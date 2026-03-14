import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useParams , useNavigate} from 'react-router-dom';

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler
} from 'chart.js';
import './Student.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

function StudentMain() {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [lightMode, setLightMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'light' ? true : false;
  });

  const { id } = useParams();
  const STUDENT_ID = id;
  const navigate = useNavigate();

  // Listen for theme changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('themeMode');
      setLightMode(saved === 'light' ? true : false);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app-settings-changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app-settings-changed', handleStorageChange);
    };
  }, []);

  // ── FETCH STUDENT DATA ────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studentRes, attendanceRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/students/${STUDENT_ID}/`),
          fetch(`http://127.0.0.1:8000/api/students/${STUDENT_ID}/attendance-summary/`)
        ]);
        const studentData = await studentRes.json();
        const attendanceData = await attendanceRes.json();
        setStudent(studentData);
        setAttendance(attendanceData);
      } catch (err) {
        console.error("Failed to fetch student data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [STUDENT_ID]);

  // ── OVERALL AVERAGE ───────────────────────────────────────────
  const overallAvg = useMemo(() => {
    if (!student?.test_marks?.length) return 0;
    const total = student.test_marks.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0);
    return Math.round(total / student.test_marks.length);
  }, [student]);

  // ── GRADE LABEL ───────────────────────────────────────────────
  const gradeLabel = (avg) => {
    if (avg >= 90) return 'Grade A+';
    if (avg >= 80) return 'Grade A';
    if (avg >= 70) return 'Grade B';
    if (avg >= 60) return 'Grade C';
    return 'Grade D';
  };

  // ── SUBJECT AVERAGES ──────────────────────────────────────────
  const subjectAverages = useMemo(() => {
    if (!student?.test_marks?.length) return [];
    const bySubject = {};
    student.test_marks.forEach(m => {
      if (!bySubject[m.subject]) bySubject[m.subject] = { total: 0, count: 0 };
      bySubject[m.subject].total += (m.marks_obtained / m.total_marks) * 100;
      bySubject[m.subject].count += 1;
    });
    return Object.entries(bySubject)
      .map(([name, d]) => ({ name, score: Math.round(d.total / d.count) }))
      .sort((a, b) => b.score - a.score);
  }, [student]);

  // ── WEAKEST SUBJECT (for AI recommendation widget) ────────────
  const weakestSubject = useMemo(() => {
    if (!subjectAverages.length) return null;
    return [...subjectAverages].sort((a, b) => a.score - b.score)[0];
  }, [subjectAverages]);

  // ── CHART DATA — marks sorted by date ────────────────────────
  const chartData = useMemo(() => {
    if (!student?.test_marks?.length) return null;
    const sorted = [...student.test_marks].sort((a, b) => new Date(a.date_taken) - new Date(b.date_taken));
    return {
      labels: sorted.map(m => `${m.subject} (${m.date_taken})`),
      datasets: [{
        label: 'Score %',
        data: sorted.map(m => Math.round((m.marks_obtained / m.total_marks) * 100)),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: sorted.map(m => {
          const pct = (m.marks_obtained / m.total_marks) * 100;
          return pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
        }),
        pointBorderColor: '#fff',
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }]
    };
  }, [student]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 30 } },
      y: { display: false, min: 0, max: 100 }
    }
  };

  // ── LOADING STATE ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="sd-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="sd-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ef4444' }}>Failed to load student data.</p>
      </div>
    );
  }

  return (
    <div className={`sd-layout ${lightMode ? 'sd-layout-light' : ''}`}>

      {/* SIDEBAR */}
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
          <a href="#" className="sd-nav-item active"><span className="icon">⊞</span> Dashboard</a>
          <a
            href="#"
            className="sd-nav-item"
            onClick={(e) => {
              e.preventDefault();
              navigate('/my-performance');
            }}
          >
            <span className="icon">📈</span> My Performance
          </a>
          <a
            href="#"
            className="sd-nav-item"
            onClick={(e) => {
              e.preventDefault();
              navigate('/upcoming-tests');
            }}
          >
            <span className="icon">📅</span> Upcoming Tests
          </a>
          <a
            href="#"
            className="sd-nav-item"
            onClick={(e) => {
              e.preventDefault();
              navigate('/ai-tutor');
            }}
          >
            <span className="icon">🤖</span> AI Tutor
          </a>
          <a
            href="#"
            className="sd-nav-item"
            onClick={(e) => {
              e.preventDefault();
              navigate('/notifications');
            }}
          >
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

      {/* MAIN CONTENT */}
      <main className="sd-main">

        {/* TOP HEADER */}
        <header className="sd-header">
          <div>
            <h1>Learning Command Center</h1>
            <p>Welcome back, {student.name.split(' ')[0]}. Keep pushing forward!</p>
          </div>
        </header>

        {/* TOP GRID */}
        <div className="sd-top-grid">

          {/* LEFT COLUMN */}
          <div className="sd-col-left">

            {/* OVERALL PERFORMANCE */}
            <div className="sd-card sd-overall-card">
              <div className="sd-card-header">
                <h3>OVERALL PERFORMANCE</h3>
                <span className="info-icon">ℹ️</span>
              </div>
              <div className="sd-circular-progress">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className="circle"
                    strokeDasharray={`${overallAvg}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="sd-circle-content">
                  <h2>{overallAvg}%</h2>
                  <span>{gradeLabel(overallAvg)}</span>
                </div>
              </div>
              <p className="sd-top-percent">
                Based on {student.test_marks?.length || 0} test{student.test_marks?.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* ATTENDANCE */}
            <div className="sd-card">
              <div className="sd-card-header">
                <h3>ATTENDANCE</h3>
                <span className="sd-goal-percent">{attendance?.percentage ?? 0}%</span>
              </div>
              <div className="sd-progress-bar-bg">
                <div className="sd-progress-bar-fill" style={{
                  width: `${attendance?.percentage ?? 0}%`,
                  background: attendance?.percentage >= 75 ? '#10b981' : attendance?.percentage >= 50 ? '#f59e0b' : '#ef4444'
                }}></div>
              </div>
              <div className="sd-goal-footer">
                <span>{attendance?.present ?? 0} present / {attendance?.total_sessions ?? 0} total</span>
                <span style={{ color: attendance?.percentage >= 75 ? '#10b981' : '#ef4444' }}>
                  {attendance?.percentage >= 75 ? 'Good standing' : 'Needs improvement'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="sd-col-right">

            {/* SUBJECT STRENGTHS */}
            <div className="sd-card">
              <h3>SUBJECT STRENGTHS</h3>
              {subjectAverages.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 16 }}>No marks recorded yet.</p>
              ) : (
                <div className="sd-subjects-grid">
                  {subjectAverages.map((sub, idx) => (
                    <div key={idx} className="sd-subject-item">
                      <div className="sd-subject-header">
                        <span>{sub.name}</span>
                        <span className="sd-subject-score"
                          style={{ color: sub.score >= 75 ? '#10b981' : sub.score >= 50 ? '#f59e0b' : '#ef4444' }}
                        >{sub.score}%</span>
                      </div>
                      <div className="sd-progress-bar-bg thin">
                        <div className="sd-progress-bar-fill" style={{
                          width: `${sub.score}%`,
                          background: sub.score >= 75 ? '#10b981' : sub.score >= 50 ? '#f59e0b' : '#ef4444'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXAM SCORE TRENDS */}
            <div className="sd-card sd-chart-card">
              <div className="sd-card-header">
                <h3>EXAM SCORE TRENDS</h3>
              </div>
              <div className="sd-chart-container">
                {chartData ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>No exam data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM WIDGETS */}
        <div className="sd-bottom-widgets">

          {/* AI RECOMMENDATION — based on weakest subject */}
          <div className="sd-widget widget-purple">
            <div className="widget-icon">✨</div>
            <div>
              <h4>AI Recommendation</h4>
              <p>
                {weakestSubject
                  ? `Focus on "${weakestSubject.name}" — your average is ${weakestSubject.score}%. Spend extra time reviewing it.`
                  : 'Add your test marks to get AI recommendations.'}
              </p>
            </div>
          </div>

          {/* ATTENDANCE WARNING */}
          <div className="sd-widget widget-yellow">
            <div className="widget-icon">⚠️</div>
            <div>
              <h4>Attendance Status</h4>
              <p>
                {attendance
                  ? attendance.percentage >= 75
                    ? `You have ${attendance.percentage}% attendance. Keep it up!`
                    : `Your attendance is ${attendance.percentage}%. You have ${attendance.absent} absences. Try to attend more.`
                  : 'No attendance data yet.'}
              </p>
            </div>
          </div>

          {/* TOTAL TESTS */}
          <div className="sd-widget widget-green">
            <div className="widget-icon">✓</div>
            <div>
              <h4>Tests Taken</h4>
              <p>
                {student.test_marks?.length > 0
                  ? `You have completed ${student.test_marks.length} test${student.test_marks.length !== 1 ? 's' : ''} across ${subjectAverages.length} subject${subjectAverages.length !== 1 ? 's' : ''}.`
                  : 'No tests recorded yet.'}
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default StudentMain;