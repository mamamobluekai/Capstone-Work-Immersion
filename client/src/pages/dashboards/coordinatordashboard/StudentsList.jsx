import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './StudentsList.css';

const StudentsList = ({ onNavigate, role }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/students');
      setStudents((data && data.students) || []);
      setSelected([]);
    } catch (err) {
      setError(err.message || 'Failed to load students');
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
    if (selected.length === filteredStudents.length) {
      setSelected([]);
    } else {
      setSelected(filteredStudents.map((s) => s.id));
    }
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Approve ${selected.length} selected student(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/api/students/${id}/approve`)));
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to approve selected students');
    }
  };

  const handleBulkDisapprove = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Disapprove ${selected.length} selected student(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/api/students/${id}/disapprove`)));
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to disapprove selected students');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected student(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/api/students/${id}`)));
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete selected students');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/students/${id}/approve`);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleDisapprove = async (id) => {
    try {
      await api.patch(`/api/students/${id}/disapprove`);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to disapprove');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/api/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const statusFilteredStudents = filter === 'all'
    ? students
    : students.filter((s) => s.status === filter);

  const normalize = (value) => (value ?? '').toString().toLowerCase().trim();

  const searchTerm = normalize(searchQuery);

  const filteredStudents = !searchTerm
    ? statusFilteredStudents
    : statusFilteredStudents.filter((s) => {
        const id = normalize(s.student_id);
        const strand = normalize(s.strand);
        const name = normalize(`${s.first_name} ${s.last_name}`);
        const email = normalize(s.email);

        return (
          id.includes(searchTerm) ||
          strand.includes(searchTerm) ||
          name.includes(searchTerm) ||
          email.includes(searchTerm)
        );
      });

  const statusBadge = (status) => {
    return (
      <span className={`status-badge status-${status}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="coordinator-layout">
        <Sidebar
          activeItem="students-list"
          onNavigate={onNavigate}
          onLogout={() => onNavigate?.('login')}
          role={role}
        />
        <div className="coordinator-main">
          <div className="coordinator-header">
            <h1>Student List</h1>
            <p>Manage and review student records</p>
          </div>

          <div className="students-card">
          <div className="students-toolbar">
            <h2>Students ({filteredStudents.length})</h2>

            {selected.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">{selected.length} selected</span>
                <button className="btn-approve" onClick={handleBulkApprove}>Approve</button>
                <button className="btn-disapprove" onClick={handleBulkDisapprove}>Disapprove</button>
                <button className="btn-delete" onClick={handleBulkDelete}>Delete</button>
              </div>
            )}

            <div className="filter-group">
                {['all', 'pending', 'approved', 'disapproved'].map((status) => (
                  <button
                    key={status}
                    className={`filter-btn ${filter === status ? 'active' : ''}`}
                    onClick={() => setFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="search-group">
                <input
                  className="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, strand, name, or gmail..."
                  aria-label="Search students"
                />
              </div>
            </div>

            {error && <div className="upload-error">{error}</div>}

            {loading ? (
              <p className="empty-state">Loading students...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="empty-state">No students found. Upload an Excel file to get started.</p>
            ) : (
              <div className="table-wrapper">
                 <table className="students-table">
                   <thead>
                     <tr>
                       <th>
                         <input
                           type="checkbox"
                           checked={selected.length === filteredStudents.length && filteredStudents.length > 0}
                           onChange={toggleSelectAll}
                           aria-label="Select all students"
                         />
                       </th>
                       <th>Student ID</th>
                       <th>Name</th>
                       <th>Email</th>
                       <th>Strand</th>
                       <th>Phone</th>
                       <th>Status</th>
                       <th>Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredStudents.map((student) => (
                       <tr key={student.id} className={selected.includes(student.id) ? 'selected-row' : ''}>
                         <td>
                           <input
                             type="checkbox"
                             checked={selected.includes(student.id)}
                             onChange={() => toggleSelect(student.id)}
                             aria-label={`Select ${student.first_name} ${student.last_name}`}
                           />
                         </td>
                         <td className="student-id">{student.student_id}</td>
                         <td>
                           {student.first_name} {student.last_name}
                         </td>
                         <td>{student.email}</td>
                         <td>{student.strand}</td>
                         <td>{student.phone || '-'}</td>
                         <td>{statusBadge(student.status)}</td>
                         <td>
                           {student.status === 'pending' && (
                             <div className="action-buttons">
                               <button className="btn-approve" onClick={() => handleApprove(student.id)}>
                                 Approve
                               </button>
                               <button className="btn-disapprove" onClick={() => handleDisapprove(student.id)}>
                                 Disapprove
                               </button>
                             </div>
                           )}
                           <button className="btn-delete" onClick={() => handleDelete(student.id)}>
                             Delete
                           </button>
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
    </>
  );
};

export default StudentsList;
