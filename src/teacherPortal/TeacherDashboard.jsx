import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTeacherApiUrl, getTeacherSessionProfile } from '../utils/teacherSession.js';
import './teacherPortal.css';

const MODULES = [
  {
    key: 'students',
    title: 'Students',
    desc: 'View and manage students enrolled in this class, track individual profiles and contact info.',
    linkText: 'Manage Roster',
    icon: '👥',
    iconBg: '#e0e7ff',
    path: '/teacher/students',
  },

  {
    key: 'tests',
    title: 'Upcoming Tests',
    desc: 'Schedule and manage assessments, upload question papers and set deadlines.',
    linkText: 'View Schedule',
    icon: '📋',
    iconBg: '#fef9c3',
    path: '/teacher/tests',
  },
  {
    key: 'ai',
    title: 'AI Insights',
    desc: 'Analyse student performance trends using machine learning to predict outcomes and risks.',
    linkText: 'Generate Report',
    icon: '🤖',
    iconBg: '#ffedd5',
    path: '/teacher/ai',
    isNew: true,
  },
];

function toLetterGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'F';
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { teacherName, assignedClass, avatar } = getTeacherSessionProfile();
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsRes, testsRes, alertsRes, marksRes] = await Promise.all([
          fetch(buildTeacherApiUrl('students/')),
          fetch(buildTeacherApiUrl('upcoming-tests/')),
          fetch(buildTeacherApiUrl('notifications/', { recipient: 'teacher', type: 'teacher_alert', unread: 'true' })),
          fetch(buildTeacherApiUrl('testmarks/')),
        ]);
        setStudents(studentsRes.ok ? (await studentsRes.json()) || [] : []);
        setTests(testsRes.ok ? (await testsRes.json()) || [] : []);
        setAlerts(alertsRes.ok ? (await alertsRes.json()) || [] : []);
        const marksData = marksRes.ok ? await marksRes.json() : [];
        setMarks(Array.isArray(marksData) ? marksData : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const analytics = useMemo(() => {
    const totalStudents = students.length;
    const totalTests = tests.length;
    const finishedTests = tests.filter((t) => t.status === 'finished').length;
    const scheduledTests = tests.filter((t) => t.status === 'scheduled').length;



    // Class performance from marks
    let grade = '—';
    if (marks.length > 0) {
      const scored = marks.filter((m) => m.total_marks > 0);
      if (scored.length > 0) {
        const avgPct = scored.reduce((sum, m) => sum + (m.marks_obtained / m.total_marks) * 100, 0) / scored.length;
        grade = toLetterGrade(Math.round(avgPct));
      }
    }

    // Student engagement: inverse of alerts
    let engagement = 'High';
    if (alerts.length >= 10) engagement = 'Low';
    else if (alerts.length >= 4) engagement = 'Medium';

    return {
      totalStudents,
      totalTests,
      finishedTests,
      scheduledTests,

      grade,
      engagement,
      alertCount: alerts.length,
    };
  }, [students, tests, alerts, marks]);

  const handleLogout = () => {
    localStorage.removeItem('teacherUser');
    navigate('/teacher-login', { replace: true });
  };

  return (
    <div className="edudash-app">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="edudash-topbar">
        <div className="edudash-brand" role="presentation">
          <div className="edudash-brand-icon">🎓</div>
          <span className="edudash-brand-name">EduManage</span>
        </div>

        <div className="edudash-topbar-end">
          <button type="button" className="edudash-switch-course-btn" onClick={() => navigate('/teacher/alerts')}>
            🔔 {analytics.alertCount > 0 ? `${analytics.alertCount} Alert${analytics.alertCount > 1 ? 's' : ''}` : 'No Alerts'}
          </button>
          <button type="button" className="edudash-switch-course-btn" onClick={handleLogout}>
            ↩ Log Out
          </button>
          <div className="edudash-user-chip">
            <div className="edudash-user-info">
              <span className="edudash-user-name">{teacherName}</span>
              <span className="edudash-user-role">Class Teacher</span>
            </div>
            <img src={avatar} alt="Teacher" className="edudash-avatar" />
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '60px 40px', color: '#6b7280', fontSize: 15 }}>Loading dashboard…</div>
      ) : (
        <>
          {/* ── Course Header ──────────────────────────────────── */}
          <div className="edudash-course-header">
            <div className="edudash-breadcrumb">
              COURSES <span className="bc-sep">›</span>{' '}
              <span className="bc-active">ACTIVE COURSE</span>
            </div>

            <div className="edudash-course-title-row">
              <h1 className="edudash-course-name">{assignedClass || 'No Class Assigned'}</h1>
            </div>

            <div className="edudash-course-meta-row">
              <span className="edudash-meta-item">
                📅 {new Date().getFullYear()}
              </span>
              <span className="edudash-meta-item">
                👥 {analytics.totalStudents} Student{analytics.totalStudents !== 1 ? 's' : ''}
              </span>
              <div className="edudash-course-btns">
                <button type="button" className="edudash-settings-btn" onClick={() => navigate('/teacher/students')}>
                  ⚙ Course Settings
                </button>
                <button type="button" className="edudash-quick-btn" onClick={() => navigate('/add-student', { state: { returnTo: '/teacher/students' } })}>
                  + Quick Action
                </button>
              </div>
            </div>
          </div>

          {/* ── Module Cards ───────────────────────────────────── */}
          <div className="edudash-modules-section">
            <div className="edudash-modules-grid">
              {MODULES.map((mod) => (
                <div
                  key={mod.key}
                  className="edudash-module-card"
                  onClick={() => navigate(mod.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(mod.path)}
                >
                  <div className="edudash-module-icon-wrap" style={{ background: mod.iconBg }}>
                    {mod.icon}
                  </div>
                  <h3 className="edudash-module-title">
                    {mod.title}
                    {mod.isNew && <span className="edudash-new-badge">NEW</span>}
                  </h3>
                  <p className="edudash-module-desc">{mod.desc}</p>
                  <span className="edudash-module-link" aria-hidden="true">
                    {mod.linkText} →
                  </span>
                  <span className="edudash-module-bg-icon" aria-hidden="true">{mod.icon}</span>
                </div>
              ))}

            </div>
          </div>

          {/* ── Course Analytics Overview ──────────────────────── */}
          <div className="edudash-analytics-section">
            <div className="edudash-analytics-card">
              <div className="edudash-analytics-header">
                <h3 className="edudash-analytics-title">Course Analytics Overview</h3>
              </div>

              <div className="edudash-analytics-row">


                <div className="edudash-analytic-item">
                  <div className="edudash-analytic-label">CLASS PERFORMANCE</div>
                  <div className="edudash-analytic-value">{analytics.grade}</div>
                  <span className="edudash-analytic-badge badge-grey">
                    {analytics.grade === '—' ? 'No Tests Yet' : 'Recent Avg'}
                  </span>
                </div>

                <div className="edudash-analytic-item">
                  <div className="edudash-analytic-label">ASSIGNMENTS</div>
                  <div className="edudash-analytic-value">
                    {analytics.finishedTests}/{analytics.totalTests}
                  </div>
                  <span className={`edudash-analytic-badge ${analytics.scheduledTests > 0 ? 'badge-orange' : 'badge-green'}`}>
                    {analytics.scheduledTests > 0 ? `${analytics.scheduledTests} Pending` : 'All Done'}
                  </span>
                </div>

                <div className="edudash-analytic-item">
                  <div className="edudash-analytic-label">STUDENT ENGAGEMENT</div>
                  <div className="edudash-analytic-value">{analytics.engagement}</div>
                  <span className={`edudash-analytic-badge ${analytics.engagement === 'High' ? 'badge-green' : analytics.engagement === 'Medium' ? 'badge-orange' : 'badge-grey'}`}>
                    {analytics.alertCount === 0 ? 'No Issues' : `${analytics.alertCount} Alert${analytics.alertCount > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}