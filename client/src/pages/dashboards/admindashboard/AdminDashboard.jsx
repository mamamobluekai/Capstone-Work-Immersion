import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/common/Sidebar.jsx';
import ReportSummary from '../coordinatordashboard/ReportSummary';
import './AdminDashboard.css';

const AdminDashboard = ({ onNavigate }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    onNavigate?.('login');
  };

  const renderPage = () => {
    if (activePage === 'reports') {
      return <ReportSummary onNavigate={setActivePage} role="admin" activeItem={activePage} />;
    }

    return (
      <div className="dashboard-container" style={{ marginLeft: 0, flex: 1 }}>
        <div className="dashboard-content">
          <div className="icon">🏫</div>
          <h1>Admin Dashboard</h1>
          <p>Work Immersion Management System</p>
          <span className="role-badge">Administrator</span>
          <button className="admin-action-button" onClick={() => setActivePage('reports')}>
            Review Reports
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeItem={activePage === 'reports' ? 'reports' : 'dashboard'} onNavigate={setActivePage} onLogout={handleLogout} role="admin" />
      {renderPage()}
    </div>
  );
};

export default AdminDashboard;
