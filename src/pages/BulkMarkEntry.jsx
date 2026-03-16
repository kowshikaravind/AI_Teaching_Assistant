import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import { getTeacherSessionProfile } from '../utils/teacherSession.js';

function BulkMarkEntry() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { teacherName, department, avatar } = getTeacherSessionProfile();

  const [test, setTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});   // { [studentId]: marksValue }
  const [errors, setErrors] = useState({}); // { [studentId]: errorMessage }
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Fetch test details ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/upcoming-tests/${testId}/`);
        if (!res.ok) throw new Error('Test not found');
        const data = await res.json();
        setTest(data);
      } catch (_err) {
        console.log(_err);
        setSubmitError('Failed to load test details.');
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  // ── Fetch students filtered by class_name (once test is loaded) ────────────
  useEffect(() => {
    if (!test) return;

    const fetchStudents = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/students/');
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : [])
          .filter(s => s.class_name === test.class_name)
          .sort((a, b) => {
            // Sort by roll_number numerically if possible, else alphabetically
            const rA = parseInt(a.roll_number, 10);
            const rB = parseInt(b.roll_number, 10);
            if (!isNaN(rA) && !isNaN(rB)) return rA - rB;
            return a.roll_number.localeCompare(b.roll_number);
          });
        setStudents(filtered);
      } catch (_err) {
        console.log(_err);
        setSubmitError('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [test]);

  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));

    // Live validation
    const num = parseFloat(value);
    if (value === '' || value === undefined) {
      setErrors(prev => ({ ...prev, [studentId]: '' }));
    } else if (isNaN(num) || num < 0) {
      setErrors(prev => ({ ...prev, [studentId]: 'Must be ≥ 0' }));
    } else if (test && num > test.total_marks) {
      setErrors(prev => ({ ...prev, [studentId]: `Max ${test.total_marks}` }));
    } else {
      setErrors(prev => ({ ...prev, [studentId]: '' }));
    }
  };

  const hasValidationErrors = () =>
    Object.values(errors).some(e => e && e.length > 0);

  const handleSubmit = async () => {
    if (hasValidationErrors()) {
      setSubmitError('Please fix validation errors before submitting.');
      return;
    }

    // Build payload — only include students where a mark was entered
    const marksPayload = students
      .filter(s => marks[s.id] !== undefined && marks[s.id] !== '')
      .map(s => ({ student_id: s.id, marks_obtained: parseFloat(marks[s.id]) }));

    if (marksPayload.length === 0) {
      setSubmitError('Please enter at least one student\'s marks.');
      return;
    }

    setSaving(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/testmarks/bulk/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: parseInt(testId), marks: marksPayload }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit marks.');
      } else {
        setSubmitSuccess(
          `Marks saved for ${data.created} student(s). Test marked as finished.`
        );
        // Update local test status so the UI reflects it
        setTest(prev => ({ ...prev, status: 'finished' }));
      }
    } catch (_err) {
      console.log(_err);
      setSubmitError('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
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
          <div className="nav-item active" onClick={() => navigate('/upcomming-test')} style={{ cursor: 'pointer' }}><span className="nav-icon">📝</span> Upcoming Tests</div>
          <div className="nav-item" onClick={() => navigate('/ai-insights')} style={{ cursor: 'pointer' }}><span className="nav-icon">✨</span> AI Insights</div>
          <div className="nav-item" onClick={() => navigate('/teacher/alerts')} style={{ cursor: 'pointer' }}><span className="nav-icon">🔔</span> Alerts</div>
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item" style={{ cursor: 'pointer' }}><span className="nav-icon">⚙️</span> Settings</div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">📊</span>
            <input
              type="text"
              value="Bulk Mark Entry"
              readOnly
              className="search-input"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn-primary" onClick={() => navigate('/upcomming-test')}>
              ← Back to Tests
            </button>
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
          {loading ? (
            <p style={{ padding: 24 }}>Loading...</p>
          ) : (
            <>
              {/* ── Test info card ──────────────────────────────────────────── */}
              {test && (
                <div
                  className="roster-container"
                  style={{ marginBottom: 24, padding: '20px 24px' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Test Name</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 18 }}>{test.test_name}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Subject</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{test.subject || test.topic}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Class</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{test.class_name}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Total Marks</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{test.total_marks}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Date</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{test.test_date}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Status</p>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 4,
                          padding: '3px 12px',
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 600,
                          background: test.status === 'finished' ? '#d1fae5' : '#fef3c7',
                          color: test.status === 'finished' ? '#065f46' : '#92400e',
                        }}
                      >
                        {test.status === 'finished' ? '✅ Finished' : '🕐 Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Already submitted notice ────────────────────────────────── */}
              {test?.status === 'finished' && (
                <div
                  style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    borderRadius: 8,
                    padding: '14px 20px',
                    marginBottom: 20,
                    fontWeight: 500,
                  }}
                >
                  ✅ Marks for this test have already been submitted. You can view them from the students' profiles.
                </div>
              )}

              {/* ── Bulk table ─────────────────────────────────────────────── */}
              <div className="roster-container">
                <div className="roster-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>
                    Enter Marks — {test?.class_name} ({students.length} students)
                  </h3>
                  {test?.status !== 'finished' && (
                    <button
                      className="btn-primary"
                      onClick={handleSubmit}
                      disabled={saving}
                      style={{ minWidth: 140 }}
                    >
                      {saving ? 'Saving...' : '✔ Submit All Marks'}
                    </button>
                  )}
                </div>

                {submitError && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '10px 16px', margin: '12px 24px 0' }}>
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div style={{ background: '#d1fae5', color: '#065f46', borderRadius: 6, padding: '10px 16px', margin: '12px 24px 0' }}>
                    {submitSuccess}
                  </div>
                )}

                {students.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    No students found for class <strong>{test?.class_name}</strong>.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="roster-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>#</th>
                          <th>Student Name</th>
                          <th style={{ width: 120 }}>Roll No</th>
                          <th style={{ width: 200 }}>
                            Marks Obtained&nbsp;
                            <span style={{ fontWeight: 400, color: '#9ca3af' }}>
                              (max {test?.total_marks})
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
                          <tr key={student.id}>
                            <td style={{ color: '#9ca3af' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 500 }}>{student.name}</td>
                            <td>{student.roll_number}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={test?.total_marks}
                                  step="0.5"
                                  placeholder="—"
                                  value={marks[student.id] ?? ''}
                                  onChange={e => handleMarkChange(student.id, e.target.value)}
                                  disabled={test?.status === 'finished'}
                                  style={{
                                    width: 90,
                                    padding: '6px 10px',
                                    border: errors[student.id]
                                      ? '1.5px solid #ef4444'
                                      : '1px solid #d1d5db',
                                    borderRadius: 6,
                                    fontSize: 14,
                                    color:'#000000',
                                    background: test?.status === 'finished' ? '#f9fafb' : 'white',
                                  }}
                                />
                                {errors[student.id] && (
                                  <span style={{ color: '#ef4444', fontSize: 12 }}>
                                    {errors[student.id]}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bottom submit bar */}
                {test?.status !== 'finished' && students.length > 0 && (
                  <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      style={{
                        padding: '9px 20px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                      onClick={() => navigate('/upcomming-test')}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleSubmit}
                      disabled={saving}
                      style={{ minWidth: 140 }}
                    >
                      {saving ? 'Saving...' : '✔ Submit All Marks'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default BulkMarkEntry;
