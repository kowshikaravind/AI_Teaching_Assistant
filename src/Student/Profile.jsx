import React, { useState, useEffect } from 'react';
import './Student.css';

function Profile() {
  
  const [lightMode, setLightMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'light' ? true : false; // default to dark mode (lightMode = false)
  });
  const [fontSize, setFontSize] = useState('Medium');

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('themeMode', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  return (
    <div className={`settings-page-container ${!lightMode ? 'dark-mode' : ''}`}>
      
      {/* TOP NAVBAR (Full width since there is no sidebar) */}
      <header className="settings-navbar">
        <div className="navbar-brand">
          <div className="brand-logo">🎓</div>
          <h2>EduAdmin</h2>
        </div>
        
        <div className="navbar-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search settings..." />
        </div>
        
        <div className="navbar-actions">
          <button className="icon-btn">🔔</button>
          <button className="icon-btn">❔</button>
          <img src="https://ui-avatars.com/api/?name=Alex+Rivers&background=fce7f3&color=9d174d" alt="Profile" className="nav-avatar" />
        </div>
      </header>

      {/* MAIN SETTINGS CONTENT */}
      <main className="settings-main-content">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your personal information, communication preferences, and security settings.</p>
        </div>

        {/* PROFILE INFORMATION CARD */}
        <section className="settings-card">
          <h3 className="card-title">Profile Information</h3>
          <div className="profile-edit-grid">
            
            <div className="avatar-edit-section">
              <img src="https://ui-avatars.com/api/?name=Alex+Rivers&background=fce7f3&color=9d174d&size=150" alt="Avatar" className="large-avatar" />
              <button className="update-photo-link">Update Photo</button>
            </div>

            <div className="form-fields-section">
              <div className="form-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <p>Alex Rivers</p>
                </div>
                <div className="input-group">
                  <label>Professional Email</label>
                  <p>alex.rivers@university.edu</p>
                </div>
              </div>
              
              <div className="input-group">
                <label>Academic Department</label>
                <p>Computer Science & Engineering</p>
              </div>
            </div>

          </div>
        </section>

        {/* BOTTOM GRID: SECURITY & APPEARANCE */}
        <div className="settings-bottom-grid">
          
          {/* Security Card */}
          <section className="settings-card min-height-card">
            <h3 className="card-title">Security</h3>
            
            <div className="security-item">
              <div className="security-info">
                <span className="sec-icon">🔑</span>
                <span>Password</span>
              </div>
              <button className="action-link-btn">CHANGE</button>
            </div>

            <div className="security-item">
              <div className="security-info">
                <span className="sec-icon">🔒</span>
                <span>Two-Factor Auth</span>
              </div>
              <span className="status-badge enabled">ENABLED</span>
            </div>

            <p className="last-login-text">Last login: Today, 09:42 AM from Chrome (MacOS)</p>
          </section>

          {/* Appearance Card */}
          <section className="settings-card min-height-card">
            <h3 className="card-title">Appearance</h3>
            
            <div className="toggle-row appearance-row">
              <div className="security-info">
                <span className="sec-icon">🌙</span>
                <span>Light Mode</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={lightMode} onChange={() => setLightMode(!lightMode)} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="font-size-section">
              <label>Interface Font Size</label>
              <div className="font-size-controls">
                {['Small', 'Medium', 'Large'].map(size => (
                  <button 
                    key={size}
                    className={`font-btn ${fontSize === size ? 'active' : ''}`}
                    onClick={() => setFontSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="settings-footer-actions">
          <button className="cancel-btn">Cancel</button>
          <button className="save-btn">Save Changes</button>
        </div>

      </main>
    </div>
  );
}

export default Profile;