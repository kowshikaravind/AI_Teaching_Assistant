import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';

const STARTER_PROMPTS = [
	'How am I trending in each subject this month?',
	'What should I study first this week?',
	'Create a 3-day revision plan based on my weak subjects.',
	'Explain my biggest mistake pattern from recent tests.',
];

function AItutor() {
	const navigate = useNavigate();
	const [student, setStudent] = useState(null);
	const [attendance, setAttendance] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showSettings, setShowSettings] = useState(false);

	const [input, setInput] = useState('');
	const [sending, setSending] = useState(false);
	const [chatStarted, setChatStarted] = useState(false);
	const [messages, setMessages] = useState([
		{
			role: 'ai',
			text:
				"Hello! I'm your AI Tutor. I can help only with your own performance, attendance, subjects, and study planning.",
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		},
	]);

	const bottomRef = useRef(null);
	const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
	const studentId = studentUser?.id;

	useEffect(() => {
		if (!studentId) {
			navigate('/', { replace: true });
			return;
		}

		const fetchContext = async () => {
			try {
				const [studentRes, attendanceRes] = await Promise.all([
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/`),
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/attendance-summary/`),
				]);

				if (!studentRes.ok) {
					throw new Error('Failed to load student context');
				}

				const studentData = await studentRes.json();
				const attendanceData = attendanceRes.ok ? await attendanceRes.json() : null;
				setStudent(studentData);
				setAttendance(attendanceData);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchContext();
	}, [studentId, navigate]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, sending]);

	const subjectSummary = useMemo(() => {
		if (!student?.test_marks?.length) return [];
		const bySubject = {};

		student.test_marks.forEach((m) => {
			if (!bySubject[m.subject]) bySubject[m.subject] = { total: 0, count: 0 };
			bySubject[m.subject].total += (m.marks_obtained / m.total_marks) * 100;
			bySubject[m.subject].count += 1;
		});

		return Object.entries(bySubject)
			.map(([name, data]) => ({ name, score: Math.round(data.total / data.count) }))
			.sort((a, b) => b.score - a.score);
	}, [student]);

	const weakestSubject = subjectSummary.length
		? [...subjectSummary].sort((a, b) => a.score - b.score)[0]
		: null;

	const sendMessage = async (messageText) => {
		if (!messageText.trim() || sending || !studentId) return;

		const userMessage = {
			role: 'user',
			text: messageText.trim(),
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		};

		const nextMessages = [...messages, userMessage];
		setMessages(nextMessages);
		setInput('');
		setSending(true);
		setChatStarted(true);

		const history = nextMessages.map((m) => ({
			role: m.role === 'user' ? 'user' : 'model',
			parts: [m.text],
		}));

		try {
			const res = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/chat/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ history }),
			});

			const data = await res.json();
			setMessages((prev) => [
				...prev,
				{
					role: 'ai',
					text: data.reply || data.error || 'I could not generate a response right now.',
					time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				},
			]);
		} catch (err) {
			console.error(err);
			setMessages((prev) => [
				...prev,
				{
					role: 'ai',
					text: 'Something went wrong while contacting the server. Please try again.',
					time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				},
			]);
		} finally {
			setSending(false);
		}
	};

	const handleEnter = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	if (loading) {
		return <div className="ai-tutor-loading">Loading AI Tutor...</div>;
	}

	return (
		<div className="ai-tutor-layout">
			<aside className="sd-sidebar">
				<div className="sd-user-profile">
					<div className="sd-avatar-container">
						<img
							src={`https://ui-avatars.com/api/?name=${student.name}&background=cbd5e1&color=0f172a`}
							alt={student.name}
							className="sd-avatar"
						/>
						<span className="sd-online-dot"></span>
					</div>
					<div className="sd-user-info">
						<h3>{student.name}</h3>
						<p>#{student.roll_number} | {student.class_name}</p>
					</div>
				</div>

				<nav className="sd-nav">
					<a
						href="#"
						className="sd-nav-item"
						onClick={(e) => {
							e.preventDefault();
							navigate(`/student-dashboard/${studentId}`);
						}}
					>
						<span className="icon">⊞</span> Dashboard
					</a>
					<a
						href="#"
						className="sd-nav-item"
						onClick={(e) => {
							e.preventDefault();
							navigate('/my-performance');
						}}
					>
						<span className="icon">📈</span> My Performance
					</a>
					<a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/upcoming-tests'); }}>
						<span className="icon">📅</span> Upcoming Tests
					</a>
          <a
						href="#"
						className="sd-nav-item active"
						onClick={(e) => {
							e.preventDefault();
							navigate('/ai-tutor');
						}}
					>
						<span className="icon">🤖</span> AI Tutor
					</a>
					<a href="#" className="sd-nav-item" onClick={(e) => { e.preventDefault(); navigate('/notifications'); }}>
						<span className="icon">🔔</span> Notifications
					</a>
					<a
						href="#"
						className={`sd-nav-item ${showSettings ? 'active' : ''}`}
						onClick={(e) => {
							e.preventDefault();
							setShowSettings((v) => !v);
						}}
					>
						<span className="icon">⚙️</span> Settings
					</a>
					{showSettings && (
						<div className="sd-settings-panel">
							<button className="sd-profile-btn" onClick={() => navigate('/profile')}>
								Profile
							</button>
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

			<main className="ai-tutor-main">
				<header className="ai-tutor-topbar">
					<div>
						<h1>AI {student?.name?.split(' ')[0] || 'Student'} Tutor</h1>
						<p>Personalized to your own academic data only</p>
					</div>
				</header>

				<section className="ai-tutor-chat-wrap">
					<div className="ai-tutor-chat-head">
						<span className="dot" />
						<strong>Live Tutor Chat</strong>
					</div>

					<div className="ai-tutor-chat-body">
						{!chatStarted && (
							<div className="ai-tutor-starters">
								<p>
									I have your marks and attendance loaded. Ask me about your weak subjects, revision strategy,
									or score trends.
								</p>
								<div className="ai-tutor-chip-list">
									{STARTER_PROMPTS.map((q) => (
										<button key={q} className="ai-chip" onClick={() => sendMessage(q)}>
											{q}
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((msg, i) => (
							<div key={`${msg.role}-${i}`} className={`ai-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
								<div className={`ai-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
									<p>{msg.text}</p>
									<span>{msg.time}</span>
								</div>
							</div>
						))}

						{sending && (
							<div className="ai-msg-row ai">
								<div className="ai-msg ai typing">
									<span className="typing-dot" />
									<span className="typing-dot" />
									<span className="typing-dot" />
								</div>
							</div>
						)}

						<div ref={bottomRef} />
					</div>

					<div className="ai-tutor-input">
						<textarea
							rows={1}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleEnter}
							placeholder="Ask about your performance, attendance, or study plan..."
							disabled={sending}
						/>
						<button onClick={() => sendMessage(input)} disabled={sending || !input.trim()}>
							Send
						</button>
					</div>
				</section>
			</main>

			<aside className="ai-tutor-right">
				<section className="ai-panel">
					<h3>Study Resources</h3>
					<div className="ai-resource-item">
						<strong>Weakest Subject</strong>
						<p>
							{weakestSubject
								? `${weakestSubject.name} (${weakestSubject.score}%)`
								: 'No tests available yet'}
						</p>
					</div>
					<div className="ai-resource-item">
						<strong>Attendance</strong>
						<p>{attendance?.percentage ?? 0}% overall</p>
					</div>
				</section>

				<section className="ai-panel progress">
					<h3>Active Learning Session</h3>
					<p className="focus-topic">{weakestSubject?.name || 'Set your first goal'}</p>

					<div className="progress-row">
						<span>Current Mastery</span>
						<b>{weakestSubject?.score ?? 0}%</b>
					</div>
					<div className="progress-bar">
						<div style={{ width: `${weakestSubject?.score ?? 0}%` }} />
					</div>

					<div className="progress-row">
						<span>Attendance Confidence</span>
						<b>{attendance?.percentage ?? 0}%</b>
					</div>
					<div className="progress-bar">
						<div style={{ width: `${attendance?.percentage ?? 0}%` }} />
					</div>

					<button className="ai-complete-btn" onClick={() => navigate('/my-performance')}>
						View Full Performance
					</button>
				</section>
			</aside>
		</div>
	);
}

export default AItutor;
