import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './DashboardHome.css';

const DashboardHome = ({ onLogout, onNavigate, role }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/students');
      setStudents((data && data.students) || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: students.length,
    pending: students.filter((s) => s.status === 'pending').length,
    approved: students.filter((s) => s.status === 'approved').length,
    disapproved: students.filter((s) => s.status === 'disapproved').length,
  };

  return (
    <div className="coordinator-layout">
      <Sidebar activeItem="dashboard" onNavigate={onNavigate} onLogout={onLogout} role={role} />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Welcome back, Coordinator</h1>
          <p>Work Immersion Management System - Marinduque National High School</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : stats.total}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-value">{loading ? '...' : stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-approved">
            <div className="stat-value">{loading ? '...' : stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card stat-disapproved">
            <div className="stat-value">{loading ? '...' : stats.disapproved}</div>
            <div className="stat-label">Disapproved</div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => onNavigate?.('upload-students')}>
              <span className="action-icon">📊</span>
              <span className="action-label">Upload Students</span>
              <span className="action-desc">Import students via Excel file</span>
            </button>
            <button className="action-card" onClick={() => onNavigate?.('students-list')}>
              <span className="action-icon">📋</span>
              <span className="action-label">View Student List</span>
              <span className="action-desc">Manage and review student records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
