import { useState , useEffect ,useCallback , useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';
import Card from "./components/card";
import AddStudent from "./components/addstudent";

function App() {
  const [students , setStudents] = useState([]);

  const [selectedClass , setSelectedClass] = useState("All");
  const navigate = useNavigate();
  
  const fetchStudents = useCallback(async () => {
    try{
      const res = await fetch("http://127.0.0.1:8000/api/students/");
      const data = await res.json();
      setStudents(data);
    }
    catch(err){
      console.error("Error fetching students:", err);
    }
  },[])
  
  useEffect(() => {
    fetchStudents();
  },[fetchStudents])

  const classStats = useMemo(() => {
    const stats = {};
    students.forEach(student => {
      const className = student.class_name;
      if(!stats[className])
        stats[className] = 0;
      stats[className]++;
    })
    return stats; // Returns object like: { "Class 10": 5, "Class 12": 3 }
  }, [students])

  const className = Object.keys(classStats).sort();

  const displayStudents = selectedClass === "All" ? students : students.filter(student => student.class_name === selectedClass);

  return (
    <div className="app-container">
      <div className="heading">
        <h1>Student Management System</h1>

      </div>
      
      {/* --- CARDS SECTION --- */}
      <Card
        classNames = {className}
        classStats = {classStats}
        totalStudents = {students.length}
        selectedClass = {selectedClass}
        setSelectedClass = {setSelectedClass}
      />
      <div>
        <button className="add-btn" onClick={() => { navigate("/add-student"); }}>
          + Add New Student
        </button>
        <button className="Std-btn" onClick={() => {navigate("/student-analysis");}} >Student Analysis</button>
      </div>
    
      {/* --- TABLE SECTION --- */}
      <div className="table-container">
        <h2>Student List ({selectedClass})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Parent No</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            {displayStudents.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#888" }}>No students found.</td>
              </tr>
            ) : (
              displayStudents.map((student) => (
                <tr key={student.id}>
                  <td><b>{student.roll_number}</b></td>
                  <td>{student.name}</td>
                  <td>{student.parent_number}</td>
                  <td><span style={{background: "#e0e7ff", color: "#4338ca", padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem"}}>{student.class_name}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default App;