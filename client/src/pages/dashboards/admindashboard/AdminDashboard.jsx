import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './AdminDashboard.css';

const AdminDashboard = ({ onNavigate }) => {
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    onNavigate?.('login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeItem="dashboard" onNavigate={() => {}} onLogout={handleLogout} />
      <div className="dashboard-container" style={{ marginLeft: 0 }}>
        <div className="dashboard-content">
          <div className="icon">�</div>
          <h1>Admin Dashboard</h1>
          <p>Work Immersion Management System</p>
          <span className="role-badge">Administrator</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
