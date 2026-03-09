import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Suggested starter questions shown before the TA types anything
const SUGGESTED_QUESTIONS = [
  "How is this student trending overall?",
  "Which subject needs the most attention?",
  "Is this student at risk of failing?",
  "Draft a message I can send to the parent.",
  "What should I focus on in our next meeting?",
  "Predict where this student will finish the semester.",
];

function StudentDetails() {
  const { id, className } = useParams();
  const decodedClassName = className ? decodeURIComponent(className) : '';
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);      // { role: 'user'|'ai', text: string }
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const chatBottomRef = useRef(null);

  // ── Fetch student ──────────────────────────────────────────────
  const fetchStudent = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/students/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
        if (data.test_marks && data.test_marks.length > 0) {
          const sorted = [...data.test_marks].sort(
            (a, b) => new Date(a.date_taken) - new Date(b.date_taken)
          );
          setExamHistory(sorted.map(tm => ({
            id: tm.id,
            test: tm.test_name,
            subject: tm.subject,
            date: tm.date_taken,
            mark: Math.round((tm.marks_obtained / tm.total_marks) * 100),
            rawObtained: tm.marks_obtained,
            rawTotal: tm.total_marks,
          })));
        }
      }
    } catch (err) {
      console.error("Error loading student:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudent(); }, [id]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message to backend ────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || chatLoading) return;

    const userMessage = { role: 'user', text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setChatLoading(true);
    setChatStarted(true);

    // Build history in Gemini format
    const geminiHistory = newMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [m.text],
    }));

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/students/${id}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: geminiHistory }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || data.error }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.' }]);
      console.error("Error sending message:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // ── Delete mark ────────────────────────────────────────────────
  const handleDeleteMark = async (markId) => {
    if (window.confirm('Delete this test mark?')) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/testmarks/${markId}/`, { method: 'DELETE' });
        if (res.ok) setExamHistory(prev => prev.filter(e => e.id !== markId));
      } catch (err) {
        console.error("Error deleting:", err);
      }
    }
  };

  // ── Stats & chart ──────────────────────────────────────────────
  const stats = useMemo(() => {
    if (examHistory.length === 0) return { avg: 0, growth: 0 };
    const marks = examHistory.map(h => h.mark);
    const avg = (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(0);
    const growth = marks.length > 1 ? marks[marks.length - 1] - marks[0] : 0;
    return { avg, growth };
  }, [examHistory]);

  const chartData = {
    labels: examHistory.map(e => `${e.subject} - ${e.test}`),
    datasets: [{
      label: 'Performance %',
      data: examHistory.map(e => e.mark),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      tension: 0.3,
      pointRadius: 5,
      pointBackgroundColor: examHistory.map(e =>
        e.mark >= 75 ? '#10b981' : e.mark >= 50 ? '#f59e0b' : '#ef4444'
      ),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y}%`,
          title: items => examHistory[items[0].dataIndex]?.test || '',
        },
      },
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false }, ticks: { maxRotation: 45 } },
    },
  };

  if (loading) return <div className="loading-screen">Loading student details...</div>;
  if (!student) return <div className="loading-screen error">Student not found.</div>;

  return (
    <div className="detail-page-container">

      {/* TOP BAR */}
      <div className="detail-top-bar">
        <button className="back-link" onClick={() => navigate('/student-analysis')}>
          &larr; Back to Analysis
        </button>
        <button
          className="add-mark-btn-primary"
          onClick={() => navigate(`/add-test-mark/${id}`, { state: { className: student.class_name } })}
        >
          + Add Test Mark
        </button>
      </div>

      {/* PROFILE HEADER */}
      <div className="profile-header-card">
        <div className="profile-info-block">
          <img
            src={`https://ui-avatars.com/api/?name=${student.name}&background=random&color=fff&size=80`}
            alt={student.name}
            className="profile-avatar"
          />
          <div>
            <h1 className="student-name-title">{student.name}</h1>
            <div className="student-meta-row">
              <span>🆔 Roll: #{student.roll_number}</span>
              <span>📚 Class: {decodedClassName || student.class_name}</span>
              <span>📞 {student.parent_number || "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="overall-score-card">
          <span className="score-label">OVERALL AVERAGE SCORE</span>
          <span className="score-value-large">{stats.avg}%</span>
          <span className={`score-growth ${stats.growth >= 0 ? 'positive' : 'negative'}`}>
            {stats.growth >= 0 ? '↗' : '↘'} {Math.abs(stats.growth)}% from first test
          </span>
        </div>
      </div>

      {/* CHART + CHAT GRID */}
      <div className="details-grid-layout">

        {/* LEFT: CHART */}
        <div className="chart-section-card">
          <div className="card-title-row">
            <h3>📈 Performance Trend</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {examHistory.length} tests recorded
            </span>
          </div>
          <div className="chart-wrapper">
            {examHistory.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="empty-chart-state">Add test marks to visualize trends.</div>
            )}
          </div>
        </div>

        <div className="ai-section-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '600px' }}>

          {/* Chat Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>✦</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>AI Academic Advisor</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Analyzing {student.name} · {examHistory.length} tests loaded
                </div>
              </div>
            </div>
          </div>

            {/* Chat Messages */}
            <div   style={{ height: '420px', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 , minHeight: 0 ,maxHeight: '420px'}}>

            {/* Welcome state — before any message sent */}
            {!chatStarted && (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
                  I have <b>{student.name}'s</b> full exam history loaded.
                  Ask me anything about their performance.
                </p>
                {/* Suggested questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      style={{
                        textAlign: 'left', padding: '9px 14px', borderRadius: 8,
                        border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer',
                        fontSize: 12, color: '#475569', transition: 'all 0.15s',
                      }}
                      onMouseOver={e => { e.target.style.borderColor = '#6366f1'; e.target.style.color = '#6366f1'; }}
                      onMouseOut={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#475569'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                      : '#f8fafc',
                    color: msg.role === 'user' ? 'white' : '#1e293b',
                    fontSize: 13,
                    lineHeight: 1.65,
                    border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                    whiteSpace: 'pre-wrap',       // preserves line breaks from AI
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#94a3b8',
                        animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbfc', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                rows={1}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this student..."
                disabled={chatLoading}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
                  fontSize: 13, resize: 'none', fontFamily: 'inherit', outline: 'none',
                  background: 'white', color: '#1e293b', lineHeight: 1.5,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                onClick={() => sendMessage(inputText)}
                disabled={chatLoading || !inputText.trim()}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: inputText.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
                  color: inputText.trim() ? 'white' : '#94a3b8',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 600, fontSize: 13, transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                Send
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, paddingLeft: 2 }}>
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>

          {/* Bounce animation */}
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-5px); }
            }
          `}</style>
        </div>
      </div>

      {/* EXAM HISTORY TABLE */}
      <div className="history-section-card">
        <div className="card-title-row">
          <h3>Exam History</h3>
        </div>
        <table className="modern-table">
          <thead>
            <tr>
              <th>SUBJECT</th>
              <th>TEST NAME</th>
              <th>DATE</th>
              <th>SCORE</th>
              <th>STATUS</th>
              <th style={{ textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {examHistory.length === 0 ? (
              <tr><td colSpan="6" className="empty-table-msg">No exam records found.</td></tr>
            ) : (
              [...examHistory].reverse().map(exam => (
                <tr key={exam.id}>
                  <td className="fw-bold">{exam.subject}</td>
                  <td>{exam.test}</td>
                  <td className="text-muted">{exam.date}</td>
                  <td>
                    <span className="score-text">
                      <b>{exam.rawObtained}/{exam.rawTotal}</b>
                      <small> ({exam.mark}%)</small>
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${exam.mark >= 50 ? 'pass' : 'fail'}`}>
                      {exam.mark >= 50 ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="icon-btn-delete" onClick={() => handleDeleteMark(exam.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default StudentDetails;