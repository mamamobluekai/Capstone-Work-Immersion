import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/common/Sidebar.jsx';
import StudentRequirements from './StudentRequirements.jsx';
import StudentSettings from './StudentSettings.jsx';
import './StudentDashboard.css';

const StudentDashboard = ({ onNavigate }) => {
  const [activePage, setActivePage] = useState('requirements');
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    onNavigate?.('login');
  };

  if (activePage === 'requirements') {
    return <StudentRequirements onNavigate={setActivePage} onLogout={handleLogout} role="student" />;
  }

  if (activePage === 'settings') {
    return <StudentSettings onNavigate={setActivePage} onLogout={handleLogout} role="student" />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeItem="dashboard" onNavigate={setActivePage} onLogout={handleLogout} role="student" />
      <div className="dashboard-container" style={{ marginLeft: 0 }}>
        <div className="dashboard-content">
          <div className="icon">�</div>
          <h1>Student Dashboard</h1>
          <p>Work Immersion Management System</p>
          <span className="role-badge">Student</span>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
