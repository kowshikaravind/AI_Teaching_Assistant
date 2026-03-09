import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

function AddTestMark() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // className is passed via navigate state from StudentDetails
  const className = location.state?.className || '';

  const goBack = () => navigate(`/student-details/${id}/${encodeURIComponent(className)}`);

  const [formData, setFormData] = useState({
    subject: '',
    test_name: '',
    marks_obtained: '',
    total_marks: '',
    date_taken: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/testmarks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: parseInt(id),
          subject: formData.subject,
          test_name: formData.test_name,
          marks_obtained: parseFloat(formData.marks_obtained),
          total_marks: parseFloat(formData.total_marks),
          date_taken: formData.date_taken
        })
      });

      if (res.ok) {
        setSuccess('Test mark added successfully!');
        setTimeout(() => goBack(), 1000);
      } else {
        const errData = await res.json();
        setError(JSON.stringify(errData));
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '500px', margin: '50px auto', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Add Test Mark</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', background: '#fee2e2', borderRadius: '5px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: 'green', marginBottom: '20px', padding: '10px', background: '#dcfce7', borderRadius: '5px' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

        <input
          type="text" name="subject"
          placeholder="Subject (e.g. Math, Science)"
          value={formData.subject} onChange={handleChange} required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />

        <input
          type="text" name="test_name"
          placeholder="Test Name (e.g. Unit Test 1)"
          value={formData.test_name} onChange={handleChange} required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number" name="marks_obtained"
            placeholder="Marks Obtained"
            value={formData.marks_obtained} onChange={handleChange}
            required step="0.1" min="0"
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', flex: 1 }}
          />
          <input
            type="number" name="total_marks"
            placeholder="Total Marks"
            value={formData.total_marks} onChange={handleChange}
            required step="0.1" min="0"
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', flex: 1 }}
          />
        </div>

        <input
          type="date" name="date_taken"
          value={formData.date_taken} onChange={handleChange} required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="button" onClick={goBack}
            style={{ flex: 1, padding: '10px', backgroundColor: '#e5e7eb', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Adding...' : 'Save Mark'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTestMark;