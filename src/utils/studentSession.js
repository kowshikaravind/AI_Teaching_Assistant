export function getStudentSessionProfile() {
  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');

  const studentName = studentUser?.name || 'Student';
  const studentId = studentUser?.id || null;
  const className = String(studentUser?.class_name || '').trim();

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=e2e8f0&color=0f172a`;

  return {
    studentId,
    studentName,
    className,
    avatar,
  };
}

export function buildStudentApiUrl(path, params = {}) {
  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const [basePath, existingQuery = ''] = normalizedPath.split('?');
  const search = new URLSearchParams(existingQuery);

  if (studentUser?.id) {
    search.set('student_id', String(studentUser.id));
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return `http://127.0.0.1:8000/api/${basePath}${query ? `?${query}` : ''}`;
}

export function withStudentScope(payload = {}) {
  const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
  if (!studentUser?.id) {
    return payload;
  }

  return {
    ...payload,
    student_id: studentUser.id,
  };
}
