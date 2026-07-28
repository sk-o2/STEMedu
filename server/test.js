const mongoose = require('mongoose');
const User = require('./models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  try {
    console.log('Testing Gemini API...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = 'Hello, reply with "OK" in JSON format: {"status": "OK"}';
    const result = await model.generateContent(prompt);
    console.log('Gemini response:', result.response.text());
  } catch (e) {
    console.error('Gemini error:', e.message);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    let user = await User.findOne({email: 'testlogin@test.com'}).select('+password');
    if (!user) {
      user = new User({name: 'Test', email: 'testlogin@test.com', password: 'password123'});
      await user.save();
      console.log('Test user created');
      user = await User.findOne({email: 'testlogin@test.com'}).select('+password');
    }

    const isMatch1 = await user.matchPassword('password123');
    console.log('Password match before save:', isMatch1);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const isMatch2 = await user.matchPassword('password123');
    console.log('Password match after save:', isMatch2);

    await mongoose.disconnect();
  } catch(e) {
    console.error('DB test error:', e);
  }
}

test();
