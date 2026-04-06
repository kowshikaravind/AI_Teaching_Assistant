import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';

const STARTER_PROMPTS = [
	'Help me understand my mistakes in this test',
	'What should I focus on for the next test?',
	'Explain my test-taking patterns',
	'How can I improve in this subject?',
];

function AItutor() {
	const navigate = useNavigate();
	const [student, setStudent] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [subjects, setSubjects] = useState([]);
	const [activeSubject, setActiveSubject] = useState(null);
	const [activeTestId, setActiveTestId] = useState(null);

	const [input, setInput] = useState('');
	const [sending, setSending] = useState(false);
	const [chatStarted, setChatStarted] = useState(false);
	const [messages, setMessages] = useState([]);
	const [chatOpen, setChatOpen] = useState(false);

	const bottomRef = useRef(null);
	const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
	const studentId = studentUser?.id;

	const activeTestReview =
		activeSubject?.tests?.find((test) => test.test_id === activeTestId) ||
		activeSubject?.tests?.[0] ||
		null;

	useEffect(() => {
		if (!activeSubject) {
			return;
		}

		setActiveTestId(activeSubject.tests?.[0]?.test_id || null);
		setChatStarted(false);
		setChatOpen(false);
		setMessages([
			{
				role: 'ai',
				text: `I'm ready to help you with ${activeSubject.name}. Ask me about your stored reviews, repeated mistakes, or how to improve for the next test.`,
				time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			},
		]);
	}, [activeSubject]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, sending]);

	useEffect(() => {
		if (!studentId) {
			navigate('/', { replace: true });
			return;
		}

		const fetchData = async () => {
			try {
				const [studentRes, aiTutorRes] = await Promise.all([
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/`),
					fetch(`http://127.0.0.1:8000/api/students/${studentId}/ai-tutor/`),
				]);

				if (!studentRes.ok) {
					throw new Error('Failed to load student');
				}

				const studentData = await studentRes.json();
				const aiTutorData = aiTutorRes.ok ? await aiTutorRes.json() : { subjects: [] };
				const loadedSubjects = aiTutorData.subjects || [];

				setStudent(studentData);
				setSubjects(loadedSubjects);

				if (loadedSubjects.length > 0) {
					setActiveSubject(loadedSubjects[0]);
				}
			} catch (err) {
				console.error('Error loading AI Tutor data:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [studentId, navigate]);

	const sendMessage = async (messageText) => {
		if (!messageText.trim() || sending || !studentId || !activeSubject) {
			return;
		}

		const activeConceptualMistakes =
			activeTestReview?.conceptual_mistakes?.length > 0
				? activeTestReview.conceptual_mistakes
				: activeSubject.conceptual_mistakes || [];
		const activeBehaviorPatterns =
			activeTestReview?.behavior_patterns?.length > 0
				? activeTestReview.behavior_patterns
				: activeSubject.behavior_patterns || [];
		const activeStrengths =
			activeTestReview?.strengths?.length > 0 ? activeTestReview.strengths : activeSubject.strengths || [];

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

		const history = nextMessages.map((message) => ({
			role: message.role === 'user' ? 'user' : 'model',
			parts: [message.text],
		}));

		const subjectContextMessage = {
			role: 'user',
			parts: [
				`We're discussing ${activeSubject.name}. ` +
					`This student has taken ${activeSubject.test_count} tests in this subject. ` +
					`Their average score is ${activeSubject.avg_score}% and recent score is ${activeSubject.recent_score}%. ` +
					(activeTestReview
						? `We are focusing on ${activeTestReview.test_name} from ${activeTestReview.test_date}. `
						: '') +
					`Their conceptual mistakes include: ${activeConceptualMistakes.join(', ')}. ` +
					`Their test behavior patterns include: ${activeBehaviorPatterns.join(', ')}. ` +
					`Their strengths include: ${activeStrengths.join(', ')}.`,
			],
		};

		try {
			const res = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/chat/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					history: [subjectContextMessage, ...history],
					subject_name: activeSubject.name,
					subject_insights: {
						avg_score: activeSubject.avg_score,
						recent_score: activeSubject.recent_score,
						test_name: activeTestReview?.test_name || null,
						test_date: activeTestReview?.test_date || null,
						conceptual_mistakes: activeConceptualMistakes,
						behavior_patterns: activeBehaviorPatterns,
							strengths: activeStrengths,
							mastery_summary: activeTestReview?.mastery_summary || activeSubject.mastery_summary || null,
						comprehensive_analysis: activeTestReview?.comprehensive_analysis || [],
					},
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || 'I could not generate a response. Please try again.');
			}
			setMessages((prev) => [
				...prev,
				{
					role: 'ai',
					text: data.reply || 'I could not generate a response. Please try again.',
					time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				},
			]);
		} catch (err) {
			console.error(err);
			setMessages((prev) => [
				...prev,
				{
					role: 'ai',
					text: err.message || 'Something went wrong. Please try again.',
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
							src={`https://ui-avatars.com/api/?name=${student?.name || 'Student'}&background=cbd5e1&color=0f172a`}
							alt={student?.name}
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
					<a
						href="#"
						className="sd-nav-item"
						onClick={(e) => {
							e.preventDefault();
							navigate('/upcoming-tests');
						}}
					>
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
					<a
						href="#"
						className="sd-nav-item"
						onClick={(e) => {
							e.preventDefault();
							navigate('/notifications');
						}}
					>
						<span className="icon">🔔</span> Notifications
					</a>
					<a
						href="#"
						className={`sd-nav-item ${showSettings ? 'active' : ''}`}
						onClick={(e) => {
							e.preventDefault();
							setShowSettings((value) => !value);
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
						<h1>AI Tutor</h1>
						<p>Stored analysis and guidance for each subject and each completed test</p>
					</div>
				</header>

				<div className="ai-tutor-subject-tabs">
					{subjects.length === 0 ? (
						<div className="ai-tutor-no-subjects">
							<p>No review available.</p>
						</div>
					) : (
						<div className="ai-tutor-tabs-scroll">
							{subjects.map((subject) => (
								<button
									key={subject.name}
									className={`ai-tutor-tab ${activeSubject?.name === subject.name ? 'active' : ''}`}
									onClick={() => setActiveSubject(subject)}
								>
									<div className="tab-name">{subject.name}</div>
									<div className="tab-meta">
										{subject.test_count} test{subject.test_count !== 1 ? 's' : ''} • {subject.avg_score}%
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				{activeSubject ? (
					<>
						<section className="ai-test-review-strip">
							<div className="ai-test-review-header">
								<div>
									<h3>Stored Test Reviews</h3>
									<p>Open any completed test in this subject to view its saved AI review.</p>
								</div>
							</div>

							<div className="ai-test-review-list">
								{activeSubject.tests?.map((test) => (
									<button
										key={test.test_id}
										type="button"
										className={`ai-test-review-card ${activeTestReview?.test_id === test.test_id ? 'active' : ''}`}
										onClick={() => setActiveTestId(test.test_id)}
									>
										<div className="ai-test-review-top">
											<strong>{test.test_name}</strong>
											<span>{test.percentage}%</span>
										</div>
										<p>{test.test_date}</p>
										<small>{test.mastery_summary || test.conceptual_mistakes?.[0] || test.behavior_patterns?.[0] || 'No review available.'}</small>
									</button>
								))}
							</div>
						</section>

						<section className="ai-tutor-analysis-section">
							<div className="ai-analysis-card ai-comparison-card">
								<h3>Progress From Previous Test</h3>
								<div className="analysis-content">
									{activeTestReview?.comparison ? (
										<div className="ai-comparison-content">
											<div className={`ai-comparison-badge ${activeTestReview.comparison.status}`}>
												{activeTestReview.comparison.title}
											</div>
											<p className="ai-comparison-summary">{activeTestReview.comparison.summary}</p>
											{activeTestReview.comparison.previous_test_name ? (
												<div className="ai-comparison-grid">
													<div className="ai-comparison-item">
														<span>Previous Test</span>
														<strong>
															{activeTestReview.comparison.previous_test_name} • {activeTestReview.comparison.previous_test_date}
														</strong>
													</div>
													<div className="ai-comparison-item">
														<span>Previous Score</span>
														<strong>{activeTestReview.comparison.previous_score}%</strong>
													</div>
													<div className="ai-comparison-item">
														<span>Current Score</span>
														<strong>{activeTestReview.percentage}%</strong>
													</div>
													<div className="ai-comparison-item">
														<span>Change</span>
														<strong>
															{activeTestReview.comparison.score_change > 0 ? '+' : ''}
															{activeTestReview.comparison.score_change}%
														</strong>
													</div>
												</div>
											) : (
												<p className="no-data">Comparison will appear after one more test in this subject.</p>
											)}
										</div>
									) : (
										<p className="no-data">Comparison data is not available yet.</p>
									)}
								</div>
							</div>

							<div className="ai-analysis-card">
								<h3>Strengths and Mastery{activeTestReview ? ` - ${activeTestReview.test_name}` : ''}</h3>
								<div className="analysis-content">
									{activeTestReview?.strengths?.length > 0 ? (
										<ul className="analysis-list">
											{activeTestReview.strengths.map((strength, idx) => (
												<li key={idx}>{strength}</li>
											))}
										</ul>
									) : (
										<p className="no-data">{activeTestReview?.mastery_summary || 'No strong strengths detected yet.'}</p>
									)}
								</div>
							</div>

							<div className="ai-analysis-card">
								<h3>Conceptual Mistakes{activeTestReview ? ` - ${activeTestReview.test_name}` : ''}</h3>
								<div className="analysis-content">
									{activeTestReview?.conceptual_mistakes?.length > 0 ? (
										<ul className="analysis-list">
											{activeTestReview.conceptual_mistakes.map((mistake, idx) => (
												<li key={idx}>{mistake}</li>
											))}
										</ul>
									) : (
										<p className="no-data">No strong patterns detected yet.</p>
									)}
								</div>
							</div>

							<div className="ai-analysis-card">
								<h3>Test Behavior Patterns{activeTestReview ? ` - ${activeTestReview.test_name}` : ''}</h3>
								<div className="analysis-content">
									{activeTestReview?.behavior_patterns?.length > 0 ? (
										<ul className="analysis-list">
											{activeTestReview.behavior_patterns.map((pattern, idx) => (
												<li key={idx}>{pattern}</li>
											))}
										</ul>
									) : (
										<p className="no-data">No clear behavior patterns detected.</p>
									)}
								</div>
							</div>
						</section>

						<div className="ai-chat-floating-zone">
							<button
								type="button"
								className="ai-chat-fab"
								onClick={() => setChatOpen((value) => !value)}
							>
								{chatOpen ? 'Close AI Chat' : `Ask AI about ${activeSubject.name}`}
							</button>

							{chatOpen && (
								<section className="ai-chat-popup">
									<div className="ai-tutor-chat-head">
										<span className="dot" />
										<strong>
											{activeSubject.name} AI Assistant
											{activeTestReview ? ` - ${activeTestReview.test_name}` : ''}
										</strong>
									</div>

									<div className="ai-tutor-chat-body">
										{!chatStarted && (
											<div className="ai-tutor-starters">
												<p>
													Ask me about your performance, mistakes, or study strategies for {activeSubject.name}
													{activeTestReview ? ` in ${activeTestReview.test_name}` : ''}.
												</p>
												<div className="ai-tutor-chip-list">
													{STARTER_PROMPTS.map((question) => (
														<button key={question} className="ai-chip" onClick={() => sendMessage(question)}>
															{question}
														</button>
													))}
												</div>
											</div>
										)}

										{messages.map((msg, index) => (
											<div key={`${msg.role}-${index}`} className={`ai-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
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
											placeholder={`Ask about ${activeSubject.name}${activeTestReview ? ` - ${activeTestReview.test_name}` : ''}...`}
											disabled={sending}
										/>
										<button onClick={() => sendMessage(input)} disabled={sending || !input.trim()}>
											Send
										</button>
									</div>
								</section>
							)}
						</div>
					</>
				) : null}
			</main>

			{activeSubject && (
				<aside className="ai-tutor-right">
					<section className="ai-panel">
						<h3>Subject Stats</h3>
						<div className="ai-resource-item">
							<strong>Tests Taken</strong>
							<p>{activeSubject.test_count}</p>
						</div>
						<div className="ai-resource-item">
							<strong>Average Score</strong>
							<p>{activeSubject.avg_score}%</p>
						</div>
						<div className="ai-resource-item">
							<strong>Latest Score</strong>
							<p>{activeSubject.recent_score}%</p>
						</div>
						{activeTestReview && (
							<div className="ai-resource-item">
								<strong>Selected Test</strong>
								<p>{activeTestReview.test_name} • {activeTestReview.test_date}</p>
							</div>
						)}
						{activeTestReview?.comparison?.previous_test_name && (
							<div className="ai-resource-item">
								<strong>Compared With</strong>
								<p>{activeTestReview.comparison.previous_test_name}</p>
							</div>
						)}
					</section>

					<section className="ai-panel">
						<h3>Overall Progress</h3>
						<button className="ai-complete-btn" onClick={() => navigate('/my-performance')}>
							View Full Dashboard
						</button>
					</section>
				</aside>
			)}
		</div>
	);
}

export default AItutor;
