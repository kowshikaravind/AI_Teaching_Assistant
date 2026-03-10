import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AddStudent from './components/addstudent.jsx';
import StudentAnalysis from './pages/StudentAnalysis.jsx';
import StudentDetails from './pages/StudentDetails.jsx';
import AddTestMark from './components/AddMarkForm.jsx';
import './index.css'
import App from './App.jsx'
import './App.css'
import LoginType from './components/LoginType.jsx';
import Login from './components/Login.jsx';
import AttendanceSheet from './pages/AttendanceSheet.jsx';
import AIInsights from './pages/AIinsights.jsx';
import StudentMain from './Student/StudentMain.jsx';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginType />} />
            <Route path="/login" element={<Login />} />

            <Route path="/student-dashboard" element={<StudentMain />} />

            <Route path="/studentDB" element={<App />} />
            <Route path="/add-student" element={<AddStudent />} />
            <Route path="/student-analysis" element={<StudentAnalysis />} />
            <Route path="/student-analysis/:className" element={<StudentAnalysis />} />
            <Route path="/student-details/:id/:className" element={<StudentDetails />} />
            <Route path="/student-details/:id" element={<StudentDetails />} />
            <Route path="/add-test-mark/:id" element={<AddTestMark />} />
            <Route path="/attendance" element={<AttendanceSheet />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
)