import { useEffect, useRef, useState } from 'react';
import TeacherPortalLayout from './TeacherPortalLayout.jsx';
import { buildTeacherApiUrl, getTeacherSessionProfile, withTeacherScope } from '../utils/teacherSession.js';

const suggestions = [
  'Who needs intervention first in this class?',
  'Which subject is weakest for my class?',
  'Which students are improving recently?',
  'Summarise this class in one paragraph.',
];

export default function TeacherAIInsightsPage() { 
  const { assignedClass } = getTeacherSessionProfile();
  const [studentCount, setStudentCount] = useState(0);
  const [messages, setMessages] = useState([{ role: 'model', text: 'hi what can i help u with' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch(buildTeacherApiUrl('students/'));
        const data = res.ok ? await res.json() : [];
        setStudentCount(Array.isArray(data) ? data.length : 0);
      } catch (error) {
        console.error('Failed to load AI class student count:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

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
      const history = nextMessages.slice(0, -1).map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [message.text],
      }));

      const res = await fetch(buildTeacherApiUrl('class-chat/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withTeacherScope({ message: text, history })),
      });
      const data = await res.json();
      setMessages((existing) => [...existing, { role: 'model', text: data.reply || data.error || 'No response received.' }]);
    } catch (error) {
      console.error('Failed to call class AI chat:', error);
      setMessages((existing) => [...existing, { role: 'model', text: 'Something went wrong while loading AI insights.' }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <TeacherPortalLayout title="AI Insights" subtitle={`AI context is now restricted to ${assignedClass || 'your assigned class'} only.`}>
      <div className="roster-container tp-chat-shell">
        <div className="tp-chat-intro">
          <h3 className="tp-chat-title">Class AI Assistant</h3>
          <p className="tp-chat-subtitle">{loading ? 'Loading class data...' : `${studentCount} students loaded from your assigned class.`}</p>
        </div>

        {messages.length === 1 && (
          <div className="tp-suggestion-grid">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} className="tp-suggestion-btn">
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="tp-chat-feed">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`tp-chat-row ${message.role === 'user' ? 'tp-chat-row-user' : 'tp-chat-row-model'}`}
            >
              <div className={`tp-chat-bubble ${message.role === 'user' ? 'tp-chat-bubble-user' : ''}`}>
                {message.text}
              </div>
            </div>
          ))}
          {thinking && <div className="tp-chat-thinking">AI is analysing your class data...</div>}
          <div ref={endRef} />
        </div>

        <div className="tp-chat-input-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            className="search-input tp-chat-input"
            placeholder="Ask about your assigned class..."
          />
          <button className="btn-primary" onClick={() => sendMessage()} disabled={thinking || !input.trim()}>Send</button>
        </div>
      </div>
    </TeacherPortalLayout>
  );
}