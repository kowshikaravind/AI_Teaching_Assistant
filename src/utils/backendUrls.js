const rawBackendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const BACKEND_BASE_URL = rawBackendBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = `${BACKEND_BASE_URL}/api`;

export function apiUrl(path = '') {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return `${API_BASE_URL}/${normalizedPath}`;
}

export function backendUrl(path = '') {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return normalizedPath ? `${BACKEND_BASE_URL}/${normalizedPath}` : BACKEND_BASE_URL;
}