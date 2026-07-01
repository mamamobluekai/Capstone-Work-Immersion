import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import RegisterStudent from '../pages/auth/RegisterStudent';
import RegisterTeacher from '../pages/auth/RegisterTeacher';
import RegisterCoordinator from '../pages/auth/RegisterCoordinator';
import RegisterSupervisor from '../pages/auth/RegisterSupervisor';
import SetPassword from '../pages/auth/SetPassword';
import AdminDashboard from '../pages/dashboards/admindashboard/AdminDashboard';
import CoordinatorDashboard from '../pages/dashboards/coordinatordashboard/CoordinatorDashboard';
import TeacherDashboard from '../pages/dashboards/teacherdashboard/TeacherDashboard';
import SupervisorDashboard from '../pages/dashboards/supervisordashboard/SupervisorDashboard';
import StudentDashboard from '../pages/dashboards/studentdashboard/StudentDashboard';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/register/student" replace />} />
      <Route path="/register/student" element={<RegisterStudent />} />
      <Route path="/register/teacher" element={<RegisterTeacher />} />
      <Route path="/register/coordinator" element={<RegisterCoordinator />} />
      <Route path="/register/supervisor" element={<RegisterSupervisor />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
