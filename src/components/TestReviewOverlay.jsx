import { useEffect, useMemo, useState } from 'react';
import { buildStudentApiUrl } from '../utils/studentSession.js';
import './StudentTestInterface.css';

export default function TestReviewOverlay({ test, studentId, onClose }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadReview = async () => {
      setLoading(true);
      try {
        const res = await fetch(buildStudentApiUrl(`upcoming-tests/${test.id}/review/`, { student_id: studentId }));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load test review.');
        }
        setReview(data);
      } catch (error) {
        console.error('Failed to load review data', error);
        setReview({ questions: [], error: error.message || 'Failed to load test review.' });
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [studentId, test.id]);

  const questions = useMemo(
    () => (Array.isArray(review?.questions) ? review.questions : []),
    [review]
  );
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (filter === 'incorrect') return question.is_attempted && !question.is_correct;
      if (filter === 'unattempted') return !question.is_attempted;
      return true;
    });
  }, [filter, questions]);

  const correct = Number(review?.correct || 0);
  const incorrect = Number(review?.incorrect || 0);
  const unattempted = Number(review?.unattempted || 0);
  const totalMarks = Number(review?.total_marks || questions.length || 0);
  const score = Number(review?.score || 0);
  const percentage = Number(review?.percentage || 0);
  const totalSeconds = Number(review?.time_taken_seconds || 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remSeconds = totalSeconds % 60;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{test.test_name} Review</h2>
            <p style={styles.subtitle}>
              Subject: {test.subject || test.topic} | Date: {new Date(test.test_date).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>X</button>
        </div>

        {loading ? (
          <div style={styles.loadingWrap}>
            <h3>Loading Review...</h3>
            <p>Preparing your question-wise breakdown.</p>
          </div>
        ) : (
          <div style={styles.body}>
            {review?.error ? (
              <div style={styles.errorBox}>{review.error}</div>
            ) : null}

            <div style={styles.summaryGrid}>
              <SummaryCard title="Score" value={`${score}/${totalMarks}`} sub={`${Math.round(percentage)}% overall`} />
              <SummaryCard title="Accuracy" value={`${Math.round(Number(review?.accuracy || 0))}%`} sub={`${correct} correct answers`} />
              <SummaryCard title="Attempt Rate" value={`${Math.round(Number(review?.attempt_rate || 0))}%`} sub={`${unattempted} left unanswered`} />
              <SummaryCard title="Time Taken" value={`${totalMinutes}m ${remSeconds}s`} sub="Active answering time" />
            </div>

            <div style={styles.badgesRow}>
              <BreakdownBadge label={`Correct: ${correct}`} color="#10b981" bg="rgba(16,185,129,0.12)" />
              <BreakdownBadge label={`Incorrect: ${incorrect}`} color="#ef4444" bg="rgba(239,68,68,0.12)" />
              <BreakdownBadge label={`Not Attempted: ${unattempted}`} color="#cbd5e1" bg="rgba(148,163,184,0.12)" />
            </div>

            <div style={styles.filterRow}>
              <h3 style={styles.sectionTitle}>Question-wise Review</h3>
              <div style={styles.filterGroup}>
                <button onClick={() => setFilter('all')} style={filter === 'all' ? styles.filterActive : styles.filterInactive}>
                  All ({questions.length})
                </button>
                <button onClick={() => setFilter('incorrect')} style={filter === 'incorrect' ? styles.filterActive : styles.filterInactive}>
                  Incorrect ({incorrect})
                </button>
                <button onClick={() => setFilter('unattempted')} style={filter === 'unattempted' ? styles.filterActive : styles.filterInactive}>
                  Unattempted ({unattempted})
                </button>
              </div>
            </div>

            <div style={styles.questionList}>
              {filteredQuestions.length === 0 ? (
                <p style={styles.emptyText}>No questions found for this filter.</p>
              ) : (
                filteredQuestions.map((question) => {
                  const isUnattempted = !question.is_attempted;
                  const borderColor = question.is_correct ? '#10b981' : isUnattempted ? '#94a3b8' : '#ef4444';
                  const statusLabel = question.is_correct ? 'Correct' : isUnattempted ? 'Not Attempted' : 'Incorrect';
                  const optionEntries = question.options && typeof question.options === 'object'
                    ? Object.entries(question.options)
                    : [];

                  return (
                    <div key={question.question_id} style={{ ...styles.questionCard, borderLeftColor: borderColor }}>
                      <div style={styles.questionHead}>
                        <h4 style={styles.questionTitle}>{question.question_text}</h4>
                        <span style={{ ...styles.statusBadge, ...statusStyle(question.is_correct, isUnattempted) }}>
                          {statusLabel}
                        </span>
                      </div>

                      <div style={styles.metaRow}>
                        <span>Topic: {question.topic || 'General'}</span>
                        <span>Difficulty: {question.difficulty || 'Medium'}</span>
                        <span>Time: {question.time_taken_seconds || 0}s</span>
                      </div>

                      {optionEntries.length > 0 ? (
                        <div style={styles.optionList}>
                          {optionEntries.map(([key, value]) => {
                            const isCorrectOption = key === question.correct_answer || value === question.correct_answer;
                            const isSelectedOption = key === question.selected_answer || value === question.selected_answer;

                            return (
                              <div
                                key={key}
                                style={{
                                  ...styles.optionRow,
                                  ...(isCorrectOption ? styles.optionCorrect : {}),
                                  ...(!question.is_correct && isSelectedOption ? styles.optionWrong : {}),
                                }}
                              >
                                <span><strong>{key})</strong> {value}</span>
                                <span>
                                  {isCorrectOption ? 'Correct Answer' : ''}
                                  {!question.is_correct && isSelectedOption ? 'Your Answer' : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={styles.answerBox}>
                          <p><strong>Your Answer:</strong> {isUnattempted ? 'Not answered' : question.selected_answer}</p>
                          <p><strong>Correct Answer:</strong> {question.correct_answer || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, sub }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryTitle}>{title}</div>
      <div style={styles.summaryValue}>{value}</div>
      <div style={styles.summarySub}>{sub}</div>
    </div>
  );
}

function BreakdownBadge({ label, color, bg }) {
  return <div style={{ ...styles.breakdownBadge, color, backgroundColor: bg }}>{label}</div>;
}

function statusStyle(isCorrect, isUnattempted) {
  if (isCorrect) {
    return { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.12)' };
  }
  if (isUnattempted) {
    return { color: '#cbd5e1', backgroundColor: 'rgba(148,163,184,0.12)' };
  }
  return { color: '#f87171', backgroundColor: 'rgba(239,68,68,0.12)' };
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    maxWidth: '960px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #334155',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(15,23,42,0.96)',
  },
  title: { margin: 0, color: '#f8fafc', fontSize: '1.5rem' },
  subtitle: { margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0.5rem',
  },
  loadingWrap: { padding: '3rem', textAlign: 'center', color: '#cbd5e1' },
  body: { padding: '1.75rem' },
  errorBox: {
    marginBottom: '1rem',
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#fecaca',
    padding: '0.9rem 1rem',
    borderRadius: '10px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '1.1rem',
  },
  summaryTitle: { color: '#94a3b8', fontSize: '0.82rem', marginBottom: '0.5rem', textTransform: 'uppercase' },
  summaryValue: { color: '#f8fafc', fontSize: '1.6rem', fontWeight: 700 },
  summarySub: { color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem' },
  badgesRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  breakdownBadge: {
    padding: '0.55rem 1rem',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  filterGroup: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  sectionTitle: { margin: 0, color: '#f8fafc', fontSize: '1.15rem' },
  filterInactive: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  filterActive: {
    background: '#2563eb',
    border: '1px solid #2563eb',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  questionList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  questionCard: {
    backgroundColor: '#1e293b',
    borderRadius: '10px',
    padding: '1.1rem',
    borderLeft: '4px solid #334155',
  },
  questionHead: { display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' },
  questionTitle: { margin: 0, color: '#f8fafc', lineHeight: 1.45, fontSize: '1rem' },
  statusBadge: {
    whiteSpace: 'nowrap',
    borderRadius: '999px',
    padding: '0.35rem 0.8rem',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  metaRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    margin: '0.75rem 0 1rem',
    color: '#94a3b8',
    fontSize: '0.82rem',
  },
  optionList: { display: 'flex', flexDirection: 'column', gap: '0.55rem' },
  optionRow: {
    padding: '0.8rem',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#cbd5e1',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    fontSize: '0.9rem',
  },
  optionCorrect: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    border: '1px solid #10b981',
    color: '#34d399',
  },
  optionWrong: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    border: '1px solid #ef4444',
    color: '#f87171',
  },
  answerBox: {
    padding: '0.9rem',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#cbd5e1',
  },
  emptyText: { color: '#94a3b8', textAlign: 'center', margin: '2rem 0' },
};
