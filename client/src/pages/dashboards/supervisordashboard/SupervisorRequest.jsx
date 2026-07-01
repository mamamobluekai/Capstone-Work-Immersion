import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import '../coordinatordashboard/AssignImmersion.css';

const SupervisorRequest = ({ onNavigate, role }) => {
  const [coordinators, setCoordinators] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');
  const [batchLabel, setBatchLabel] = useState('Batch 1');
  const [strand, setStrand] = useState('');
  const [numStudents, setNumStudents] = useState(5);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchCoordinators = async () => {
    try {
      const res = await api.get('/api/users/coordinators');
      setCoordinators(res?.coordinators || res?.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get('/api/deployment-requests/supervisor/me');
      setMyRequests(res?.deployment_requests || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCoordinators(), fetchMyRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSubmitRequest = async () => {
    if (!selectedCoordinatorId) {
      setError('Please select a coordinator.');
      return;
    }
    if (!batchLabel.trim()) {
      setError('Batch label is required.');
      return;
    }
    if (!Number.isInteger(numStudents) || numStudents <= 0) {
      setError('Number of students must be a positive integer.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/deployment-requests/supervisor-request', {
        coordinator_id: Number(selectedCoordinatorId),
        batch_label: batchLabel.trim(),
        strand: strand.trim() || null,
        num_students: numStudents,
        notes: notes.trim() || null,
      });
      setSelectedCoordinatorId('');
      setBatchLabel('Batch 1');
      setStrand('');
      setNumStudents(5);
      setNotes('');
      setSuccess('Deployment request sent to coordinator.');
      await fetchMyRequests();
    } catch (e) {
      setError(e.message || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueStrands = useMemo(() => {
    return ['STEM', 'ABM', 'HUMSS', 'TVL', 'GAS', 'PBM'].filter(Boolean);
  }, []);

  return (
    <div className="coordinator-layout">
      <Sidebar activeItem="deployment-request" onNavigate={onNavigate} onLogout={() => onNavigate?.('login')} role={role} />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Send Deployment Request</h1>
          <p>Request students from the coordinator for your company.</p>
        </div>

        {error && <div className="assign-error">{error}</div>}
        {success && <div className="assign-success">{success}</div>}

        <div className="assign-card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--gray-800)' }}>New Request</h2>
          <div className="assign-grid">
            <div className="field">
              <label>Coordinator</label>
              <select
                value={selectedCoordinatorId}
                onChange={(e) => setSelectedCoordinatorId(e.target.value)}
                className="select"
              >
                <option value="">Select coordinator</option>
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.department ? `(${c.department})` : ''}
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

          <div className="assign-grid" style={{ marginTop: '1rem' }}>
            <div className="field">
              <label>Number of Students</label>
              <input
                className="input"
                type="number"
                min={1}
                value={numStudents}
                onChange={(e) => setNumStudents(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Notes (optional)</label>
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific requirements or notes for the coordinator..."
              />
            </div>
          </div>

          <div className="assign-footer">
            <div className="capacity-note">
              Requesting: <strong>{numStudents}</strong> students {strand ? `(${strand})` : '(All strands)'}
            </div>
            <button
              className="btn-primary"
              onClick={handleSubmitRequest}
              disabled={submitting || loading}
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>

        <div className="batches-section">
          <div className="batches-header">
            <h2>My Requests</h2>
            <p>Total: {myRequests.length}</p>
          </div>

          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : myRequests.length === 0 ? (
            <p className="empty-state">No requests sent yet.</p>
          ) : (
            <div className="deployment-list">
              {myRequests.map((req) => {
                const isExpanded = expandedId === req.id;
                const statusClass = req.status === 'approved' || req.status === 'fulfilled' ? 'status-approved' :
                  req.status === 'rejected' ? 'status-rejected' : 'status-pending';
                const isIncoming = req.direction === 'coordinator_to_supervisor';
                return (
                  <div key={req.id} className="deployment-card">
                    <div className="deployment-header" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                      <div className="deployment-info">
                        <div className="deployment-title">
                          {req.batch_label} {isIncoming ? '(Received)' : '(My Request)'}
                        </div>
                        <div className="deployment-meta">
                          {isIncoming
                            ? `From: ${req.coordinator_first_name || 'Coordinator'} ${req.coordinator_last_name || ''}`
                            : `To: ${req.coordinator_first_name || 'Coordinator'} ${req.coordinator_last_name || ''}`
                          } • Sent: {new Date(req.created_at).toLocaleDateString()}
                        </div>
                        <div className="deployment-meta">
                          Students: {req.student_count || 0}{req.num_students ? ` / ${req.num_students} requested` : ''} • Strand: {req.strand || 'All'}
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
                            <h4>Students ({req.students.length})</h4>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorRequest;
