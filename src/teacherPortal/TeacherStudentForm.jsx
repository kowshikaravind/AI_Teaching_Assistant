import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TeacherPortalLayout from './TeacherPortalLayout.jsx';
import { buildTeacherApiUrl, getTeacherSessionProfile, withTeacherScope } from '../utils/teacherSession.js';

const emptyForm = {
  name: '',
  roll_number: '',
  student_number: '',
  student_email: '',
  student_password: 'student-123',
  dob: '',
  gender: '',
  nationality: '',
  blood_group: '',
  parent_name: '',
  parent_number: '',
  parent_email: '',
  address: '',
  emergency_contact: '',
};

export default function TeacherStudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { assignedClass } = getTeacherSessionProfile();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadStudent = async () => {
      try {
        const res = await fetch(buildTeacherApiUrl(`students/${id}/`));
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load student.');
          return;
        }

        setFormData({
          name: data.name || '',
          roll_number: data.roll_number || '',
          student_number: data.student_number || '',
          student_email: data.student_email || '',
          student_password: '',
          dob: data.dob || '',
          gender: data.gender || '',
          nationality: data.nationality || '',
          blood_group: data.blood_group || '',
          parent_name: data.parent_name || '',
          parent_number: data.parent_number || '',
          parent_email: data.parent_email || '',
          address: data.address || '',
          emergency_contact: data.emergency_contact || '',
        });
      } catch (loadError) {
        console.error('Failed to load student:', loadError);
        setError('Failed to load student.');
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = id ? buildTeacherApiUrl(`students/${id}/`) : buildTeacherApiUrl('students/');
      const method = id ? 'PUT' : 'POST';
      const payload = withTeacherScope({ ...formData, class_name: assignedClass });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save student.');
        return;
      }

      navigate('/teacher/students');
    } catch (saveError) {
      console.error('Failed to save student:', saveError);
      setError('Server error while saving student.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    ['name', 'Full Name', 'text'],
    ['roll_number', 'Roll Number', 'text'],
    ['student_number', 'Student Number', 'text'],
    ['student_email', 'Student Email', 'email'],
    ['student_password', id ? 'New Password (optional)' : 'Student Password', 'text'],
    ['dob', 'Date of Birth', 'date'],
    ['gender', 'Gender', 'text'],
    ['nationality', 'Nationality', 'text'],
    ['blood_group', 'Blood Group', 'text'],
    ['parent_name', 'Parent Name', 'text'],
    ['parent_number', 'Parent Number', 'text'],
    ['parent_email', 'Parent Email', 'email'],
    ['emergency_contact', 'Emergency Contact', 'text'],
  ];

  return (
    <TeacherPortalLayout
      title={id ? 'Edit Student' : 'Add Student'}
      subtitle={`All saved students will stay inside ${assignedClass || 'the assigned class'}.`}
    >
      <div className="roster-container tp-panel">
        {loading ? (
          <p className="tp-loading">Loading student form...</p>
        ) : (
          <form onSubmit={handleSubmit} className="tp-form-grid">
            <div className="form-grid-2">
              {fields.map(([name, label, type]) => (
                <div className="input-group" key={name}>
                  <label>{label}</label>
                  <input type={type} name={name} value={formData[name]} onChange={handleChange} required={['name', 'roll_number', 'student_number', 'student_email'].includes(name)} />
                </div>
              ))}
            </div>

            <div className="input-group">
              <label>Assigned Class</label>
              <input type="text" value={assignedClass} readOnly />
            </div>

            <div className="input-group">
              <label>Address</label>
              <textarea name="address" rows="3" value={formData.address} onChange={handleChange} />
            </div>

            {error && <p className="tp-error-inline">{error}</p>}

            <div className="tp-form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/teacher/students')}>Cancel</button>
              <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : (id ? 'Update Student' : 'Create Student')}</button>
            </div>
          </form>
        )}
      </div>
    </TeacherPortalLayout>
  );
}