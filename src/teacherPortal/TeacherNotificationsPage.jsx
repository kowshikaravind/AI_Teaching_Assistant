import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherPortalLayout from './TeacherPortalLayout.jsx';
import { buildTeacherApiUrl, getTeacherSessionProfile, withTeacherScope } from '../utils/teacherSession.js';

export default function TeacherNotificationsPage() {
  const navigate = useNavigate();
  const { assignedClass } = getTeacherSessionProfile();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await fetch(buildTeacherApiUrl('notifications/', { recipient: 'teacher', type: 'teacher_alert' }));
      const data = res.ok ? await res.json() : [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load teacher alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(buildTeacherApiUrl('notifications/mark-all-read/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withTeacherScope({ recipient: 'teacher' })),
      });
      loadAlerts();
    } catch (error) {
      console.error('Failed to mark teacher alerts as read:', error);
    }
  };

  return (
    <TeacherPortalLayout title="Teacher Alerts" subtitle={`Only alerts raised by students from ${assignedClass || 'your assigned class'} are shown.`} actions={<button className="btn-primary" onClick={markAllRead}>Mark All Read</button>}>
      <div className="roster-container">
        <div className="roster-header"><h3>AI Escalation Alerts</h3></div>
        {loading ? (
          <p className="tp-loading">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="tp-empty">No teacher alerts for this class.</p>
        ) : (
          <table className="roster-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Previous %</th>
                <th>Latest %</th>
                <th>Message</th>
                <th className="tp-align-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.student_name}</td>
                  <td>{alert.subject}</td>
                  <td>{alert.details?.previous_score ?? '-'}</td>
                  <td>{alert.details?.latest_score ?? '-'}</td>
                  <td>{alert.message}</td>
                  <td className="tp-action-cell">
                    <button className="btn-primary" onClick={() => navigate(`/teacher/students/${alert.student}`)}>View Student</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TeacherPortalLayout>
  );
}