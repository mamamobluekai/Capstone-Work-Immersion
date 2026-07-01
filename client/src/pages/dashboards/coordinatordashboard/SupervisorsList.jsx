import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './TeachersList.css';

const SupervisorsList = ({ onNavigate, role }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/immersion/supervisors');
      setSupervisors((data && data.supervisors) || []);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Failed to load supervisors');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredSupervisors.length) {
      setSelected([]);
    } else {
      setSelected(filteredSupervisors.map((s) => s.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Approve ${selected.length} selected supervisor(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/api/users/${id}/approve`)));
      fetchSupervisors();
    } catch (err) {
      alert(err.message || 'Failed to approve selected supervisors');
    }
  };

  const handleBulkDisapprove = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Disapprove ${selected.length} selected supervisor(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/api/users/${id}/disapprove`)));
      fetchSupervisors();
    } catch (err) {
      alert(err.message || 'Failed to disapprove selected supervisors');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected supervisor(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/api/users/${id}`)));
      fetchSupervisors();
    } catch (err) {
      alert(err.message || 'Failed to delete selected supervisors');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/users/${id}/approve`);
      fetchSupervisors();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleDisapprove = async (id) => {
    try {
      await api.patch(`/api/users/${id}/disapprove`);
      fetchSupervisors();
    } catch (err) {
      alert(err.message || 'Failed to disapprove');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supervisor?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchSupervisors();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const statusFiltered = filter === 'all'
    ? supervisors
    : supervisors.filter((s) => s.status === filter);

  const normalize = (value) => (value ?? '').toString().toLowerCase().trim();
  const searchTerm = normalize(searchQuery);

  const filteredSupervisors = !searchTerm
    ? statusFiltered
    : statusFiltered.filter((s) => {
        const name = normalize(`${s.first_name} ${s.last_name}`);
        const email = normalize(s.email);
        const company = normalize(s.company_name);
        const designation = normalize(s.designation);
        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          company.includes(searchTerm) ||
          designation.includes(searchTerm)
        );
      });

  const statusBadge = (status) => (
    <span className={`status-badge status-${status}`}>{status}</span>
  );

  return (
    <div className="coordinator-layout">
      <Sidebar
        activeItem="supervisors-list"
        onNavigate={onNavigate}
        onLogout={() => onNavigate?.('login')}
        role={role}
      />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Supervisors List</h1>
          <p>Manage and review supervisor accounts</p>
        </div>

        <div className="students-card">
          <div className="students-toolbar">
            <h2>Supervisors ({filteredSupervisors.length})</h2>

            {selected.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">{selected.length} selected</span>
                <button className="btn-approve" onClick={handleBulkApprove}>Approve</button>
                <button className="btn-disapprove" onClick={handleBulkDisapprove}>Disapprove</button>
                <button className="btn-delete" onClick={handleBulkDelete}>Delete</button>
              </div>
            )}

            <div className="filter-group">
              {['all', 'pending', 'coordinator_approved', 'disapproved'].map((status) => (
                <button
                  key={status}
                  className={`filter-btn ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'coordinator_approved' ? 'approved' : status}
                </button>
              ))}
            </div>

            <div className="search-group">
              <input
                className="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, company, or designation..."
                aria-label="Search supervisors"
              />
            </div>
          </div>

          {error && <div className="upload-error">{error}</div>}

          {loading ? (
            <p className="empty-state">Loading supervisors...</p>
          ) : filteredSupervisors.length === 0 ? (
            <p className="empty-state">No supervisors found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selected.length === filteredSupervisors.length && filteredSupervisors.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all supervisors"
                      />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupervisors.map((supervisor) => (
                    <tr key={supervisor.id} className={selected.includes(supervisor.id) ? 'selected-row' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(supervisor.id)}
                          onChange={() => toggleSelect(supervisor.id)}
                          aria-label={`Select ${supervisor.first_name} ${supervisor.last_name}`}
                        />
                      </td>
                      <td>{supervisor.first_name} {supervisor.last_name}</td>
                      <td>{supervisor.email}</td>
                      <td>{supervisor.company_name || '-'}</td>
                      <td>{supervisor.designation || '-'}</td>
                      <td>{supervisor.phone || '-'}</td>
                      <td>{statusBadge(supervisor.status)}</td>
                      <td>
                        {supervisor.status === 'pending' && (
                          <div className="action-buttons">
                            <button className="btn-approve" onClick={() => handleApprove(supervisor.id)}>Approve</button>
                            <button className="btn-disapprove" onClick={() => handleDisapprove(supervisor.id)}>Disapprove</button>
                          </div>
                        )}
                        <button className="btn-delete" onClick={() => handleDelete(supervisor.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorsList;
