import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentTestDetailModal from '../components/StudentTestDetailModal.jsx';
import './Student.css';

function Test() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTestTab, setActiveTestTab] = useState('scheduled');
  const [lightMode, setLightMode] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const studentId = studentUser?.id;

  useEffect(() => {
    const updateTheme = () => {
      const saved = localStorage.getItem('themeMode');
      setLightMode(saved === 'light');
    };

    updateTheme();

    window.addEventListener('storage', updateTheme);
    window.addEventListener('app-settings-changed', updateTheme);
    return () => {
      window.removeEventListener('storage', updateTheme);
      window.removeEventListener('app-settings-changed', updateTheme);
    };
  }, []);

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

        const studentText = await sRes.text();
        const testsText = await tRes.text();
        const studentData = studentText ? JSON.parse(studentText) : {};
        const testsData = testsText ? JSON.parse(testsText) : [];

        if (!sRes.ok || !tRes.ok) {
          throw new Error('Failed to load upcoming tests.');
        }

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

  const refreshTests = async () => {
    if (!studentId) return;
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/students/${studentId}/`),
        fetch(`http://127.0.0.1:8000/api/upcoming-tests/?student_id=${studentId}`),
      ]);
      const studentText = await sRes.text();
      const testsText = await tRes.text();
      const studentData = studentText ? JSON.parse(studentText) : {};
      const testsData = testsText ? JSON.parse(testsText) : [];

      if (!sRes.ok || !tRes.ok) {
        throw new Error('Failed to refresh upcoming tests.');
      }

      setStudent(studentData);
      setTests(Array.isArray(testsData) ? testsData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const normalize = (text) => String(text || '').trim().toLowerCase();

  const toLocalDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;

    // Prefer full datetime parsing (with timezone) when available.
    if (timeStr && String(timeStr).includes('T')) {
      const direct = new Date(String(timeStr));
      if (!Number.isNaN(direct.getTime())) {
        return direct;
      }
    }

    const [y, m, d] = String(dateStr).split('-').map(Number);
    if (!y || !m || !d) return null;

    let hh = 23;
    let mm = 59;
    let ss = 59;

    if (timeStr) {
      const rawTime = String(timeStr).includes('T')
        ? String(timeStr).split('T')[1]
        : String(timeStr);
      const cleanTime = rawTime.replace('Z', '').split('.')[0];
      const [h = '23', min = '59', sec = '59'] = cleanTime.split(':');
      hh = Number(h);
      mm = Number(min);
      ss = Number(sec);
    }

    if ([hh, mm, ss].some((n) => Number.isNaN(n))) {
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    }

    return new Date(y, m - 1, d, hh, mm, ss, 999);
  };

  const isTestEnded = useCallback((test) => {
    const endDateTime = toLocalDateTime(test.test_date, test.end_time);
    if (!endDateTime) return false;
    return new Date() > endDateTime;
  }, []);

  const hasStudentFinished = useCallback(
    (test) => Boolean(test.already_submitted) || test.status === 'finished',
    []
  );

  const scheduledTests = useMemo(
    () => tests
      .filter((t) => {
        if (typeof t.is_past === 'boolean') {
          return !t.is_past;
        }
        const ended = isTestEnded(t);
        return !hasStudentFinished(t) && !ended;
      })
      .sort((a, b) => new Date(a.test_date) - new Date(b.test_date)),
    [tests, hasStudentFinished, isTestEnded]
  );

  const finishedTests = useMemo(
    () => tests
      .filter((t) => {
        if (typeof t.is_past === 'boolean') {
          return t.is_past;
        }
        const ended = isTestEnded(t);
        return hasStudentFinished(t) || ended;
      })
      .sort((a, b) => new Date(b.test_date) - new Date(a.test_date)),
    [tests, hasStudentFinished, isTestEnded]
  );

  const navigateWithClose = (path) => {
    setIsSidebarOpen(false);
    navigate(path);
  };

  const getStudentMarkForTest = (test) => {
    const marks = Array.isArray(student?.test_marks) ? student.test_marks : [];
    const testSubject = normalize(test.subject || test.topic);
    const testName = normalize(test.test_name);
    const testDate = String(test.test_date || '');

    const exact = marks.find(
      (m) =>
        normalize(m.test_name) === testName
        && normalize(m.subject) === testSubject
        && String(m.date_taken) === testDate
    );

    if (exact) return exact;

    const byNameAndDate = marks.find(
      (m) =>
        normalize(m.test_name) === testName
        && String(m.date_taken) === testDate
    );

    if (byNameAndDate) return byNameAndDate;

    return marks.find(
      (m) =>
        normalize(m.test_name) === testName
        && normalize(m.subject) === testSubject
    );
  };

  if (loading) return <div className="st-loading">Loading upcoming tests...</div>;

  return (
    <div className={`st-layout ${lightMode ? 'sd-layout-light st-layout-light' : ''}`}>
      <aside className={`sd-sidebar st-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button
          type="button"
          className="st-sidebar-close"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>

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
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigateWithClose(`/student-dashboard/${studentId}`); }}><span className="icon">⊞</span> Dashboard</a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigateWithClose('/my-performance'); }}><span className="icon">📈</span> My Performance</a>
          <a href="#" className="sd-nav-item active" onClick={(e) => { e.preventDefault(); navigateWithClose('/upcoming-tests'); }}><span className="icon">📅</span> Upcoming Tests</a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigateWithClose('/ai-tutor'); }}><span className="icon">🤖</span> AI Tutor</a>
          <a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigateWithClose('/notifications'); }}><span className="icon">🔔</span> Notifications</a>
          <a href="#" className={`sd-nav-item ${showSettings ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setShowSettings(!showSettings); }}><span className="icon">⚙️</span> Settings</a>
          {showSettings && (
            <div className="sd-settings-panel">
              <button className="sd-profile-btn" onClick={() => navigateWithClose('/profile')}>Profile</button>
              <button className="sd-logout-btn" onClick={() => { localStorage.removeItem('studentUser'); setIsSidebarOpen(false); navigate('/', { replace: true }); }}>🚪 Log Out</button>
            </div>
          )}
        </nav>
      </aside>

      {isSidebarOpen && <button type="button" className="st-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" />}

      <main className="st-main">
        <div className="st-header">
          <div className="st-header-main">
            <button
              type="button"
              className="st-hamburger-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              ☰
            </button>
            <div>
              <h1>Upcoming Tests</h1>
              <p>Stay prepared with your scheduled assessments.</p>
            </div>
          </div>
        </div>

        <div className="st-grid">
          <section className="st-card st-tests-card">
            <div className="st-tab-switcher">
              <button
                type="button"
                onClick={() => setActiveTestTab('scheduled')}
                className={`st-tab-btn ${activeTestTab === 'scheduled' ? 'active' : ''}`}
              >
                Scheduled Test
              </button>
              <button
                type="button"
                onClick={() => setActiveTestTab('past')}
                className={`st-tab-btn ${activeTestTab === 'past' ? 'active' : ''}`}
              >
                Past Test
              </button>
            </div>

            {activeTestTab === 'scheduled' ? (
              <>
                <h3>Scheduled For {student?.class_name}</h3>
                {scheduledTests.length === 0 ? (
                  <p className="st-empty">No upcoming tests scheduled yet.</p>
                ) : (
                  <div className="st-list">
                    {scheduledTests.map((t) => (
                      <div className="st-item" key={t.id}>
                        <div>
                          <h4>{t.test_name}</h4>
                          <p>Subject: {t.subject || t.topic}</p>
                        </div>
                        <div className="st-meta">
                          <span>{t.test_date}</span>
                          <strong>{t.total_marks} marks</strong>
                          <button
                            type="button"
                            className="st-manage-btn"
                            onClick={() => setSelectedTest(t)}
                            style={{ marginTop: 8 }}
                          >
                            View / Start
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3>Past Tests (Finished)</h3>
                {finishedTests.length === 0 ? (
                  <p className="st-empty">No finished tests yet.</p>
                ) : (
                  <div className="st-past-track">
                    {finishedTests.map((t) => {
                      const mark = getStudentMarkForTest(t);
                      const pct = mark && Number(mark.total_marks) > 0
                        ? Math.round((Number(mark.marks_obtained) / Number(mark.total_marks)) * 100)
                        : null;

                      return (
                        <div key={`finished-${t.id}`} className="st-past-card">
                          <div className="st-past-head">
                            <h4>{t.test_name}</h4>
                            <span
                              className="st-finished-badge"
                            >
                              Finished
                            </span>
                          </div>

                          <p className="st-past-subject">
                            Subject: {t.subject || t.topic}
                          </p>
                          <p className="st-past-date">
                            Date: {t.test_date}
                          </p>

                          {mark ? (
                            <div className="st-mark-panel">
                              <div>
                                <p className="st-mark-label">Your Marks</p>
                                <strong className="st-mark-value">
                                  {mark.marks_obtained}/{mark.total_marks}
                                </strong>
                              </div>
                              <strong className="st-mark-pct">
                                {pct}%
                              </strong>
                            </div>
                          ) : (
                            <p className="st-mark-pending">
                              Marks not published yet.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {selectedTest && (
        <StudentTestDetailModal
          test={selectedTest}
          studentId={studentId}
          onClose={() => setSelectedTest(null)}
          onTestStarted={refreshTests}
        />
      )}
    </div>
  );
}

export default Test;
