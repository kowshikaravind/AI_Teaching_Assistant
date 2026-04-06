import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import { getTeacherSessionProfile } from '../utils/teacherSession.js';

function AddStudent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherName, assignedClass, avatar } = getTeacherSessionProfile();
  const returnTo = location.state?.returnTo || '/studentDB';
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const hasTeacherAccess = teacherUser?.role === 'teacher';
  const hasAdminAccess = adminUser?.role === 'admin';
  const isTeacherOnlyView = hasTeacherAccess && !hasAdminAccess;
  
  const isEditMode = location.state?.editMode || false;
  const existingData = location.state?.studentData || null;

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [existingClasses, setExistingClasses] = useState([]);
  const [isNewClass, setIsNewClass] = useState(false); // toggle manual input

  const [formData, setFormData] = useState(() => {
    if (isEditMode && existingData) {
      return {
        name: existingData.name || "",
        roll_number: existingData.roll_number || "",
        student_number: existingData.student_number || "",
        student_email: existingData.student_email || "",
        student_password: "",
        class_name: existingData.class_name || "",
        dob: existingData.dob || "",
        gender: existingData.gender || "",
        nationality: existingData.nationality || "",
        blood_group: existingData.blood_group || "",
        parent_name: existingData.parent_name || "",
        parent_number: existingData.parent_number || "",
        parent_email: existingData.parent_email || "",
        address: existingData.address || "",
        emergency_contact: existingData.emergency_contact || ""
      };
    }
    return {
      name: "",
      roll_number: "",
      student_number: "",
      student_email: "",
      student_password: "student-123",
      class_name: "",
      dob: "",
      gender: "",
      nationality: "",
      blood_group: "",
      parent_name: "",
      parent_number: "",
      parent_email: "",
      address: "",
      emergency_contact: ""
    };
  });

  // ── FETCH EXISTING CLASSES FROM DB ────────────────────────────
  useEffect(() => {
    if (!hasTeacherAccess && !hasAdminAccess) {
      navigate('/', { replace: true });
      return;
    }

    const fetchClasses = async () => {
      if (isTeacherOnlyView) {
        setExistingClasses([]);
        return;
      }
      try {
        const res = await fetch("http://127.0.0.1:8000/api/students/");
        const data = await res.json();
        const unique = [...new Set(data.map(s => s.class_name).filter(Boolean))].sort();
        setExistingClasses(unique);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      }
    };
    fetchClasses();
  }, [hasTeacherAccess, hasAdminAccess, isTeacherOnlyView, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── CLASS DROPDOWN HANDLER ────────────────────────────────────
  const handleClassSelect = (e) => {
    const val = e.target.value;
    if (val === "__new__") {
      // Teacher wants to type a new class
      setIsNewClass(true);
      setFormData({ ...formData, class_name: "" });
    } else {
      setIsNewClass(false);
      setFormData({ ...formData, class_name: val });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasTeacherAccess && !hasAdminAccess) {
      navigate('/', { replace: true });
      return;
    }
    
    const payload = {
      ...formData,
      class_name: isTeacherOnlyView ? assignedClass : formData.class_name,
    };

    const url = isEditMode
      ? `http://127.0.0.1:8000/api/students/${existingData.id}/`
      : "http://127.0.0.1:8000/api/students/";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        navigate(returnTo);
      } else {
        const errorData = await res.json();
        console.error("Error:", errorData);
        alert("Failed to save student. Please check inputs.");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  if (!hasTeacherAccess && !hasAdminAccess) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">🎓</div>
          <div className="brand-text">
            <h2>EduManage</h2>
            <p>Teacher Portal</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active" onClick={() => navigate(returnTo)}><span className="nav-icon">▦</span> Dashboard</a>
          <a href="#" className="nav-item"><span className="nav-icon">👥</span> Students</a>
          <a href="#" className="nav-item"><span className="nav-icon">📘</span> Upcoming Tests</a>
          <a href="#" className="nav-item"><span className="nav-icon">📊</span> Reports</a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search student by name or ID..." className="search-input" />
          </div>
          <div className="user-profile-section">
            <div className="notification-bell">🔔</div>
            <div className="user-info">
              <span className="user-name">{teacherName}</span>
              <span className="user-role">Class: {assignedClass}</span>
            </div>
            <img src={avatar} alt="Teacher" className="user-avatar" />
          </div>
        </header>

        <div className="registration-body">
          <div className="breadcrumb">Students / <b>{isEditMode ? "Edit Student" : "Add New Student"}</b></div>
          
          <div className="page-header">
            <h2>{isEditMode ? "Edit Student Profile" : "Student Registration"}</h2>
            <p>Fill in the official details to register a new student in the academic system.</p>
          </div>

          <form className="registration-form-card" onSubmit={handleSubmit}>
            
            {/* PHOTO UPLOAD */}
            <div className="photo-upload-section">
              <div className="photo-placeholder">
                <span className="camera-icon">📷</span>
                <div className="edit-badge">✎</div>
              </div>
              <div className="photo-text">
                <h4>Student Photograph</h4>
                <p>Upload a high-resolution formal photograph (JPG or PNG, max 2MB).</p>
              </div>
            </div>

            <div className="section-divider">PERSONAL INFORMATION</div>
            
            <div className="form-grid-2">
              <div className="input-group">
                <label>Full Name (as per official records)</label>
                <input type="text" name="name" placeholder="Enter student's full name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Roll Number</label>
                <input type="text" name="roll_number" placeholder="e.g. 1024" value={formData.roll_number} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-grid-2" style={{ marginTop: '20px' }}>
              <div className="input-group">
                <label>Student Number</label>
                <input type="text" name="student_number" placeholder="e.g. STU-2026-001" value={formData.student_number} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Student Email</label>
                <input type="email" name="student_email" placeholder="student@example.com" value={formData.student_email} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Student Password</label>
              <input
                type="text"
                name="student_password"
                placeholder="Default: student-123"
                value={formData.student_password}
                onChange={handleChange}
              />
              <small style={{ color: '#64748b' }}>
                {isEditMode ? 'Leave blank to keep current password.' : 'Default password is student-123 if unchanged.'}
              </small>
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label>Nationality</label>
                <input type="text" name="nationality" placeholder="e.g. Indian" value={formData.nationality} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Blood Group</label>
                <input type="text" name="blood_group" placeholder="e.g. O Positive" value={formData.blood_group} onChange={handleChange} />
              </div>
            </div>

            {/* ── ASSIGNED CLASS — DROPDOWN + NEW CLASS OPTION ── */}
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Assigned Class</label>

              {isTeacherOnlyView ? (
                <input
                  type="text"
                  value={assignedClass || formData.class_name}
                  readOnly
                  style={{ marginBottom: 0 }}
                />
              ) : (
                <>
                  {/* Always show the dropdown */}
                  <select
                    onChange={handleClassSelect}
                    value={isNewClass ? "__new__" : formData.class_name}
                    required={!isNewClass}
                    style={{ marginBottom: isNewClass ? 10 : 0 }}
                  >
                    <option value="">Select a class</option>
                    {existingClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__new__">➕ Add New Class</option>
                  </select>

                  {/* Only show text input when "Add New Class" is selected */}
                  {isNewClass && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        name="class_name"
                        placeholder="DEPARTMENT - YEAR (e.g. Computer Science - 2025)"
                        value={formData.class_name}
                        onChange={handleChange}
                        required
                        autoFocus
                        style={{ flex: 1 }}
                      />
                      {/* Back to dropdown */}
                      <button
                        type="button"
                        onClick={() => { setIsNewClass(false); setFormData({ ...formData, class_name: "" }); }}
                        style={{
                          padding: '8px 12px', background: '#f1f5f9',
                          border: '1px solid #e2e8f0', borderRadius: 8,
                          fontSize: 12, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="section-divider">PARENT / GUARDIAN DETAILS</div>

            <div className="input-group">
              <label>Parent/Guardian Name</label>
              <input type="text" name="parent_name" placeholder="Full name of parent or legal guardian" value={formData.parent_name} onChange={handleChange} />
            </div>

            <div className="form-grid-2" style={{ marginTop: '20px' }}>
              <div className="input-group">
                <label>Parent Mobile Number</label>
                <input type="text" name="parent_number" placeholder="+1 (555) 000-0000" value={formData.parent_number} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Parent Email ID</label>
                <input type="email" name="parent_email" placeholder="email@example.com" value={formData.parent_email} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Residential Address</label>
              <textarea name="address" placeholder="Street name, City, State, ZIP code" rows="3" value={formData.address} onChange={handleChange}></textarea>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Emergency Contact Number</label>
              <div className="emergency-input-wrapper">
                <input type="text" name="emergency_contact" placeholder="Alternative contact number for emergencies" value={formData.emergency_contact} onChange={handleChange} />
                <span className="emergency-icon">✱</span>
              </div>
            </div>

            <div className="form-actions-row">
              <button type="button" className="cancel-btn" onClick={() => setConfirmCancel(true)}>Cancel</button>
              <button type="submit" className="save-btn">{isEditMode ? "Update Student" : "Register Student"}</button>
            </div>

          </form>

          {confirmCancel && (
            <div className='confirm-cancel-form'>
              <div className='confirm-cancel-content'>
                <p style={{fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px"}}>Are you sure you want to cancel?</p>
                <p style={{color: "#64748b", marginBottom: "30px"}}>Any unsaved changes will be lost.</p>
                <div className='confirm-cancel-buttons'>
                  <button className='cancel-yes-btn' onClick={() => navigate(returnTo)}>Yes, Cancel</button>
                  <button className='cancel-no-btn' onClick={() => setConfirmCancel(false)}>No, Continue Editing</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default AddStudent;