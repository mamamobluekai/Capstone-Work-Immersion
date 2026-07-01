import { useState, useEffect } from 'react';
import api from '../../api/axios';
import './auth.css';

const SetPassword = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('No activation token found. Please use the link from your email.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/password/set-password', { token, password });

      setSuccess('Password set successfully! Redirecting to login...');
      setTimeout(() => onNavigate?.('login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2a5298 50%, #1a3a5c 100%)' }}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔐</div>
          <h1>Set Your Password</h1>
          <p>Work Immersion Management System</p>
          <p className="subtitle">Marinduque National High School</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>New Password <span className="required">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password <span className="required">*</span></label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Setting Password...' : 'Activate Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="#" onClick={() => onNavigate?.('login')}>Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
