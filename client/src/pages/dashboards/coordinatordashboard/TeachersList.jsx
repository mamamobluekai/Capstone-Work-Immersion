import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './TeachersList.css';

const TeachersList = ({ onNavigate, role }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/immersion/teachers');
      setTeachers((data && data.teachers) || []);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Failed to load teachers');
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
    if (selected.length === filteredTeachers.length) {
      setSelected([]);
    } else {
      setSelected(filteredTeachers.map((t) => t.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Approve ${selected.length} selected teacher(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/api/users/${id}/approve`)));
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to approve selected teachers');
    }
  };

  const handleBulkDisapprove = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Disapprove ${selected.length} selected teacher(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/api/users/${id}/disapprove`)));
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to disapprove selected teachers');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected teacher(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/api/users/${id}`)));
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to delete selected teachers');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/users/${id}/approve`);
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleDisapprove = async (id) => {
    try {
      await api.patch(`/api/users/${id}/disapprove`);
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to disapprove');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchTeachers();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const statusFiltered = filter === 'all'
    ? teachers
    : teachers.filter((t) => t.status === filter);

  const normalize = (value) => (value ?? '').toString().toLowerCase().trim();
  const searchTerm = normalize(searchQuery);

  const filteredTeachers = !searchTerm
    ? statusFiltered
    : statusFiltered.filter((t) => {
        const name = normalize(`${t.first_name} ${t.last_name}`);
        const email = normalize(t.email);
        const empId = normalize(t.employee_id);
        const dept = normalize(t.department);
        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          empId.includes(searchTerm) ||
          dept.includes(searchTerm)
        );
      });

  const statusBadge = (status) => (
    <span className={`status-badge status-${status}`}>{status}</span>
  );

  return (
    <div className="coordinator-layout">
      <Sidebar
        activeItem="teachers-list"
        onNavigate={onNavigate}
        onLogout={() => onNavigate?.('login')}
        role={role}
      />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Teachers List</h1>
          <p>Manage and review teacher accounts</p>
        </div>

        <div className="students-card">
          <div className="students-toolbar">
            <h2>Teachers ({filteredTeachers.length})</h2>

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
                placeholder="Search by name, email, ID, or department..."
                aria-label="Search teachers"
              />
            </div>
          </div>

          {error && <div className="upload-error">{error}</div>}

          {loading ? (
            <p className="empty-state">Loading teachers...</p>
          ) : filteredTeachers.length === 0 ? (
            <p className="empty-state">No teachers found.</p>
          ) : (
            <div className="table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selected.length === filteredTeachers.length && filteredTeachers.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all teachers"
                      />
                    </th>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className={selected.includes(teacher.id) ? 'selected-row' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(teacher.id)}
                          onChange={() => toggleSelect(teacher.id)}
                          aria-label={`Select ${teacher.first_name} ${teacher.last_name}`}
                        />
                      </td>
                      <td className="student-id">{teacher.employee_id || '-'}</td>
                      <td>{teacher.first_name} {teacher.last_name}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.department || '-'}</td>
                      <td>{statusBadge(teacher.status)}</td>
                      <td>
                        {teacher.status === 'pending' && (
                          <div className="action-buttons">
                            <button className="btn-approve" onClick={() => handleApprove(teacher.id)}>Approve</button>
                            <button className="btn-disapprove" onClick={() => handleDisapprove(teacher.id)}>Disapprove</button>
                          </div>
                        )}
                        <button className="btn-delete" onClick={() => handleDelete(teacher.id)}>Delete</button>
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

export default TeachersList;
