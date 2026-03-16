import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { getTeacherSessionProfile } from '../utils/teacherSession.js';

function TeacherNotify() {
  const navigate = useNavigate();
  const { teacherName, department, avatar } = getTeacherSessionProfile();
  const [alerts, setAlerts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [alertsRes, testsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/notifications/?recipient=teacher&type=teacher_alert'),
          fetch('http://127.0.0.1:8000/api/upcoming-tests/'),
        ]);

        const alertsData = alertsRes.ok ? await alertsRes.json() : [];
        const testsData = testsRes.ok ? await testsRes.json() : [];

        setAlerts(Array.isArray(alertsData) ? alertsData : []);
        setTests(Array.isArray(testsData) ? testsData : []);
      } catch (err) {
        console.error('Failed to load teacher notifications context:', err);
        setAlerts([]);
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const upcomingByClass = useMemo(() => {
    const map = {};
    tests.forEach((t) => {
      const key = t.class_name || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tests]);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">🎓</div>
          <div className="brand-text">
            <h2>EduManage</h2>
            <p>Teacher Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/studentDB')} style={{ cursor: 'pointer' }}><span className="nav-icon">▦</span> Dashboard</div>
          <div className="nav-item" onClick={() => navigate('/student-analysis')} style={{ cursor: 'pointer' }}><span className="nav-icon">👥</span> Students</div>
          <div className="nav-item" onClick={() => navigate('/attendance')} style={{ cursor: 'pointer' }}><span className="nav-icon">📋</span> Attendance</div>
          <div className="nav-item" onClick={() => navigate('/upcomming-test')} style={{ cursor: 'pointer' }}><span className="nav-icon">📝</span> Upcoming Tests</div>
          <div className="nav-item" onClick={() => navigate('/ai-insights')} style={{ cursor: 'pointer' }}><span className="nav-icon">✨</span> AI Insights</div>
          <div className="nav-item active" style={{ cursor: 'pointer' }}><span className="nav-icon">🔔</span> Alerts</div>
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item" style={{ cursor: 'pointer' }}><span className="nav-icon">⚙️</span> Settings</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🔔</span>
            <input type="text" value="AI escalation alerts: continued decline after student warning" readOnly className="search-input" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn-primary" onClick={() => navigate('/studentDB')}>Back to Dashboard</button>
            <div className="user-profile-section">
              <div className="user-info">
                <span className="user-name">{teacherName}</span>
                <span className="user-role">{department}</span>
              </div>
              <img src={avatar} alt="Teacher" className="user-avatar" />
            </div>
          </div>
        </header>

        <div className="dashboard-body">
          <div className="roster-container" style={{ marginBottom: 20 }}>
            <div className="roster-header">
              <h3>Teacher Alerts (Subject-wise Continued Drops)</h3>
            </div>
            {loading ? (
              <p style={{ padding: 24, margin: 0 }}>Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <p style={{ padding: 24, margin: 0 }}>No escalation alerts right now. Students are stable or improving after alerts.</p>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Previous %</th>
                    <th>Latest %</th>
                    <th>AI Message</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((item) => (
                    <tr key={item.id}>
                      <td>{item.student_name}</td>
                      <td>{item.class_name}</td>
                      <td>{item.subject}</td>
                      <td>{item.details?.previous_score ?? '-'}%</td>
                      <td>{item.details?.latest_score ?? '-'}%</td>
                      <td>{item.message}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-primary"
                          onClick={() => navigate(`/student-details/${item.student}/${encodeURIComponent(item.class_name || 'All')}`)}
                        >
                          View Student
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="roster-container">
            <div className="roster-header">
              <h3>Upcoming Tests by Class</h3>
            </div>
            {upcomingByClass.length === 0 ? (
              <p style={{ padding: 24, margin: 0 }}>No upcoming tests scheduled.</p>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Upcoming Test Count</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingByClass.map(([className, count]) => (
                    <tr key={className}>
                      <td>{className}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherNotify;
