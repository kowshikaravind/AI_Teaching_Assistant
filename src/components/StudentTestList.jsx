import { useCallback, useEffect, useState } from 'react';
import { buildStudentApiUrl } from '../utils/studentSession.js';
import StudentTestDetailModal from './StudentTestDetailModal.jsx';
import './StudentTestList.css';

export default function StudentTestList({ studentId }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTests = useCallback(async () => {
    if (!studentId) {
      setTests([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(buildStudentApiUrl(`upcoming-tests/?student_id=${studentId}`));
      const data = res.ok ? await res.json() : [];
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadTests();
    // Auto-refresh every 30 seconds to check for new tests
    const interval = setInterval(loadTests, 30000);
    return () => clearInterval(interval);
  }, [loadTests]);

  const getTestStatus = (test) => {
    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = new Date(test.end_time);

    if (now < startTime) return 'Scheduled';
    if (now >= startTime && now <= endTime) return 'Active';
    return 'Finished';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#27ae60';
      case 'Scheduled': return '#3498db';
      case 'Finished': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <>
      <div className="student-test-list">
        <div className="list-header">
          <h2>📚 Available Tests</h2>
          <span className="test-count">{tests.length} tests</span>
        </div>

        {loading && <div className="loading">Loading tests...</div>}

        {tests.length === 0 && !loading && (
          <div className="empty-state">
            <p>No tests assigned yet. Check back soon!</p>
          </div>
        )}

        <div className="tests-grid">
          {tests.map((test) => {
            const status = getTestStatus(test);
            
            return (
              <button
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className="test-card"
                style={{
                  borderLeftColor: getStatusColor(status),
                }}
              >
                <div className="test-header">
                  <h3 className="test-name">{test.test_name}</h3>
                  <span
                    className="test-status"
                    style={{ backgroundColor: getStatusColor(status) }}
                  >
                    {status}
                  </span>
                </div>

                <div className="test-info">
                  <div className="info-row">
                    <span className="label">📖 Subject:</span>
                    <span className="value">{test.subject || test.topic}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">⭐ Total Marks:</span>
                    <span className="value">{test.total_marks}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">❓ Questions:</span>
                    <span className="value">{test.num_questions}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">📅 Date:</span>
                    <span className="value">{new Date(test.test_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="test-timing">
                  <div className="timing-item">
                    <span className="timing-label">Start:</span>
                    <span className="timing-value">
                      {new Date(test.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="timing-item">
                    <span className="timing-label">End:</span>
                    <span className="timing-value">
                      {new Date(test.end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="test-action">
                  <span className="action-text">
                    {status === 'Active' ? '▶️ Start Test' : 'View Details'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTest && (
        <StudentTestDetailModal
          test={selectedTest}
          studentId={studentId}
          onClose={() => setSelectedTest(null)}
          onTestStarted={() => {
            setSelectedTest(null);
            loadTests();
          }}
        />
      )}
    </>
  );
}
