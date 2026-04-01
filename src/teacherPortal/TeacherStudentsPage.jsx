import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherPortalLayout from './TeacherPortalLayout.jsx';
import SubjectSelectorWithManager from '../components/SubjectSelectorWithManager.jsx';
import { buildTeacherApiUrl, getTeacherSessionProfile } from '../utils/teacherSession.js';

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const { assignedClass } = getTeacherSessionProfile();
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    try {
      const res = await fetch(buildTeacherApiUrl('students/'));
      const data = res.ok ? await res.json() : [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load class students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!query.trim()) {
      return students;
    }

    const lowered = query.toLowerCase();
    return students.filter((student) => (
      student.name.toLowerCase().includes(lowered)
      || student.roll_number.toLowerCase().includes(lowered)
      || String(student.student_email || '').toLowerCase().includes(lowered)
    ));
  }, [students, query]);

  const handleDelete = async (student) => {
    const confirmed = window.confirm(`Delete ${student.name} from ${assignedClass}?`);
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(buildTeacherApiUrl(`students/${student.id}/`), { method: 'DELETE' });
      if (res.ok) {
        loadStudents();
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  return (
    <TeacherPortalLayout
      title="Student Analysis"
      subtitle={`Only students from ${assignedClass || 'your assigned class'} are visible here.`}
      actions={(
        <div className="tp-header-actions">
          <SubjectSelectorWithManager mode="manage-only" triggerText="📚 Manage Subjects" />
          <button className="btn-primary" onClick={() => navigate('/teacher/students/form/new')}>+ Add Student</button>
        </div>
      )}
    >
      <div className="roster-container">
        <div className="roster-header">
          <h3>Assigned Class Students</h3>
          <div className="search-container tp-search-wrap-wide">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, roll number, or email"
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="tp-loading">Loading students...</p>
        ) : (
          <table className="roster-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Email</th>
                <th>Parent Number</th>
                <th>Gender</th>
                <th className="tp-align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan="6" className="tp-empty-centered">No students found for this class.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>#{student.roll_number}</td>
                    <td>{student.name}</td>
                    <td>{student.student_email || 'N/A'}</td>
                    <td>{student.parent_number || 'N/A'}</td>
                    <td>{student.gender || 'N/A'}</td>
                    <td className="tp-table-action-cell">
                      <div className="tp-tests-actions-wrap">
                        <button className="btn-primary" onClick={() => navigate(`/teacher/students/${student.id}`)}>View</button>
                        <button className="btn-primary" onClick={() => navigate(`/teacher/students/form/${student.id}`)}>Edit</button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student)}
                          className="tp-danger-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </TeacherPortalLayout>
  );
}