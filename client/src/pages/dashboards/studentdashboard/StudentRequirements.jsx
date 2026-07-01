import { useEffect, useMemo, useState, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Save,
  Send,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './StudentRequirements.css';

const industries = [
  'Information Technology',
  'Business',
  'Hospitality',
  'Engineering',
  'Healthcare',
  'Education',
  'Government',
  'Manufacturing',
  'Retail',
  'Others',
];

const initialForm = {
  student_number: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  gender: '',
  birthdate: '',
  age: '',
  contact_number: '',
  email: '',
  home_address: '',
  grade_level: '',
  section: '',
  track_strand: '',
  school: '',
  preferred_industry: '',
  preferred_company: '',
  career_goal: '',
  industry_reason: '',
  guardian_name: '',
  guardian_relationship: '',
  guardian_contact: '',
  guardian_email: '',
  guardian_address: '',
  emergency_contact: '',
  emergency_contact_number: '',
  academic_notes: '',
};

const documentGroups = {
  guardian: [{ code: 'guardian_consent', name: 'Signed Consent Form' }],
  medical: [
    { code: 'medical_certificate', name: 'Medical Certificate' },
    { code: 'accident_insurance', name: 'Accident Insurance' },
    { code: 'vaccination_record', name: 'Vaccination Record' },
    { code: 'emergency_contact_form', name: 'Emergency Contact Form' },
  ],
  academic: [
    { code: 'form_138', name: 'Form 138' },
    { code: 'good_moral', name: 'Good Moral Certificate' },
    { code: 'psa_birth_certificate', name: 'PSA Birth Certificate' },
    { code: 'id_picture', name: '2x2 ID Picture' },
    { code: 'student_profile_form', name: 'Student Profile Form' },
  ],
};

const fileBaseUrl = 'http://localhost:5000/';

const StudentRequirements = ({ onNavigate, onLogout, role = 'student' }) => {
  const [form, setForm] = useState(initialForm);
  const [documents, setDocuments] = useState([]);
  const [progress, setProgress] = useState(0);
  const [sections, setSections] = useState({});
  const [submission, setSubmission] = useState(null);
  const [logs, setLogs] = useState([]);
  const [openSections, setOpenSections] = useState({ personal: true, guardian: true, medical: true, academic: true });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lastSavedRef = useRef(null);

  const docsByCode = useMemo(() => {
    const map = {};
    documents.forEach((doc) => { map[doc.code] = doc; });
    return map;
  }, [documents]);

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      const data = await api.get('/api/requirements/me');
      if (data.student) {
        const next = { ...initialForm };
        Object.keys(next).forEach((key) => {
          next[key] = data.student[key] || '';
        });
        if (next.birthdate) next.birthdate = String(next.birthdate).slice(0, 10);
        setForm(next);
      }
      setDocuments(data.documents || []);
      setProgress(data.progress || 0);
      setSections(data.sections || {});
      setSubmission(data.submission || null);
      setLogs(data.logs || []);
    } catch (err) {
      setToast(err.message || 'Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    const serialized = JSON.stringify(form);
    if (serialized === lastSavedRef.current) return;
    try {
      setSaving(true);
      const data = await api.put('/api/requirements', form);
      lastSavedRef.current = serialized;
      setProgress(data.progress || 0);
      setSections(data.sections || {});
      setSubmission(data.submission || null);
      setErrors({});
    } catch (err) {
      setErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleUpload = async (code, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('document_code', code);
    formData.append('file', file);
    try {
      const data = await api.postForm('/api/upload', formData);
      setToast('File uploaded successfully.');
      setProgress(data.progress || progress);
      await loadRequirements();
    } catch (err) {
      setToast(err.message || 'Upload failed.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/requirements/document/${id}`);
      setToast('Document deleted.');
      await loadRequirements();
    } catch (err) {
      setToast(err.message || 'Unable to delete document.');
    }
  };

  const submitRequirements = async () => {
    try {
      await saveDraft();
      const data = await api.post('/api/requirements', form);
      setConfirmOpen(false);
      setToast(data.message || 'Requirements submitted successfully.');
      await loadRequirements();
    } catch (err) {
      setToast(err.message || 'Complete every required section before submitting.');
    }
  };

  const renderInput = (label, field, type = 'text', required = true) => (
    <label className="req-field">
      <span>{label}{required && <b>*</b>}</span>
      <input
        type={type}
        value={form[field] || ''}
        onChange={(e) => updateField(field, e.target.value)}
        className={errors[field] ? 'invalid' : ''}
      />
      {errors[field] && <small>{errors[field]}</small>}
    </label>
  );

  const renderDocument = (item) => {
    const doc = docsByCode[item.code];
    return (
      <div className="doc-row" key={item.code}>
        <div>
          <strong>{item.name}</strong>
          <span className={`doc-status ${doc?.status?.toLowerCase() || 'pending'}`}>{doc?.status || 'Pending'}</span>
          {doc?.remarks && <p className="doc-remarks">Feedback: {doc.remarks}</p>}
          {doc?.original_name && (
            <a href={`${fileBaseUrl}${doc.file_path.replaceAll('\\', '/')}`} target="_blank" rel="noreferrer">
              Preview {doc.original_name}
            </a>
          )}
        </div>
        <div className="doc-actions">
          <label className="icon-btn text-btn">
            <UploadCloud size={18} />
            {doc ? 'Replace' : 'Upload'}
            <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={(e) => handleUpload(item.code, e.target.files?.[0])} hidden />
          </label>
          {doc && (
            <button className="icon-btn danger" type="button" onClick={() => handleDelete(doc.id)} title="Delete document">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ id, title, complete, children }) => (
    <section className="req-card">
      <button className="req-section-header" type="button" onClick={() => setOpenSections((s) => ({ ...s, [id]: !s[id] }))}>
        <span><ClipboardCheck size={20} /> {title}</span>
        <span className={complete ? 'complete-pill' : 'pending-pill'}>{complete ? 'Complete' : 'Pending'}</span>
        <ChevronDown className={openSections[id] ? 'rotated' : ''} size={18} />
      </button>
      {openSections[id] && <div className="req-section-body">{children}</div>}
    </section>
  );

  return (
    <div className="requirements-shell">
      <Sidebar activeItem="requirements" onNavigate={onNavigate} onLogout={onLogout} role={role} />
      <main className="requirements-main">
        <div className="requirements-topbar">
          <div>
            <h1>Student Requirements Submission</h1>
            <p>Work Immersion Management System</p>
          </div>
          <button className="icon-btn" type="button" onClick={saveDraft} title="Save draft">
            <Save size={18} />
          </button>
        </div>

        <div className="progress-card">
          <div className="progress-copy">
            <h2>Requirements Progress</h2>
            <strong>{progress}% Complete</strong>
            <div className="progress-steps">
              <span className={sections.personalComplete ? 'done' : ''}>Personal Information</span>
              <span className={sections.guardianComplete ? 'done' : ''}>Guardian Consent</span>
              <span className={sections.medicalComplete ? 'done' : ''}>Medical Documents</span>
              <span className={sections.academicComplete ? 'done' : ''}>Academic Records</span>
            </div>
          </div>
          <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
          <span className="autosave">{saving ? 'Saving...' : 'Progress auto-saved'}</span>
        </div>

        {loading ? (
          <div className="skeleton-grid"><div /><div /><div /></div>
        ) : (
          <>
            <Section id="personal" title="Personal Information" complete={sections.personalComplete}>
              <div className="req-grid">
                {renderInput('Student ID', 'student_number')}
                {renderInput('First Name', 'first_name')}
                {renderInput('Middle Name', 'middle_name', 'text', false)}
                {renderInput('Last Name', 'last_name')}
                {renderInput('Suffix', 'suffix', 'text', false)}
                {renderInput('Gender', 'gender')}
                {renderInput('Birthdate', 'birthdate', 'date')}
                {renderInput('Age', 'age', 'number')}
                {renderInput('Contact Number', 'contact_number')}
                {renderInput('Email Address', 'email', 'email')}
                {renderInput('Grade Level', 'grade_level')}
                {renderInput('Section', 'section')}
                {renderInput('Track/Strand', 'track_strand')}
                {renderInput('School', 'school')}
                <label className="req-field">
                  <span>Preferred Industry<b>*</b></span>
                  <select value={form.preferred_industry} onChange={(e) => updateField('preferred_industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {industries.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                {renderInput('Preferred Company (Optional)', 'preferred_company', 'text', false)}
              </div>
              <label className="req-field wide"><span>Home Address<b>*</b></span><textarea value={form.home_address} onChange={(e) => updateField('home_address', e.target.value)} /></label>
              <label className="req-field wide"><span>Career Goal<b>*</b></span><textarea value={form.career_goal} onChange={(e) => updateField('career_goal', e.target.value)} /></label>
              <label className="req-field wide"><span>Why do you want this industry?<b>*</b></span><textarea value={form.industry_reason} onChange={(e) => updateField('industry_reason', e.target.value)} /></label>
            </Section>

            <Section id="guardian" title="Parent / Guardian Information" complete={sections.guardianComplete}>
              <div className="req-grid">
                {renderInput('Guardian Name', 'guardian_name')}
                {renderInput('Relationship', 'guardian_relationship')}
                {renderInput('Contact Number', 'guardian_contact')}
                {renderInput('Email Address', 'guardian_email', 'email')}
                {renderInput('Emergency Contact', 'emergency_contact')}
                {renderInput('Emergency Contact Number', 'emergency_contact_number')}
              </div>
              <label className="req-field wide"><span>Address<b>*</b></span><textarea value={form.guardian_address} onChange={(e) => updateField('guardian_address', e.target.value)} /></label>
              <div className="docs-list">{documentGroups.guardian.map(renderDocument)}</div>
            </Section>

            <Section id="medical" title="Medical & Insurance Documents" complete={sections.medicalComplete}>
              <div className="docs-list">{documentGroups.medical.map(renderDocument)}</div>
            </Section>

            <Section id="academic" title="Academic Records" complete={sections.academicComplete}>
              <div className="docs-list">{documentGroups.academic.map(renderDocument)}</div>
              <label className="req-field wide"><span>Notes</span><textarea value={form.academic_notes} onChange={(e) => updateField('academic_notes', e.target.value)} /></label>
            </Section>

            <div className="student-dashboard-card">
              <h2>Student Dashboard</h2>
              <div className="dashboard-mini-grid">
                <span>Submission Date <b>{submission?.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not submitted'}</b></span>
                <span>Current Status <b>{submission?.status || 'Pending'}</b></span>
                <span>Coordinator Feedback <b>{submission?.coordinator_feedback || 'No feedback yet'}</b></span>
              </div>
              <h3>Recent Activity Timeline</h3>
              <div className="timeline">{logs.length ? logs.map((log) => <p key={log.id}>{log.action} - {new Date(log.created_at).toLocaleString()}</p>) : <p>No activity yet.</p>}</div>
            </div>

            <button className="submit-requirements" disabled={progress < 100} onClick={() => setConfirmOpen(true)}>
              <Send size={18} /> Submit Requirements
            </button>
          </>
        )}
      </main>

      {toast && <div className="toast"><AlertCircle size={18} /> {toast}<button onClick={() => setToast('')}><X size={14} /></button></div>}
      {confirmOpen && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <CheckCircle2 size={42} />
            <h2>Submit requirements?</h2>
            <p>Your files and information will be sent to the coordinator for review.</p>
            <div>
              <button className="ghost-btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="submit-requirements" onClick={submitRequirements}>Confirm Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRequirements;
