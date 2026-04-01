import { useLocation, useNavigate } from 'react-router-dom';
import { getTeacherSessionProfile } from '../utils/teacherSession.js';
import './teacherPortal.css';

const navItems = [
  { label: 'Dashboard', path: '/teacher/dashboard' },
  { label: 'Students', path: '/teacher/students' },
  { label: 'Upcoming Tests', path: '/teacher/tests' },
  { label: 'AI Insights', path: '/teacher/ai' },
  { label: 'Alerts', path: '/teacher/alerts' },
];

export default function TeacherPortalLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacherName, assignedClass, avatar } = getTeacherSessionProfile();

  const handleLogout = () => {
    localStorage.removeItem('teacherUser');
    navigate('/teacher-login', { replace: true });
  };

  return (
    <div className="edudash-app">
      <header className="edudash-topbar">
        <div className="edudash-brand" onClick={() => navigate('/teacher/dashboard')} role="button">
          <div className="edudash-brand-icon">🎓</div>
          <span className="edudash-brand-name">EduManage</span>
        </div>

        <nav className="edudash-nav-links">
          {navItems.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== '/teacher/dashboard' && location.pathname.startsWith(`${item.path}/`));
            return (
              <button
                key={item.path}
                type="button"
                className={`edudash-nav-tab${active ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="edudash-topbar-end">
          <button type="button" className="edudash-switch-course-btn" onClick={handleLogout}>
            ↩ Log Out
          </button>
          <div className="edudash-user-chip">
            <div className="edudash-user-info">
              <span className="edudash-user-name">{teacherName}</span>
              <span className="edudash-user-role">{assignedClass}</span>
            </div>
            <img src={avatar} alt="Teacher" className="edudash-avatar" />
          </div>
        </div>
      </header>

      <main className="edudash-inner-main">
        <div className="edudash-inner-header">
          <div>
            <h1 className="edudash-inner-title">{title}</h1>
            {subtitle && <p className="edudash-inner-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="edudash-inner-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}