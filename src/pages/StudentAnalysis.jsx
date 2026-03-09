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

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class_name))];
    return ["All Students", ...classes.sort(), "Graduates"];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (activeTab !== "All Students" && activeTab !== "Graduates") {
      filtered = filtered.filter(s => s.class_name === activeTab);
    } else if (activeTab === "Graduates") {
      filtered = [];
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

      {/* SIDEBAR — identical structure and classes to App.jsx */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">🎓</div>
          <div className="brand-text">
            <h2>EduManage</h2>
            <p>Teacher Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-item" onClick={() => navigate("/studentDB")}>
            <span className="nav-icon">▦</span> Dashboard
          </a>
          <a className="nav-item active" onClick={() => navigate("/student-analysis")}>
            <span className="nav-icon">👥</span> Students
          </a>
          <a className="nav-item" onClick={() => navigate("/attendance")}>
            <span className="nav-icon">�</span> Attendance
          </a>
          <a className="nav-item">
            <span className="nav-icon">📊</span> Reports
          </a>
          <a className="nav-item">
            <span className="nav-icon">✨</span> AI Insights
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item">
            <span className="nav-icon">⚙️</span> Settings
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP NAVBAR */}
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search student by name or ID..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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

        {/* DIRECTORY BODY */}
        <div className="directory-body">
          <div className="breadcrumb">Students &rsaquo; <b>Directory</b></div>

          <div className="page-header">
            <h2>Student Directory</h2>
            <p>Manage and monitor academic performance for {students.length} students.</p>
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
                  <div className="student-card" key={student.id}>
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