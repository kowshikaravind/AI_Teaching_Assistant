import React from 'react';
import { Navigate } from 'react-router-dom';

export function RequireTeacherAuth({ children }) {
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
  if (teacherUser?.role !== 'teacher') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireAdminAuth({ children }) {
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  if (adminUser?.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}
