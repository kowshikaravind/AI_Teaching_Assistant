import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../App.css';
import SubjectSelectorWithManager from '../components/SubjectSelectorWithManager.jsx';
import { getTeacherSessionProfile } from '../utils/teacherSession.js';

function StudentAnalysis() {
  const navigate = useNavigate();
  const { className: classNameParam } = useParams();
  const { teacherName, department, avatar } = getTeacherSessionProfile();

  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState(
    classNameParam ? decodeURIComponent(classNameParam) : "All Students"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 8;

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

  useEffect(() => {
    const initFetch = async () => {
      await fetchData();
    }
    initFetch();
  }, [fetchData]);

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
          <div className="nav-item" onClick={() => navigate("/upcomming-test")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">📝</span> Upcoming Tests
          </div>
          <div className="nav-item" onClick={() => navigate("/ai-insights")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">✨</span> AI Insights
          </div>
          <div className="nav-item" onClick={() => navigate("/teacher/alerts")} style={{ cursor: 'pointer' }}>
            <span className="nav-icon">🔔</span> Alerts
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
            <div className="user-info">
              <span className="user-name">{teacherName}</span>
              <span className="user-role">{department}</span>
            </div>
            <img src={avatar} alt="Teacher" className="user-avatar" />
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
            <SubjectSelectorWithManager
              mode="manage-only"
              triggerText="📚 Manage Subjects"
              triggerStyle={{ marginTop: 4 }}
            />
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
    </div>
  );
}

export default StudentAnalysis;