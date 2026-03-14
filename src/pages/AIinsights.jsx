import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import '../App.css';

const SUGGESTED = [
  "Who is struggling the most right now?",
  "Which subject is the class weakest in?",
  "Who has the most absences?",
  "Which students are at risk of failing?",
  "Give me a full class performance summary.",
  "Who improved the most recently?",
];

export default function AIinsights() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  // ── FETCH ALL STUDENTS WITH MARKS ─────────────────────────────
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/students/");
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  // ── AUTO SCROLL ───────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // ── SEND MESSAGE ──────────────────────────────────────────────
  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || isThinking || loadingStudents) return;
    setInput("");

    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      // Build history in Gemini format (exclude the message we just added — backend adds it)
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [m.text]
      }));

      const res = await fetch("http://127.0.0.1:8000/api/class-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history,
          student_ids: students.map(s => s.id)
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", text: "Something went wrong. Please try again." }]);
      console.error("Error sending message:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">🎓</div>
          <div className="brand-text">
            <h2>EduManage</h2>
            <p>Teacher Portal</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate("/studentDB")} style={{ cursor: 'pointer' }}><span className="nav-icon">▦</span> Dashboard</div>
          <div className="nav-item" onClick={() => navigate("/student-analysis")} style={{ cursor: 'pointer' }}><span className="nav-icon">👥</span> Students</div>
          <div className="nav-item" onClick={() => navigate("/attendance")} style={{ cursor: 'pointer' }}><span className="nav-icon">📋</span> Attendance</div>
          <div className="nav-item" onClick={() => navigate("/upcomming-test")} style={{ cursor: 'pointer' }}><span className="nav-icon">📝</span> Upcoming Tests</div>
          <div className="nav-item active" style={{ cursor: 'pointer' }}><span className="nav-icon">✨</span> AI Insights</div>
          <div className="nav-item" onClick={() => navigate("/teacher/alerts")} style={{ cursor: 'pointer' }}><span className="nav-icon">🔔</span> Alerts</div>
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-item" style={{ cursor: 'pointer' }}><span className="nav-icon">⚙️</span> Settings</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">

        <header className="top-navbar">
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>AI Insights</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              {loadingStudents ? "Loading student data..." : `${students.length} students loaded · Ask anything about your class`}
            </p>
          </div>
          <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="user-avatar" />
        </header>

        {/* CHAT AREA */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          height: 'calc(100vh - 72px)', padding: '0 28px 28px'
        }}>

          {/* MESSAGES */}
          <div style={{
            flex: 1, overflowY: 'auto', paddingTop: 24,
            display: 'flex', flexDirection: 'column', gap: 16
          }}>

            {/* Empty state — show suggestions */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 16
                }}>✨</div>
                <h3 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: 18, fontWeight: 700 }}>
                  Class AI Assistant
                </h3>
                <p style={{ margin: '0 0 28px', color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 420 }}>
                  Ask anything about your students — performance, attendance, who needs help, subject trends across the class.
                </p>

                {/* Suggested questions */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 620
                }}>
                  {SUGGESTED.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      disabled={loadingStudents}
                      style={{
                        padding: '12px 16px', background: 'white',
                        border: '1px solid #e2e8f0', borderRadius: 10,
                        fontSize: 13, color: '#475569', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.15s',
                        fontWeight: 500
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {/* AI avatar */}
                {msg.role === 'model' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, marginRight: 10, alignSelf: 'flex-end'
                  }}>✨</div>
                )}

                <div style={{
                  maxWidth: '72%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'white',
                  color: msg.role === 'user' ? 'white' : '#1e293b',
                  fontSize: 14, lineHeight: 1.7,
                  border: msg.role === 'model' ? '1px solid #f1f5f9' : 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>

                {/* User avatar */}
                {msg.role === 'user' && (
                  <img
                    src="https://i.pravatar.cc/150?img=47"
                    style={{ width: 32, height: 32, borderRadius: '50%', marginLeft: 10, alignSelf: 'flex-end', flexShrink: 0 }}
                  />
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                }}>✨</div>
                <div style={{
                  padding: '12px 18px', background: 'white', borderRadius: '16px 16px 16px 4px',
                  border: '1px solid #f1f5f9', display: 'flex', gap: 5, alignItems: 'center'
                }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
                      animation: 'bounce 1s ease infinite',
                      animationDelay: `${j * 0.18}s`
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <div style={{
            display: 'flex', gap: 10, padding: '14px 0 0',
            borderTop: '1px solid #f1f5f9'
          }}>
            <input
              type="text"
              placeholder={loadingStudents ? "Loading student data..." : "Ask about your class..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking || loadingStudents}
              style={{
                flex: 1, padding: '12px 18px',
                border: '1px solid #e2e8f0', borderRadius: 12,
                fontSize: 14, outline: 'none', color: '#1e293b',
                background: isThinking || loadingStudents ? '#f8fafc' : 'white'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isThinking || loadingStudents}
              style={{
                padding: '12px 22px',
                background: !input.trim() || isThinking || loadingStudents
                  ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: !input.trim() || isThinking || loadingStudents ? '#94a3b8' : 'white',
                border: 'none', borderRadius: 12,
                fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}