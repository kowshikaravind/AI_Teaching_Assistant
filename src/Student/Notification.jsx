import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';

function Notification() {
	const navigate = useNavigate();
	const [student, setStudent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showSettings, setShowSettings] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [subjectFilter, setSubjectFilter] = useState('all');
	const [searchText, setSearchText] = useState('');
	const [activeTab, setActiveTab] = useState('all');
	const [processingAllRead, setProcessingAllRead] = useState(false);
	const [processingReadId, setProcessingReadId] = useState(null);

	const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
	const studentId = studentUser?.id;

	useEffect(() => {
		if (!studentId) {
			navigate('/', { replace: true });
			return;
		}

		const fetchContext = async () => {
			try {
				setError('');
				const [studentRes, notificationRes] = await Promise.all([
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/`),
					fetch(`http://127.0.0.1:8000/api/notifications/?student_id=${studentId}&recipient=student`),
				]);

				if (!studentRes.ok) {
					throw new Error('Failed to load student profile');
				}

				const studentData = await studentRes.json();
				const notificationData = notificationRes.ok ? await notificationRes.json() : [];
				setStudent(studentData);
				setNotifications(Array.isArray(notificationData) ? notificationData : []);
			} catch (err) {
				console.error(err);
				setError('Unable to load notifications right now. Please try again.');
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
			const tabOk = activeTab === 'all' || !n.read_status;
			const searchable = `${n.message || ''} ${n.subject || ''}`.toLowerCase();
			const searchOk = !searchText.trim() || searchable.includes(searchText.trim().toLowerCase());
			return categoryOk && subjectOk && tabOk && searchOk;
		});
	}, [notifications, categoryFilter, subjectFilter, activeTab, searchText]);

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
			setProcessingAllRead(true);
			await fetch('http://127.0.0.1:8000/api/notifications/mark-all-read/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ student_id: studentId, recipient: 'student' }),
			});
			setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
		} catch (err) {
			console.error(err);
			setError('Failed to mark notifications as read.');
		} finally {
			setProcessingAllRead(false);
		}
	};

	const markRead = async (id) => {
		try {
			setProcessingReadId(id);
			await fetch(`http://127.0.0.1:8000/api/notifications/${id}/read/`, { method: 'PATCH' });
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_status: true } : n)));
		} catch (err) {
			console.error(err);
			setError('Failed to update this notification.');
		} finally {
			setProcessingReadId(null);
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
				<section className="nt-panel">
					<header className="nt-panel-header">
						<div>
							<h1>Notifications</h1>
							<p>Stay updated with tests, AI alerts, and class activity.</p>
						</div>
						<div className="nt-summary-chip">
							Unread <b>{unreadCount}</b>
						</div>
					</header>

					<div className="nt-toolbar">
						<div className="nt-tabs" role="tablist" aria-label="Notification filter tabs">
							<button
								className={`nt-tab ${activeTab === 'all' ? 'active' : ''}`}
								onClick={() => setActiveTab('all')}
							>
								All
							</button>
							<button
								className={`nt-tab ${activeTab === 'unread' ? 'active' : ''}`}
								onClick={() => setActiveTab('unread')}
							>
								Unread
							</button>
						</div>

						<button
							className="nt-mark-all"
							onClick={markAllRead}
							disabled={processingAllRead || unreadCount === 0}
						>
							{processingAllRead ? 'Marking...' : 'Mark all as read'}
						</button>
					</div>

					<div className="nt-filters">
						<input
							type="text"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder="Search notifications"
							className="nt-search"
						/>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className="nt-select"
						>
							<option value="all">All Categories</option>
							<option value="test">Upcoming Tests</option>
							<option value="ai_warning">AI Performance Alerts</option>
							<option value="teacher_alert">Teacher Alerts</option>
						</select>
						<select
							value={subjectFilter}
							onChange={(e) => setSubjectFilter(e.target.value)}
							className="nt-select"
						>
							<option value="all">All Subjects</option>
							{subjectOptions.map((subj) => (
								<option key={subj} value={subj}>{subj}</option>
							))}
						</select>
					</div>

					{error && <p className="nt-error">{error}</p>}

					{filteredNotifications.length === 0 ? (
						<p className="nt-empty">No notifications found for current filters.</p>
					) : (
						<div className="nt-list">
							{filteredNotifications.map((item) => (
								<article key={item.id} className={`nt-feed-card ${!item.read_status ? 'unread' : 'read'}`}>
									<div className="nt-feed-head">
										<div>
											<h4>
												{item.type === 'test'
													? `Upcoming Test${item.subject ? `: ${item.subject}` : ''}`
													: item.type === 'ai_warning'
														? `AI Alert${item.subject ? `: ${item.subject}` : ''}`
														: `Teacher Alert${item.subject ? `: ${item.subject}` : ''}`}
											</h4>
											<span>{new Date(item.timestamp).toLocaleString()}</span>
										</div>
										{!item.read_status && <span className="nt-unread-dot" aria-label="Unread"></span>}
									</div>
									<p>{item.message}</p>
									{!item.read_status && (
										<button
											className="nt-mark-read"
											onClick={() => markRead(item.id)}
											disabled={processingReadId === item.id}
										>
											{processingReadId === item.id ? 'Updating...' : 'Mark as read'}
										</button>
									)}
								</article>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}

export default Notification;
