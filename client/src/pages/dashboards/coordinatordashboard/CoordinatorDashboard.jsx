import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DashboardHome from './DashboardHome';
import UploadUsers from './UploadUsers';
import StudentsList from './StudentsList';
import TeachersList from './TeachersList';
import SupervisorsList from './SupervisorsList';
import AssignImmersion from './AssignImmersion';
import DeploymentRequest from './DeploymentRequest';
import SupervisorRequest from '../supervisordashboard/SupervisorRequest';
import StudentRequirementsReview from './StudentRequirementsReview';

const CoordinatorDashboard = ({ onNavigate }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const { user, logoutUser } = useAuth();
  const role = user?.role || 'coordinator';

  const handleLogout = () => {
    logoutUser();
    onNavigate?.('login');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'upload-students':
      case 'upload-teachers':
      case 'upload-supervisors':
        return <UploadUsers onNavigate={setActivePage} role={role} />;
      case 'upload-users':
        return <UploadUsers onNavigate={setActivePage} role={role} />;
      case 'students-list':
        return <StudentsList onNavigate={setActivePage} role={role} />;
      case 'teachers-list':
        return <TeachersList onNavigate={setActivePage} role={role} />;
      case 'supervisors-list':
        return <SupervisorsList onNavigate={setActivePage} role={role} />;
      case 'assign-immersion':
        return <AssignImmersion onNavigate={setActivePage} role={role} />;
      case 'deployment-request':
        if (role === 'supervisor') {
          return <SupervisorRequest onNavigate={setActivePage} role={role} />;
        }
        return <DeploymentRequest onNavigate={setActivePage} role={role} />;
      case 'student-requirements':
        return <StudentRequirementsReview onNavigate={setActivePage} role={role} />;
      default:
        return <DashboardHome onLogout={handleLogout} onNavigate={setActivePage} role={role} />;
    }
  };

  return renderPage();
};

export default CoordinatorDashboard;
