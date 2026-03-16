import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { getTeacherSessionProfile } from '../utils/teacherSession.js';

function AttendanceSheet() {
  const navigate = useNavigate();
  const { teacherName, department, avatar } = getTeacherSessionProfile();
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingId, setSavingId] = useState(null); // tracks which card is currently saving

  // ── FETCH STUDENTS ────────────────────────────────────────────
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/students/");
        const data = await res.json();
        setStudents(data);
        const initial = {};
        data.forEach(s => { initial[s.id] = 'not_marked'; });
        setAttendanceState(initial);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, []);

  // ── LOAD SAVED ATTENDANCE WHEN DATE CHANGES ───────────────────
  useEffect(() => {
    if (!currentDate || students.length === 0) return;

    const loadSavedAttendance = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/attendance/?date=${currentDate}`);
        const data = await res.json();

        const loaded = {};
        students.forEach(s => { loaded[s.id] = 'not_marked'; });
        if (data.records) {
          data.records.forEach(r => { loaded[r.student_id] = r.status; });
        }
        setAttendanceState(loaded);
      } catch (err) {
        console.error("Error loading attendance:", err);
      }
    };

    loadSavedAttendance();
  }, [currentDate, students]);

  // ── TOGGLE + AUTO SAVE ────────────────────────────────────────
  // When teacher clicks a card:
  // 1. Update the UI immediately
  // 2. Save just that one student's new status to the backend
  const toggleAttendance = async (studentId) => {
    const current = attendanceState[studentId];
    let next = 'present';
    if (current === 'present') next = 'absent';
    else if (current === 'absent') next = 'not_marked';

    // Update UI immediately so it feels instant
    setAttendanceState(prev => ({ ...prev, [studentId]: next }));

    // Save just this student in the background
    setSavingId(studentId);
    try {
      await fetch('http://127.0.0.1:8000/api/attendance/save/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentDate,
          records: [{ student_id: studentId, status: next }]
        })
      });
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSavingId(null);
    }
  };

  const markAll = async (status) => {
    // Update UI first
    const newState = {};
    filteredStudents.forEach(s => { newState[s.id] = status; });
    setAttendanceState(prev => ({ ...prev, ...newState }));

    // Then save all of them
    const records = filteredStudents.map(s => ({ student_id: s.id, status }));
    try {
      await fetch('http://127.0.0.1:8000/api/attendance/save/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: currentDate, records })
      });
    } catch (err) {
      console.error("Bulk save failed:", err);
    }
  };

  // ── UNIQUE CLASSES ────────────────────────────────────────────
  const uniqueClasses = useMemo(() => {
    return ["All", ...new Set(students.map(s => s.class_name))];
  }, [students]);

  // ── FILTER ────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedClass !== "All") list = list.filter(s => s.class_name === selectedClass);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.roll_number.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, selectedClass, searchQuery]);

  // ── STATS ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const present = filteredStudents.filter(s => attendanceState[s.id] === 'present').length;
    const absent = filteredStudents.filter(s => attendanceState[s.id] === 'absent').length;
    const notMarked = filteredStudents.filter(s => attendanceState[s.id] === 'not_marked').length;
    const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, notMarked, attendancePct };
  }, [filteredStudents, attendanceState]);

  const statusLabel = (status) => {
    if (status === 'present') return 'Present';
    if (status === 'absent') return 'Absent';
    return 'Not Marked';
  };

  const statusIcon = (status) => {
    if (status === 'present') return '✔';
    if (status === 'absent') return '✖';
    return '—';
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
          <div className="nav-item active" style={{ cursor: 'pointer' }}><span className="nav-icon">📋</span> Attendance</div>
          <div className="nav-item" onClick={() => navigate("/upcomming-test")} style={{ cursor: 'pointer' }}><span className="nav-icon">📝</span> Upcoming Tests</div>
          <div className="nav-item" onClick={() => navigate("/ai-insights")} style={{ cursor: 'pointer' }}><span className="nav-icon">✨</span> AI Insights</div>
          <div className="nav-item" onClick={() => navigate("/teacher/alerts")} style={{ cursor: 'pointer' }}><span className="nav-icon">🔔</span> Alerts</div>
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-item" style={{ cursor: 'pointer' }}><span className="nav-icon">⚙️</span> Settings</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">

        {/* TOP BAR */}
        <header className="top-navbar">
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              Attendance Sheet
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              {currentDate} · {selectedClass === 'All' ? 'All Classes' : selectedClass}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="date"
              value={currentDate}
              onChange={e => setCurrentDate(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 13, color: '#1e293b',
                background: 'gray', cursor: 'pointer'
              }}
            />

            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 13, color: '#1e293b',
                background: 'white', cursor: 'pointer', minWidth: 150
              }}
            >
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* No save button — auto saves on click */}
            <div style={{
              padding: '9px 16px', background: '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: 8,
              fontSize: 12, color: '#16a34a', fontWeight: 600
            }}>
              Auto-saving
            </div>

            <div className="user-profile-section" style={{ marginLeft: 4 }}>
              <div className="user-info">
                <span className="user-name">{teacherName}</span>
                <span className="user-role">{department}</span>
              </div>
              <img src={avatar} alt="Teacher" className="user-avatar" />
            </div>
          </div>
        </header>

        <div className="dashboard-body">

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Students', value: stats.total,     color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  icon: '👥' },
              { label: 'Present',        value: stats.present,   color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: '✅' },
              { label: 'Absent',         value: stats.absent,    color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  icon: '❌' },
              { label: 'Not Marked',     value: stats.notMarked, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '⏳' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 12, padding: '18px 20px',
                border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* PROGRESS BAR */}
          <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Session Attendance</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{stats.attendancePct}%</span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: stats.attendancePct >= 75 ? '#10b981' : stats.attendancePct >= 50 ? '#f59e0b' : '#ef4444',
                width: `${stats.attendancePct}%`, transition: 'width 0.4s ease'
              }} />
            </div>
            {stats.notMarked > 0 && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#f59e0b' }}>
                ⚠ {stats.notMarked} student{stats.notMarked > 1 ? 's' : ''} not marked yet
              </p>
            )}
          </div>

          {/* CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => markAll('present')} style={{
                padding: '8px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>✔ Mark All Present</button>

              <button onClick={() => markAll('absent')} style={{
                padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>✖ Mark All Absent</button>

              <button onClick={() => markAll('not_marked')} style={{
                padding: '8px 16px', background: '#f8fafc', color: '#64748b',
                border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}>↺ Reset</button>
            </div>

            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name or roll..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px', border: '1px solid #e2e8f0',
                  borderRadius: 8, fontSize: 13, width: 220, outline: 'none'
                }}
              />
            </div>
          </div>

          {/* STUDENT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {filteredStudents.length === 0 ? (
              <p style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No students found.</p>
            ) : (
              filteredStudents.map(student => {
                const status = attendanceState[student.id] || 'not_marked';
                const isSaving = savingId === student.id;

                const cardStyle = {
                  present:    { border: '2px solid #10b981', background: 'rgba(16,185,129,0.05)' },
                  absent:     { border: '2px solid #ef4444', background: 'rgba(239,68,68,0.05)'  },
                  not_marked: { border: '2px solid #e2e8f0', background: 'white'                  },
                };

                const badgeStyle = {
                  present:    { background: '#10b981', color: 'white'    },
                  absent:     { background: '#ef4444', color: 'white'    },
                  not_marked: { background: '#f1f5f9', color: '#94a3b8'  },
                };

                return (
                  <div
                    key={student.id}
                    onClick={() => toggleAttendance(student.id)}
                    style={{
                      ...cardStyle[status],
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'all 0.18s ease',
                      opacity: isSaving ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${student.name}&background=random&color=fff&size=50`}
                        alt={student.name}
                        style={{ width: 42, height: 42, borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{student.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>#{student.roll_number}</div>
                      </div>
                    </div>

                    <div style={{
                      ...badgeStyle[status],
                      padding: '4px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <span>{isSaving ? '⏳' : statusIcon(status)}</span>
                      <span>{isSaving ? 'Saving...' : statusLabel(status)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default AttendanceSheet;