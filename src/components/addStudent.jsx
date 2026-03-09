import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';

function AddStudent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we arrived here by clicking "Edit"
  const isEditMode = location.state?.editMode || false;
  const existingData = location.state?.studentData || null;

  // Your cancel confirmation state
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Updated state to match the new backend fields exactly
  const [formData, setFormData] = useState({
    name: "",
    roll_number: "",
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
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditMode && existingData) {
      setFormData({
        name: existingData.name || "",
        roll_number: existingData.roll_number || "",
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
      });
    }
  }, [isEditMode, existingData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine if we are creating new or updating existing
    const url = isEditMode
      ? `http://127.0.0.1:8000/api/students/${existingData.id}/`
      : "http://127.0.0.1:8000/api/students/";
      
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        navigate("/studentDB");
      } else {
        const errorData = await res.json();
        console.error("Error:", errorData);
        alert("Failed to save student. Please check inputs.");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

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
          <a href="#" className="nav-item active" onClick={() => navigate("/studentDB")}><span className="nav-icon">▦</span> Dashboard</a>
          <a href="#" className="nav-item "><span className="nav-icon">👥</span> Students</a>
          <a href="#" className="nav-item"><span className="nav-icon">📘</span> Attendence</a>
          <a href="#" className="nav-item"><span className="nav-icon">📊</span> Reports</a>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-navbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search student by name or ID..." className="search-input" />
          </div>
          <div className="user-profile-section">
            <div className="notification-bell">🔔</div>
            <div className="user-info">
              <span className="user-name">Sarah Jenkins</span>
              <span className="user-role">Senior Educator</span>
            </div>
            <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="user-avatar" />
          </div>
        </header>

        <div className="registration-body">
          <div className="breadcrumb">Students / <b>{isEditMode ? "Edit Student" : "Add New Student"}</b></div>
          
          <div className="page-header">
            <h2>{isEditMode ? "Edit Student Profile" : "Student Registration"}</h2>
            <p>Fill in the official details to register a new student in the academic system.</p>
          </div>

          <form className="registration-form-card" onSubmit={handleSubmit}>
            
            {/* PHOTO UPLOAD UI */}
            <div className="photo-upload-section">
              <div className="photo-placeholder">
                <span className="camera-icon">📷</span>
                <div className="edit-badge">✎</div>
              </div>
              <div className="photo-text">
                <h4>Student Photograph</h4>
                <p>Upload a high-resolution formal photograph (JPG or PNG, max 2MB).</p>
                <button type="button" className="browse-btn">Browse Files</button>
              </div>
            </div>

            <div className="section-divider">PERSONAL INFORMATION</div>
            
            {/* FULL NAME AND ROLL NUMBER SIDE-BY-SIDE */}
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
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label>Nationality</label>
                <input type="text" name="nationality" placeholder="e.g. Canadian" value={formData.nationality} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Blood Group</label>
                <input type="text" name="blood_group" placeholder="e.g. O Positive" value={formData.blood_group} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Assigned Class</label>
              <input type="text" name="class_name" placeholder="e.g. Grade 10 - Section A" value={formData.class_name} onChange={handleChange} required />
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

            {/* FORM ACTIONS */}
            <div className="form-actions-row">
              <button type="button" className="cancel-btn" onClick={() => setConfirmCancel(true)}>Cancel</button>
              <button type="submit" className="save-btn">{isEditMode ? "Update Student" : "Register Student"}</button>
            </div>

          </form>

          {/* YOUR CUSTOM CANCEL CONFIRMATION MODAL */}
          {confirmCancel && (
            <div className='confirm-cancel-form'>
              <div className='confirm-cancel-content'>
                <p style={{fontSize: "1.2rem", fontWeight: "600", marginBottom: "20px"}}>Are you sure you want to cancel?</p>
                <p style={{color: "#64748b", marginBottom: "30px"}}>Any unsaved changes will be lost.</p>
                <div className='confirm-cancel-buttons'>
                  <button className='cancel-yes-btn' onClick={() => navigate("/studentDB")}>Yes, Cancel</button>
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