import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AddStudent from './components/addStudent.jsx';
import AddTestMark from './components/AddMarkForm.jsx';
import './index.css'
import App from './App.jsx'
import './App.css'
import LoginType from './components/LoginType.jsx';
import Login from './components/Login.jsx';
import TeacherLoginPortal from './components/TeacherLoginPortal.jsx';
import StudentMain from './Student/StudentMain.jsx';
import StudentLogin from './components/StudentLogin.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import TeacherRegister from './components/TeacherRegister.jsx';
import Profile from './Student/Profile.jsx';
import Performance from './Student/Performance.jsx';
import AItutor from './Student/AItutor.jsx';
import Notification from './Student/Notification.jsx';
import Test from './Student/Test.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import TeacherDashboard from './teacherPortal/TeacherDashboard.jsx';
import TeacherStudentsPage from './teacherPortal/TeacherStudentsPage.jsx';
import TeacherUpcomingTestsPage from './teacherPortal/TeacherUpcomingTestsPage.jsx';
import TeacherAIInsightsPage from './teacherPortal/TeacherAIInsightsPage.jsx';
import TeacherNotificationsPage from './teacherPortal/TeacherNotificationsPage.jsx';
import TeacherStudentDetailsPage from './teacherPortal/TeacherStudentDetailsPage.jsx';
import TeacherStudentForm from './teacherPortal/TeacherStudentForm.jsx';
import { applyAppSettings, loadAppSettings } from './utils/appSettings.js';
import { RequireTeacherAuth, RequireAdminAuth } from './components/RouteGuards.jsx';

applyAppSettings(loadAppSettings());

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<LoginType />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teacher-login" element={<TeacherLoginPortal />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/teacher-register" element={<TeacherRegister />} />
            <Route path="/admin-dashboard" element={<RequireAdminAuth><AdminDashboard /></RequireAdminAuth>} />
            <Route path="/all-students" element={<RequireAdminAuth><App /></RequireAdminAuth>} />
            <Route path="/all-students/add-student" element={<RequireAdminAuth><AddStudent /></RequireAdminAuth>} />

            <Route path="/student-dashboard/:id" element={<StudentMain />} />

            <Route path="/studentDB" element={<RequireTeacherAuth><App /></RequireTeacherAuth>} />
            <Route path="/add-student" element={<RequireTeacherAuth><AddStudent /></RequireTeacherAuth>} />
            <Route path="/add-test-mark/:id" element={<RequireTeacherAuth><AddTestMark /></RequireTeacherAuth>} />

            {/* Teacher Portal Routes */}
            <Route path="/teacher/dashboard" element={<RequireTeacherAuth><TeacherDashboard /></RequireTeacherAuth>} />
            <Route path="/teacher/students" element={<RequireTeacherAuth><TeacherStudentsPage /></RequireTeacherAuth>} />
            <Route path="/teacher/students/:id" element={<RequireTeacherAuth><TeacherStudentDetailsPage /></RequireTeacherAuth>} />
            <Route path="/teacher/students/form/new" element={<RequireTeacherAuth><TeacherStudentForm /></RequireTeacherAuth>} />
            <Route path="/teacher/students/form/:id" element={<RequireTeacherAuth><TeacherStudentForm /></RequireTeacherAuth>} />
            <Route path="/teacher/tests" element={<RequireTeacherAuth><TeacherUpcomingTestsPage /></RequireTeacherAuth>} />
            <Route path="/teacher/ai" element={<RequireTeacherAuth><TeacherAIInsightsPage /></RequireTeacherAuth>} />
            <Route path="/teacher/alerts" element={<RequireTeacherAuth><TeacherNotificationsPage /></RequireTeacherAuth>} />

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
