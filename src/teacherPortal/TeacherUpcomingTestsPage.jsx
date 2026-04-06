import { useEffect, useMemo, useRef, useState } from 'react';
import TeacherPortalLayout from './TeacherPortalLayout.jsx';
import SubjectSelectorWithManager from '../components/SubjectSelectorWithManager.jsx';
import TeacherQuestionReview from './TeacherQuestionReview.jsx';
import { buildTeacherApiUrl, getTeacherSessionProfile } from '../utils/teacherSession.js';
import './TeacherUpcomingTestsPage.css';

export default function TeacherUpcomingTestsPage() {
  const { assignedClass, teacherId } = getTeacherSessionProfile();
  const [tests, setTests] = useState([]);
  const [formData, setFormData] = useState({ 
    test_name: '', 
    subject: '', 
    test_date: '', 
    start_time: '',
    end_time: '',
    num_questions: ''
  });
  const [studyMaterial, setStudyMaterial] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reviewingTest, setReviewingTest] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [publishingTestId, setPublishingTestId] = useState(null);
  const studyMaterialInputRef = useRef(null);

  const selectedTest = tests.find((t) => t.id === selectedTestId) || null;

  const formatDateTimeForApi = (dateValue, timeValue) => {
    const [year, month, day] = String(dateValue || '').split('-').map(Number);
    const [hours, minutes] = String(timeValue || '').split(':').map(Number);
    const localDate = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);
    const offsetMinutes = -localDate.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const offsetPartMinutes = String(absMinutes % 60).padStart(2, '0');

    return `${dateValue}T${String(hours || 0).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00${sign}${offsetHours}:${offsetPartMinutes}`;
  };

  const schedulePreview = useMemo(() => {
    if (!formData.test_date || !formData.start_time || !formData.end_time) {
      return { isReady: false, isValid: false, message: 'Choose a date, start time, and end time to preview this test window.' };
    }

    const start = new Date(`${formData.test_date}T${formData.start_time}:00`);
    const end = new Date(`${formData.test_date}T${formData.end_time}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { isReady: true, isValid: false, message: 'Enter a valid date and time range.' };
    }

    if (end <= start) {
      return { isReady: true, isValid: false, message: 'End time must be later than start time.' };
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return {
      isReady: true,
      isValid: true,
      durationMinutes,
      message: `Students will see this test for ${durationMinutes} minutes, from ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    };
  }, [formData.test_date, formData.start_time, formData.end_time]);

  const canSchedule = Boolean(
    studyMaterial &&
    formData.test_name.trim() &&
    formData.subject.trim() &&
    formData.num_questions &&
    Number(formData.num_questions) > 0 &&
    schedulePreview.isValid
  );

  const getWorkflowStatus = (test) => {
    const value = String(test.workflow_status || '').trim();
    if (value) return value;

    if (test.status === 'finished') return 'Completed';
    if (test.status === 'active') return 'Active';
    if (test.questions_generated) return 'Published';
    return 'Draft';
  };

  const statusStyle = (status) => {
    if (status === 'Completed') return { backgroundColor: '#e74c3c', color: '#fff' };
    if (status === 'Active') return { backgroundColor: '#27ae60', color: '#fff' };
    if (status === 'Published') return { backgroundColor: '#2563eb', color: '#fff' };
    return { backgroundColor: '#95a5a6', color: '#fff' };
  };

  const loadTests = async () => {
    try {
      setLoadingTests(true);
      const res = await fetch(buildTeacherApiUrl('upcoming-tests/'));
      const data = res.ok ? await res.json() : [];
      setTests(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error('Failed to load tests:', loadError);
      setTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    if (!studyMaterial) {
      setError('Study material is mandatory. Please upload a file.');
      setSaving(false);
      return;
    }

    if (!formData.num_questions || Number(formData.num_questions) <= 0) {
      setError('Number of questions is mandatory for MCQ tests.');
      setSaving(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append('test_name', formData.test_name);
      payload.append('subject', formData.subject);
      payload.append('topic', formData.subject);
      payload.append('test_date', formData.test_date);
      payload.append('start_time', formatDateTimeForApi(formData.test_date, formData.start_time));
      payload.append('end_time', formatDateTimeForApi(formData.test_date, formData.end_time));
      payload.append('total_marks', String(Number(formData.num_questions)));
      payload.append('class_name', assignedClass || '');
      payload.append('study_material', studyMaterial);
      payload.append('num_questions', String(Number(formData.num_questions)));
      if (teacherId) {
        payload.append('teacher_id', String(teacherId));
      }

      const res = await fetch(buildTeacherApiUrl('upcoming-tests/'), {
        method: 'POST',
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || 'Failed to schedule test.');
        return;
      }

      setSuccessMessage(`Test "${data.test_name}" scheduled successfully! Test ID: ${data.id}`);
      setFormData({ test_name: '', subject: '', test_date: '', start_time: '', end_time: '', num_questions: '' });
      setStudyMaterial(null);
      if (studyMaterialInputRef.current) {
        studyMaterialInputRef.current.value = '';
      }
      
      await loadTests();
    } catch (saveError) {
      console.error('Failed to schedule test:', saveError);
      setError('Server error while scheduling test.');
    } finally {
      setSaving(false);
    }
  };

  const handleManageQuestions = async (testId) => {
    setReviewingTest(tests.find(t => t.id === testId));
  };

  const handlePublishTest = async (test) => {
    setError('');
    setSuccessMessage('');

    const workflow = getWorkflowStatus(test);
    if (workflow === 'Published' || workflow === 'Active' || workflow === 'Completed') {
      setError('This test is already published or no longer editable.');
      return;
    }

    const sourceQuestions = Array.isArray(test.question_bank) ? test.question_bank : [];
    if (sourceQuestions.length === 0) {
      setError('Add questions first from Manage Questions before publishing.');
      return;
    }

    const startTs = test?.start_time ? new Date(test.start_time).getTime() : null;
    if (startTs && startTs < Date.now()) {
      const proceed = window.confirm('Start time has already passed. Publish anyway?');
      if (!proceed) return;
    }

    setPublishingTestId(test.id);
    try {
      const payload = sourceQuestions.map((q) => ({
        question_text: q.question_text,
        question_type: 'MCQ',
        options: q.options,
        correct_answer: q.correct_answer,
        marks: 1,
        topic: q.topic,
        difficulty: q.difficulty,
      }));

      const res = await fetch(buildTeacherApiUrl(`upcoming-tests/${test.id}/publish-questions/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          questions: payload,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to publish test.');
        return;
      }

      setSuccessMessage('Test published successfully.');
      await loadTests();
    } catch (publishError) {
      console.error('Failed to publish test:', publishError);
      setError('Server error while publishing test.');
    } finally {
      setPublishingTestId(null);
    }
  };

  const handleDelete = async (test) => {
    const confirmed = window.confirm(`Delete ${test.test_name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      const res = await fetch(buildTeacherApiUrl(`upcoming-tests/${test.id}/`), { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage(`Deleted test "${test.test_name}".`);
        loadTests();
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Could not delete test.');
      }
    } catch (deleteError) {
      console.error('Failed to delete test:', deleteError);
      setError('Server error while deleting test.');
    }
  };

  return (
    <TeacherPortalLayout title="Upcoming Tests" subtitle={`Class name selection is removed. Every test here belongs to ${assignedClass || 'your assigned class'}.`}>
      <div className="roster-container tp-tests-panel">
        <div className="roster-header"><h3>Schedule Test For {assignedClass || 'Assigned Class'}</h3></div>
        <form onSubmit={handleSubmit} className="tp-tests-form">
          <div className="form-grid-2">
            <div className="input-group">
              <label>Class</label>
              <input value={assignedClass} readOnly />
            </div>
            <div className="input-group">
              <label>Test Name *</label>
              <input 
                name="test_name" 
                value={formData.test_name} 
                onChange={(event) => setFormData((current) => ({ ...current, test_name: event.target.value }))} 
                required 
              />
            </div>
          </div>

          <SubjectSelectorWithManager 
            value={formData.subject} 
            onChange={(subject) => setFormData((current) => ({ ...current, subject }))} 
            required 
            selectPlaceholder="Select Subject" 
          />

          <div className="form-grid-2">
            <div className="input-group">
              <label>Test Date *</label>
              <input 
                type="date" 
                value={formData.test_date} 
                onChange={(event) => setFormData((current) => ({ ...current, test_date: event.target.value }))} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Total Marks (Auto)</label>
              <input 
                type="number" 
                min="1" 
                value={formData.num_questions ? String(Number(formData.num_questions)) : ''}
                readOnly
                placeholder="Equals number of questions"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Start Time *</label>
              <input 
                type="time" 
                value={formData.start_time} 
                onChange={(event) => setFormData((current) => ({ ...current, start_time: event.target.value }))} 
                required 
              />
            </div>
            <div className="input-group">
              <label>End Time *</label>
              <input 
                type="time" 
                value={formData.end_time} 
                onChange={(event) => setFormData((current) => ({ ...current, end_time: event.target.value }))} 
                required 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Number of Questions</label>
              <input 
                type="number" 
                min="1" 
                max="200"
                value={formData.num_questions} 
                placeholder="Enter number of questions"
                onChange={(event) => setFormData((current) => ({ ...current, num_questions: event.target.value }))}
              />
            </div>
            <div className="input-group">
              <label>Upload Study Material (Mandatory) *</label>
              <input 
                ref={studyMaterialInputRef}
                type="file" 
                accept=".pdf,.txt,.docx"
                required
                onChange={(event) => setStudyMaterial(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="btn-primary tp-secondary-action"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setStudyMaterial(null);
                  if (studyMaterialInputRef.current) {
                    studyMaterialInputRef.current.value = '';
                  }
                }}
              >
                Refresh File
              </button>
            </div>
          </div>

          <div className={`tp-schedule-preview ${schedulePreview.isReady ? (schedulePreview.isValid ? 'is-valid' : 'is-invalid') : ''}`}>
            <strong>Schedule Preview</strong>
            <span>{schedulePreview.message}</span>
          </div>

          {error && <p className="tp-form-error" style={{color: '#e74c3c'}}>{error}</p>}
          {successMessage && <p className="tp-form-success" style={{color: '#27ae60'}}>{successMessage}</p>}
          
          <div className="tp-form-actions">
            <button 
              type="submit"
              className="btn-primary" 
              disabled={saving || !canSchedule}
            >
              {saving ? 'Scheduling...' : 'Schedule Test'}
            </button>
            <button
              type="button"
              className="btn-primary tp-secondary-action"
              onClick={loadTests}
              disabled={loadingTests}
            >
              {loadingTests ? 'Refreshing...' : 'Refresh Tests'}
            </button>
          </div>
        </form>
      </div>

      <div className="roster-container">
        <div className="roster-header"><h3>Tests For Your Class</h3></div>
        {loadingTests ? (
          <div className="tp-table-feedback">Loading scheduled tests...</div>
        ) : (
        <table className="roster-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Questions</th>
              <th>Total Marks</th>
              <th>Status</th>
              <th className="tp-align-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr><td colSpan="7" className="tp-empty-centered">No tests scheduled for this class.</td></tr>
            ) : tests.map((test) => {
              const workflow = getWorkflowStatus(test);
              return (
              <tr
                key={test.id}
                onClick={() => setSelectedTestId(test.id)}
                className={`tp-test-row ${selectedTestId === test.id ? 'is-selected' : ''}`}
              >
                <td>{test.test_name}</td>
                <td>{test.subject || test.topic}</td>
                <td>{test.test_date}</td>
                <td>{test.num_questions || '-'}</td>
                <td>{test.total_marks}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    ...statusStyle(workflow),
                  }}>
                    {workflow}
                  </span>
                </td>
                <td className="tp-tests-actions-cell">
                  <div className="tp-tests-actions-wrap">
                    {workflow === 'Draft' && (
                      <button 
                        type="button" 
                        onClick={(event) => {
                          event.stopPropagation();
                          handleManageQuestions(test.id);
                        }} 
                        className="btn-primary"
                        style={{fontSize: '12px', padding: '6px 10px'}}
                        title="Add or edit questions manually"
                      >
                        📝 Manage Q
                      </button>
                    )}
                    {workflow === 'Draft' && (
                      <button 
                        type="button" 
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePublishTest(test);
                        }} 
                        className="btn-primary"
                        disabled={publishingTestId === test.id}
                        style={{fontSize: '12px', padding: '6px 10px'}}
                        title="Publish the draft test"
                      >
                        {publishingTestId === test.id ? 'Publishing...' : 'Publish'}
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(test);
                      }} 
                      className="tp-danger-btn"
                      style={{fontSize: '12px', padding: '6px 10px'}}
                      title="Delete this test from database"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        )}
      </div>

      {selectedTest && (
        <div className="roster-container tp-test-details-panel">
          <div className="roster-header"><h3>Test Details</h3></div>
          <div className="tp-test-details-grid">
            <div className="tp-test-detail-item"><strong>Name:</strong> {selectedTest.test_name}</div>
            <div className="tp-test-detail-item"><strong>Subject:</strong> {selectedTest.subject || selectedTest.topic || '-'}</div>
            <div className="tp-test-detail-item"><strong>Date:</strong> {selectedTest.test_date}</div>
            <div className="tp-test-detail-item"><strong>Time:</strong> {selectedTest.start_time ? new Date(selectedTest.start_time).toLocaleTimeString() : '-'} - {selectedTest.end_time ? new Date(selectedTest.end_time).toLocaleTimeString() : '-'}</div>
            <div className="tp-test-detail-item"><strong>Questions:</strong> {selectedTest.num_questions || 0}</div>
            <div className="tp-test-detail-item"><strong>Total Marks:</strong> {selectedTest.total_marks || 0}</div>
            <div className="tp-test-detail-item"><strong>Status:</strong> {getWorkflowStatus(selectedTest)}</div>
            <div className="tp-test-detail-actions">
              {getWorkflowStatus(selectedTest) === 'Draft' && (
                <button type="button" className="btn-primary" onClick={() => handleManageQuestions(selectedTest.id)}>
                  Manage Questions
                </button>
              )}
              {getWorkflowStatus(selectedTest) === 'Draft' && (
                <button type="button" className="btn-primary" onClick={() => handlePublishTest(selectedTest)} disabled={publishingTestId === selectedTest.id}>
                  {publishingTestId === selectedTest.id ? 'Publishing...' : 'Publish Test'}
                </button>
              )}
              <button
                type="button"
                className="tp-danger-btn"
                onClick={() => handleDelete(selectedTest)}
                title="Delete this test from database"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewingTest && (
        <TeacherQuestionReview 
          test={reviewingTest} 
          onClose={() => {
            setReviewingTest(null);
            loadTests();
          }}
        />
      )}
    </TeacherPortalLayout>
  );
}
