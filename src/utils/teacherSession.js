export function getTeacherSessionProfile() {
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');

  const teacherName =
    teacherUser?.teacher_name
    || teacherUser?.name
    || teacherUser?.username
    || 'Teacher';

  const department = String(teacherUser?.department || '').trim() || 'Department N/A';

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=e2e8f0&color=0f172a`;

  return {
    teacherName,
    department,
    avatar,
  };
}
