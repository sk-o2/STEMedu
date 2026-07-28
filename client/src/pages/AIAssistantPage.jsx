import { useState, useRef, useEffect } from 'react';
import {
  Bot, Plus, X, Send, Loader, Cpu, Zap, ChevronRight,
  Sparkles, Clock, Layers, RefreshCw, ArrowRight
} from 'lucide-react';
import { suggestProjects, aiChat } from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SAMPLE_COMPONENTS = [
  'Arduino Uno', 'Raspberry Pi', 'HC-SR04', 'DHT11 Sensor',
  'L298N Motor Driver', 'Servo Motor', 'DC Motor', 'LED Strip',
  'Buzzer', 'LCD Display', 'Bluetooth Module', 'IR Sensor',
  'Relay Module', 'ESP8266 WiFi', 'OLED Display',
];

const DIFF_CONFIG = {
  Beginner:     { color: '#00ff88', bg: 'rgba(0,255,136,0.12)',  border: 'rgba(0,255,136,0.3)'  },
  Intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  Advanced:     { color: '#ff4466', bg: 'rgba(255,68,102,0.12)', border: 'rgba(255,68,102,0.3)' },
};

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
      <div style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', margin: '8px 0', borderRadius: 8, boxSizing: 'border-box' }}>
        <SyntaxHighlighter
          style={dracula}
          language={match ? match[1] : 'text'}
          PreTag="div"
          customStyle={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            borderRadius: 8,
            fontSize: '13px',
            lineHeight: 1.5,
            margin: 0,
            padding: '10px 12px',
            boxSizing: 'border-box',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: '0.88em',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <div style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', margin: '8px 0', boxSizing: 'border-box' }}>{children}</div>;
  },
  p({ children }) {
    return <p style={{ margin: '0 0 8px 0', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.65 }}>{children}</p>;
  },
  ul({ children }) {
    return <ul style={{ paddingLeft: 20, margin: '4px 0 8px 0' }}>{children}</ul>;
  },
  ol({ children }) {
    return <ol style={{ paddingLeft: 20, margin: '4px 0 8px 0' }}>{children}</ol>;
  },
  table({ children }) {
    return (
      <div style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', margin: '8px 0' }}>
        <table className="data-table">{children}</table>
      </div>
    );
  }
};

const AIAssistantPage = () => {
  const [componentInput, setComponentInput] = useState('');
  const [components,     setComponents]     = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [projects,       setProjects]       = useState(null);
  const [sessionId,      setSessionId]      = useState(null);
  const [chatMessages,   setChatMessages]   = useState([]);
  const [chatInput,      setChatInput]      = useState('');
  const [chatLoading,    setChatLoading]    = useState(false);
  const chatRef    = useRef();
  const inputRef   = useRef();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const addComponent = (name) => {
    const n = name.trim();
    if (!n) return;
    if (components.find(c => c.name.toLowerCase() === n.toLowerCase()))
      return toast.error('Already added');
    setComponents(prev => [...prev, { name: n, quantity: 1 }]);
    setComponentInput('');
    inputRef.current?.focus();
  };

  const removeComponent = (i) =>
    setComponents(prev => prev.filter((_, idx) => idx !== i));

  const updateQty = (i, qty) =>
    setComponents(prev =>
      prev.map((c, idx) => idx === i ? { ...c, quantity: Math.max(1, qty) } : c)
    );

  const handleSuggest = async () => {
    if (components.length === 0) return toast.error('Add at least one component');
    setLoading(true);
    setProjects(null);
    try {
      const { data } = await suggestProjects({ components, sessionId });
      setProjects(data.projects || []);
      setSessionId(data.sessionId);
      setChatMessages([{ role: 'model', text: data.message || 'Here are projects you can build!' }]);
    } catch (err) {
      console.error('AI Suggest Error:', err);
      const rawMsg = err.response?.data?.message || err.message || '';
      const isTechError = rawMsg.includes('GoogleGenerativeAI') || rawMsg.includes('503') || rawMsg.includes('https://');
      toast.error(isTechError ? 'Something went wrong. Please try again later.' : (rawMsg || 'Something went wrong. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const { data } = await aiChat({ message: msg, sessionId });
      setChatMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setChatMessages(prev => [
        ...prev,
        { role: 'model', text: 'Something went wrong. Please try again later.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="ai-page">

      {/* ── Header ── */}
      <div className="ai-page-header">
        <div className="ai-gemini-badge">
          <Bot size={14} /> Powered by Google AI
        </div>
        <h1>AI <span className="gradient-text">Project Assistant</span></h1>
        <p>Tell us what components you have — our AI will suggest amazing STEM projects you can build right now!</p>
      </div>

      <div className="container ai-body">
        <div className="ai-layout">

          {/* ════ LEFT PANEL: Component Input ════ */}
          <div className="ai-left">

            {/* Component input card */}
            <div className="card ai-input-card">
              <h2 className="ai-card-title">
                <Layers size={18} style={{ color: 'var(--primary-light)' }} />
                Your Components
              </h2>
              <p className="ai-card-sub">Add the electronic or robotics parts you have available.</p>

              {/* Text input */}
              <div className="ai-input-row">
                <input
                  ref={inputRef}
                  id="component-input"
                  className="form-input"
                  placeholder="e.g. Arduino Uno, Servo Motor…"
                  value={componentInput}
                  onChange={e => setComponentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComponent(componentInput)}
                />
                <button
                  className="btn btn-primary ai-add-btn"
                  onClick={() => addComponent(componentInput)}
                  disabled={!componentInput.trim()}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick-add chips */}
              <div className="ai-quick-add">
                <span className="ai-quick-label">Quick add:</span>
                <div className="ai-chips">
                  {SAMPLE_COMPONENTS
                    .filter(s => !components.find(c => c.name === s))
                    .slice(0, 10)
                    .map(s => (
                      <button key={s} className="ai-chip" onClick={() => addComponent(s)}>
                        + {s}
                      </button>
                    ))}
                </div>
              </div>

              {/* Added components list */}
              {components.length > 0 && (
                <div className="ai-comp-list">
                  <div className="ai-comp-list-header">
                    <span>{components.length} component{components.length !== 1 ? 's' : ''} added</span>
                    <button className="ai-clear-btn" onClick={() => setComponents([])}>
                      Clear all
                    </button>
                  </div>
                  {components.map((comp, i) => (
                    <div key={i} className="ai-comp-item">
                      <Cpu size={13} className="ai-comp-icon" />
                      <span className="ai-comp-name">{comp.name}</span>
                      <div className="ai-comp-qty">
                        <button className="ai-qty-btn" onClick={() => updateQty(i, comp.quantity - 1)}>−</button>
                        <span>{comp.quantity}</span>
                        <button className="ai-qty-btn" onClick={() => updateQty(i, comp.quantity + 1)}>+</button>
                      </div>
                      <button className="ai-remove-btn" onClick={() => removeComponent(i)}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              <button
                id="ai-suggest-btn"
                className={`btn btn-primary ai-suggest-btn ${loading ? 'loading' : ''}`}
                onClick={handleSuggest}
                disabled={loading || components.length === 0}
              >
                {loading ? (
                  <><Loader size={18} className="spin" /> Analyzing components…</>
                ) : (
                  <><Sparkles size={18} /> Suggest Projects with AI</>
                )}
              </button>
            </div>

            {/* AI Chat (appears after first suggestion) */}
            {sessionId && (
              <div className="card ai-chat-card">
                <div className="ai-chat-header">
                  <Bot size={17} />
                  <span>Ask AI Follow-up Questions</span>
                  <div className="ai-online-dot" />
                </div>

                <div className="ai-chat-messages" ref={chatRef}>
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
                      {m.role === 'user' ? (
                        <span>{m.text}</span>
                      ) : (
                        <ReactMarkdown components={MarkdownComponents}>{m.text}</ReactMarkdown>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble ai typing">
                      <span /><span /><span />
                    </div>
                  )}
                </div>

                <div className="ai-chat-input-row">
                  <input
                    id="ai-chat-input"
                    className="form-input ai-chat-input"
                    placeholder="Ask a follow-up question…"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChat()}
                  />
                  <button
                    className="btn btn-primary ai-send-btn"
                    onClick={handleChat}
                    disabled={!chatInput.trim() || chatLoading}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ════ RIGHT PANEL: Project Suggestions ════ */}
          <div className="ai-right">
            {/* Empty state */}
            {!projects && !loading && (
              <div className="ai-empty-state">
                <div className="ai-empty-orb">
                  <Bot size={40} />
                </div>
                <h3>Add components to get started</h3>
                <p>Our AI will analyze your inventory and suggest the best STEM projects you can build right now.</p>
                <div className="ai-empty-hints">
                  {['Arduino Uno + HC-SR04 → Obstacle Robot', 'Raspberry Pi + Camera → Face Detection', 'ESP8266 + DHT11 → IoT Weather Station'].map((hint, i) => (
                    <div key={i} className="ai-hint-chip">
                      <Zap size={11} /> {hint}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="ai-loading-state">
                <div className="ai-loading-orb">
                  <Bot size={32} className="ai-pulse-icon" />
                </div>
                <h3>AI is analyzing…</h3>
                <p>Finding the best projects for your components</p>
                <div className="ai-loading-dots">
                  <div /><div /><div />
                </div>
              </div>
            )}

            {/* Results */}
            {projects && (
              <div className="ai-results">
                <div className="ai-results-header">
                  <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                  <h2>AI-Suggested Projects</h2>
                  <span className="ai-results-count">{projects.length}</span>
                  <button className="ai-refresh-btn" onClick={handleSuggest} title="Regenerate suggestions">
                    <RefreshCw size={14} />
                  </button>
                </div>

                <div className="ai-project-list">
                  {projects.map((proj, i) => {
                    const diff = DIFF_CONFIG[proj.difficulty] || DIFF_CONFIG.Beginner;
                    return (
                      <div key={i} className="ai-project-card">
                        {/* Card top */}
                        <div className="ai-proj-top">
                          <div className="ai-proj-meta">
                            {proj.canBuildNow && (
                              <span className="ai-build-now-badge">✓ Build Now</span>
                            )}
                            <span
                              className="ai-diff-badge"
                              style={{ color: diff.color, background: diff.bg, borderColor: diff.border }}
                            >
                              {proj.difficulty}
                            </span>
                          </div>
                          <div className="ai-proj-number">#{i + 1}</div>
                        </div>

                        <h3 className="ai-proj-title">{proj.title}</h3>
                        <p className="ai-proj-desc">{proj.description}</p>

                        {/* Info row */}
                        <div className="ai-proj-info">
                          {proj.estimatedTime && (
                            <span className="ai-proj-info-item">
                              <Clock size={12} /> {proj.estimatedTime}
                            </span>
                          )}
                          {proj.category && (
                            <span className="ai-proj-info-item">
                              <Layers size={12} /> {proj.category}
                            </span>
                          )}
                        </div>

                        {/* Unlock more */}
                        {proj.additionalComponents?.length > 0 && (
                          <div className="ai-unlock-banner">
                            <Zap size={13} />
                            <span>
                              <strong>Unlock more:</strong> Add {proj.additionalComponents.slice(0, 3).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ── Page ── */
        .ai-page {
          min-height: 100vh;
          max-width: 100vw;
          overflow-x: hidden;
        }
        .ai-page-header { text-align: center; padding: 60px 24px 40px; }
        .ai-gemini-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 100px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.35);
          color: var(--primary-light);
          font-size: 12px; font-weight: 700;
          margin-bottom: 18px;
          letter-spacing: 0.3px;
        }
        .ai-page-header h1 { font-size: clamp(28px,5vw,56px); margin-bottom: 14px; }
        .ai-page-header p  { font-size: clamp(14px,2vw,18px); color: var(--text-secondary); max-width: 560px; margin: 0 auto; line-height: 1.7; }

        /* ── Layout ── */
        .ai-body { padding-bottom: 80px; max-width: 100%; box-sizing: border-box; }
        .ai-layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 28px;
          align-items: start;
          max-width: 100%;
        }
        .ai-left  { display: flex; flex-direction: column; gap: 20px; max-width: 100%; min-width: 0; }
        .ai-right { min-height: 480px; max-width: 100%; min-width: 0; }

        /* ── Input Card ── */
        .ai-input-card { padding: 24px; max-width: 100%; box-sizing: border-box; }
        .ai-card-title {
          display: flex; align-items: center; gap: 9px;
          font-size: 18px; font-weight: 700; margin-bottom: 6px;
        }
        .ai-card-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }

        .ai-input-row { display: flex; gap: 8px; margin-bottom: 16px; width: 100%; }
        .ai-add-btn   { flex-shrink: 0; padding: 0 16px; }

        /* Quick add */
        .ai-quick-add { margin-bottom: 18px; }
        .ai-quick-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); display: block; margin-bottom: 8px; }
        .ai-chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .ai-chip {
          padding: 4px 12px; border-radius: 100px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 12px; cursor: pointer;
          transition: var(--transition);
        }
        .ai-chip:hover { border-color: var(--primary-light); color: var(--primary-light); background: rgba(124,58,237,0.08); }

        /* Component list */
        .ai-comp-list { margin-bottom: 18px; }
        .ai-comp-list-header {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted); margin-bottom: 10px;
        }
        .ai-clear-btn {
          background: none; border: none;
          color: var(--danger); font-size: 11px; font-weight: 600;
          cursor: pointer; opacity: 0.7;
          transition: opacity 0.2s;
        }
        .ai-clear-btn:hover { opacity: 1; }

        .ai-comp-item {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 10px 14px;
          margin-bottom: 6px;
          transition: border-color 0.2s;
        }
        .ai-comp-item:hover { border-color: rgba(0,240,255,0.25); }
        .ai-comp-icon { color: var(--primary-light); flex-shrink: 0; }
        .ai-comp-name { flex: 1; font-size: 14px; font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

        .ai-comp-qty {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-dark); border-radius: 8px; padding: 4px 8px;
          border: 1px solid var(--border);
          font-size: 13px; font-weight: 700;
          color: var(--text-primary);
        }
        .ai-qty-btn {
          background: none; border: none;
          color: var(--text-muted); font-size: 16px;
          cursor: pointer; line-height: 1;
          transition: color 0.15s; padding: 0 2px;
        }
        .ai-qty-btn:hover { color: var(--primary); }

        .ai-remove-btn {
          background: none; border: none;
          color: var(--text-muted); cursor: pointer;
          display: flex; padding: 3px;
          border-radius: 4px; transition: var(--transition);
        }
        .ai-remove-btn:hover { color: var(--danger); background: rgba(255,0,60,0.1); }

        /* CTA */
        .ai-suggest-btn {
          width: 100%; justify-content: center;
          padding: 14px; font-size: 15px;
          letter-spacing: 0.5px;
        }
        .ai-suggest-btn.loading { opacity: 0.8; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Chat Card ── */
        .ai-chat-card { padding: 0; overflow: hidden; max-width: 100%; box-sizing: border-box; }
        .ai-chat-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
          background: rgba(124,58,237,0.08);
          font-size: 14px; font-weight: 700;
          color: var(--primary-light);
        }
        .ai-online-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 6px var(--success);
          margin-left: auto;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }

        .ai-chat-messages {
          height: 380px; overflow-y: auto; overflow-x: hidden;
          padding: 16px; display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: var(--border) transparent;
          max-width: 100%; box-sizing: border-box;
        }
        .chat-bubble {
          padding: 12px 16px; border-radius: 14px;
          font-size: 14px; line-height: 1.65;
          word-break: break-word; overflow-wrap: break-word;
          animation: bubble-in 0.2s ease;
          box-sizing: border-box;
        }
        @keyframes bubble-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .chat-bubble.user {
          align-self: flex-end;
          width: fit-content;
          max-width: 88%;
          background: rgba(124,58,237,0.25);
          border: 1px solid rgba(124,58,237,0.4);
          color: var(--text-primary);
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.ai {
          align-self: stretch;
          width: 100%;
          max-width: 100%;
          background: rgba(0,240,255,0.07);
          border: 1px solid rgba(0,240,255,0.15);
          color: var(--text-secondary);
          border-bottom-left-radius: 4px;
          box-sizing: border-box;
        }
        /* typing dots */
        .chat-bubble.typing {
          align-self: flex-start;
          width: fit-content;
          display: flex; align-items: center; gap: 5px; padding: 12px 18px;
        }
        .chat-bubble.typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--primary-light); opacity: 0.5;
          animation: typing-dot 1.2s ease-in-out infinite;
        }
        .chat-bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-dot { 0%,80%,100%{transform:scale(1);opacity:0.5} 40%{transform:scale(1.3);opacity:1} }

        .ai-chat-input-row {
          display: flex; gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          width: 100%; box-sizing: border-box;
        }
        .ai-chat-input { flex: 1; min-width: 0; }
        .ai-send-btn { flex-shrink: 0; padding: 0 14px; }

        /* ── Right panel: empty / loading / results ── */
        .ai-empty-state, .ai-loading-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 480px; text-align: center; gap: 14px;
          color: var(--text-muted); padding: 40px 24px;
          max-width: 100%; box-sizing: border-box;
        }
        .ai-empty-orb, .ai-loading-orb {
          width: 96px; height: 96px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.2), rgba(124,58,237,0.05));
          border: 1px solid rgba(124,58,237,0.3);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary-light);
          box-shadow: 0 0 30px rgba(124,58,237,0.15);
          margin-bottom: 4px;
        }
        .ai-empty-state h3, .ai-loading-state h3 { font-size: 20px; color: var(--text-secondary); }
        .ai-empty-state p, .ai-loading-state p { font-size: 14px; max-width: 300px; line-height: 1.6; }

        .ai-empty-hints { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; width: 100%; max-width: 320px; }
        .ai-hint-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          font-size: 12px; color: var(--text-muted);
          text-align: left;
        }

        .ai-pulse-icon { animation: ai-pulse 1.5s ease-in-out infinite; }
        @keyframes ai-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.9)} }
        .ai-loading-dots { display: flex; gap: 8px; margin-top: 6px; }
        .ai-loading-dots div {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--primary-light);
          animation: loading-dot 1.4s ease-in-out infinite;
        }
        .ai-loading-dots div:nth-child(2) { animation-delay: 0.2s; }
        .ai-loading-dots div:nth-child(3) { animation-delay: 0.4s; }
        @keyframes loading-dot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }

        /* ── Results ── */
        .ai-results { display: flex; flex-direction: column; gap: 16px; max-width: 100%; }
        .ai-results-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 4px; flex-wrap: wrap;
        }
        .ai-results-header h2 { font-size: 20px; flex: 1; }
        .ai-results-count {
          background: rgba(0,240,255,0.12);
          color: var(--primary);
          border: 1px solid rgba(0,240,255,0.25);
          border-radius: 100px;
          padding: 2px 10px;
          font-size: 12px; font-weight: 700;
        }
        .ai-refresh-btn {
          background: none; border: 1px solid var(--border);
          color: var(--text-muted); border-radius: 8px;
          padding: 6px 10px; cursor: pointer;
          transition: var(--transition); display: flex;
        }
        .ai-refresh-btn:hover { border-color: var(--primary); color: var(--primary); }

        .ai-project-list { display: flex; flex-direction: column; gap: 14px; max-width: 100%; }
        .ai-project-card {
          background: var(--gradient-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          transition: border-color 0.25s, box-shadow 0.25s;
          max-width: 100%; box-sizing: border-box;
          overflow-x: hidden;
        }
        .ai-project-card:hover {
          border-color: rgba(0,240,255,0.3);
          box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        }

        .ai-proj-top {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;
        }
        .ai-proj-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .ai-build-now-badge {
          padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700;
          background: rgba(0,255,136,0.12); color: var(--success);
          border: 1px solid rgba(0,255,136,0.3);
        }
        .ai-diff-badge {
          padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700;
          border: 1px solid;
        }
        .ai-proj-number {
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          background: var(--bg-elevated); border-radius: 6px; padding: 3px 8px;
        }

        .ai-proj-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; word-break: break-word; }
        .ai-proj-desc  { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 12px; word-break: break-word; }

        .ai-proj-info { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
        .ai-proj-info-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--text-muted);
        }

        .ai-unlock-banner {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; border-radius: 8px;
          background: rgba(6,182,212,0.08);
          border: 1px solid rgba(6,182,212,0.2);
          font-size: 13px; color: var(--secondary); line-height: 1.5;
          word-break: break-word;
        }
        .ai-unlock-banner svg { flex-shrink: 0; margin-top: 2px; }

        /* ── Responsive ── */
        @media(max-width: 1024px) {
          .ai-layout { grid-template-columns: 360px 1fr; }
        }
        @media(max-width: 860px) {
          .ai-layout { grid-template-columns: 1fr; }
          .ai-right { min-height: auto; }
          .ai-empty-state, .ai-loading-state { min-height: 320px; }
        }
        @media(max-width: 640px) {
          .ai-page-header { padding: 44px 16px 28px; }
          .ai-chat-messages { height: 320px; }
          .ai-chat-input { font-size: 16px !important; }
          #component-input { font-size: 16px !important; }
        }
        @media(max-width: 420px) {
          .ai-input-card { padding: 16px; }
          .ai-proj-title  { font-size: 15px; }
        }
      `}</style>
    </div>
  );
};

export default AIAssistantPage;
