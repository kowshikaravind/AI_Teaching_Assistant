import { createRoot } from 'react-dom/client'
import {BrowserRouter , Routes , Route,Navigate} from 'react-router-dom';
import AddStudent from './components/addstudent.jsx';
import StudentAnalysis from './pages/studentAnalysis.jsx';
import StudentDetails from './pages/studentDetails.jsx';
import AddTestMark from './components/AddMarkForm.jsx';
import './index.css'
import App from './App.jsx'
import './App.css'
import  LoginType  from './components/LoginType.jsx';
import Login from './components/Login.jsx';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/student" element={<Navigate to="/studentDB" />} />
            <Route path = "/studentDB" element={<App />} />
            <Route path="/add-student" element={<AddStudent  />} />
            <Route path="/student-analysis" element={<StudentAnalysis />} />
            <Route path="/student-analysis/:className" element={<StudentAnalysis />} />
            <Route path="/student-details/:id/:className" element={<StudentDetails />} />
            <Route path="/add-test-mark/:id" element={<AddTestMark />} />
            <Route path="/" element={<LoginType />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    </BrowserRouter>
)