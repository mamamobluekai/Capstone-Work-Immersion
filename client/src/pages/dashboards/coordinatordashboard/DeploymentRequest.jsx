import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './AssignImmersion.css';

const DeploymentRequest = ({ onNavigate, role }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [batchLabel, setBatchLabel] = useState('Batch 1');
  const [strand, setStrand] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [fulfillId, setFulfillId] = useState(null);
  const [fulfillStudentIds, setFulfillStudentIds] = useState([]);
  const [fulfillQuery, setFulfillQuery] = useState('');
  const [fulfilling, setFulfilling] = useState(false);

  const filteredStudents = useMemo(() => {
    const q = (query ?? '').toString().toLowerCase().trim();
    let list = students;
    if (strand) {
      list = list.filter((s) => s.strand === strand);
    }
    if (!q) return list;
    return list.filter((s) => {
      const id = (s.student_id ?? '').toString().toLowerCase();
      const sStrand = (s.strand ?? '').toString().toLowerCase();
      const name = `${s.first_name ?? ''} ${s.last_name ?? ''}`.toLowerCase();
      const email = (s.email ?? '').toString().toLowerCase();
      return id.includes(q) || sStrand.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [query, students, strand]);

  const fetchSupervisors = async () => {
    try {
      const res = await api.get('/api/immersion/supervisors');
      setSupervisors(res?.supervisors || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/immersion/students/requirements-completed');
      setStudents(res?.students || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/deployment-requests/coordinator/me');
      setRequests(res?.deployment_requests || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchSupervisors(), fetchStudents(), fetchRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      const set = new Set(prev);
      if (set.has(studentId)) set.delete(studentId);
      else set.add(studentId);
      return Array.from(set);
    });
  };

  const handleSendRequest = async () => {
    if (!selectedSupervisorId) {
      setError('Please select a supervisor.');
      return;
    }
    if (!batchLabel.trim()) {
      setError('Batch label is required.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/deployment-requests', {
        supervisor_id: Number(selectedSupervisorId),
        batch_label: batchLabel.trim(),
        strand: strand.trim() || null,
        notes: notes.trim() || null,
        student_ids: selectedStudentIds,
      });
      setSelectedStudentIds([]);
      setBatchLabel('Batch 1');
      setStrand('');
      setNotes('');
      await fetchRequests();
    } catch (e) {
      setError(e.message || 'Failed to send deployment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Delete this deployment request?')) return;
    try {
      await api.delete(`/api/deployment-requests/${requestId}`);
      fetchRequests();
    } catch (e) {
      setError(e.message || 'Failed to delete request.');
    }
  };

  const handleOpenFulfill = async (requestId) => {
    setFulfillId(requestId);
    setFulfillStudentIds([]);
    setFulfillQuery('');
  };

  const handleFulfillSubmit = async () => {
    if (fulfillStudentIds.length === 0) {
      setError('Please select students to assign.');
      return;
    }
    const req = requests.find((r) => r.id === fulfillId);
    if (req && req.num_students && fulfillStudentIds.length !== Number(req.num_students)) {
      setError(`Expected ${req.num_students} students, selected ${fulfillStudentIds.length}.`);
      return;
    }
    try {
      setFulfilling(true);
      setError('');
      await api.patch(`/api/deployment-requests/${fulfillId}/fulfill`, {
        student_ids: fulfillStudentIds,
      });
      setFulfillId(null);
      setFulfillStudentIds([]);
      await fetchRequests();
    } catch (e) {
      setError(e.message || 'Failed to fulfill request.');
    } finally {
      setFulfilling(false);
    }
  };

  const uniqueStrands = useMemo(() => {
    const set = new Set();
    students.forEach((s) => s.strand && set.add(s.strand));
    return Array.from(set).sort();
  }, [students]);

  const supervisorRequests = requests.filter((r) => r.direction === 'supervisor_to_coordinator');
  const sentRequests = requests.filter((r) => r.direction === 'coordinator_to_supervisor');

  const fulfillReq = fulfillId ? requests.find((r) => r.id === fulfillId) : null;
  const fulfillMax = fulfillReq?.num_students || null;

  return (
    <div className="coordinator-layout">
      <Sidebar activeItem="deployment-request" onNavigate={onNavigate} onLogout={() => onNavigate?.('login')} role={role} />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Deployment Request</h1>
          <p>Send students to supervisors and fulfill supervisor requests.</p>
        </div>

        {error && <div className="assign-error">{error}</div>}

        {supervisorRequests.length > 0 && (
          <div className="assign-card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gray-800)' }}>
              Supervisor Requests ({supervisorRequests.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              Supervisors have requested students. Assign students with completed requirements to fulfill these requests.
            </p>
            <div className="deployment-list">
              {supervisorRequests.map((req) => {
                const isFulfilling = fulfillId === req.id;
                const statusClass = req.status === 'fulfilled' ? 'status-approved' :
                  req.status === 'rejected' ? 'status-rejected' : 'status-pending';
                return (
                  <div key={req.id} className="deployment-card">
                    <div className="deployment-header">
                      <div className="deployment-info">
                        <div className="deployment-title">
                          {req.batch_label} — {req.num_students} students requested
                        </div>
                        <div className="deployment-meta">
                          From: {req.supervisor_first_name} {req.supervisor_last_name} ({req.supervisor_company || 'No company'}) • Sent: {new Date(req.created_at).toLocaleDateString()}
                        </div>
                        <div className="deployment-meta">
                          Strand: {req.strand || 'All'} • Assigned: {req.student_count || 0} / {req.num_students}
                        </div>
                      </div>
                      <div className={`status-badge ${statusClass}`}>
                        {req.status}
                      </div>
                    </div>

                    {req.notes && (
                      <div className="deployment-notes" style={{ margin: '0 1.25rem' }}>
                        <strong>Notes:</strong> {req.notes}
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="deployment-actions">
                        {isFulfilling ? (
                          <div style={{ width: '100%' }}>
                            <div className="assign-toolbar" style={{ marginBottom: '0.75rem' }}>
                              <h3 style={{ fontSize: '0.95rem' }}>
                                Select {fulfillMax || 'students'} to assign ({fulfillStudentIds.length}{fulfillMax ? ` / ${fulfillMax}` : ''})
                              </h3>
                              <input
                                className="search-input"
                                type="text"
                                value={fulfillQuery}
                                onChange={(e) => setFulfillQuery(e.target.value)}
                                placeholder="Search students..."
                              />
                            </div>
                            <div className="students-select-list" style={{ maxHeight: '250px', marginBottom: '0.75rem' }}>
                              {filteredStudents.length === 0 ? (
                                <p className="empty-state">No available students.</p>
                              ) : (
                                filteredStudents.map((s) => {
                                  const checked = fulfillStudentIds.includes(s.id);
                                  return (
                                    <label key={s.id} className={`student-row ${checked ? 'checked' : ''}`}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          setFulfillStudentIds((prev) => {
                                            const set = new Set(prev);
                                            if (set.has(s.id)) set.delete(s.id);
                                            else {
                                              if (fulfillMax && set.size >= fulfillMax) return prev;
                                              set.add(s.id);
                                            }
                                            return Array.from(set);
                                          });
                                        }}
                                      />
                                      <span className="student-meta">
                                        <span className="student-main">
                                          <strong className="mono">{s.student_id}</strong> {s.first_name} {s.last_name}
                                        </span>
                                        <span className="student-sub">
                                          {s.strand} • {s.email}
                                        </span>
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                            <div className="deployment-actions" style={{ border: 'none', marginTop: '0', paddingTop: '0' }}>
                              <button className="btn-primary" onClick={handleFulfillSubmit} disabled={fulfilling}>
                                {fulfilling ? 'Assigning...' : 'Assign & Fulfill'}
                              </button>
                              <button className="btn-delete-batch" onClick={() => setFulfillId(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn-primary" onClick={() => handleOpenFulfill(req.id)}>
                            Assign Students
                          </button>
                        )}
                      </div>
                    )}

                    {req.students?.length > 0 && req.status === 'fulfilled' && (
                      <div style={{ padding: '0 1.25rem 1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Assigned Students:</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {req.students.map((s) => (
                            <span key={s.id} className="student-chip">
                              {s.first_name} {s.last_name} ({s.student_id})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="assign-card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gray-800)' }}>Send Students to Supervisor</h2>
          <div className="assign-grid">
            <div className="field">
              <label>Supervisor</label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="select"
              >
                <option value="">Select supervisor</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} — {s.company_name || 'No company'}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Batch Label</label>
              <input
                className="input"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                placeholder="Batch 1"
              />
            </div>

            <div className="field">
              <label>Strand (optional)</label>
              <select
                value={strand}
                onChange={(e) => setStrand(e.target.value)}
                className="select"
              >
                <option value="">All strands</option>
                {uniqueStrands.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="assign-toolbar">
            <h2>Completed Requirements ({filteredStudents.length})</h2>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, strand, name, or email..."
              aria-label="Search students"
            />
          </div>

          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="empty-state">No students with completed requirements found.</p>
          ) : (
            <div className="students-select-list">
              {filteredStudents.map((s) => {
                const checked = selectedStudentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`student-row ${checked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleStudent(s.id)}
                    />
                    <span className="student-meta">
                      <span className="student-main">
                        <strong className="mono">{s.student_id}</strong> {s.first_name} {s.last_name}
                      </span>
                      <span className="student-sub">
                        {s.strand} • {s.email} • {s.requirements_status || 'Completed'}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="field" style={{ marginTop: '1rem' }}>
            <label>Notes (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions for the supervisor..."
            />
          </div>

          <div className="assign-footer">
            <div className="capacity-note">
              Selected: <strong>{selectedStudentIds.length}</strong> students
            </div>
            <button
              className="btn-primary"
              onClick={handleSendRequest}
              disabled={submitting || loading}
            >
              {submitting ? 'Sending...' : 'Send Deployment Request'}
            </button>
          </div>
        </div>

        {sentRequests.length > 0 && (
          <div className="batches-section">
            <div className="batches-header">
              <h2>Sent Deployment Requests</h2>
              <p>Total: {sentRequests.length}</p>
            </div>

            <div className="deployment-list">
              {sentRequests.map((req) => {
                const isExpanded = expandedId === req.id;
                const statusClass = req.status === 'approved' ? 'status-approved' :
                  req.status === 'rejected' ? 'status-rejected' : 'status-pending';
                return (
                  <div key={req.id} className="deployment-card">
                    <div className="deployment-header" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                      <div className="deployment-info">
                        <div className="deployment-title">
                          {req.batch_label} → {req.supervisor_company || `${req.supervisor_first_name} ${req.supervisor_last_name}`}
                        </div>
                        <div className="deployment-meta">
                          Strand: {req.strand || 'All'} • Students: {req.student_count} • Sent: {new Date(req.created_at).toLocaleDateString()}
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
                        {req.status === 'pending' && (
                          <div className="deployment-actions">
                            <button className="btn-delete-batch" onClick={() => handleDeleteRequest(req.id)}>
                              Delete Request
                            </button>
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

export default DeploymentRequest;
