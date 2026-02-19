import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function StudentDetails() {
  const { id, className } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudent = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/students/${id}/`);
      
      if (res.ok) {
        const foundStudent = await res.json();
        setStudent(foundStudent);
        
        if (foundStudent.test_marks && foundStudent.test_marks.length > 0) {
          const sortedMarks = [...foundStudent.test_marks].sort((a, b) => new Date(b.date_taken) - new Date(a.date_taken));
          
          const formattedHistory = sortedMarks.map(tm => {
            const percentage = Math.round((tm.marks_obtained / tm.total_marks) * 100);
            return {
              id: tm.id,
              test: tm.test_name,
              subject: tm.subject,
              date: tm.date_taken,
              mark: percentage,
              rawObtained: tm.marks_obtained,
              rawTotal: tm.total_marks
            };
          });
          
          setExamHistory(formattedHistory);
        } else {
          setExamHistory([]);
        }
      } else {
        console.error("Failed to fetch student");
      }
    } catch (err) {
      console.error("Error loading student:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMark = async (markId) => {
    if (window.confirm('Are you sure you want to delete this test mark?')) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/testmarks/${markId}/`, {
          method: 'DELETE',
        });

        if (res.ok) {
          setExamHistory(prev => prev.filter(exam => exam.id !== markId));
          alert('Test mark deleted successfully!');
        } else {
          alert('Failed to delete test mark');
        }
      } catch (err) {
        console.error("Error deleting test mark:", err);
        alert('Error deleting test mark');
      }
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const stats = useMemo(() => {
    if (examHistory.length === 0) return { avg: 0, max: 0, min: 0 };
    const marks = examHistory.map(h => h.mark);
    return {
      avg: (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1),
      max: Math.max(...marks),
      min: Math.min(...marks),
    };
  }, [examHistory]);

  if (loading) return <div className="app-container" style={{ textAlign: "center", marginTop: "50px" }}>Loading student details...</div>;
  if (!student) return <div className="app-container" style={{ textAlign: "center", marginTop: "50px", color: "red" }}>Student not found.</div>;

  return (
    <div className="app-container">
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button 
          onClick={() => navigate(`/student-analysis/${className}`)} 
          style={{ padding: "8px 15px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "5px", background: "white", fontWeight: "bold",color:"black" }}
        >
          ← Back to Analysis
        </button>

        <button 
          onClick={() => navigate(`/add-test-mark/${id}`)} 
          style={{ padding: "8px 15px", cursor: "pointer", border: "1px solid #3b82f6", borderRadius: "5px", background: "#3b82f6", color: "white", fontWeight: "bold" }}
        >
          ➕ Add Test Mark
        </button>
      </div>

      <div className="class-stats-box" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 10px 0", color: "#333" }}>{student.name}</h1>
          <div style={{ color: "#666", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <span>🆔 Roll No: <b>{student.roll_number}</b></span>
            <span>📚 Class: <b>{student.class_name}</b></span>
            <span>📞 Parent: <b>{student.parent_number || "N/A"}</b></span>
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: "120px" }}>
            <span className="stat-label">Overall Average</span>
            <span className="stat-value" style={{ color: stats.avg >= 50 ? "#10b981" : "#ef4444" }}>
                {examHistory.length > 0 ? `${stats.avg}%` : "No Data"}
            </span>
        </div>
      </div>

      <div style={{ marginBottom: "30px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, color: "#333" }}>Performance Trend (Last 5 Tests)</h3>
        
        {examHistory.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>No test records available yet.</p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", height: "150px", gap: "15px", borderBottom: "1px solid #ddd", paddingTop: "20px" }}>
              {[...examHistory].slice(0, 5).reverse().map((exam, index) => (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#555" }}>{exam.mark}%</div>
                      <div style={{ 
                          width: "100%", 
                          height: `${Math.max(exam.mark, 10)}%`, 
                          backgroundColor: exam.mark >= 50 ? "#3b82f6" : "#ef4444", 
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.5s ease" 
                      }}></div>
                      <div style={{ fontSize: "12px", marginTop: "5px", color: "#888", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                        {exam.test}
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>

      <div className="table-container">
        <h3 style={{ padding: "20px", margin: 0, backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Exam History</h3>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Test Name</th>
              <th>Date</th>
              <th>Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {examHistory.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#888" }}>No records found.</td></tr>
            ) : (
              examHistory.map((exam, index) => (
                <tr key={index} className="clickable-row">
                  <td>{exam.subject}</td>
                  <td>{exam.test}</td>
                  <td>{exam.date}</td>
                  <td><b>{exam.rawObtained}/{exam.rawTotal}</b> <span style={{color: "#888", fontSize: "12px"}}>({exam.mark}%)</span></td>
                  <td>
                    <span style={{
                      padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                      backgroundColor: exam.mark >= 50 ? "#dcfce7" : "#fee2e2",
                      color: exam.mark >= 50 ? "#166534" : "#dc2626"
                    }}>
                      {exam.mark >= 50 ? "Passed" : "Failed"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteMark(exam.id)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default StudentDetails;