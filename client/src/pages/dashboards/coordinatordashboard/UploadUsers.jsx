import { useState } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './UploadStudents.css';

const UploadUsers = ({ onNavigate, role }) => {
  const [activeTab, setActiveTab] = useState('students');

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const getTabConfig = () => {
    switch (activeTab) {
      case 'students':
        return {
          sidebarActive: 'upload-users',
          title: 'Upload Students via Excel',
          subtitle: 'Import student records in bulk using an Excel file',
          endpoint: '/api/students/upload',
          requiredColumns: 'Student ID, First Name, Last Name, Email, Grade Level, Strand',
          optionalColumns: 'Phone',
          fileRequirementsNote:
            'Status will be set to pending. Students will receive an email to set their password.',
        };
      case 'teachers':
        return {
          sidebarActive: 'upload-users',
          title: 'Upload Teachers via Excel',
          subtitle: 'Import teacher accounts in bulk using an Excel file',
          endpoint: '/api/students/upload-teachers',
          requiredColumns:
            'Employee ID, First Name, Last Name, Email, Department, Position, Password',
          optionalColumns: 'Middle Name, Suffix, Phone Number, Gender',
          fileRequirementsNote:
            'Password must be at least 8 characters. Teachers will receive an email notification.',
        };
      case 'supervisors':
        return {
          sidebarActive: 'upload-users',
          title: 'Upload Supervisors via Excel',
          subtitle: 'Import supervisor accounts in bulk using an Excel file',
          endpoint: '/api/students/upload-supervisors',
          requiredColumns:
            'Employee ID, Company Name, Supervisor First Name, Supervisor Last Name, Position, Email, Password',
          optionalColumns: 'Department, Phone Number',
          fileRequirementsNote:
            'Password must be at least 8 characters. Supervisors will receive an email notification.',
        };
      default:
        return null;
    }
  };

  const tab = getTabConfig();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      setUploadResult(null);
      const data = await api.postForm(tab.endpoint, formData);
      setUploadResult(data);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="coordinator-layout">
      <Sidebar
        activeItem={tab.sidebarActive}
        onNavigate={onNavigate}
        onLogout={() => onNavigate?.('login')}
        role={role}
      />

      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Bulk Upload</h1>
          <p>Choose a type and upload the matching Excel file</p>
        </div>

        <div className="upload-card" style={{ marginBottom: 16 }}>
          <div className="upload-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className={`upload-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('students');
                setUploadResult(null);
                setError('');
              }}
              type="button"
            >
              Upload Students
            </button>

            <button
              className={`upload-tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('teachers');
                setUploadResult(null);
                setError('');
              }}
              type="button"
            >
              Upload Teachers
            </button>

            <button
              className={`upload-tab-btn ${activeTab === 'supervisors' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('supervisors');
                setUploadResult(null);
                setError('');
              }}
              type="button"
            >
              Upload Supervisors
            </button>
          </div>
        </div>

        <div className="upload-card">
          <div className="coordinator-header" style={{ padding: 0, marginBottom: 12 }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>{tab.title}</h1>
            <p style={{ marginTop: 6 }}>{tab.subtitle}</p>
          </div>

          <div className="upload-card-inner">
            <h2>File Requirements</h2>
            <div className="requirements-box">
              <p>
                <strong>Required columns:</strong> {tab.requiredColumns}
              </p>
              <p>
                <strong>Optional columns:</strong> {tab.optionalColumns}
              </p>
              <p>{tab.fileRequirementsNote}</p>
            </div>

            {error && <div className="upload-error">{error}</div>}

            <div className="upload-actions">
              <label className={`upload-btn ${uploading ? 'disabled' : ''}`}>
                {uploading ? 'Uploading...' : '📁 Choose Excel File'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {uploadResult && (
              <div
                className={`upload-result ${
                  uploadResult.results?.success > 0 ? 'success' : 'error'
                }`}
              >
                <strong>{uploadResult.message}</strong>
                {uploadResult.results?.errors?.length > 0 && (
                  <div className="upload-errors">
                    {uploadResult.results.errors.slice(0, 5).map((e, i) => (
                      <div key={i}>
                        Row {e.row}: {e.error}
                      </div>
                    ))}
                    {uploadResult.results.errors.length > 5 && (
                      <div>...and {uploadResult.results.errors.length - 5} more errors</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .upload-tab-btn{
          border: 1px solid rgba(0,0,0,0.15);
          background: #fff;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }
        .upload-tab-btn.active{
          border-color: #2a5298;
          color: #2a5298;
          background: rgba(42,82,152,0.08);
        }
      `}</style>
    </div>
  );
};

export default UploadUsers;
