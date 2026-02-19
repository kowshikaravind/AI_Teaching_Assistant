import { createRoot } from 'react-dom/client'
import {BrowserRouter , Routes , Route,Navigate} from 'react-router-dom';
import AddStudent from './components/addstudent.jsx';
import './index.css'
import App from './App.jsx'
import './App.css'
createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Navigate to="/studentDB" />} />
            <Route path = "/studentDB" element={<App />} />
            <Route path="/add-student" element={<AddStudent  />} />
        </Routes>
    </BrowserRouter>
)
