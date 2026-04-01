import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';
import { loadAppSettings, saveAppSettings, applyAppSettings } from '../utils/appSettings.js';

function Profile() {
  const navigate = useNavigate();
  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const studentId = studentUser?.id;
  const initial = loadAppSettings();

  const [lightMode, setLightMode] = useState(initial.themeMode === 'light');
  const [fontSize, setFontSize] = useState(initial.fontSize);
  const [saveMessage, setSaveMessage] = useState('');
  const [student, setStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!studentId) {
        setProfileLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentId]);

  const handleSave = () => {
    const saved = saveAppSettings({
      themeMode: lightMode ? 'light' : 'dark',
      fontSize,
    });
    setLightMode(saved.themeMode === 'light');
    setFontSize(saved.fontSize);
    setSaveMessage('Settings saved and applied to all pages.');
  };

  const handleCancel = () => {
    const restored = loadAppSettings();
    setLightMode(restored.themeMode === 'light');
    setFontSize(restored.fontSize);
    applyAppSettings(restored);
    setSaveMessage('Reverted unsaved changes.');
  };

  const handleThemeToggle = () => {
    const newLightMode = !lightMode;
    setLightMode(newLightMode);
    saveAppSettings({
      themeMode: newLightMode ? 'light' : 'dark',
      fontSize,
    });
  };

  const handlePasswordChange = async () => {
    setPasswordErr('');
    setPasswordMsg('');

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordErr('Please fill all password fields.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErr('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/student-change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordErr(data.error || 'Failed to change password.');
      } else {
        setPasswordMsg(data.message || 'Password changed successfully.');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      }
    } catch (err) {
      console.error(err);
      setPasswordErr('Server error while changing password.');
    } finally {
      setPasswordLoading(false);
    }
  };

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
          <img
            src={`https://ui-avatars.com/api/?name=${student?.name || 'Student'}&background=fce7f3&color=9d174d`}
            alt="Profile"
            className="nav-avatar"
          />
        </div>
      </header>

      {/* MAIN SETTINGS CONTENT */}
      <main className="settings-main-content">
        <div className="settings-back-row">
          <button
            className="settings-back-btn"
            onClick={() => navigate(studentId ? `/student-dashboard/${studentId}` : '/', { replace: !studentId })}
          >
            &larr; Back to Dashboard
          </button>
        </div>

        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your personal information, communication preferences, and security settings.</p>
        </div>

        {/* PROFILE INFORMATION CARD */}
        <section className="settings-card settings-profile-card">
          <h3 className="card-title">Profile Information</h3>
          <div className="profile-edit-grid">
            
            <div className="avatar-edit-section">
              <img src={`https://ui-avatars.com/api/?name=${student?.name || 'Student'}&background=fce7f3&color=9d174d&size=150`} alt="Avatar" className="large-avatar" />
            </div>

            <div className="form-fields-section">
              <div className="form-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <p>{profileLoading ? 'Loading...' : (student?.name || 'N/A')}</p>
                </div>
                <div className="input-group">
                  <label>Student Email</label>
                  <p>{profileLoading ? 'Loading...' : (student?.student_email || 'N/A')}</p>
                </div>
              </div>
              
              <div className="form-row">
                <div className="input-group">
                  <label>Student Number</label>
                  <p>{profileLoading ? 'Loading...' : (student?.student_number || 'N/A')}</p>
                </div>
                <div className="input-group">
                  <label>Class</label>
                  <p>{profileLoading ? 'Loading...' : (student?.class_name || 'N/A')}</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* BOTTOM GRID: SECURITY & APPEARANCE */}
        <div className="settings-bottom-grid">
          
          {/* Security Card */}
          <section className="settings-card min-height-card settings-security-card">
            <h3 className="card-title">Security</h3>
            
            <div className="security-item">
              <div className="security-info">
                <span className="sec-icon">🔑</span>
                <span>Change Password</span>
              </div>
            </div>

            <div className="password-change-form">
              <div className="password-input-row">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  placeholder="Current Password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                >
                  {showPassword.current ? 'Hide' : 'View'}
                </button>
              </div>

              <div className="password-input-row">
                <input
                  type={showPassword.next ? 'text' : 'password'}
                  placeholder="New Password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => ({ ...prev, next: !prev.next }))}
                >
                  {showPassword.next ? 'Hide' : 'View'}
                </button>
              </div>

              <div className="password-input-row">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPassword.confirm ? 'Hide' : 'View'}
                </button>
              </div>

              <button className="action-link-btn" type="button" onClick={handlePasswordChange} disabled={passwordLoading}>
                {passwordLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
              {passwordErr && <p className="password-msg error">{passwordErr}</p>}
              {passwordMsg && <p className="password-msg success">{passwordMsg}</p>}
            </div>


            <p className="last-login-text">Default password for new students: student-123</p>
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
                <input type="checkbox" checked={lightMode} onChange={handleThemeToggle} />
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
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
        </div>
        {saveMessage && <p className="settings-save-msg">{saveMessage}</p>}

      </main>
    </div>
  );
}

export default Profile;