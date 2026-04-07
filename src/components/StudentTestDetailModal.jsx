import { useCallback, useEffect, useState } from 'react';
import { buildStudentApiUrl } from '../utils/studentSession.js';
import { backendUrl } from '../utils/backendUrls.js';
import StudentTestInterface from './StudentTestInterface.jsx';
import './StudentTestDetailModal.css';

export default function StudentTestDetailModal({ test, studentId, onClose, onTestStarted }) {
  const [testDetails, setTestDetails] = useState(null);
  const [showTest, setShowTest] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [serverCanSubmit, setServerCanSubmit] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTestDetails = useCallback(async () => {
    try {
      const res = await fetch(buildStudentApiUrl(`upcoming-tests/${test.id}/details/`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load test details');
      }
      setTestDetails(data);
      const allowed = Boolean(data.student_can_submit);
      setServerCanSubmit(allowed);
      setCanStart(allowed);
      setError('');
    } catch (err) {
      setError('Failed to load test details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [test.id]);

  const checkTiming = useCallback(() => {
    if (testDetails) {
      const now = new Date();
      const startTime = new Date(testDetails.start_time);
      const endTime = new Date(testDetails.end_time);

      setCanStart(serverCanSubmit && now >= startTime && now < endTime);
    }
  }, [serverCanSubmit, testDetails]);

  useEffect(() => {
    loadTestDetails();
  }, [loadTestDetails]);

  useEffect(() => {
    // Check timing every second
    const timer = setInterval(checkTiming, 1000);
    return () => clearInterval(timer);
  }, [checkTiming]);

  const handleStartTest = async () => {
    if (!canStart) {
      setError('Test is not available at this time');
      return;
    }

    const now = new Date();
    const startTime = new Date(testDetails.start_time);
    const endTime = new Date(testDetails.end_time);

    if (now < startTime) {
      setError(`Test starts at ${startTime.toLocaleTimeString()}`);
      return;
    }

    if (now > endTime) {
      setError('Test time has expired');
      return;
    }

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log('Fullscreen blocked:', err));
    }
    
    setShowTest(true);
  };

  if (showTest) {
    return (
      <StudentTestInterface
        test={testDetails || test}
        studentId={studentId}
        onClose={() => {
          setShowTest(false);
          onTestStarted();
          onClose();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-state">Loading test details...</div>
        </div>
      </div>
    );
  }

  const testInfo = testDetails || test;
  const startTime = new Date(testInfo.start_time);
  const endTime = new Date(testInfo.end_time);
  const now = new Date();
  const timeRemaining = Math.max(0, Math.floor((startTime - now) / 1000));
  const materialUrl = testInfo.study_material_url
    ? (String(testInfo.study_material_url).startsWith('http')
      ? testInfo.study_material_url
      : backendUrl(testInfo.study_material_url))
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{testInfo.test_name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Test Info */}
        <div className="modal-body">
          <div className="test-details-grid">
            <div className="detail-card">
              <label>Subject</label>
              <div className="detail-value">{testInfo.subject}</div>
            </div>
            <div className="detail-card">
              <label>Total Marks</label>
              <div className="detail-value">{testInfo.total_marks}</div>
            </div>
            <div className="detail-card">
              <label>Questions</label>
              <div className="detail-value">{testInfo.num_questions}</div>
            </div>
            <div className="detail-card">
              <label>Date</label>
              <div className="detail-value">{new Date(testInfo.test_date).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Time Information */}
          <div className="timing-section">
            <div className="timing-box">
              <label>Start Time</label>
              <div className="timing-value">
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="timing-box">
              <label>End Time</label>
              <div className="timing-value">
                {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="timing-box">
              <label>Duration</label>
              <div className="timing-value">
                {Math.floor((endTime - startTime) / 60000)} minutes
              </div>
            </div>
          </div>

          {/* Status Message */}
          {!canStart && (
            <div className="status-message warning">
              {now < startTime ? (
                <>
                  ⏰ Test will start in <strong>{Math.floor(timeRemaining / 60)} minutes</strong>
                </>
              ) : (
                <>
                  ❌ Test has ended
                </>
              )}
            </div>
          )}

          {canStart && (
            <div className="status-message success">
              ✅ Test is now available - You can start!
            </div>
          )}

          {error && (
            <div className="status-message error">
              {error}
            </div>
          )}

          {/* Study Material Section */}
          {materialUrl && (
            <div className="study-material-section">
              <h3>📄 Study Material</h3>
              <div className="material-info">
                <span>View the study material before starting the test</span>
              </div>
              <a
                href={materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="material-link"
              >
                📖 Open Study Material
              </a>
            </div>
          )}

          {/* Instructions */}
          <div className="instructions-section">
            <h3>📋 Instructions</h3>
            <ul>
              <li>You have <strong>{Math.floor((endTime - startTime) / 60000)} minutes</strong> to complete this test</li>
              <li>Read each question carefully before answering</li>
              <li>Your answers are auto-saved in real time while you attempt the paper</li>
              <li>The test will auto-close at the scheduled end time</li>
              <li>Do not switch tabs repeatedly or the test may auto-submit</li>
              <li>Your score will be calculated automatically after submission</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-start"
            onClick={handleStartTest}
            disabled={!canStart}
            title={!canStart ? 'Test is not available at this time' : 'Start the test'}
          >
            {canStart ? '▶️ Start Test' : '🔒 Test Not Available'}
          </button>
        </div>
      </div>
    </div>
  );
}
