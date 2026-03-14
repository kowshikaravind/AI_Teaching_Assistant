import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/student-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('studentUser', JSON.stringify(data));
        navigate(`/student-dashboard/${data.id}`);
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Login error:', err);
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
            <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
          </svg>
        </div>

        <h2 className="login-title">Student Portal</h2>
        <p className="login-subtitle">
          Enter your <span className="login-role-text">Email</span> and <span className="login-role-text">Password</span>
        </p>

        <form className="login-form" onSubmit={handleSignIn}>
          <input
            type="email"
            className="login-input"
            placeholder="Student Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '-8px', textAlign: 'center' }}>
              ⚠ {error}
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

      <div className="login-footer">
        &copy; 2026 Academic Performance Tracker. All rights reserved.
      </div>
    </div>
  );
}

export default StudentLogin;