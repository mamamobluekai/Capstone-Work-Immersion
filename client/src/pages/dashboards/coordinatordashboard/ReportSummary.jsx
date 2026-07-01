import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './DashboardHome.css';

const emptyForm = {
  title: '',
  recipientEmail: '',
  message: '',
};

const ReportSummary = ({ onNavigate, role, activeItem = 'reports' }) => {
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [summaryRes, reportsRes] = await Promise.all([
        api.get('/api/reports/summary'),
        api.get('/api/reports'),
      ]);
      setSummary(summaryRes?.data?.summary || null);
      setReports(reportsRes?.data?.reports || []);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setFeedback({ type: 'error', message: 'Unable to load report data right now.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipientEmail.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an admin email address.' });
      return;
    }

    setSending(true);
    setFeedback({ type: '', message: '' });
    try {
      const response = await api.post('/api/reports/send-to-admin', {
        recipient_email: form.recipientEmail.trim(),
        title: form.title.trim() || 'Work Immersion Summary Report',
        message: form.message.trim(),
      });
      const createdReport = response?.data?.report;
      if (createdReport) {
        setReports((prev) => [createdReport, ...prev]);
      }
      setForm(emptyForm);
      setFeedback({ type: 'success', message: 'Report sent successfully to the admin.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to send report.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="coordinator-layout">
        <Sidebar activeItem={activeItem} onNavigate={onNavigate} role={role} />
        <div className="coordinator-main">
          <p>Loading report workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coordinator-layout">
      <Sidebar activeItem={activeItem} onNavigate={onNavigate} role={role} />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Reports</h1>
          <p>Create a detailed report for the admin and track the reports you have sent.</p>
        </div>

        <div className="report-shell">
          <div className="report-card">
            <h2>Generate Report</h2>
            <form className="report-form" onSubmit={handleSubmit}>
              <label>
                Report Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Weekly Coordinator Report"
                />
              </label>
              <label>
                Admin Email
                <input
                  value={form.recipientEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="admin@school.edu"
                  type="email"
                />
              </label>
              <label>
                Notes for Admin
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Add any updates, concerns, or highlights for the administration."
                />
              </label>
              <button className="report-submit" disabled={sending} type="submit">
                {sending ? 'Sending...' : 'Send Report to Admin'}
              </button>
            </form>
            {feedback.message ? (
              <div className={`report-feedback ${feedback.type}`}>{feedback.message}</div>
            ) : null}
          </div>

          <div className="report-card">
            <h2>Current Summary</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{summary?.total_students || 0}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card stat-pending">
                <div className="stat-value">{summary?.pending_students || 0}</div>
                <div className="stat-label">Pending ({summary?.pending_rate || 0}%)</div>
              </div>
              <div className="stat-card stat-approved">
                <div className="stat-value">{summary?.approved_students || 0}</div>
                <div className="stat-label">Approved ({summary?.approval_rate || 0}%)</div>
              </div>
              <div className="stat-card stat-disapproved">
                <div className="stat-value">{summary?.disapproved_students || 0}</div>
                <div className="stat-label">Disapproved ({summary?.disapproval_rate || 0}%)</div>
              </div>
            </div>
            <div className="report-mini-grid">
              <div className="report-mini-card">
                <strong>{summary?.requirements_completion_rate || 0}%</strong>
                <div>Requirement Completion</div>
              </div>
              <div className="report-mini-card">
                <strong>{summary?.deployed_students || 0}</strong>
                <div>Students Deployed</div>
              </div>
            </div>
            {summary?.flagged_issues?.length ? (
              <div style={{ marginTop: '16px' }}>
                <strong style={{ color: '#b91c1c' }}>Flagged Issues</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '8px', color: '#b91c1c' }}>
                  {summary.flagged_issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="report-card" style={{ marginTop: '20px' }}>
          <h2>Sent Reports</h2>
          {reports.length ? (
            <div className="report-list">
              {reports.map((report) => (
                <div className="report-item" key={report.id}>
                  <div className="report-item-header">
                    <strong>{report.title}</strong>
                    <span className="report-badge">{report.status}</span>
                  </div>
                  <p className="report-date">{new Date(report.created_at).toLocaleString()}</p>
                  <p className="report-message">Sent to: {report.recipient_email}</p>
                  {report.message ? <p className="report-message">{report.message}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="report-empty">No reports have been sent yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportSummary;