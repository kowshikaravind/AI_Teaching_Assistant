import { API_BASE_URL } from './backendUrls.js';

export function getTeacherSessionProfile() {
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');

  const teacherName =
    teacherUser?.teacher_name
    || teacherUser?.name
    || teacherUser?.username
    || 'Teacher';

  const assignedClass = String(teacherUser?.assigned_class || '').trim() || 'Class N/A';
  const teacherId = teacherUser?.id || null;

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=e2e8f0&color=0f172a`;

  return {
    teacherName,
    assignedClass,
    teacherId,
    avatar,
  };
}

/**
 * Build teacher-scoped API URL with assigned class filter
 * Automatically filters results by assigned_class
 */
export function buildTeacherApiUrl(endpoint, params = {}) {
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
  const assignedClass = teacherUser?.assigned_class || '';
  
  const normalized = String(endpoint || '').replace(/^\/+/, '');
  const [path, existingQuery = ''] = normalized.split('?');

  // Merge existing query params from endpoint with provided params.
  const queryParams = new URLSearchParams(existingQuery);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      queryParams.set(key, String(value));
    }
  });

  if (assignedClass) {
    queryParams.set('assigned_class', assignedClass);
  }
  
  const queryString = queryParams.toString();
  return `${API_BASE_URL}/${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Wrap payload with teacher scope (assigned_class)
 * Used for POST/PUT requests to ensure data is scoped to teacher's class
 */
export function withTeacherScope(payload = {}) {
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
  return {
    ...payload,
    assigned_class: teacherUser?.assigned_class || '',
    teacher_id: teacherUser?.id || null,
  };
}
