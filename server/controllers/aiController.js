const { GoogleGenerativeAI } = require('@google/generative-ai');
const AISession = require('../models/AISession');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an expert STEM educator and maker. Your role is to help students discover what projects they can build with the electronic/robotics components they have.

When a student provides a list of components:
1. Suggest 3-5 practical projects they can build RIGHT NOW with existing components
2. For each project suggest 1-3 additional low-cost components that would unlock MORE possibilities
3. Rate each project difficulty: Beginner / Intermediate / Advanced
4. Give a brief exciting description of each project

Format your response as JSON with this structure:
{
  "projects": [
    {
      "title": "Project Name",
      "description": "Exciting 2-sentence description",
      "difficulty": "Beginner|Intermediate|Advanced",
      "canBuildNow": true|false,
      "additionalComponents": ["Component 1", "Component 2"],
      "estimatedTime": "X hours",
      "category": "Robotics|IoT|Electronics|Game Development|Drone Technology"
    }
  ],
  "message": "Encouraging message to the student"
}

Always be encouraging and educational. Focus on STEM learning outcomes.`;

// const MODEL_NAMES = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
const MODEL_NAMES = [ 'gemini-2.5-flash'];
// Helper to call Gemini API with model fallback
async function callGemini(generateFn) {
  let lastErr;
  for (const modelName of MODEL_NAMES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await generateFn(model);
    } catch (err) {
      console.error(`Gemini model [${modelName}] failed:`, err.message);
      lastErr = err;
    }
  }
  throw lastErr;
}

// @desc Suggest projects based on components
exports.suggestProjects = async (req, res) => {
  try {
    const { components, sessionId } = req.body;
    if (!components || components.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one component' });
    }

    const componentsList = components.map(c => `- ${c.quantity || 1}x ${c.name}`).join('\n');
    const prompt = `${SYSTEM_PROMPT}\n\nThe student has these components:\n${componentsList}\n\nSuggest projects and respond ONLY with valid JSON.`;

    let text;
    try {
      text = await callGemini(async (model) => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      });
    } catch (err) {
      console.error("Gemini Suggest Error:", err);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again later.'
      });
    }

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = { projects: [], message: text };
    }

    // Save session
    const sid = sessionId || uuidv4();
    const sessionData = {
      sessionId: sid,
      components,
      suggestedProjects: parsed.projects || [],
      conversation: [
        { role: 'user', parts: [{ text: `My components: ${componentsList}` }] },
        { role: 'model', parts: [{ text: JSON.stringify(parsed) }] },
      ],
    };
    if (req.user) sessionData.user = req.user.id;

    await AISession.findOneAndUpdate({ sessionId: sid }, sessionData, { upsert: true, new: true });

    res.status(200).json({ success: true, sessionId: sid, ...parsed });
  } catch (err) {
    console.error("suggestProjects Controller Error:", err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// @desc Follow-up AI chat
exports.aiChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    let history = [];
    if (sessionId) {
      const session = await AISession.findOne({ sessionId }).lean();
      if (session && session.conversation) {
        history = session.conversation.map(msg => ({
          role: msg.role,
          parts: msg.parts.map(part => ({
            text: part.text
          }))
        }));
      }
    }

    let reply;
    try {
      reply = await callGemini(async (model) => {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        return result.response.text();
      });
    } catch (err) {
      console.error("Gemini Chat Error:", err);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong. Please try again later.'
      });
    }

    // Update session conversation
    if (sessionId) {
      await AISession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            conversation: {
              $each: [
                { role: 'user', parts: [{ text: message }] },
                { role: 'model', parts: [{ text: reply }] },
              ],
            },
          },
        }
      );
    }

    res.status(200).json({ success: true, reply, sessionId });
  } catch (err) {
    console.error("aiChat Controller Error:", err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};