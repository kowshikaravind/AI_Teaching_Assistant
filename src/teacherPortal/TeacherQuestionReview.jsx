import { useCallback, useEffect, useRef, useState } from 'react';
import { buildTeacherApiUrl } from '../utils/teacherSession.js';
import './TeacherUpcomingTestsPage.css';

const makeEmptyQuestion = (optionCount = 4) => {
  const options = {};
  for (let i = 0; i < optionCount; i++) {
    options[String.fromCharCode(65 + i)] = '';
  }
  return {
    question_text: '',
    options,
    correct_answer: '',
    marks: 1,
    difficulty: 'medium',
    expanded: true,
  };
};

function getTeacherId() {
  const teacherUser = JSON.parse(localStorage.getItem('teacherUser') || '{}');
  return teacherUser?.id || null;
}

async function readApiPayload(response) {
  const raw = await response.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw.slice(0, 200) };
  }
}

export default function TeacherQuestionReview({ test, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [globalOptionCount, setGlobalOptionCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditable, setIsEditable] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const csvInputRef = useRef(null);

  const loadExistingQuestions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const teacherId = getTeacherId();
      if (!teacherId) {
        setError('Teacher session not found. Please login again.');
        return;
      }

      const res = await fetch(
        buildTeacherApiUrl(`upcoming-tests/${test.id}/teacher-questions-review/`, { teacher_id: teacherId })
      );
      const data = await readApiPayload(res);

      if (!res.ok) {
        setError(data.error || 'Failed to load questions');
        return;
      }

      setIsEditable(Boolean(data.is_editable ?? true));
      setIsPublished(Boolean(data.is_published ?? false));
      
      // Enforce global MCQ standardization mapping
      let baselineCount = globalOptionCount;
      const mapped = (data.questions || []).map((q, idx) => {
        const providedOptions = q.options && typeof q.options === 'object' ? q.options : {};
        const keyCount = Object.keys(providedOptions).length;
        if (keyCount > baselineCount) {
            baselineCount = Math.min(keyCount, 10);
        }

        return {
          question_text: q.question_text || '',
          options: providedOptions,
          correct_answer: q.correct_answer || '',
          marks: q.marks || 1,
          difficulty: String(q.difficulty || 'medium').toLowerCase(),
          expanded: idx === 0, // Expand only the first question by default
        };
      });

      if (baselineCount !== globalOptionCount) setGlobalOptionCount(baselineCount);

      // Force-format all loaded questions to match exactly `baselineCount` options
      const standardized = mapped.map(q => {
        const nextOptions = {};
        for (let i = 0; i < baselineCount; i++) {
            const key = String.fromCharCode(65 + i);
            nextOptions[key] = q.options[key] || '';
        }
        return {
          ...q,
          options: nextOptions,
          correct_answer: (nextOptions[q.correct_answer] !== undefined) ? q.correct_answer : '',
          difficulty: ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase())
            ? String(q.difficulty).toLowerCase()
            : 'medium',
        };
      });

      setQuestions(standardized.length ? standardized : [makeEmptyQuestion(baselineCount)]);
    } catch (loadError) {
      console.error('Failed to load questions:', loadError);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [globalOptionCount, test.id]);

  useEffect(() => {
    loadExistingQuestions();
  }, [loadExistingQuestions]);

  const applyGlobalOptionCount = (newCount) => {
    const safeCount = Math.max(2, Math.min(10, Number(newCount)));
    setGlobalOptionCount(safeCount);
    
    setQuestions(prev => prev.map(q => {
      const nextOptions = {};
      for (let i = 0; i < safeCount; i++) {
        const key = String.fromCharCode(65 + i);
        nextOptions[key] = q.options[key] || '';
      }
      return {
        ...q,
        options: nextOptions,
        correct_answer: (nextOptions[q.correct_answer] !== undefined) ? q.correct_answer : ''
      };
    }));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev.map(q => ({ ...q, expanded: false })), 
      makeEmptyQuestion(globalOptionCount)
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const toggleExpand = (index) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, expanded: !q.expanded } : q)));
  };

  const moveQuestion = (index, direction) => {
    setQuestions(prev => {
      const newArr = [...prev];
      if (direction === 'up' && index > 0) {
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      } else if (direction === 'down' && index < newArr.length - 1) {
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
      }
      return newArr;
    });
  };

  const updateOption = (qIndex, optionKey, optionValue) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: {
                ...q.options,
                [optionKey]: optionValue,
              },
            }
          : q
      )
    );
  };

  const currentTotalMarks = questions.length;
  const targetTotalMarks = Number(test.total_marks || 0);
  const marksMatch = currentTotalMarks === targetTotalMarks;

  const validateQuestions = () => {
    if (!marksMatch) {
      return `Total marks mismatch! Questions sum to ${currentTotalMarks}, but Test requires ${targetTotalMarks} marks.`;
    }

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!String(q.question_text || '').trim()) {
        return `Question ${i + 1}: question text is required.`;
      }

      const optionKeys = Object.keys(q.options || {});
      for (const key of optionKeys) {
        if (!String(q.options[key] || '').trim()) {
            return `Question ${i + 1}: option ${key} cannot be empty.`;
        }
      }

      if (!q.correct_answer || !optionKeys.includes(q.correct_answer)) {
        return `Question ${i + 1}: select a valid correct option.`;
      }

      const d = String(q.difficulty || '').toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(d)) {
        return `Question ${i + 1}: difficulty must be easy, medium, or hard.`;
      }
    }

    return '';
  };

  const buildPayload = () => questions.map((q) => ({
    question_text: q.question_text,
    question_type: 'MCQ',
    options: q.options,
    correct_answer: q.correct_answer,
    marks: 1,
    topic: test.subject || test.topic || 'General',
    difficulty: q.difficulty,
  }));

  const handleSaveDraft = async () => {
    setError('');
    setSuccessMessage('');

    if (!isEditable) {
      setError('Draft editing is locked for this test.');
      return;
    }

    const validationError = validateQuestions();
    if (validationError) {
      setError(validationError);
      return;
    }

    const teacherId = getTeacherId();
    if (!teacherId) {
      setError('Teacher session not found. Please login again.');
      return;
    }

    setSavingDraft(true);
    try {
      const res = await fetch(buildTeacherApiUrl(`upcoming-tests/${test.id}/draft-questions/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, questions: buildPayload() }),
      });
      const data = await readApiPayload(res);
      if (!res.ok) {
        setError(data.error || 'Failed to save draft questions.');
        return;
      }
      setSuccessMessage('Draft saved successfully. Students cannot see this yet.');
    } catch (draftError) {
      console.error('Draft save failed:', draftError);
      setError('Server error while saving draft questions.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishQuestions = async () => {
    setError('');
    setSuccessMessage('');

    if (questions.length === 0) {
      setError('Add at least one question before publishing.');
      return;
    }

    if (!isEditable || isPublished) {
      setError('This test is already published. Questions are locked.');
      return;
    }

    const validationError = validateQuestions();
    if (validationError) {
      setError(validationError);
      return;
    }

    const teacherId = getTeacherId();
    if (!teacherId) {
      setError('Teacher session not found. Please login again.');
      return;
    }

    const startTs = test?.start_time ? new Date(test.start_time).getTime() : null;
    if (startTs && startTs < Date.now()) {
      const proceed = window.confirm('Start time has already passed. Publish anyway?');
      if (!proceed) return;
    }

    setPublishing(true);

    try {
      const payload = buildPayload();

      const res = await fetch(buildTeacherApiUrl(`upcoming-tests/${test.id}/publish-questions/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          questions: payload,
        }),
      });

      const data = await readApiPayload(res);
      if (!res.ok) {
        setError(data.error || 'Failed to publish questions.');
        return;
      }

      setSuccessMessage('Questions saved successfully.');
      setIsPublished(true);
      setIsEditable(false);
      setTimeout(() => onClose(), 700);
    } catch (publishError) {
      console.error('Publish failed:', publishError);
      setError('Server error while saving questions.');
    } finally {
      setPublishing(false);
    }
  };

  const handleCsvUpload = async () => {
    setError('');
    setSuccessMessage('');

    if (!isEditable) {
      setError('Question editing is locked for this test.');
      return;
    }

    const teacherId = getTeacherId();
    if (!teacherId) {
      setError('Teacher session not found. Please login again.');
      return;
    }

    if (!csvFile) {
      setError('Please choose a CSV file first.');
      return;
    }

    setUploadingCsv(true);
    try {
      const formData = new FormData();
      formData.append('teacher_id', String(teacherId));
      formData.append('file', csvFile);
      formData.append('publish', 'false');

      const res = await fetch(buildTeacherApiUrl(`upcoming-tests/${test.id}/upload-questions-csv/`), {
        method: 'POST',
        body: formData,
      });
      const data = await readApiPayload(res);

      if (!res.ok) {
        setError(data.error || 'Failed to upload CSV questions.');
        return;
      }

      const rejectedCount = Number(data.rejected_count || 0);
      setSuccessMessage(
        rejectedCount > 0
          ? `CSV imported. Saved ${data.saved || 0} question(s), rejected ${rejectedCount}.`
          : `CSV imported successfully. Saved ${data.saved || 0} question(s).`
      );

      setCsvFile(null);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
      await loadExistingQuestions();
    } catch (uploadError) {
      console.error('CSV upload failed:', uploadError);
      setError('Server error while uploading CSV questions.');
    } finally {
      setUploadingCsv(false);
    }
  };

  return (
    <div className="qr-overlay">
      <div className="qr-modal">
        <div className="qr-header">
          <h2>Strict MCQ Builder</h2>
          <p className="qr-test-name">{test.test_name} ({test.subject || test.topic})</p>
          <button className="qr-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Dynamic Validation & Global Config Bar */}
        <div className={`qr-validation-bar ${marksMatch ? 'valid' : 'invalid'}`}>
            <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                <span title="The required sum of marks for this test">Target Marks: <strong>{targetTotalMarks}</strong></span>
                <span title="Sum of all points allocated manually">Allocated: <strong>{currentTotalMarks}</strong></span>
                {marksMatch ? (
                    <span className="qr-validation-status" style={{color: '#15803d'}}>✅ Perfect Match</span>
                ) : (
                    <span className="qr-validation-status" style={{color: '#dc2626'}}>⚠️ Mismatch</span>
                )}
            </div>
            
            <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '4px 12px', borderRadius: '6px', border: '1px solid #cbd5e1'}}>
                <label style={{fontSize: '13px', fontWeight: 'bold', color: '#475569', margin: 0}}>Global Options/Question:</label>
                <input 
                    type="number" 
                    min="2" 
                    max="10" 
                    value={globalOptionCount}
                    onChange={(e) => applyGlobalOptionCount(e.target.value)}
                    className="qr-input num-input"
                    style={{padding: '4px 8px', width: '60px'}}
                    title="Change this to automatically adjust A/B/C/D option fields across EVERY question instantly"
                />
            </div>
        </div>

        <div className="qr-review-section">
          {loading ? (
            <div className="qr-loading">Loading existing questions...</div>
          ) : (
            <div className="qr-questions-list">
              {questions.map((question, qIndex) => {
                const optionKeys = Object.keys(question.options || {}).sort();
                return (
                  <div key={`q-${qIndex}`} className={`qr-question-item ${question.expanded ? 'expanded' : 'collapsed'}`}>
                    {/* ACCORDION HEADER */}
                    <div className="qr-question-head-row" onClick={() => toggleExpand(qIndex)}>
                      <div className="qr-question-number">
                          <span className="qr-drag-handle">≡</span> 
                          Question {qIndex + 1} 
                          <span className="qr-marks-badge">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="qr-question-preview">
                          {!question.expanded && (
                              <span className="qr-preview-text">
                                  {question.question_text ? (question.question_text.length > 50 ? question.question_text.substring(0, 50) + '...' : question.question_text) : 'Empty question...'}
                              </span>
                          )}
                      </div>
                      <div className="qr-header-actions" onClick={e => e.stopPropagation()}>
                        <button className="qr-arrow-btn" disabled={!isEditable || qIndex === 0} onClick={() => moveQuestion(qIndex, 'up')}>↑</button>
                        <button className="qr-arrow-btn" disabled={!isEditable || qIndex === questions.length - 1} onClick={() => moveQuestion(qIndex, 'down')}>↓</button>
                        <button className="qr-remove-btn" disabled={!isEditable} onClick={() => removeQuestion(qIndex)}>Remove</button>
                      </div>
                    </div>

                    {/* ACCORDION BODY */}
                    {question.expanded && (
                        <div className="qr-question-body">
                            <div className="qr-config-row">
                                <div className="qr-question-section" style={{flex: 1, marginBottom: 0}}>
                                    <label>Question Text</label>
                                    <textarea
                                      value={question.question_text}
                                      disabled={!isEditable}
                                      onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                      rows="2"
                                      className="qr-textarea"
                                      placeholder="Type the question content here..."
                                    />
                                </div>
                                <div className="qr-config-group" style={{maxWidth: '120px'}}>
                                    <label>Difficulty</label>
                                    <select
                                      value={question.difficulty || 'medium'}
                                      disabled={!isEditable}
                                      onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                                      className="qr-select"
                                    >
                                      <option value="easy">easy</option>
                                      <option value="medium">medium</option>
                                      <option value="hard">hard</option>
                                    </select>
                                </div>
                            </div>

                            {/* Strict MCQ Builder */}
                            <div className="qr-mcq-builder">
                                <div className="qr-mcq-header">
                                    <label>MCQ Options (Regulated globally to {globalOptionCount})</label>
                                </div>
                                <div className="qr-options-grid">
                                {optionKeys.map((key) => (
                                    <div key={key} className={`qr-option-item ${question.correct_answer === key ? 'correct-highlight' : ''}`}>
                                    <div className="qr-option-row">
                                        <label className="qr-opt-label" style={{width: '25px'}}>{key}.</label>
                                        <input
                                            type="text"
                                            value={question.options[key] || ''}
                                            disabled={!isEditable}
                                            onChange={(e) => updateOption(qIndex, key, e.target.value)}
                                            className="qr-input"
                                            placeholder={`Type Option ${key} here...`}
                                        />
                                    </div>
                                    </div>
                                ))}
                                </div>

                                <div className="qr-correct-section" style={{marginTop: '15px', background: '#e0e7ff', padding: '12px', borderRadius: '6px', border: '1px solid #c7d2fe'}}>
                                    <label style={{color: '#3730a3', marginBottom: '8px', display: 'block', fontWeight: 'bold'}}>★ Correct Answer</label>
                                    <select
                                        value={question.correct_answer || ''}
                                      disabled={!isEditable}
                                        onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                                        className="qr-select"
                                        style={{maxWidth: '250px', cursor: 'pointer', border: '1px solid #818cf8'}}
                                    >
                                        <option value="">-- Choose Correct Option --</option>
                                        {optionKeys.map((key) => (
                                            <option key={key} value={key}>Option {key}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && <div className="qr-error-message">{error}</div>}
          {successMessage && <div className="qr-success-message">{successMessage}</div>}

          <div className="qr-actions" style={{ justifyContent: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              disabled={!isEditable || uploadingCsv || loading}
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="qr-input"
              style={{ maxWidth: '320px', padding: '8px' }}
            />
            <button
              onClick={handleCsvUpload}
              disabled={!isEditable || uploadingCsv || loading || !csvFile}
              className="qr-btn-secondary"
              title="Upload CSV with columns: question_text, option_a, option_b, option_c, option_d, correct_answer"
            >
              {uploadingCsv ? 'Uploading CSV...' : 'Upload CSV Questions'}
            </button>
          </div>

          <div className="qr-actions">
              <button onClick={addQuestion} disabled={!isEditable} className="qr-btn-secondary">+ Add Question</button>
              <button onClick={handleSaveDraft} disabled={savingDraft || loading || !isEditable} className="qr-btn-secondary">
                {savingDraft ? 'Saving Draft...' : 'Save Draft'}
              </button>
            <button
              onClick={handlePublishQuestions}
                disabled={publishing || loading || questions.length === 0 || !isEditable}
                className={`qr-btn-primary ${questions.length === 0 || !isEditable ? 'disabled' : ''}`}
                title={questions.length === 0 ? 'Add questions before publishing' : (!isEditable ? 'Already published' : '')}
            >
                {publishing ? 'Publishing...' : 'Publish Test'}
            </button>
            <button onClick={onClose} className="qr-btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
