import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function StudentAnalysis() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  // 1. FETCH DATA (Now includes the nested test_history array)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/students/");
        const data = await res.json();
        setStudents(data);

        // Auto-select first class
        if (data.length > 0 && !selectedClass) {
          setSelectedClass(data[0].class_name);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchData();
  }, [selectedClass]);

  // 2. GET UNIQUE CLASSES
  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class_name))];
    return classes.sort();
  }, [students]);

  // 3. FILTER STUDENTS
  const displayStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.class_name === selectedClass);
  }, [selectedClass, students]);

  // Helper function to calculate a single student's average from their history
  const getStudentAverage = (history) => {
    if (!history || history.length === 0) return null;
    const totalPercentage = history.reduce((sum, test) => {
      return sum + ((test.marks_obtained / test.total_marks) * 100);
    }, 0);
    return (totalPercentage / history.length).toFixed(1);
  };

  // 4. CALCULATE CLASS AVERAGE
  const classAverage = useMemo(() => {
    if (displayStudents.length === 0) return 0;
    
    let totalClassPercentage = 0;
    let studentsWithMarksCount = 0;

    displayStudents.forEach(student => {
      const studentAvg = getStudentAverage(student.test_history);
      if (studentAvg !== null) {
        totalClassPercentage += parseFloat(studentAvg);
        studentsWithMarksCount++;
      }
    });

    if (studentsWithMarksCount === 0) return 0;
    return (totalClassPercentage / studentsWithMarksCount).toFixed(2);
  }, [displayStudents]);

  // 5. NAVIGATE TO DETAIL
  const handleStudentClick = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  return (
    <div className="app-container">
      
      {/* HEADER */}
      <div style={{ marginBottom: "20px" }}>
        <h2>Class Performance Analysis</h2>
      </div>

      {/* CLASS TABS */}
      <div className="tabs-container">
        {uniqueClasses.map(clsName => (
          <button
            key={clsName}
            onClick={() => setSelectedClass(clsName)}
            className={selectedClass === clsName ? "active-tab-btn" : "tab-btn"}
          >
            {clsName}
          </button>
        ))}
      </div>

      {/* CLASS STATS BOX */}
      {selectedClass && (
        <div className="class-stats-box">
          <div>
            <h3 style={{ margin: 0, color: "#333" }}>{selectedClass} Overview</h3>
            <span style={{ color: "#666", fontSize: "14px" }}>Total Students: {displayStudents.length}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="stat-label">Class Average</span>
            <span className="stat-value">{classAverage}%</span>
          </div>
        </div>
      )}

      {/* STUDENT TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Attendance</th>
              <th>Avg Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayStudents.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>No students found.</td></tr>
            ) : (
              displayStudents.map(student => {
                const studentAvg = getStudentAverage(student.test_history);
                
                return (
                  <tr 
                    key={student.id} 
                    onClick={() => handleStudentClick(student.id)} 
                    className="clickable-row"
                  >
                    <td><b>{student.roll_number}</b></td>
                    <td>{student.name}</td>

                    {/* ATTENDANCE */}
                    <td>
                      <span className={student.attendance_percentage < 75 ? "status-bad" : "status-good"}>
                        {student.attendance_percentage}%
                      </span>
                    </td>

                    {/* MARK */}
                    <td>
                      {studentAvg !== null ? (
                        <span className={studentAvg < 50 ? "status-bad" : ""}>
                          {studentAvg}%
                        </span>
                      ) : (
                        <span style={{ color: "#999" }}>-</span>
                      )}
                    </td>

                    {/* ACTION BUTTON */}
                    <td onClick={(e) => e.stopPropagation()}> 
                      <button className="add-mark-btn">+ Add Mark</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentAnalysis;