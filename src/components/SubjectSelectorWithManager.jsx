import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/backendUrls.js';

function SubjectSelectorWithManager({
  value = '',
  onChange,
  required = false,
  mode = 'select-with-manage',
  triggerText = '📚 Manage Subjects',
  selectPlaceholder = 'Select Subject',
  selectStyle,
  triggerStyle,
  wrapperStyle,
}) {
  const [subjects, setSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [subjectError, setSubjectError] = useState('');

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/subjects/'));
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      fetchSubjects();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [fetchSubjects]);

  const sortedSubjects = useMemo(
    () => [...subjects].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [subjects]
  );

  const handleAddSubject = async () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      setSubjectError('Subject name cannot be empty.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/subjects/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        setSubjectError('Subject already exists.');
        return;
      }

      setNewSubjectInput('');
      setSubjectError('');
      await fetchSubjects();

      if (mode !== 'manage-only' && !value && onChange) {
        onChange(trimmed);
      }
    } catch (err) {
      console.error('Failed to add subject:', err);
      setSubjectError('Failed to add subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await fetch(apiUrl(`/subjects/${id}/`), { method: 'DELETE' });
      await fetchSubjects();
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const closeModal = () => {
    setShowSubjectModal(false);
    setNewSubjectInput('');
    setSubjectError('');
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, ...wrapperStyle }}>
        {mode !== 'manage-only' && (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            required={required}
            style={{
              flex: 1,
              padding: 10,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              ...selectStyle,
            }}
          >
            <option value="">{selectPlaceholder}</option>
            {sortedSubjects.map((subject) => (
              <option key={subject.id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setShowSubjectModal(true)}
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            ...triggerStyle,
          }}
        >
          {triggerText}
        </button>
      </div>

      {showSubjectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>📚 Manage Subjects</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Subjects added here appear in the dropdown for all screens.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics..."
                value={newSubjectInput}
                onChange={(e) => {
                  setNewSubjectInput(e.target.value);
                  setSubjectError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddSubject}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>

            {subjectError && (
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#ef4444' }}>{subjectError}</p>
            )}

            <div
              style={{
                maxHeight: 260,
                overflowY: 'auto',
                border: '1px solid #f1f5f9',
                borderRadius: 10,
                marginTop: 12,
              }}
            >
              {sortedSubjects.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No subjects yet. Add one above.
                </p>
              ) : (
                sortedSubjects.map((subject, i) => (
                  <div
                    key={subject.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: i < sortedSubjects.length - 1 ? '1px solid #f8fafc' : 'none',
                      background: i % 2 === 0 ? '#fafafa' : 'white',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{subject.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={closeModal}
              style={{
                width: '100%',
                marginTop: 18,
                padding: '11px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SubjectSelectorWithManager;
