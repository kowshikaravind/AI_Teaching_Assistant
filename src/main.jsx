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
import TeacherNotify from './pages/TeacherNotify.jsx';
import StudentMain from './Student/StudentMain.jsx';
import StudentLogin from './components/StudentLogin.jsx';
import Profile from './Student/Profile.jsx';
import Performance from './Student/Performance.jsx';
import AItutor from './Student/AItutor.jsx';
import Notification from './Student/Notification.jsx';
import Test from './Student/Test.jsx';
import UpcommingTest from './pages/UpcommingTest.jsx';
import { applyAppSettings, loadAppSettings } from './utils/appSettings.js';

applyAppSettings(loadAppSettings());

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginType />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin />} />

            <Route path="/student-dashboard/:id" element={<StudentMain />} />

            <Route path="/studentDB" element={<App />} />
            <Route path="/add-student" element={<AddStudent />} />
            <Route path="/student-analysis" element={<StudentAnalysis />} />
            <Route path="/student-analysis/:className" element={<StudentAnalysis />} />
            <Route path="/student-details/:id/:className" element={<StudentDetails />} />
            <Route path="/student-details/:id" element={<StudentDetails />} />
            <Route path="/add-test-mark/:id" element={<AddTestMark />} />
            <Route path="/attendance" element={<AttendanceSheet />} />
            <Route path="/upcomming-test" element={<UpcommingTest />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/teacher-notifications" element={<TeacherNotify />} />
            <Route path="/teacher/alerts" element={<TeacherNotify />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-performance" element={<Performance />} />
            <Route path="/ai-tutor" element={<AItutor />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/student/notifications" element={<Notification />} />
            <Route path="/upcoming-tests" element={<Test />} />
            <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
    </BrowserRouter>
)