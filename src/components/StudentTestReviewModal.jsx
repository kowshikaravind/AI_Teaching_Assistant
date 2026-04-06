import { useEffect, useMemo, useState } from 'react';
import { buildStudentApiUrl } from '../utils/studentSession.js';
import './StudentTestReviewModal.css';

export default function StudentTestReviewModal({ test, studentId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);

  useEffect(() => {
    const loadReview = async () => {
      if (!test?.id || !studentId) {
        setError('Missing test or student context.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(buildStudentApiUrl(`upcoming-tests/${test.id}/review/`));
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load test review.');
        }
        setReview(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load test review.');
      } finally {
        setLoading(false);
      }
    };

    loadReview();
  }, [studentId, test?.id]);

  const summary = useMemo(() => {
    if (!review) return null;
    return {
      score: review.score ?? 0,
      total: review.total_marks ?? 0,
      pct: review.percentage ?? 0,
      correct: review.correct ?? 0,
      incorrect: review.incorrect ?? 0,
      unattempted: review.unattempted ?? 0,
      accuracy: review.accuracy ?? 0,
      attemptRate: review.attempt_rate ?? 0,
    };
  }, [review]);

  return (
    <div className="st-review-modal-overlay" onClick={onClose}>
      <div className="st-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="st-review-modal-header">
          <div>
            <h3>Test Review</h3>
            <p>{test?.test_name || 'Selected Test'}</p>
          </div>
          <button type="button" onClick={onClose} className="st-review-close-btn" aria-label="Close review modal">
            ✕
          </button>
        </div>

        {loading && <p className="st-review-loading">Loading review...</p>}
        {error && !loading && <p className="st-review-error">{error}</p>}

        {!loading && !error && review && (
          <>
            <div className="st-review-summary-grid">
              <div><span>Score</span><strong>{summary.score}/{summary.total}</strong></div>
              <div><span>Percentage</span><strong>{summary.pct}%</strong></div>
              <div><span>Accuracy</span><strong>{summary.accuracy}%</strong></div>
              <div><span>Attempt Rate</span><strong>{summary.attemptRate}%</strong></div>
              <div><span>Correct</span><strong>{summary.correct}</strong></div>
              <div><span>Incorrect</span><strong>{summary.incorrect}</strong></div>
              <div><span>Unattempted</span><strong>{summary.unattempted}</strong></div>
            </div>

            <div className="st-review-question-list">
              {(review.questions || []).map((q) => {
                const attempted = Boolean(q.is_attempted);
                const status = !attempted ? 'unattempted' : (q.is_correct ? 'correct' : 'incorrect');
                return (
                  <article key={q.question_id} className={`st-review-question ${status}`}>
                    <div className="st-review-question-head">
                      <strong>Q{q.question_id}</strong>
                      <span className={`st-review-status ${status}`}>
                        {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Unattempted'}
                      </span>
                    </div>
                    <p className="st-review-question-text">{q.question_text || 'Question text unavailable.'}</p>
                    <div className="st-review-question-meta">
                      <span><b>Topic:</b> {q.topic || 'General'}</span>
                      <span><b>Difficulty:</b> {q.difficulty || 'medium'}</span>
                    </div>
                    <div className="st-review-answers">
                      <span><b>Your answer:</b> {q.selected_answer || 'Not attempted'}</span>
                      <span><b>Correct answer:</b> {q.correct_answer || 'N/A'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
