import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../App.css';

function StudentAnalysis() {
  const navigate = useNavigate();
  const { className: classNameParam } = useParams();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/students/");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (classNameParam) {
      setSelectedClass(classNameParam);
    } else if (students.length > 0) {
      setSelectedClass(students[0].class_name);
    }
  }, [classNameParam, students]);

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class_name))];
    return classes.sort();
  }, [students]);

  const displayStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.class_name === selectedClass);
  }, [selectedClass, students]);

  const getStudentAverage = (testMarksArray) => {
    if (!testMarksArray || testMarksArray.length === 0) return null;
    
    let totalObtained = 0;
    let totalMax = 0;
    
    testMarksArray.forEach(test => {
      totalObtained += Number(test.marks_obtained);
      totalMax += Number(test.total_marks);
    });

    if (totalMax === 0) return 0;
    
    return ((totalObtained / totalMax) * 100).toFixed(1);
  };

  const classAverage = useMemo(() => {
    if (displayStudents.length === 0) return 0;
    
    let totalClassPercentage = 0;
    let studentsWithMarksCount = 0;

    displayStudents.forEach(student => {
      const studentAvg = getStudentAverage(student.test_marks);
      if (studentAvg !== null) {
        totalClassPercentage += Number(studentAvg);
        studentsWithMarksCount++;
      }
    });

    if (studentsWithMarksCount === 0) return 0;
    return (totalClassPercentage / studentsWithMarksCount).toFixed(2);
  }, [displayStudents]);

  const handleStudentClick = (studentId) => {
    navigate(`/student-details/${studentId}/${selectedClass}`);
  };

  return (
    <div className="app-container">
      
      <div style={{ marginBottom: "20px" }}>
        <h2>Class Performance Analysis</h2>
      </div>

      <div className="tabs-container">
        {uniqueClasses.map(clsName => (
          <button
            key={clsName}
            onClick={() => {
              setSelectedClass(clsName);
              navigate(`/student-analysis/${clsName}`);
            }}
            className={selectedClass === clsName ? "active-tab-btn" : "tab-btn"}
          >
            {clsName}
          </button>
        ))}
      </div>

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
                const studentAvg = getStudentAverage(student.test_marks); 
                
                return (
                  <tr 
                    key={student.id} 
                    onClick={() => handleStudentClick(student.id)} 
                    className="clickable-row"
                    style={{ cursor: "pointer" }}
                  >
                    <td><b>{student.roll_number}</b></td>
                    <td>{student.name}</td>
                    <td>
                      <span className="status-good">N/A</span>
                    </td>
                    <td>
                      {studentAvg !== null ? (
                        <span className={studentAvg < 50 ? "status-bad" : "status-good"} style={{ fontWeight: "bold" }}>
                          {studentAvg}%
                        </span>
                      ) : (
                        <span style={{ color: "#999" }}>-</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="add-mark-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/add-test-mark/${student.id}`);
                        }}
                      >
                        + Add Mark
                      </button>
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