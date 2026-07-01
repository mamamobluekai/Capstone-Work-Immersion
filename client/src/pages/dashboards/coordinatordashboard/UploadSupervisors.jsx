import { useState } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './UploadStudents.css';

const UploadSupervisors = ({ onNavigate, role }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

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
      const data = await api.postForm('/api/students/upload-supervisors', formData);
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
      <Sidebar activeItem="upload-supervisors" onNavigate={onNavigate} onLogout={() => onNavigate?.('login')} role={role} />
      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Upload Supervisors via Excel</h1>
          <p>Import supervisor accounts in bulk using an Excel file</p>
        </div>

        <div className="upload-card">
          <h2>File Requirements</h2>
          <div className="requirements-box">
            <p><strong>Required columns:</strong> Employee ID, Company Name, Supervisor First Name, Supervisor Last Name, Position, Email, Password</p>
            <p><strong>Optional columns:</strong> Department, Phone Number</p>
            <p>Password must be at least 8 characters. Supervisors will receive an email notification.</p>
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
            <div className={`upload-result ${uploadResult.results?.success > 0 ? 'success' : 'error'}`}>
              <strong>{uploadResult.message}</strong>
              {uploadResult.results?.errors?.length > 0 && (
                <div className="upload-errors">
                  {uploadResult.results.errors.slice(0, 5).map((e, i) => (
                    <div key={i}>Row {e.row}: {e.error}</div>
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
  );
};

export default UploadSupervisors;
