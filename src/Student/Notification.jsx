import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';

function Notification() {
	const navigate = useNavigate();
	const [student, setStudent] = useState(null);
	const [attendance, setAttendance] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [subjectFilter, setSubjectFilter] = useState('all');

	const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
	const studentId = studentUser?.id;

	useEffect(() => {
		if (!studentId) {
			navigate('/', { replace: true });
			return;
		}

		const fetchContext = async () => {
			try {
				const [studentRes, attendanceRes, notificationRes] = await Promise.all([
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/`),
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/attendance-summary/`),
					fetch(`http://127.0.0.1:8000/api/notifications/?student_id=${studentId}&recipient=student`),
				]);

				if (!studentRes.ok) {
					throw new Error('Failed to load student profile');
				}

				const studentData = await studentRes.json();
				const attendanceData = attendanceRes.ok ? await attendanceRes.json() : null;
				const notificationData = notificationRes.ok ? await notificationRes.json() : [];
				setStudent(studentData);
				setAttendance(attendanceData);
				setNotifications(Array.isArray(notificationData) ? notificationData : []);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchContext();
	}, [studentId, navigate]);

	const filteredNotifications = useMemo(() => {
		return notifications.filter((n) => {
			const categoryOk = categoryFilter === 'all' || n.type === categoryFilter;
			const subjectOk = subjectFilter === 'all' || (n.subject || '').toLowerCase() === subjectFilter.toLowerCase();
			return categoryOk && subjectOk;
		});
	}, [notifications, categoryFilter, subjectFilter]);

	const subjectOptions = useMemo(() => {
		const set = new Set(
			notifications
				.map((n) => (n.subject || '').trim())
				.filter(Boolean)
		);
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [notifications]);

	const unreadCount = notifications.filter((n) => !n.read_status).length;

	const markAllRead = async () => {
		try {
			await fetch('http://127.0.0.1:8000/api/notifications/mark-all-read/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ student_id: studentId, recipient: 'student' }),
			});
			setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
		} catch (err) {
			console.error(err);
		}
	};

	const markRead = async (id) => {
		try {
			await fetch(`http://127.0.0.1:8000/api/notifications/${id}/read/`, { method: 'PATCH' });
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_status: true } : n)));
		} catch (err) {
			console.error(err);
		}
	};

	if (loading) {
		return <div className="nt-loading">Loading notifications...</div>;
	}

	return (
		<div className="nt-layout">
			<aside className="sd-sidebar">
				<div className="sd-user-profile">
					<div className="sd-avatar-container">
						<img
							src={`https://ui-avatars.com/api/?name=${student?.name || 'Student'}&background=cbd5e1&color=0f172a`}
							alt={student?.name || 'Student'}
							className="sd-avatar"
						/>
						<span className="sd-online-dot"></span>
					</div>
					<div className="sd-user-info">
						<h3>{student?.name}</h3>
						<p>#{student?.roll_number} | {student?.class_name}</p>
					</div>
				</div>

				<nav className="sd-nav">
					<a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate(`/student-dashboard/${studentId}`); }}>
						<span className="icon">⊞</span> Dashboard
					</a>
					<a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/my-performance'); }}>
						<span className="icon">📈</span> My Performance
					</a>
					<a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/upcoming-tests'); }}>
						<span className="icon">📅</span> Upcoming Tests
					</a>
					<a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/ai-tutor'); }}>
						<span className="icon">🤖</span> AI Tutor
					</a>
					<a href="#" className="sd-nav-item active" onClick={(e) => { e.preventDefault(); navigate('/notifications'); }}>
						<span className="icon">🔔</span> Notifications
					</a>
					<a
						href="#"
						className={`sd-nav-item ${showSettings ? 'active' : ''}`}
						onClick={(e) => { e.preventDefault(); setShowSettings(!showSettings); }}
					>
						<span className="icon">⚙️</span> Settings
					</a>
					{showSettings && (
						<div className="sd-settings-panel">
							<button className="sd-profile-btn" onClick={() => navigate('/profile')}>Profile</button>
							<button
								className="sd-logout-btn"
								onClick={() => {
									localStorage.removeItem('studentUser');
									navigate('/', { replace: true });
								}}
								onMouseEnter={(e) => (e.currentTarget.style.background = '#ffe4e6')}
								onMouseLeave={(e) => (e.currentTarget.style.background = '#fff1f2')}
							>
								🚪 Log Out
							</button>
						</div>
					)}
				</nav>
			</aside>

			<main className="nt-main">
				<section className="nt-center">
					<h1>Nexus Center</h1>
					<p>Your cognitive hub for all recent academic activity and real-time updates.</p>

					<div className="nt-orbit-wrap">
						<div className="nt-orbit-ring">
							<div className="nt-orbit-core">
								<span>✦</span>
							</div>
						</div>
						{unreadCount > 0 && <div className="nt-badge">{unreadCount}</div>}
					</div>

					<div className="nt-actions">
						<button className="primary" onClick={markAllRead}>Mark All Read</button>
					</div>

					<div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							style={{ padding: 8, borderRadius: 8, border: '1px solid #dbe3ff', background: '#fff' , color:'black' }}
						>
							<option value="all">All Categories</option>
							<option value="test">Upcoming Tests</option>
							<option value="ai_warning">AI Performance Alerts</option>
						</select>
						<select
							value={subjectFilter}
							onChange={(e) => setSubjectFilter(e.target.value)}
							style={{ padding: 8, borderRadius: 8, border: '1px solid #dbe3ff', background: '#fff', color:'black'  }}
						>
							<option value="all">All Subjects</option>
							{subjectOptions.map((subj) => (
								<option key={subj} value={subj}>{subj}</option>
							))}
						</select>
					</div>
				</section>
			</main>

			<aside className="nt-right">
				<div className="nt-right-head">
					<h3>Activity Stream</h3>
				</div>

				{filteredNotifications.length === 0 ? (
					<p className="nt-empty">No notifications left. You're all caught up.</p>
				) : (
					<div className="nt-cards">
						{filteredNotifications.map((item) => (
							
							<article key={item.id} className={`nt-card ${item.type}`}>
								<div className="nt-card-top">
									<h4>
										{item.type === 'test'
											? `Upcoming Test${item.subject ? `: ${item.subject}` : ''}`
											: item.type === 'ai_warning'
												? `AI Alert${item.subject ? `: ${item.subject}` : ''}`
												: `Teacher Alert${item.subject ? `: ${item.subject}` : ''}`}
									</h4>
									<span>{new Date(item.timestamp).toLocaleString()}</span>
								</div>
								<p>{item.message}</p>
								{!item.read_status && (
									<button
										onClick={() => markRead(item.id)}
										style={{ marginTop: 8, borderRadius: 8, border: 'none', padding: '6px 10px', cursor: 'pointer' }}
									>
										Mark as read
									</button>
								)}
							</article>
						))}
					</div>
				)}

				<button className="nt-link-btn">View Past Activity</button>

				<div className="nt-storage">
					<div className="nt-storage-head">
						<span>Storage Sync</span>
						<b>{attendance?.percentage ?? 0}%</b>
					</div>
					<div className="nt-storage-bar">
						<div style={{ width: `${attendance?.percentage ?? 0}%` }} />
					</div>
				</div>
			</aside>
		</div>
	);
}

export default Notification;
