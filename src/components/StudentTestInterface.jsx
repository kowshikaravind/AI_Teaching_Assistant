import { useCallback, useEffect, useRef, useState } from 'react';
import { buildStudentApiUrl } from '../utils/studentSession.js';
import './StudentTestInterface.css';

export default function StudentTestInterface({ test, studentId, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [result, setResult] = useState(null);
  const [warnings, setWarnings] = useState(0);
  const [error, setError] = useState('');
  const [questionStartAt, setQuestionStartAt] = useState(Date.now());
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});
  const submitLockRef = useRef(false);
  const autoSubmitRef = useRef(false);

  const loadQuestions = useCallback(async () => {
    try {
      const endTime = new Date(test.end_time).getTime();
      const now = new Date().getTime();
      setTimeRemaining(Math.max(0, Math.floor((endTime - now) / 1000)));

      const res = await fetch(buildStudentApiUrl(`upcoming-tests/${test.id}/questions/`));
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load questions');
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load test questions');
    } finally {
      setLoading(false);
    }
  }, [test.end_time, test.id]);

  useEffect(() => {
    loadQuestions();
    const handleContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, [loadQuestions]);

  const handleSubmit = useCallback(async () => {
    if (submitLockRef.current || result) {
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    let submittedOk = false;
    try {
      const responses = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
        time_taken_seconds: Number(questionTimeSpent[q.id] || 0),
        answer_changed: false,
      }));

      const res = await fetch(buildStudentApiUrl(`upcoming-tests/${test.id}/submit/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, responses }),
      });

      const submitText = await res.text();
      let data = {};
      try {
        data = submitText ? JSON.parse(submitText) : {};
      } catch {
        throw new Error('Server returned invalid response while submitting test.');
      }

      if (!res.ok) {
        setError(data.error || 'Failed to submit test');
        return;
      }
      submittedOk = true;
      setResult(data);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      if (!submittedOk) {
        submitLockRef.current = false;
        autoSubmitRef.current = false;
      }
      setSubmitting(false);
    }
  }, [answers, questionTimeSpent, questions, result, studentId, test.id]);

  const handleAutoSubmit = useCallback(async () => {
    if (autoSubmitRef.current || submitLockRef.current || result) {
      return;
    }
    autoSubmitRef.current = true;
    await handleSubmit();
  }, [handleSubmit, result]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !result && !loading && !submitting && !submitLockRef.current) {
        setWarnings((w) => {
          const next = w + 1;
          if (next >= 3) {
            alert('TEST SUBMITTED: You have left the active testing window 3 times.');
            handleAutoSubmit();
          } else {
            alert(`WARNING ${next}/3: Do not switch tabs or minimize the browser during the exam. Your test will be auto-submitted on the 3rd attempt.`);
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleAutoSubmit, loading, result, submitting]);

  useEffect(() => {
    if (!questions.length || timeRemaining === 0 || result || submitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions.length, timeRemaining, result, submitting, handleAutoSubmit]);

  useEffect(() => {
    setQuestionStartAt(Date.now());
  }, [currentQuestionIndex]);


  const saveResponseRealtime = async (questionId, answer, extraMeta = {}) => {
    if (!studentId) return;

    try {
      setSavingAnswer(true);
      const res = await fetch(buildStudentApiUrl(`upcoming-tests/${test.id}/response/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          answer,
          time_taken_seconds: extraMeta.time_taken_seconds || 0,
          answer_changed: !!extraMeta.answer_changed,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Failed to save answer');
        return;
      }

      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Failed to save answer');
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSelectAnswer = (questionId, answer, persist = true) => {
    const previousAnswer = answers[questionId] || '';
    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - questionStartAt) / 1000));
    const accumulated = Number(questionTimeSpent[questionId] || 0) + elapsed;

    setQuestionTimeSpent((prev) => ({ ...prev, [questionId]: accumulated }));
    setQuestionStartAt(now);

    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    if (persist) {
      saveResponseRealtime(questionId, answer, {
        time_taken_seconds: accumulated,
        answer_changed: Boolean(previousAnswer && previousAnswer !== answer),
      });
    }
  };


  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="test-container">
        <div className="loading-screen">
          <p>Loading test questions...</p>
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="test-container">
        <div className="error-screen">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={onClose}>Back to Tests</button>
        </div>
      </div>
    );
  }

  if (result) {
    const scorePct = Number(result.total_marks) > 0
      ? Math.round((Number(result.score || 0) / Number(result.total_marks)) * 100)
      : 0;

    return (
      <div className="test-container">
        <div className="result-screen">
          <div className="result-header">
            {warnings >= 3 && <h2 style={{ color: '#d32f2f' }}>Test Auto-Submitted (Rule Violation)</h2>}
            <h1>Test Complete</h1>
            <p>Your answers have been submitted successfully.</p>
          </div>

          <div className="score-display">
            <div className="score-circle">
              <div className="score-percentage">{scorePct}%</div>
              <div className="score-label">Score</div>
            </div>
            <div className="score-detail">
              <div className="detail-row"><span>Total Score:</span><strong>{result.score}/{result.total_marks}</strong></div>
              <div className="detail-row"><span>Status:</span><strong>{result.status}</strong></div>
              <div className="detail-row"><span>Accuracy:</span><strong>{result.accuracy}%</strong></div>
              <div className="detail-row"><span>Attempt Rate:</span><strong>{result.attempt_rate}%</strong></div>
              <div className="detail-row"><span>Correct / Incorrect / Unattempted:</span><strong>{result.correct} / {result.incorrect} / {result.unattempted}</strong></div>
              <div className="detail-row"><span>Time Taken:</span><strong>{Math.floor((result.time_taken_seconds || 0) / 60)}m {(result.time_taken_seconds || 0) % 60}s</strong></div>
            </div>
          </div>

          <button
            className="btn-close-result"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
          >
            Done - Back to Tests
          </button>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="test-container">
        <div className="error-screen">
          <h2>No Questions</h2>
          <p>This test does not have any questions yet.</p>
          <button className="btn-back" onClick={onClose}>Back to Tests</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeColor = timeRemaining > 300 ? '#4caf50' : timeRemaining > 60 ? '#ff9800' : '#f44336';

  return (
    <div className="test-container">
      <div className="test-header">
        <div className="header-left">
          <h2>{test.test_name}</h2>
          <span className="question-counter">Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>

        <div className="header-right">
          {warnings > 0 && <div className="anti-cheat-warning">Warnings: {warnings}/3</div>}
          <div className="timer" style={{ color: timeColor }}>Time Left: {formatTimeRemaining(timeRemaining)}</div>
          <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Test'}</button>
          {savingAnswer && <div className="live-score-chip">Saving answer...</div>}
        </div>
      </div>

      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>

      <div className="test-content">
        <div className="question-section">
          <div className="question-header">
            <h3>{currentQuestion.question_text}</h3>
            {currentQuestion.marks && <span className="marks-badge">{currentQuestion.marks} marks</span>}
          </div>

          {currentQuestion.question_type === 'MCQ' && currentQuestion.options && (
            <div className="options-grid">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  className={`option-btn ${answers[currentQuestion.id] === key ? 'selected' : ''}`}
                  onClick={() => handleSelectAnswer(currentQuestion.id, key, true)}
                >
                  <span className="option-key">{key}</span>
                  <span className="option-text">{value}</span>
                  {answers[currentQuestion.id] === key && <span className="checkmark">OK</span>}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'TRUE_FALSE' && (
            <div className="options-grid">
              {['True', 'False'].map((value) => (
                <button
                  key={value}
                  className={`option-btn ${answers[currentQuestion.id] === value ? 'selected' : ''}`}
                  onClick={() => handleSelectAnswer(currentQuestion.id, value, true)}
                >
                  <span className="option-text">{value}</span>
                  {answers[currentQuestion.id] === value && <span className="checkmark">OK</span>}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'SHORT_ANSWER' && (
            <div className="short-answer-box">
              <textarea
                className="short-answer-input"
                rows="4"
                placeholder="Type your answer here"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value, false)}
                onBlur={(e) => handleSelectAnswer(currentQuestion.id, e.target.value, true)}
              />
            </div>
          )}
        </div>

        <div className="question-navigator">
          <h4>Questions</h4>
          <div className="question-buttons">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`q-btn ${idx === currentQuestionIndex ? 'current' : answers[q.id] ? 'answered' : 'unanswered'}`}
                onClick={() => setCurrentQuestionIndex(idx)}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="test-footer">
        <button className="nav-btn" onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0}>
          Previous
        </button>

        <div className="answered-counter">Answered: {Object.values(answers).filter((v) => String(v || '').trim()).length}/{questions.length}</div>

        <button
          className="nav-btn"
          onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
