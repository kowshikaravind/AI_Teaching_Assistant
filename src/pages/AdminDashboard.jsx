import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/Login.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [adminForm, setAdminForm] = useState({
    current_username: '',
    current_password: '',
    new_username: '',
    new_password: '',
  });

  const loadTeachers = async () => {
    try {
      setError('');
      const [pendingRes, approvedRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/admin/teachers/pending/'),
        fetch('http://127.0.0.1:8000/api/admin/teachers/approved/'),
      ]);

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();

      setPendingTeachers(Array.isArray(pendingData) ? pendingData : []);
      setApprovedTeachers(Array.isArray(approvedData) ? approvedData : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load teacher management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (!admin?.username) {
      navigate('/admin-login', { replace: true });
      return;
    }

    setAdminForm((prev) => ({ ...prev, current_username: admin.username }));
    loadTeachers();
  }, [navigate]);

  const handleApprove = async (teacherId) => {
    setBusyId(`approve-${teacherId}`);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/teachers/${teacherId}/approve/`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to approve teacher.');
      } else {
        setMessage('Teacher approved successfully.');
        loadTeachers();
      }
    } catch (err) {
      console.error(err);
      setError('Server error while approving teacher.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (teacherId) => {
    setBusyId(`reject-${teacherId}`);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/teachers/${teacherId}/reject/`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to reject teacher.');
      } else {
        setMessage('Teacher request rejected.');
        loadTeachers();
      }
    } catch (err) {
      console.error(err);
      setError('Server error while rejecting teacher.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (teacherId) => {
    setBusyId(`revoke-${teacherId}`);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/teachers/${teacherId}/revoke/`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to remove teacher access.');
      } else {
        setMessage('Teacher access removed.');
        loadTeachers();
      }
    } catch (err) {
      console.error(err);
      setError('Server error while removing teacher access.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminInput = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminCredentialUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setBusyId('admin-credentials');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin-change-credentials/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to update admin credentials.');
      } else {
        localStorage.setItem('adminUser', JSON.stringify({ username: data.username, role: 'admin' }));
        setAdminForm((prev) => ({
          ...prev,
          current_username: data.username,
          current_password: '',
          new_username: '',
          new_password: '',
        }));
        setMessage('Admin credentials updated successfully.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while updating admin credentials.');
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin-login', { replace: true });
  };

  if (loading) {
    return <div className="login-page-wrapper"><div className="login-card"><p>Loading admin dashboard...</p></div></div>;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage Teachers</p>
        </div>
        <button className="admin-logout" onClick={handleLogout}>Log Out</button>
      </header>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <section className="admin-card">
        <h2>Update Admin Credentials</h2>
        <form className="admin-form-grid" onSubmit={handleAdminCredentialUpdate}>
          <input
            name="current_username"
            value={adminForm.current_username}
            onChange={handleAdminInput}
            placeholder="Current Username"
            required
          />
          <input
            name="current_password"
            type="password"
            value={adminForm.current_password}
            onChange={handleAdminInput}
            placeholder="Current Password"
            required
          />
          <input
            name="new_username"
            value={adminForm.new_username}
            onChange={handleAdminInput}
            placeholder="New Username"
            required
          />
          <input
            name="new_password"
            type="password"
            value={adminForm.new_password}
            onChange={handleAdminInput}
            placeholder="New Password"
            required
          />
          <button type="submit" disabled={busyId === 'admin-credentials'}>
            {busyId === 'admin-credentials' ? 'Updating...' : 'Update Credentials'}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <h2>Pending Teacher Requests</h2>
        {pendingTeachers.length === 0 ? (
          <p className="admin-empty">No pending requests.</p>
        ) : (
          <div className="admin-grid">
            {pendingTeachers.map((teacher) => (
              <article className="admin-teacher-card" key={teacher.teacher_id}>
                <h3>{teacher.teacher_name}</h3>
                <p><strong>Email / Username:</strong> {teacher.username}</p>
                <p><strong>Assigned Class:</strong> {teacher.assigned_class || 'N/A'}</p>
                <div className="admin-actions">
                  <button
                    className="admin-approve"
                    onClick={() => handleApprove(teacher.teacher_id)}
                    disabled={busyId === `approve-${teacher.teacher_id}`}
                  >
                    {busyId === `approve-${teacher.teacher_id}` ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="admin-reject"
                    onClick={() => handleReject(teacher.teacher_id)}
                    disabled={busyId === `reject-${teacher.teacher_id}`}
                  >
                    {busyId === `reject-${teacher.teacher_id}` ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card">
        <h2>Approved Teachers</h2>
        {approvedTeachers.length === 0 ? (
          <p className="admin-empty">No approved teachers yet.</p>
        ) : (
          <div className="admin-grid">
            {approvedTeachers.map((teacher) => (
              <article className="admin-teacher-card" key={teacher.teacher_id}>
                <h3>{teacher.teacher_name}</h3>
                <p><strong>Email / Username:</strong> {teacher.username}</p>
                <p><strong>Assigned Class:</strong> {teacher.assigned_class || 'N/A'}</p>
                <div className="admin-actions">
                  <button
                    className="admin-reject"
                    onClick={() => handleRevoke(teacher.teacher_id)}
                    disabled={busyId === `revoke-${teacher.teacher_id}`}
                  >
                    {busyId === `revoke-${teacher.teacher_id}` ? 'Removing...' : 'Delete / Remove Access'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
