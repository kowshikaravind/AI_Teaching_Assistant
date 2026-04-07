import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './App.css';
import { getTeacherSessionProfile } from './utils/teacherSession.js';
import { apiUrl } from './utils/backendUrls.js';

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeStudentId, setActiveStudentId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherName, assignedClass, avatar } = getTeacherSessionProfile();
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isAdminView = adminUser?.role === 'admin' && location.pathname === '/all-students';

  const profileName = isAdminView ? (adminUser.username || 'Admin') : teacherName;
  const profileRoleText = isAdminView ? 'Administrator' : `Class: ${assignedClass}`;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const handleLogout = () => {
    const confirmed = window.confirm('Logout now?');
    if (!confirmed) return;

    // Clear stored auth memory for safety.
    localStorage.removeItem('teacherUser');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('allStudentsViewer');
    localStorage.removeItem('studentUser');
    navigate('/', { replace: true });
  };

  const getDepartment = useCallback((student) => {
    const classValue = String(student?.class_name || '').trim();
    if (!classValue) return 'Unassigned';
    if (classValue.includes('-')) return classValue.split('-')[0].trim() || 'Unassigned';
    return classValue;
  }, []);
  
  const fetchStudents = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/students/'));
      if (!res.ok) {
        throw new Error('Unable to load students right now.');
      }
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err?.message || 'Unable to load students right now.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (!statusMessage) return;
    const timeoutId = window.setTimeout(() => setStatusMessage(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

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

  const departments = useMemo(() => {
    return [...new Set(students.map((s) => getDepartment(s)))].sort((a, b) => a.localeCompare(b));
  }, [students, getDepartment]);

  // --- FILTER STUDENTS BASED ON SEARCH QUERY ---
  const filteredStudents = useMemo(() => {
    if (!normalizedSearchQuery) return students;
    
    return students.filter((student) => {
      return (
        String(student?.name || '').toLowerCase().includes(normalizedSearchQuery) ||
        String(student?.roll_number || '').toLowerCase().includes(normalizedSearchQuery) ||
        String(student?.class_name || '').toLowerCase().includes(normalizedSearchQuery) ||
        getDepartment(student).toLowerCase().includes(normalizedSearchQuery)
      );
    });
  }, [students, normalizedSearchQuery, getDepartment]);

  const visibleStudents = useMemo(() => {
    if (departmentFilter === 'all') return filteredStudents;
    return filteredStudents.filter((student) => getDepartment(student) === departmentFilter);
  }, [filteredStudents, departmentFilter, getDepartment]);

  // --- ACTIONS ---
  const handleEditClick = (student) => {
    navigate("/add-student", { state: { editMode: true, studentData: student } });
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    const isConfirmed = window.confirm(`Are you sure you want to completely delete ${studentName}? This action cannot be undone.`);
    
    if (isConfirmed) {
      setDeletingStudentId(studentId);
      setError('');
      try {
        const res = await fetch(apiUrl(`/students/${studentId}/`), {
          method: "DELETE",
        });

        if (res.ok) {
          setStudents((prev) => prev.filter((student) => student.id !== studentId));
          setStatusMessage(`${studentName} was removed successfully.`);
        } else {
          setError('Failed to delete student. Please try again.');
        }
      } catch (err) {
        console.error("Error deleting student:", err);
        setError('Failed to delete student. Please check your network and retry.');
      } finally {
        setDeletingStudentId(null);
      }
    }
  };

  const hasActiveFilters = Boolean(searchQuery.trim()) || departmentFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
  };

  const rosterTitle = searchQuery ? `Search Results (${visibleStudents.length})` : 'All Students';

  return (
    <div className="dashboard-layout">

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
              aria-label="Search students"
            />
          </div>
          
          <div className="user-profile-section">
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
            <div className="user-info">
              <span className="user-name">{profileName}</span>
              <span className="user-role">{profileRoleText}</span>
            </div>
            <img src={avatar} alt="Admin" className="user-avatar" />
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="dashboard-body">

          {statusMessage && (
            <div className="status-banner success-banner" role="status">
              {statusMessage}
            </div>
          )}

          {error && (
            <div className="status-banner error-banner" role="alert">
              <span>{error}</span>
              <button type="button" className="inline-link-btn" onClick={fetchStudents}>Retry</button>
            </div>
          )}
          
          {/* STATS CARDS */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue-icon">👤</div>
              </div>
              <div className="stat-title">Total Students</div>
              <div className="stat-value">{stats.enrollment}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon purple-icon">🏫</div>
              </div>
              <div className="stat-title">Classes</div>
              <div className="stat-value">{stats.classes}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon orange-icon">👥</div>
              </div>
              <div className="stat-title">Avg per Class</div>
              <div className="stat-value">{stats.avgPerClass}</div>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE */}
          <div className="roster-container">
            <div className="roster-header">
              <h3>{rosterTitle}</h3>
              <div className="roster-actions">
                <select
                  className="filter-select"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  aria-label="Filter by department"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn-muted"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear
                </button>

                <button
                  className="btn-primary"
                  onClick={() => navigate(isAdminView ? "/all-students/add-student" : "/add-student", { state: { returnTo: isAdminView ? '/all-students' : '/studentDB' } })}
                >
                  👤+ Add New Student
                </button>
              </div>
            </div>

            {loading ? (
              <div className="empty-state" role="status">
                Loading students...
              </div>
            ) : (
              <>
                <div className="table-scroll">
            
            <table className="roster-table">
              <thead>
                <tr>
                  <th>ROLL NUMBER</th>
                  <th>FULL NAME</th>
                  <th>DEPARTMENT</th>
                  <th>CLASS</th>
                  <th>GENDER</th>
                  <th>PARENT NUMBER</th>
                  {!isAdminView && <th style={{ textAlign: 'right' }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {visibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminView ? 6 : 7} className="empty-state-cell">
                      {searchQuery ? `No students found matching "${searchQuery}"` : "No students in the database."}
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((student) => (
                    <tr
                      key={student.id}
                      className={activeStudentId === student.id ? 'active-row' : ''}
                      onMouseEnter={() => setActiveStudentId(student.id)}
                      onMouseLeave={() => setActiveStudentId(null)}
                    >
                      <td className="roll-col">#{student.roll_number}</td>
                      <td>
                        <div className="student-name-cell">
                          <div className="student-avatar-small">{String(student?.name || '?').charAt(0)}</div>
                          <span className="font-bold">{student.name}</span>
                        </div>
                      </td>
                      <td>{getDepartment(student)}</td>
                      <td>{student.class_name}</td>
                      <td>{student.gender || "N/A"}</td>
                      <td>{student.parent_number || "N/A"}</td>
                      {!isAdminView && (
                        <td className="table-actions-cell">
                          <div className="table-actions-group">
                            <button className="action-btn edit-action" onClick={() => handleEditClick(student)} title="Edit Student">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                            </button>

                            <button
                              className="action-btn delete-action"
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              title="Delete Student"
                              disabled={deletingStudentId === student.id}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

                </div>

                <div className="mobile-roster-list">
                  {visibleStudents.length === 0 ? (
                    <div className="empty-state">
                      {searchQuery ? `No students found matching "${searchQuery}"` : 'No students in the database.'}
                    </div>
                  ) : (
                    visibleStudents.map((student) => (
                      <article className="student-mobile-card" key={`mobile-${student.id}`}>
                        <div className="student-mobile-head">
                          <div className="student-name-cell">
                            <div className="student-avatar-small">{String(student?.name || '?').charAt(0)}</div>
                            <div>
                              <div className="font-bold">{student.name}</div>
                              <div className="roll-col">#{student.roll_number}</div>
                            </div>
                          </div>
                          <span className="dept-pill">{getDepartment(student)}</span>
                        </div>

                        <div className="student-mobile-meta">
                          <span>Class: {student.class_name || 'N/A'}</span>
                          <span>Gender: {student.gender || 'N/A'}</span>
                          <span>Parent: {student.parent_number || 'N/A'}</span>
                        </div>

                        {!isAdminView && (
                          <div className="table-actions-group">
                            <button className="action-btn edit-action" onClick={() => handleEditClick(student)} title="Edit Student">
                              Edit
                            </button>
                            <button
                              className="action-btn delete-action"
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              title="Delete Student"
                              disabled={deletingStudentId === student.id}
                            >
                              {deletingStudentId === student.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;