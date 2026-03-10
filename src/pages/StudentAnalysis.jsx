import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../App.css';

function StudentAnalysis() {
  const navigate = useNavigate();
  const { className: classNameParam } = useParams();

  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState(
    classNameParam ? decodeURIComponent(classNameParam) : "All Students"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 8;

  // ── SUBJECT MODAL STATE ───────────────────────────────────────
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [subjectError, setSubjectError] = useState("");

  // ── FETCH STUDENTS ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/students/");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── FETCH SUBJECTS FROM DB ────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/subjects/");
      const data = await res.json();
      setAllSubjects(data); // [{id, name}, ...]
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  // ── ADD SUBJECT TO DB ─────────────────────────────────────────
  const handleAddSubject = async () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) { setSubjectError("Subject name cannot be empty."); return; }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/subjects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      if (res.ok) {
        setNewSubjectInput("");
        setSubjectError("");
        fetchSubjects();
      } else {
        setSubjectError("Subject already exists.");
      }
    } catch (err) {
      setSubjectError("Failed to add subject.");
    }
  };

  // ── DELETE SUBJECT FROM DB ────────────────────────────────────
  const handleDeleteSubject = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/subjects/${id}/`, { method: "DELETE" });
      fetchSubjects();
    } catch (err) {
      console.error("Failed to delete subject:", err);
    }
  };

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class_name))];
    return ["All Students", ...classes.sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (activeTab !== "All Students") {
      filtered = filtered.filter(s => s.class_name === activeTab);
    }
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.roll_number.toLowerCase().includes(lowerQuery)
      );
    }
    return filtered;
  }, [students, activeTab, searchQuery]);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, currentPage]);

  const getStudentAverage = (testMarksArray) => {
    if (!testMarksArray || testMarksArray.length === 0) return null;
    let totalObtained = 0, totalMax = 0;
    testMarksArray.forEach(test => {
      totalObtained += Number(test.marks_obtained);
      totalMax += Number(test.total_marks);
    });
    if (totalMax === 0) return 0;
    return Math.round((totalObtained / totalMax) * 100);
  };

  const handleProfileClick = (studentId, studentClassName) => {
    navigate(`/student-details/${studentId}/${encodeURIComponent(studentClassName)}`);
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
          <div className="nav-item" onClick={() => navigate("/studentDB")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">▦</span> Dashboard
          </div>
          <div className="nav-item active" onClick={() => navigate("/student-analysis")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">👥</span> Students
          </div>
          <div className="nav-item" onClick={() => navigate("/attendance")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">📋</span> Attendance
          </div>
          <div className="nav-item" onClick={() => navigate("/ai-insights")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">✨</span> AI Insights
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-item" style={{ cursor: 'pointer' }}>
            <span className="nav-icon">⚙️</span> Settings
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search student by name or ID..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="user-profile-section">
            <div className="notification-bell">🔔</div>
            <div className="user-info">
              <span className="user-name">Sarah Jenkins</span>
              <span className="user-role">Senior Educator</span>
            </div>
            <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="user-avatar" />
          </div>
        </header>

        <div className="directory-body">
          <div className="breadcrumb">Students &rsaquo; <b>Directory</b></div>

          {/* PAGE HEADER WITH MANAGE SUBJECTS BUTTON */}
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Student Directory</h2>
              <p>Manage and monitor academic performance for {students.length} students.</p>
            </div>
            <button
              onClick={() => setShowSubjectModal(true)}
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                whiteSpace: 'nowrap', marginTop: 4
              }}
            >📚 Manage Subjects</button>
          </div>

          {/* TABS */}
          <div className="directory-tabs">
            {uniqueClasses.map(tab => (
              <button
                key={tab}
                className={`dir-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              >
                {tab.replace(/[\]()]/g, '')}
              </button>
            ))}
          </div>

          {/* STUDENT CARDS */}
          {paginatedStudents.length === 0 ? (
            <div className="no-results-msg">No students found for this selection.</div>
          ) : (
            <div className="student-grid">
              {paginatedStudents.map(student => {
                const avg = getStudentAverage(student.test_marks);
                let badgeClass = "perf-badge-neutral";
                if (avg !== null) {
                  if (avg >= 90) badgeClass = "perf-badge-excellent";
                  else if (avg >= 70) badgeClass = "perf-badge-good";
                  else badgeClass = "perf-badge-warning";
                }
                return (
                  <div className="student-card" key={student.id} onClick={() => handleProfileClick(student.id, student.class_name)}>
                    <div className={`perf-badge ${badgeClass}`}>
                      {avg !== null ? `${avg}% Perf.` : "No Data"}
                    </div>
                    <img
                      src={`https://ui-avatars.com/api/?name=${student.name}&background=random&color=fff&size=80`}
                      alt={student.name}
                      className="student-avatar-lg"
                    />
                    <h3 className="student-card-name">{student.name}</h3>
                    <p className="student-card-id">ID: #{student.roll_number}</p>
                    <div className="student-card-footer">
                      <div className="card-class-info">
                        <span>CLASS</span>
                        <b>{student.class_name}</b>
                      </div>
                      <button
                        className="view-profile-link"
                        onClick={() => handleProfileClick(student.id, student.class_name)}
                      >
                        View Profile &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Showing {(currentPage - 1) * studentsPerPage + 1} to{' '}
                {Math.min(currentPage * studentsPerPage, totalStudents)} of {totalStudents} students
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}>&lsaquo;</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i + 1}
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}>&rsaquo;</button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MANAGE SUBJECTS MODAL ─────────────────────────────── */}
      {showSubjectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>📚 Manage Subjects</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Subjects added here appear in the dropdown for all students.
                </p>
              </div>
              <button
                onClick={() => { setShowSubjectModal(false); setNewSubjectInput(""); setSubjectError(""); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}
              >✕</button>
            </div>

            {/* Add input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics..."
                value={newSubjectInput}
                onChange={e => { setNewSubjectInput(e.target.value); setSubjectError(""); }}
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                style={{
                  flex: 1, padding: '10px 14px',
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, outline: 'none'
                }}
              />
              <button
                onClick={handleAddSubject}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}
              >Add</button>
            </div>

            {subjectError && (
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ef4444' }}>{subjectError}</p>
            )}

            {/* Subject list */}
            <div style={{
              maxHeight: 260, overflowY: 'auto',
              border: '1px solid #f1f5f9', borderRadius: 10, marginTop: 12
            }}>
              {allSubjects.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No subjects yet. Add one above.
                </p>
              ) : (
                allSubjects.map((subject, i) => (
                  <div key={subject.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: i < allSubjects.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: i % 2 === 0 ? '#fafafa' : 'white'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{subject.name}</span>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      style={{
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: 'none', borderRadius: 6,
                        padding: '4px 10px', fontSize: 11,
                        cursor: 'pointer', fontWeight: 600
                      }}
                    >Remove</button>
                  </div>
                ))
              )}
            </div>

            {/* Done */}
            <button
              onClick={() => { setShowSubjectModal(false); setNewSubjectInput(""); setSubjectError(""); }}
              style={{
                width: '100%', marginTop: 18, padding: '11px',
                background: '#f1f5f9', color: '#475569',
                border: 'none', borderRadius: 8,
                fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}
            >Done</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentAnalysis;