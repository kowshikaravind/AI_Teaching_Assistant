import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function UpcommingTest() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tests, setTests] = useState([]);

  const [formData, setFormData] = useState({
    class_name: '',
    test_name: '',
    subject: '',
    test_date: '',
    total_marks: '',
  });

  const fetchStudents = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/students/');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/upcoming-tests/');
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTests([]);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchTests();
  }, []);

  const classOptions = useMemo(() => {
    const classes = [...new Set(students.map((s) => s.class_name).filter(Boolean))];
    return classes.sort();
  }, [students]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        class_name: formData.class_name,
        test_name: formData.test_name,
        subject: formData.subject,
        topic: formData.subject,
        test_date: formData.test_date,
        total_marks: Number(formData.total_marks),
      };

      const res = await fetch('http://127.0.0.1:8000/api/upcoming-tests/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Failed to schedule test.');
      } else {
        setSuccess('Upcoming test scheduled successfully.');
        setFormData({ class_name: '', test_name: '', subject: '', test_date: '', total_marks: '' });
        fetchTests();
      }
    } catch (err) {
      console.error(err);
      setError('Server error while scheduling test.');
    } finally {
      setSaving(false);
    }
  };

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
          <div className="nav-item active"><span className="nav-icon">🗓️</span> Upcoming Tests</div>
          <div className="nav-item" onClick={() => navigate('/ai-insights')} style={{ cursor: 'pointer' }}><span className="nav-icon">✨</span> AI Insights</div>
          <div className="nav-item" onClick={() => navigate('/teacher/alerts')} style={{ cursor: 'pointer' }}><span className="nav-icon">🔔</span> Alerts</div>
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item" style={{ cursor: 'pointer' }}><span className="nav-icon">⚙️</span> Settings</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🗓️</span>
            <input type="text" value="Schedule and manage upcoming tests" readOnly className="search-input" />
          </div>
          <button className="btn-primary" onClick={() => navigate('/studentDB')}>Back to Dashboard</button>
        </header>

        <div className="dashboard-body">
          <div className="roster-container" style={{ marginBottom: 24 }}>
            <div className="roster-header">
              <h3>Schedule New Test</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select name="class_name" value={formData.class_name} onChange={handleChange} required style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }}>
                  <option value="">Select Class</option>
                  {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input name="test_name" value={formData.test_name} onChange={handleChange} placeholder="Test Name" required style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>

              <input name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" required style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input type="date" name="test_date" value={formData.test_date} onChange={handleChange} required style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }} />
                <input type="number" min="1" name="total_marks" value={formData.total_marks} onChange={handleChange} placeholder="Total Marks" required style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>

              {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: '#059669', margin: 0 }}>{success}</p>}

              <div>
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Schedule Test'}</button>
              </div>
            </form>
          </div>

          <div className="roster-container">
            <div className="roster-header">
              <h3>Scheduled Tests</h3>
            </div>
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Total Marks</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {tests.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24 }}>No tests scheduled yet.</td></tr>
                ) : tests.map((t) => (
                  <tr key={t.id}>
                    <td>{t.test_name}</td>
                    <td>{t.subject || t.topic}</td>
                    <td>{t.test_date}</td>
                    <td>{t.total_marks}</td>
                    <td>{t.class_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UpcommingTest;
