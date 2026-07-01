import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './DashboardHome.css';

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const IconReport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" />
    <rect x="12" y="8" width="3" height="10" />
    <rect x="17" y="5" width="3" height="13" />
  </svg>
);

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.9A7 7 0 0 1 5 1.1a1 1 0 0 1 0 0" />
    <path d="M16 16l-4-4-4 4" />
    <path d="M12 12v9" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const DashboardHome = ({ onLogout, onNavigate, role, activeItem = 'dashboard' }) => {
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
      <Sidebar activeItem={activeItem || 'dashboard'} onNavigate={onNavigate} onLogout={onLogout} role={role} />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <div>
            <div className="coordinator-header-eyebrow">Coordinator panel</div>
            <h1>Welcome back, Coordinator</h1>
            <p>Work Immersion Management System - Marinduque National High School</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><IconUsers /></div>
            <div className="stat-body">
              <div className="stat-value">{loading ? '...' : stats.total}</div>
              <div className="stat-label">Total students</div>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon"><IconClock /></div>
            <div className="stat-body">
              <div className="stat-value">{loading ? '...' : stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card stat-approved">
            <div className="stat-icon"><IconCheck /></div>
            <div className="stat-body">
              <div className="stat-value">{loading ? '...' : stats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          <div className="stat-card stat-disapproved">
            <div className="stat-icon"><IconX /></div>
            <div className="stat-body">
              <div className="stat-value">{loading ? '...' : stats.disapproved}</div>
              <div className="stat-label">Disapproved</div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => onNavigate?.('reports')}>
              <div className="action-icon"><IconReport /></div>
              <div className="action-text">
                <span className="action-label">Generate report</span>
                <span className="action-desc">Create and send a summary report to the admin</span>
              </div>
              <span className="action-arrow"><IconArrowRight /></span>
            </button>
            <button className="action-card" onClick={() => onNavigate?.('upload-students')}>
              <div className="action-icon"><IconUpload /></div>
              <div className="action-text">
                <span className="action-label">Upload students</span>
                <span className="action-desc">Import students via Excel file</span>
              </div>
              <span className="action-arrow"><IconArrowRight /></span>
            </button>
            <button className="action-card" onClick={() => onNavigate?.('students-list')}>
              <div className="action-icon"><IconList /></div>
              <div className="action-text">
                <span className="action-label">View student list</span>
                <span className="action-desc">Manage and review student records</span>
              </div>
              <span className="action-arrow"><IconArrowRight /></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;