import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { apiUrl } from '../utils/backendUrls.js';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = username.trim().length >= 3 && password.length >= 6;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isFormValid) {
      setError('Use a valid username and a password with at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/teacher-login/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      localStorage.setItem('teacherUser', JSON.stringify(data));
      setSuccess('Login successful. Redirecting...');
      window.setTimeout(() => {
        navigate('/studentDB');
      }, 450);
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
            <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
          </svg>
        </div>

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">
          Please enter your credentials to continue as <span className="login-role-text">Faculty</span>
        </p>

        <form className="login-form" onSubmit={handleSignIn}>
          <div className="login-field-wrap">
            <input
              type="text"
              className="login-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              aria-invalid={Boolean(error) && username.trim().length < 3}
            />
          </div>

          <div className="login-field-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-invalid={Boolean(error) && password.length < 6}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && (
            <p className="login-feedback error-text" role="alert">
              ⚠ {error}
            </p>
          )}

          {!error && success && (
            <p className="login-feedback success-text" role="status">
              {success}
            </p>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading || !isFormValid}>
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <button className="teacher-create-btn" onClick={() => navigate('/teacher-register')}>
          Create Teacher Account
        </button>

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

export default Login;