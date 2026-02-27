import React, {  } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  const handleSignIn = (e) => {
    e.preventDefault();
    // Navigate to your main dashboard after "login"
    navigate('/studentDB');
  };

  return (
    <div className="login-page-wrapper">
      
      {/* Background blur effects */}
      <div className="login-bokeh login-bokeh-1"></div>
      <div className="login-bokeh login-bokeh-2"></div>
      <div className="login-bokeh login-bokeh-3"></div>

      <div className="login-card">
        <div className="login-icon-container">
          {/* SVG Graduation Cap Icon */}
          <svg className="login-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z"/>
          </svg>
        </div>
        
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">
          Please enter your credentials to continue as <span className="login-role-text">Faculty</span>
        </p>

        <form className="login-form" onSubmit={handleSignIn}>
          <input
            type="text"
            className="login-input"
            placeholder="Institutional ID or Email"
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
          />
          
          <div className="login-forgot-container">
            <a href="#" className="login-forgot-link">Forgot Password?</a>
          </div>
          
          <button type="submit" className="login-submit-btn">Sign In</button>
        </form>

        {/* This will take the user back to the Role Selection screen */}
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