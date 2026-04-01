import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function TeacherRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    teacher_name: '',
    username: '',
    password: '',
    assigned_class: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [classNames, setClassNames] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Fetch available class names from students
  React.useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const fetchClassNames = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/students/');
        
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        // Handle both paginated and non-paginated responses
        let students = [];
        if (Array.isArray(data)) {
          students = data;
        } else if (data?.results && Array.isArray(data.results)) {
          students = data.results;
        }

        // Extract unique class names from student data
        const uniqueClasses = [...new Set(
          students
            .map(s => s.class_name)
            .filter(name => name && name.trim())
        )].sort();

        if (!cancelled) {
          setClassNames(uniqueClasses);
        }
      } catch (err) {
        console.error('Failed to load class names:', err);
        if (!cancelled) {
          setClassNames([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingClasses(false);
        }
      }
    };

    timeoutId = setTimeout(fetchClassNames, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/teacher-register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to submit request.');
        return;
      }

      setSuccess(data.message || 'Request submitted. Waiting for admin approval.');
      setFormData({ teacher_name: '', username: '', password: '', assigned_class: '' });
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-bokeh login-bokeh-1"></div>
      <div className="login-bokeh login-bokeh-2"></div>
      <div className="login-bokeh login-bokeh-3"></div>

      <div className="login-card">
        <div className="login-icon-container">
          <svg className="login-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
          </svg>
        </div>

        <h2 className="login-title">Teacher Registration</h2>
        <p className="login-subtitle">Submit your request. Admin approval is required for portal access.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="teacher_name"
            className="login-input"
            placeholder="Teacher Name"
            value={formData.teacher_name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            className="login-input"
            placeholder="Email / Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            className="login-input"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <select
            name="assigned_class"
            className="login-input"
            value={formData.assigned_class}
            onChange={handleChange}
            required
            disabled={loadingClasses}
          >
            <option value="">
              {loadingClasses ? 'Loading classes...' : 'Select Class Name'}
            </option>
            {classNames.length > 0 ? (
              classNames.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))
            ) : (
              !loadingClasses && <option disabled>No classes available</option>
            )}
          </select>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
          {success && <p style={{ color: '#16a34a', fontSize: '0.85rem' }}>{success}</p>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <button className="login-back-btn" onClick={() => navigate('/login')}>
          &larr; Back to Teacher Login
        </button>
      </div>
    </div>
  );
}

export default TeacherRegister;
