import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';

function Test() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const studentId = studentUser?.id;

  useEffect(() => {
    if (!studentId) {
      navigate('/', { replace: true });
      return;
    }

    const fetchAll = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/students/${studentId}/`),
          fetch(`http://127.0.0.1:8000/api/upcoming-tests/?student_id=${studentId}`),
        ]);

        const studentData = await sRes.json();
        const testsData = await tRes.json();
        setStudent(studentData);
        setTests(Array.isArray(testsData) ? testsData : []);
      } catch (err) {
        console.error(err);
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [studentId, navigate]);

  const aiSuggestions = useMemo(() => {
    if (!tests.length) {
      return [
        'No upcoming tests are scheduled yet. Keep a daily 45-minute study routine so you stay prepared.',
        'Revise one core subject every day and solve at least 5 practice questions.',
        'Maintain short notes for formulas, definitions, and common mistakes for quick review.',
      ];
    }

    const nextTest = [...tests].sort((a, b) => new Date(a.test_date) - new Date(b.test_date))[0];
    const daysLeft = Math.max(0, Math.ceil((new Date(nextTest.test_date) - new Date()) / (1000 * 60 * 60 * 24)));

    const hasPreviousTests = Array.isArray(student?.test_marks) && student.test_marks.length > 0;
    if (!hasPreviousTests) {
      return [
        `Your next test is ${nextTest.test_name} (${nextTest.subject || nextTest.topic}) in about ${daysLeft} day(s).`,
        'Since there are no previous test records yet, start with concept learning first, then short daily practice.',
        'Use a simple plan: 30 minutes concept revision + 20 minutes practice + 10 minutes error review.',
      ];
    }

    const normalize = (text) => String(text || '').trim().toLowerCase();
    const topicLabel = nextTest.subject || nextTest.topic;
    const topicKey = normalize(topicLabel);

    // Analyze only past marks related to the upcoming test topic.
    const topicMatchedMarks = student.test_marks.filter((m) => {
      const subjectKey = normalize(m.subject);
      return subjectKey === topicKey || subjectKey.includes(topicKey) || topicKey.includes(subjectKey);
    });

    if (!topicMatchedMarks.length) {
      return [
        `Your next test is ${nextTest.test_name} on "${topicLabel}" in about ${daysLeft} day(s).`,
        `No previous test record was found for this topic, so start with core concepts and solved examples for "${topicLabel}".`,
        'Follow a focused plan: concept revision, short practice, then error review each day until the test.',
      ];
    }

    const scored = topicMatchedMarks.map((m) => {
      const pct = m.total_marks > 0 ? Math.round((m.marks_obtained / m.total_marks) * 100) : 0;
      return { ...m, pct };
    });
    const avg = Math.round(scored.reduce((sum, m) => sum + m.pct, 0) / scored.length);
    const latest = scored[scored.length - 1];

    return [
      `For upcoming topic "${topicLabel}", your previous average is ${avg}%. Use this as your improvement target before ${nextTest.test_name}.`,
      `Latest related score is ${latest.pct}%. In the next ${daysLeft} day(s), review mistakes first, then do one timed practice set daily.`,
      `Keep revision topic-specific: "${topicLabel}" concepts, key formulas, and 10-15 targeted questions per session.`,
    ];
  }, [student, tests]);

  if (loading) return <div className="st-loading">Loading upcoming tests...</div>;

  return (
    <div className="st-layout">
      <aside className="sd-sidebar">
        <div className="sd-user-profile">
          <div className="sd-avatar-container">
            <img
              src={`https://ui-avatars.com/api/?name=${student?.name || 'Student'}&background=cbd5e1&color=0f172a`}
              alt={student?.name || 'Student'}
              className="sd-avatar"
            />
            <span className="sd-online-dot"></span>
          </div>
          <div className="sd-user-info">
            <h3>{student?.name}</h3>
            <p>#{student?.roll_number} | {student?.class_name}</p>
          </div>
        </div>

        <nav className="sd-nav">
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate(`/student-dashboard/${studentId}`); }}><span className="icon">⊞</span> Dashboard</a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/my-performance'); }}><span className="icon">📈</span> My Performance</a>
          <a href="#" className="sd-nav-item active" onClick={(e) => { e.preventDefault(); navigate('/upcoming-tests'); }}><span className="icon">📅</span> Upcoming Tests</a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/ai-tutor'); }}><span className="icon">🤖</span> AI Tutor</a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/notifications'); }}><span className="icon">🔔</span> Notifications</a>
          <a href="#" className={`sd-nav-item ${showSettings ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setShowSettings(!showSettings); }}><span className="icon">⚙️</span> Settings</a>
          {showSettings && (
            <div className="sd-settings-panel">
              <button className="sd-profile-btn" onClick={() => navigate('/profile')}>Profile</button>
              <button className="sd-logout-btn" onClick={() => { localStorage.removeItem('studentUser'); navigate('/', { replace: true }); }}>🚪 Log Out</button>
            </div>
          )}
        </nav>
      </aside>

      <main className="st-main">
        <div className="st-header">
          <h1>Upcoming Tests</h1>
          <p>Stay prepared with your scheduled assessments.</p>
        </div>

        <div className="st-grid">
          <section className="st-card">
            <h3>Scheduled For {student?.class_name}</h3>
            {tests.length === 0 ? (
              <p className="st-empty">No upcoming tests scheduled yet.</p>
            ) : (
              <div className="st-list">
                {tests.map((t) => (
                  <div className="st-item" key={t.id}>
                    <div>
                      <h4>{t.test_name}</h4>
                      <p>Subject: {t.subject || t.topic}</p>
                    </div>
                    <div className="st-meta">
                      <span>{t.test_date}</span>
                      <strong>{t.total_marks} marks</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="st-card st-ai">
            <h3>AI Prep Coach</h3>
            <ul>
              {aiSuggestions.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Test;
