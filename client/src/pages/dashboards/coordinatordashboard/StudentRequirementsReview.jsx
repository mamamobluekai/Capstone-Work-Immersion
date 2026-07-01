import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, FileCheck2, Search, XCircle } from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import '../studentdashboard/StudentRequirements.css';
import './StudentRequirementsReview.css';

const fileBaseUrl = 'http://localhost:5000/';

const StudentRequirementsReview = ({ onNavigate, role = 'coordinator' }) => {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [status]);

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((item) => ['Pending Review', 'Submitted', 'Under Review'].includes(item.status)).length,
    approved: submissions.filter((item) => item.status === 'Approved').length,
    rejected: submissions.filter((item) => ['Rejected', 'Needs Revision'].includes(item.status)).length,
  }), [submissions]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status', status);
      if (search) params.set('search', search);
      const data = await api.get(`/api/requirements/submissions?${params.toString()}`);
      setSubmissions(data.submissions || []);
    } catch (err) {
      setMessage(err.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (submission) => {
    setSelected(submission);
    setRemarks(submission.coordinator_feedback || '');
    try {
      const data = await api.get(`/api/requirements/${submission.student_id}`);
      setDetails(data);
    } catch (err) {
      setMessage(err.message || 'Failed to load student requirements.');
    }
  };

  const reviewSubmission = async (nextStatus) => {
    if ((nextStatus === 'Rejected' || nextStatus === 'Needs Revision') && !remarks.trim()) {
      setMessage('Remarks are required when rejecting or requesting revision.');
      return;
    }
    try {
      await api.patch(`/api/requirements/submissions/${selected.id}/review`, { status: nextStatus, remarks });
      setMessage(`Submission marked as ${nextStatus}.`);
      await loadSubmissions();
      await loadDetails(selected);
    } catch (err) {
      setMessage(err.message || 'Unable to update submission.');
    }
  };

  const verifyDocument = async (documentId, nextStatus) => {
    const note = nextStatus === 'Rejected' ? window.prompt('Coordinator feedback for this document:') : '';
    if (nextStatus === 'Rejected' && !note) return;
    try {
      await api.patch(`/api/requirements/document/${documentId}/verify`, { status: nextStatus, remarks: note });
      await loadDetails(selected);
    } catch (err) {
      setMessage(err.message || 'Unable to review document.');
    }
  };

  const filtered = submissions;

  return (
    <div className="requirements-shell">
      <Sidebar activeItem="student-requirements" onNavigate={onNavigate} onLogout={() => onNavigate?.('login')} role={role} />
      <main className="requirements-main review-main">
        <div className="requirements-topbar">
          <div>
            <h1>Students Requirements</h1>
            <p>Review submissions, verify documents, and update student requirement status.</p>
          </div>
          <button className="icon-btn text-btn" onClick={() => window.print()}><Download size={18} /> Export</button>
        </div>

        <div className="review-stats">
          <span>Total <b>{stats.total}</b></span>
          <span>For Review <b>{stats.pending}</b></span>
          <span>Approved <b>{stats.approved}</b></span>
          <span>Needs Action <b>{stats.rejected}</b></span>
        </div>

        <div className="review-toolbar">
          <label>
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadSubmissions()} placeholder="Search students..." />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Needs Revision">Needs Revision</option>
          </select>
          <button className="icon-btn text-btn" onClick={loadSubmissions}>Search</button>
        </div>

        <div className="review-grid">
          <section className="req-card review-list">
            <h2>Submissions</h2>
            {loading ? <p className="empty-review">Loading submissions...</p> : filtered.length === 0 ? <p className="empty-review">No requirement submissions found.</p> : filtered.map((item) => (
              <button key={item.id} className={`submission-row ${selected?.id === item.id ? 'active' : ''}`} onClick={() => loadDetails(item)}>
                <span>
                  <b>{item.first_name} {item.last_name}</b>
                  <small>{item.student_number} • {item.grade_level || 'Grade'} • {item.track_strand || 'Strand'}</small>
                </span>
                <span className="doc-status uploaded">{item.status}</span>
                <strong>{item.progress}%</strong>
              </button>
            ))}
          </section>

          <section className="req-card review-detail">
            {!selected ? (
              <div className="empty-detail"><FileCheck2 size={42} /><p>Select a student submission to review uploaded files.</p></div>
            ) : (
              <>
                <div className="detail-header">
                  <div>
                    <h2>{selected.first_name} {selected.last_name}</h2>
                    <p>{selected.student_number} • {selected.email}</p>
                  </div>
                  <span className="doc-status uploaded">{details?.progress || selected.progress}% Complete</span>
                </div>

                <div className="docs-list">
                  {(details?.documents || []).map((doc) => (
                    <div className="doc-row" key={doc.id}>
                      <div>
                        <strong>{doc.document_name}</strong>
                        <span className={`doc-status ${doc.status?.toLowerCase()}`}>{doc.status}</span>
                        {doc.remarks && <p className="doc-remarks">Feedback: {doc.remarks}</p>}
                        <a href={`${fileBaseUrl}${doc.file_path.replaceAll('\\', '/')}`} target="_blank" rel="noreferrer">View uploaded file</a>
                      </div>
                      <div className="doc-actions">
                        <button className="icon-btn" title="Verify document" onClick={() => verifyDocument(doc.id, 'Verified')}><CheckCircle2 size={18} /></button>
                        <button className="icon-btn danger" title="Reject document" onClick={() => verifyDocument(doc.id, 'Rejected')}><XCircle size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <label className="req-field wide">
                  <span>Coordinator Feedback / Remarks</span>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks for rejection, revision, or guidance." />
                </label>

                <div className="review-actions">
                  <button className="icon-btn text-btn" onClick={() => reviewSubmission('Under Review')}>Under Review</button>
                  <button className="submit-requirements" onClick={() => reviewSubmission('Approved')}>Approve Requirements</button>
                  <button className="icon-btn text-btn" onClick={() => reviewSubmission('Needs Revision')}>Request Resubmission</button>
                  <button className="icon-btn danger text-btn" onClick={() => reviewSubmission('Rejected')}>Reject</button>
                </div>

                <div className="student-dashboard-card">
                  <h3>Recent Activity Timeline</h3>
                  <div className="timeline">{details?.logs?.length ? details.logs.map((log) => <p key={log.id}>{log.action} - {new Date(log.created_at).toLocaleString()}</p>) : <p>No activity yet.</p>}</div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      {message && <div className="toast">{message}<button onClick={() => setMessage('')}>x</button></div>}
    </div>
  );
};

export default StudentRequirementsReview;
