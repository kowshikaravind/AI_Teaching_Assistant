import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

function App() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/students/");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  }, []);
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // --- CALCULATE NEW DASHBOARD STATS ---
  const stats = useMemo(() => {
    const totalEnrollment = students.length;
    const uniqueClasses = new Set(students.map(s => s.class_name)).size;
    const avgStudentsPerClass = uniqueClasses === 0 ? 0 : (totalEnrollment / uniqueClasses).toFixed(1);
    
    return {
      enrollment: totalEnrollment,
      classes: uniqueClasses,
      avgPerClass: avgStudentsPerClass
    };
  }, [students]);

  // --- FILTER STUDENTS BASED ON SEARCH QUERY ---
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    return students.filter((student) => {
      return (
        student.name.toLowerCase().includes(lowerCaseQuery) ||
        student.roll_number.toLowerCase().includes(lowerCaseQuery) ||
        student.class_name.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [students, searchQuery]);

  // --- ACTIONS ---
  const handleEditClick = (student) => {
    navigate("/add-student", { state: { editMode: true, studentData: student } });
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    const isConfirmed = window.confirm(`Are you sure you want to completely delete ${studentName}? This action cannot be undone.`);
    
    if (isConfirmed) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/`, {
          method: "DELETE",
        });

        if (res.ok) {
          fetchStudents(); // Instantly refresh the table data
        } else {
          alert("Failed to delete student. Check the console.");
        }
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
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
          <a href="#" className="nav-item active"><span className="nav-icon">▦</span> Dashboard</a>
          <a href="#" className="nav-item" onClick={() => navigate("/student-analysis")}><span className="nav-icon">👥</span> Students</a>
          <a href="#" className="nav-item" onClick={() => navigate("/attendance")}><span className="nav-icon">�</span> Attendance</a>
          <a href="#" className="nav-item"><span className="nav-icon">📊</span> Reports</a>
          <a href="#" className="nav-item"><span className="nav-icon">✨</span> AI Insights</a>
        </nav>
        
        <div className="sidebar-bottom">
          <a href="#" className="nav-item"><span className="nav-icon">⚙️</span> Settings</a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        
        {/* TOP NAVBAR */}
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name, roll no, or class..." 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* DASHBOARD CONTENT */}
        <div className="dashboard-body">
          
          {/* STATS CARDS */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue-icon">👤</div>
                <span className="stat-trend positive">+2.1% ↗</span>
              </div>
              <div className="stat-title">Total Enrollment</div>
              <div className="stat-value">{stats.enrollment}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon purple-icon">🏫</div>
                <span className="stat-trend positive">+0.5% ↗</span>
              </div>
              <div className="stat-title">Number of Classes</div>
              <div className="stat-value">{stats.classes}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon orange-icon">👥</div>
                <span className="stat-trend negative">-1.2% ↘</span>
              </div>
              <div className="stat-title">Avg Students in a Class</div>
              <div className="stat-value">{stats.avgPerClass}</div>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE */}
          <div className="roster-container">
            <div className="roster-header">
              <h3>{searchQuery ? `Search Results (${filteredStudents.length})` : "Student Roster (All Classes)"}</h3>
              <button className="btn-primary" onClick={() => navigate("/add-student")}>
                👤+ Add New Student
              </button>
            </div>
            
            <table className="roster-table">
              <thead>
                <tr>
                  <th>ROLL NUMBER</th>
                  <th>FULL NAME</th>
                  <th>CLASS</th>
                  {/* ADDED GENDER HEADER HERE */}
                  <th>GENDER</th>
                  <th>PARENT NUMBER</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    {/* UPDATED COLSPAN FROM 5 TO 6 */}
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                      {searchQuery ? `No students found matching "${searchQuery}"` : "No students found in the database."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="roll-col">#{student.roll_number}</td>
                      <td>
                        <div className="student-name-cell">
                          <div className="student-avatar-small">{student.name.charAt(0)}</div>
                          <span className="font-bold">{student.name}</span>
                        </div>
                      </td>
                      <td>{student.class_name}</td>
                      {/* ADDED GENDER DATA CELL HERE */}
                      <td>{student.gender || "N/A"}</td>
                      <td>{student.parent_number || "N/A"}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          
                          {/* EDIT ICON */}
                          <button className="action-btn edit-action" onClick={() => handleEditClick(student)} title="Edit Student">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>

                          {/* DELETE ICON */}
                          <button className="action-btn delete-action" onClick={() => handleDeleteStudent(student.id, student.name)} title="Delete Student">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;