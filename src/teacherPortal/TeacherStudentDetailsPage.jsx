import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TeacherPortalLayout from './TeacherPortalLayout.jsx';
import { buildTeacherApiUrl, withTeacherScope } from '../utils/teacherSession.js';

const suggestedQuestions = [
  'How is this student trending overall?',
  'Which subject needs attention?',
  'Draft a parent message.',
  'What should I do next for this student?',
];

export default function TeacherStudentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const res = await fetch(buildTeacherApiUrl(`students/${id}/`));
        const data = await res.json();
        if (res.ok) {
          setStudent(data);
        }
      } catch (error) {
        console.error('Failed to load teacher student detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const examHistory = useMemo(() => {
    if (!student?.test_marks) {
      return [];
    }

    return [...student.test_marks].sort((left, right) => new Date(left.date_taken) - new Date(right.date_taken));
  }, [student]);

  const average = useMemo(() => {
    if (examHistory.length === 0) {
      return 0;
    }
    const totalObtained = examHistory.reduce((sum, mark) => sum + Number(mark.marks_obtained), 0);
    const totalMarks = examHistory.reduce((sum, mark) => sum + Number(mark.total_marks), 0);
    return totalMarks ? Math.round((totalObtained / totalMarks) * 100) : 0;
  }, [examHistory]);

  const sendMessage = async (preset) => {
    const text = (preset || input).trim();
    if (!text || thinking) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    setThinking(true);

    try {
      const history = nextMessages.map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [message.text],
      }));

      const res = await fetch(buildTeacherApiUrl(`students/${id}/chat/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withTeacherScope({ history })),
      });
      const data = await res.json();
      setMessages((existing) => [...existing, { role: 'model', text: data.reply || data.error || 'No response received.' }]);
    } catch (error) {
      console.error('Failed to ask student AI:', error);
      setMessages((existing) => [...existing, { role: 'model', text: 'Something went wrong while getting AI advice.' }]);
    } finally {
      setThinking(false);
    }
  };

  const deleteMark = async (markId) => {
    const confirmed = window.confirm('Delete this mark entry?');
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(buildTeacherApiUrl(`testmarks/${markId}/`), { method: 'DELETE' });
      if (res.ok) {
        setStudent((current) => ({
          ...current,
          test_marks: current.test_marks.filter((mark) => mark.id !== markId),
        }));
      }
    } catch (error) {
      console.error('Failed to delete mark:', error);
    }
  };

  return (
    <TeacherPortalLayout title="Student Profile" subtitle="Detailed view with AI support for one student." actions={<button className="btn-primary" onClick={() => navigate('/teacher/students')}>← Back To Students</button>}>
      {loading || !student ? (
        <div className="roster-container"><p className="tp-loading">Loading student profile...</p></div>
      ) : (
        <>
          <div className="tp-grid-two-alt">
            <div className="roster-container tp-panel">
              <h3 className="tp-ai-title">{student.name}</h3>
              <p className="tp-chat-subtitle">#{student.roll_number} · {student.class_name}</p>
              <div className="tp-detail-stack">
                <div><strong>Student Email:</strong> {student.student_email || 'N/A'}</div>
                <div><strong>Parent Name:</strong> {student.parent_name || 'N/A'}</div>
                <div><strong>Parent Number:</strong> {student.parent_number || 'N/A'}</div>
                <div><strong>Average Score:</strong> {average}%</div>
              </div>
              <div className="tp-detail-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate('/add-student', { state: { editMode: true, studentData: student, returnTo: '/teacher/students' } })}
                >
                  Edit Student
                </button>
              </div>
            </div>

            <div className="roster-container tp-ai-panel">
              <h3 className="tp-ai-title">AI Advisor</h3>
              {messages.length === 0 && suggestedQuestions.map((question) => (
                <button key={question} type="button" onClick={() => sendMessage(question)} className="tp-ai-suggestion">
                  {question}
                </button>
              ))}
              <div className="tp-ai-feed">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`tp-ai-bubble ${message.role === 'user' ? 'tp-ai-bubble-user' : ''}`}>
                    {message.text}
                  </div>
                ))}
                {thinking && <div className="tp-ai-thinking">Analysing student history...</div>}
                <div ref={endRef} />
              </div>
              <div className="tp-ai-input-row">
                <input className="search-input tp-chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about this student..." />
                <button className="btn-primary" onClick={() => sendMessage()} disabled={thinking || !input.trim()}>Send</button>
              </div>
            </div>
          </div>

          <div className="roster-container">
            <div className="roster-header"><h3>Exam History</h3></div>
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th className="tp-align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {examHistory.length === 0 ? (
                  <tr><td colSpan="5" className="tp-empty-centered">No marks recorded yet.</td></tr>
                ) : examHistory.map((mark) => {
                  const percentage = mark.total_marks ? Math.round((mark.marks_obtained / mark.total_marks) * 100) : 0;
                  return (
                    <tr key={mark.id}>
                      <td>{mark.subject}</td>
                      <td>{mark.test_name}</td>
                      <td>{mark.date_taken}</td>
                      <td>{mark.marks_obtained}/{mark.total_marks} ({percentage}%)</td>
                      <td className="tp-action-cell">
                        <button type="button" onClick={() => deleteMark(mark.id)} className="tp-danger-btn">Delete Mark</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </TeacherPortalLayout>
  );
}