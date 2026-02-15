import { useState } from "react";
import './App.css';

function App() {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [formData, setFormData] = useState({
    studentID: "",
    studentName: "",
    parentNumber: "",
    studentClass: "",
  });

  const handleChange = (e) =>{
    setFormData({
      ...formData,
      [e.target.name] : e.target.value
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    setFormData({
      studentID: "",
      studentName: "",
      parentNumber: "",
      studentClass: "",
    });
    setIsFormVisible(false);
  };

  return(
    <div>
      {!isFormVisible &&(
      <button onClick={() => setIsFormVisible(true)}>
        Add Student
      </button>
      )}
      {isFormVisible &&(
        <div>
          <h3>Enter Student Details</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <input
                type = "text"
                name = "studentID"
                placeholder="Student ID"
                value={formData.studentID}
                onChange={handleChange}
              />
              <input
                type = "text"
                name = "studentName"
                placeholder="Student Name"
                value={formData.studentName}
                onChange={handleChange}
              /><input
                type = "text"
                name = "parentNumber"
                placeholder="Parent Number"
                value={formData.parentNumber}
                onChange={handleChange}
              /><input
                type = "text"
                name = "studentClass"
                placeholder="Student Class"
                value={formData.studentClass}
                onChange={handleChange}
              />
            </div>
            <button>Submit</button>
            <button type="button" onClick={() => setIsFormVisible(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
export default App;