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
import AdminLogin from './components/AdminLogin.jsx';
import TeacherRegister from './components/TeacherRegister.jsx';
import Profile from './Student/Profile.jsx';
import Performance from './Student/Performance.jsx';
import AItutor from './Student/AItutor.jsx';
import Notification from './Student/Notification.jsx';
import Test from './Student/Test.jsx';
import UpcommingTest from './pages/UpcommingTest.jsx';
import BulkMarkEntry from './pages/BulkMarkEntry.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { applyAppSettings, loadAppSettings } from './utils/appSettings.js';
import { RequireTeacherAuth, RequireAdminAuth } from './components/RouteGuards.jsx';

applyAppSettings(loadAppSettings());

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginType />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/teacher-register" element={<TeacherRegister />} />
            <Route path="/admin-dashboard" element={<RequireAdminAuth><AdminDashboard /></RequireAdminAuth>} />

            <Route path="/student-dashboard/:id" element={<StudentMain />} />

            <Route path="/studentDB" element={<RequireTeacherAuth><App /></RequireTeacherAuth>} />
            <Route path="/add-student" element={<RequireTeacherAuth><AddStudent /></RequireTeacherAuth>} />
            <Route path="/student-analysis" element={<RequireTeacherAuth><StudentAnalysis /></RequireTeacherAuth>} />
            <Route path="/student-analysis/:className" element={<RequireTeacherAuth><StudentAnalysis /></RequireTeacherAuth>} />
            <Route path="/student-details/:id/:className" element={<RequireTeacherAuth><StudentDetails /></RequireTeacherAuth>} />
            <Route path="/student-details/:id" element={<RequireTeacherAuth><StudentDetails /></RequireTeacherAuth>} />
            <Route path="/add-test-mark/:id" element={<RequireTeacherAuth><AddTestMark /></RequireTeacherAuth>} />
            <Route path="/attendance" element={<RequireTeacherAuth><AttendanceSheet /></RequireTeacherAuth>} />
            <Route path="/upcomming-test" element={<RequireTeacherAuth><UpcommingTest /></RequireTeacherAuth>} />
            <Route path="/bulk-mark-entry/:testId" element={<RequireTeacherAuth><BulkMarkEntry /></RequireTeacherAuth>} />
            <Route path="/ai-insights" element={<RequireTeacherAuth><AIInsights /></RequireTeacherAuth>} />
            <Route path="/teacher-notifications" element={<RequireTeacherAuth><TeacherNotify /></RequireTeacherAuth>} />
            <Route path="/teacher/alerts" element={<RequireTeacherAuth><TeacherNotify /></RequireTeacherAuth>} />
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