import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Admin login failed.');
        return;
      }

      localStorage.setItem('adminUser', JSON.stringify({ username: data.username, role: 'admin' }));
      navigate('/admin-dashboard');
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
            <path d="M12 2L4 5V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V5L12 2ZM12 4.18L18 6.47V11C18 15.76 14.97 19.95 12 21.14C9.03 19.95 6 15.76 6 11V6.47L12 4.18ZM11 7V12.17L14.59 15.76L16 14.35L13 11.35V7H11Z" />
          </svg>
        </div>

        <h2 className="login-title">Admin Portal</h2>
        <p className="login-subtitle">Use admin credentials to manage teacher access</p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="text"
            className="login-input"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-input"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '-8px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <button className="login-back-btn" onClick={() => navigate('/')}>
          &larr; Back to Role Selection
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
