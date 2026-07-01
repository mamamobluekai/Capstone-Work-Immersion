import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import RegisterStudent from './pages/auth/RegisterStudent';
import RegisterTeacher from './pages/auth/RegisterTeacher';
import RegisterCoordinator from './pages/auth/RegisterCoordinator';
import RegisterSupervisor from './pages/auth/RegisterSupervisor';
import SetPassword from './pages/auth/SetPassword';
import AdminDashboard from './pages/dashboards/admindashboard/AdminDashboard';
import CoordinatorDashboard from './pages/dashboards/coordinatordashboard/CoordinatorDashboard';
import TeacherDashboard from './pages/dashboards/teacherdashboard/TeacherDashboard';
import SupervisorDashboard from './pages/dashboards/supervisordashboard/SupervisorDashboard';
import StudentDashboard from './pages/dashboards/studentdashboard/StudentDashboard';
import NotFound from './pages/NotFound';

function App() {
  const getPageFromPath = () => {
    const path = window.location.pathname.replace(/^\/+/, '') || 'login';
    return path === 'register' ? 'register/student' : path;
  };

  const [currentPage, setCurrentPage] = useState(getPageFromPath);

  const navigate = (page) => {
    setCurrentPage(page);
    window.history.pushState(null, '', `/${page}`);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={navigate} />;
      case 'register/student':
        return <RegisterStudent onNavigate={navigate} />;
      case 'register/teacher':
        return <RegisterTeacher onNavigate={navigate} />;
      case 'register/coordinator':
        return <RegisterCoordinator onNavigate={navigate} />;
      case 'register/supervisor':
        return <RegisterSupervisor onNavigate={navigate} />;
      case 'set-password':
        return <SetPassword onNavigate={navigate} />;
      case 'admin/dashboard':
        return <AdminDashboard onNavigate={navigate} />;
      case 'coordinator/dashboard':
        return <CoordinatorDashboard onNavigate={navigate} />;
      case 'teacher/dashboard':
        return <TeacherDashboard onNavigate={navigate} />;
       case 'supervisor/dashboard':
       case 'supervisor/deployment-request':
         return <SupervisorDashboard onNavigate={navigate} />;
      case 'student/dashboard':
        return <StudentDashboard onNavigate={navigate} />;
      default:
        return <NotFound onNavigate={navigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="app">
        {renderPage()}
      </div>
    </AuthProvider>
  );
}

export default App;
