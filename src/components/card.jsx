import React from "react";
import '../App.css';

// I changed 'className' prop to 'classNames' to avoid confusion with CSS
function Card({ classNames, classStats, selectedClass, setSelectedClass, totalStudents }) {
  
  return (
    <div className="cards-wrapper">
      
      {/* Static Card: All Classes */}
      <div
        className={`card ${selectedClass === "All" ? "active" : ""}`} 
        onClick={() => setSelectedClass("All")}
      >
        <h2>All Classes</h2>
        <div className="card-stat">Total Students: {totalStudents} </div>
      </div>

      {/* Dynamic Cards */}
      {classNames.map((clsName) => (
        <div
          key={clsName}
          className={`card ${selectedClass === clsName ? "active" : ""}`} 
          onClick={() => setSelectedClass(clsName)}
        >
          <h2>{clsName}</h2>
          <div className="card-stat">Total Students: {classStats[clsName]}</div>
        </div>
      ))}
      
    </div>
  );
}

export default Card;