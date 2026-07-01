import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import SupervisorRequest from './SupervisorRequest';
import './SupervisorDashboard.css';

const SupervisorDashboard = ({ onNavigate }) => {
  const { logoutUser, user } = useAuth();

  const getSubPage = () => {
    const path = window.location.pathname.replace(/^\/+/, '');
    return path === 'supervisor/deployment-request' ? 'deployment-request' : 'home';
  };

  const [activePage, setActivePage] = useState(getSubPage);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const handleLogout = () => {
    logoutUser();
    onNavigate?.('login');
  };

  const handleNavigate = (page) => {
    if (page === 'deployment-request') {
      setActivePage('deployment-request');
      window.history.pushState(null, '', '/supervisor/deployment-request');
    } else {
      setActivePage('home');
      window.history.pushState(null, '', '/supervisor/dashboard');
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/deployment-requests/supervisor/me');
      setRequests(res?.deployment_requests || []);
    } catch (e) {
      setError(e.message || 'Failed to load deployment requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this deployment request? This will assign the selected students to your company.')) return;
    try {
      await api.patch(`/api/deployment-requests/${requestId}/approve`);
      fetchRequests();
    } catch (e) {
      setError(e.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Reject this deployment request?')) return;
    try {
      await api.patch(`/api/deployment-requests/${requestId}/reject`);
      fetchRequests();
    } catch (e) {
      setError(e.message || 'Failed to reject request.');
    }
  };

  const myCompany = user?.company_name || 'Your Company';

  const incomingRequests = requests.filter((r) => r.direction === 'coordinator_to_supervisor');
  const outgoingRequests = requests.filter((r) => r.direction === 'supervisor_to_coordinator');

  const incomingCounts = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    incomingRequests.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [incomingRequests]);

  const outgoingCounts = useMemo(() => {
    const counts = { pending: 0, fulfilled: 0, rejected: 0 };
    outgoingRequests.forEach((r) => {
      if (r.status === 'fulfilled') counts.fulfilled++;
      else if (r.status === 'rejected') counts.rejected++;
      else counts.pending++;
    });
    return counts;
  }, [outgoingRequests]);

  if (activePage === 'deployment-request') {
    return <SupervisorRequest onNavigate={setActivePage} role="supervisor" />;
  }

  return (
    <div className="coordinator-layout">
      <Sidebar activeItem={activePage === 'deployment-request' ? 'deployment-request' : 'dashboard'} onNavigate={handleNavigate} onLogout={handleLogout} role="supervisor" />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Supervisor Dashboard</h1>
          <p>Deployment Requests — {myCompany}</p>
        </div>

        {error && <div className="assign-error">{error}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{loading ? '...' : incomingRequests.length}</div>
            <div className="stat-label">Received</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-value">{loading ? '...' : incomingCounts.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-approved">
            <div className="stat-value">{loading ? '...' : incomingCounts.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              <button className="btn-link" onClick={() => handleNavigate('deployment-request')}>
                + New Request
              </button>
            </div>
            <div className="stat-label">Request Students</div>
          </div>
        </div>

        <div className="batches-section">
          <div className="batches-header">
            <h2>Received Deployments</h2>
            <p>Students sent by coordinator for your company</p>
          </div>

          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : incomingRequests.length === 0 ? (
            <p className="empty-state">No deployments received yet.</p>
          ) : (
            <div className="deployment-list">
              {incomingRequests.map((req) => {
                const isExpanded = expandedId === req.id;
                const statusClass = req.status === 'approved' ? 'status-approved' :
                  req.status === 'rejected' ? 'status-rejected' : 'status-pending';
                return (
                  <div key={req.id} className="deployment-card">
                    <div className="deployment-header" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                      <div className="deployment-info">
                        <div className="deployment-title">
                          Batch: {req.batch_label || `Batch #${req.id}`}
                        </div>
                        <div className="deployment-meta">
                          Coordinator: {req.coordinator_first_name} {req.coordinator_last_name} • Sent: {new Date(req.created_at).toLocaleDateString()}
                        </div>
                        <div className="deployment-meta">
                          Students: {req.student_count || (req.students || []).length} • Strand: {req.strand || 'All'}
                        </div>
                      </div>
                      <div className={`status-badge ${statusClass}`}>
                        {req.status}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="deployment-body">
                        {req.notes && (
                          <div className="deployment-notes">
                            <strong>Notes:</strong> {req.notes}
                          </div>
                        )}

                        <div className="deployment-students">
                          <h4>Students ({req.students?.length || 0})</h4>
                          {req.students?.length > 0 ? (
                            <table className="batches-table">
                              <thead>
                                <tr>
                                  <th>Student ID</th>
                                  <th>Name</th>
                                  <th>Strand</th>
                                  <th>Grade</th>
                                  <th>Email</th>
                                </tr>
                              </thead>
                              <tbody>
                                {req.students.map((s) => (
                                  <tr key={s.id}>
                                    <td className="mono">{s.student_id}</td>
                                    <td>{s.first_name} {s.last_name}</td>
                                    <td>{s.strand || '—'}</td>
                                    <td>{s.grade_level || '—'}</td>
                                    <td>{s.email}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="empty-state">No students listed.</p>
                          )}
                        </div>

                        {req.status === 'pending' && (
                          <div className="deployment-actions">
                            <button className="btn-primary" onClick={() => handleApprove(req.id)}>
                              Approve
                            </button>
                            <button className="btn-delete-batch" onClick={() => handleReject(req.id)}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {outgoingRequests.length > 0 && (
          <div className="batches-section">
            <div className="batches-header">
              <h2>My Requests to Coordinator</h2>
              <p>Pending: {outgoingCounts.pending} • Fulfilled: {outgoingCounts.fulfilled} • Rejected: {outgoingCounts.rejected}</p>
            </div>

            <div className="deployment-list">
              {outgoingRequests.map((req) => {
                const isExpanded = expandedId === `out-${req.id}`;
                const statusClass = req.status === 'fulfilled' ? 'status-approved' :
                  req.status === 'rejected' ? 'status-rejected' : 'status-pending';
                return (
                  <div key={`out-${req.id}`} className="deployment-card">
                    <div className="deployment-header" onClick={() => setExpandedId(isExpanded ? null : `out-${req.id}`)}>
                      <div className="deployment-info">
                        <div className="deployment-title">
                          {req.batch_label} — {req.num_students} students requested
                        </div>
                        <div className="deployment-meta">
                          To: {req.coordinator_first_name} {req.coordinator_last_name} • Sent: {new Date(req.created_at).toLocaleDateString()}
                        </div>
                        <div className="deployment-meta">
                          Strand: {req.strand || 'All'} • Assigned: {req.student_count || 0} / {req.num_students}
                        </div>
                      </div>
                      <div className={`status-badge ${statusClass}`}>
                        {req.status}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="deployment-body">
                        {req.notes && (
                          <div className="deployment-notes">
                            <strong>Notes:</strong> {req.notes}
                          </div>
                        )}
                        {req.students?.length > 0 && (
                          <div className="deployment-students">
                            <h4>Students Assigned ({req.students.length})</h4>
                            <table className="batches-table">
                              <thead>
                                <tr>
                                  <th>Student ID</th>
                                  <th>Name</th>
                                  <th>Strand</th>
                                  <th>Grade</th>
                                  <th>Email</th>
                                </tr>
                              </thead>
                              <tbody>
                                {req.students.map((s) => (
                                  <tr key={s.id}>
                                    <td className="mono">{s.student_id}</td>
                                    <td>{s.first_name} {s.last_name}</td>
                                    <td>{s.strand || '—'}</td>
                                    <td>{s.grade_level || '—'}</td>
                                    <td>{s.email}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;
