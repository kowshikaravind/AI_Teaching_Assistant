import {React , useState} from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function AddStudent() {
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [formData, setFormData] = useState({
      studentID: "",
      studentName: "",
      parentNumber: "",
      studentClass: "",
  });
  
  const handleChange = (e) =>{
    setFormData({
      ...formData,
      [e.target.name] : e.target.value,
    });
  }


    const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.studentName,
      roll_number: formData.studentID,
      parent_number: formData.parentNumber,
      class_name: formData.studentClass,
    }
    try{
      const res = await fetch("http://127.0.0.1:8000/api/students/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if(res.ok){
        const data = await res.json();
        console.log("Student added:", data);
        navigate("/studentDB");
      }
      else{
        const errorData = await res.json();
        console.error("Error:", errorData);
      }
    }
    catch(err){
      console.error("Error:", err);
    }
    
  };

  return (
    <div className="form-container">
      <h3>Enter Student Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input type="text" name="studentID" placeholder="Student ID (Roll No)" value={formData.studentID} onChange={handleChange} required />
          <input type="text" name="studentName" placeholder="Full Name" value={formData.studentName} onChange={handleChange} required />
          <input type="text" name="parentNumber" placeholder="Parent Contact Number" value={formData.parentNumber} onChange={handleChange} required />
          <input type="text" name="studentClass" placeholder="Class Name (e.g. Class 10)" value={formData.studentClass} onChange={handleChange} required />
        </div>
        
        <div style={{ textAlign: "right" }}>
          <button type="submit" className="submit-btn">Save Student</button>
          <button type="button" className="cancel-btn" onClick={() => setConfirmCancel(true)}>Cancel</button>
        </div>
      </form>
      <div>
      {confirmCancel && (
        <div className='confirm-cancel-form'>
          <div className='confirm-cancel-content'>
            <p>Are you sure you want to cancel?</p>
            <div className='confirm-cancel-buttons'>
              <button className='cancel-yes-btn' onClick={() => navigate("/studentDB")}>Yes</button>
              <button className='cancel-no-btn' onClick={() => setConfirmCancel(false)}>No</button>
            </div>
          </div>
        </div>
        
      )}
      </div>
    </div>
  )
}
export default AddStudent;