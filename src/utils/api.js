import { apiUrl } from './backendUrls.js';

function getAuthToken() {
  // Check teacher, student, or admin
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  return teacherUser.access || studentUser.access || adminUser.access || null;
}

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : apiUrl(endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (token expired)
  if (response.status === 401) {
      console.warn("Unauthorized access. Token might be expired.");
      // Ideally trigger logout here if token is actually expired
  }

  return response;
}
