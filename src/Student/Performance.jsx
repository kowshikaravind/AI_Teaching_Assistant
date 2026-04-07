import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import './Student.css';
import { apiUrl } from '../utils/backendUrls.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Performance() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [aiSubjects, setAiSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const studentId = studentUser?.id;

  useEffect(() => {
    if (!studentId) { navigate('/', { replace: true }); return; }
    const fetchAll = async () => {
      try {
        const [sRes, aiRes] = await Promise.all([
          fetch(apiUrl(`/students/${studentId}/`)),
          fetch(apiUrl(`/students/${studentId}/ai-tutor/`)),
        ]);

        const studentData = await sRes.json();
        const aiData = aiRes.ok ? await aiRes.json() : { subjects: [] };
        setStudent(studentData);
        setAiSubjects(Array.isArray(aiData?.subjects) ? aiData.subjects : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId, navigate]);

  // ── SUBJECT AVERAGES ──────────────────────────────────────────
  const subjectAverages = useMemo(() => {
    if (!aiSubjects.length) return [];
    return aiSubjects
      .map((s) => ({ name: s.name, score: Math.round(Number(s.avg_score || 0)) }))
      .sort((a, b) => b.score - a.score);
  }, [aiSubjects]);

  // ── OVERALL AVG ───────────────────────────────────────────────
  const overallAvg = useMemo(() => {
    if (!subjectAverages.length) return 0;
    return Math.round(subjectAverages.reduce((s, x) => s + x.score, 0) / subjectAverages.length);
  }, [subjectAverages]);

  // ── DECLINE DETECTION ─────────────────────────────────────────
  const decliningSubjects = useMemo(() => {
    if (!aiSubjects.length) return [];

    return aiSubjects
      .filter((subject) => {
        const tests = Array.isArray(subject.tests) ? [...subject.tests] : [];
        tests.sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
        const scores = tests
          .map((t) => Math.round(Number(t.percentage || 0)))
          .filter((v) => Number.isFinite(v));

        return (
          scores.length >= 3
          && scores[scores.length - 1] < scores[scores.length - 2]
          && scores[scores.length - 2] < scores[scores.length - 3]
        );
      })
      .map((subject) => subject.name);
  }, [aiSubjects]);

  // ── RECENT MARKS (last 5) ─────────────────────────────────────
  const recentMarks = useMemo(() => {
    if (!aiSubjects.length) return [];

    return aiSubjects
      .flatMap((subject) => (Array.isArray(subject.tests) ? subject.tests.map((t) => ({ ...t, subject: subject.name })) : []))
      .sort((a, b) => new Date(b.test_date) - new Date(a.test_date))
      .slice(0, 5)
      .map((t) => ({
        id: t.test_id,
        test_name: t.test_name,
        subject: t.subject,
        date_taken: t.test_date,
        marks_obtained: Number(t.score || 0),
        total_marks: Number(t.total_marks || 0),
      }));
  }, [aiSubjects]);

  // ── BAR CHART DATA ────────────────────────────────────────────
  const barData = useMemo(() => ({
    labels: subjectAverages.map(s => s.name),
    datasets: [{
      label: 'Average Score %',
      data: subjectAverages.map(s => s.score),
      backgroundColor: subjectAverages.map(s =>
        s.score >= 75 ? 'rgba(16,185,129,0.75)' :
        s.score >= 50 ? 'rgba(245,158,11,0.75)' :
        'rgba(239,68,68,0.75)'
      ),
      borderColor: subjectAverages.map(s =>
        s.score >= 75 ? '#10b981' : s.score >= 50 ? '#f59e0b' : '#ef4444'
      ),
      borderWidth: 2,
      borderRadius: 8,
    }]
  }), [subjectAverages]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.raw}%` }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12 } }
      },
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(148,163,184,0.1)' },
        ticks: { color: '#94a3b8', callback: v => `${v}%` }
      }
    }
  };

  const getStatus = (pct) => {
    if (pct >= 80) return { label: 'Above Average', cls: 'status-above' };
    if (pct >= 60) return { label: 'Average', cls: 'status-avg' };
    return { label: 'Needs Review', cls: 'status-below' };
  };

  if (loading) return (
    <div className="mp-loading">Loading performance data...</div>
  );

  if (!student) return (
    <div className="mp-loading">Unable to load performance data right now.</div>
  );

  return (
    <div className="mp-layout">

      {/* ── SIDEBAR ── */}
      <aside className="sd-sidebar">
        <div className="sd-user-profile">
          <div className="sd-avatar-container">
            <img
              src={`https://ui-avatars.com/api/?name=${student.name}&background=cbd5e1&color=0f172a`}
              alt={student.name}
              className="sd-avatar"
            />
            <span className="sd-online-dot"></span>
          </div>
          <div className="sd-user-info">
            <h3>{student.name}</h3>
            <p>#{student.roll_number} | {student.class_name}</p>
          </div>
        </div>

        <nav className="sd-nav">
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate(`/student-dashboard/${studentId}`); }}>
            <span className="icon">⊞</span> Dashboard
          </a>
          <a href="#" className="sd-nav-item active" onClick={(e) => { e.preventDefault(); navigate('/my-performance'); }}>
            <span className="icon">📈</span> My Performance
          </a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/upcoming-tests'); }}>
            <span className="icon">📅</span> Upcoming Tests
          </a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/ai-tutor'); }}>
            <span className="icon">🤖</span> AI Tutor
          </a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/notifications'); }}>
            <span className="icon">🔔</span> Notifications
          </a>
          <a
            href="#"
            className={`sd-nav-item ${showSettings ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setShowSettings(!showSettings); }}
          >
            <span className="icon">⚙️</span> Settings
          </a>
          {showSettings && (
            <div className="sd-settings-panel">
              <button
                className="sd-profile-btn"
                onClick={() => navigate('/profile')}
              >
                Profile
              </button>
              <button
                className="sd-logout-btn"
                onClick={() => {
                  localStorage.removeItem('studentUser');
                  navigate('/', { replace: true });
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
              >
                🚪 Log Out
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="mp-main">

        {/* Header */}
        <div className="mp-header">
          <div>
            <h1 className="mp-title">My Performance</h1>
            <p className="mp-subtitle">Detailed academic analytics and progress tracking</p>
          </div>
          <div className="mp-header-stats">
            <div className="mp-stat-pill">
              <span className="mp-stat-dot green"></span>
              Overall: <strong>{overallAvg}%</strong>
            </div>

          </div>
        </div>

        {/* Decline Alert */}
        {decliningSubjects.length > 0 && (
          <div className="mp-alert">
            <span className="mp-alert-icon">⚠️</span>
            <div>
              <strong>Declining Performance Detected</strong>
              <p>3 consecutive drops in: {decliningSubjects.join(', ')}. Consider reaching out to your teacher.</p>
            </div>
          </div>
        )}

        {/* Top Grid */}
        <div className="mp-top-grid">

          {/* Bar Chart */}
          <div className="mp-card mp-chart-card">
            <div className="mp-card-header">
              <h3>Subject Mastery</h3>
              <p>Average score per subject</p>
            </div>
            <div className="mp-chart-wrap">
              {subjectAverages.length > 0
                ? <Bar data={barData} options={barOptions} />
                : <p className="mp-empty">No data available.</p>
              }
            </div>
          </div>

        </div>

        {/* Recent Test Performance */}
        <div className="mp-card">
          <div className="mp-card-header">
            <div>
              <h3>Recent Test Performance</h3>
              <p>Latest assessment scores and performance status</p>
            </div>
          </div>

          {recentMarks.length > 0 ? (
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Assessment Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMarks.map((m, i) => {
                  const pct = Math.round((m.marks_obtained / m.total_marks) * 100);
                  const st = getStatus(pct);
                  return (
                    <tr key={i}>
                      <td className="mp-td-bold">{m.test_name}</td>
                      <td className="mp-td-muted">{m.subject}</td>
                      <td className="mp-td-muted">{m.date_taken}</td>
                      <td>{m.marks_obtained}/{m.total_marks}</td>
                      <td>
                        <span style={{ color: pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                          {pct}%
                        </span>
                      </td>
                      <td><span className={`mp-status ${st.cls}`}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mp-empty">No data available.</p>
          )}
        </div>

      </main>
    </div>
  );
}

export default Performance;