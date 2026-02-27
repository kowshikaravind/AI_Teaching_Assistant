import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'
function LoginType(){
  const navigate = useNavigate();

  return(
    <div className='login-type-container' >
      <div className='create-account' >
        <button className='create-account-btn' onClick={() => navigate("/create-account")}>Create Account</button>
      </div>
      <div className='logintype-heading-text'>
        <h2>Academic Performance Tracker</h2>
        <p className='heading-para'>Welcome to the Academic Performance Tracker System</p>
      </div>
      <div className='logintype-btns' >
        <div className='student-portal' >
          <button className='student-portal-btn' >Student Portal</button>
        </div>
        <div className='teacher-portal' >
          <button className='teacher-portal-btn' onClick={() => navigate("/login")}>Teacher Portal</button>
        </div>
      </div>
    </div>
  )
}

export default LoginType;