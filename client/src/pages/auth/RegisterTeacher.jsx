import { useState } from 'react';
import './auth.css';
import api from '../../api/axios';

const RegisterTeacher = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    department: '',
    phone: '',
    role: 'teacher',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/register', formData);
      setSuccess('Registration successful! Your account is pending coordinator approval. You can log in once approved.');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #3d1f1f 30%, #5c2d2d 60%, #3d1f1f 100%)' }}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">👨‍🏫</div>
          <h1>Teacher Registration</h1>
          <p>Work Immersion Management System</p>
          <p className="subtitle">Marinduque National High School</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="First name" />
            </div>
            <div className="form-group">
              <label>Last Name <span className="required">*</span></label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Last name" />
            </div>
          </div>

          <div className="form-group">
            <label>Employee ID <span className="required">*</span></label>
            <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} required placeholder="e.g., MNHS-T-001" />
          </div>

          <div className="form-group">
            <label>Email Address <span className="required">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter email" />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
          </div>

          <div className="form-group">
            <label>Department <span className="required">*</span></label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} required placeholder="e.g., Senior High School Department" />
          </div>

          <div className="form-group">
            <label>Password <span className="required">*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="Min. 8 characters" />
          </div>

          <div className="form-group">
            <label>Confirm Password <span className="required">*</span></label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={8} placeholder="Confirm password" />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register as Teacher'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="#" onClick={() => onNavigate('login')}>Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterTeacher;
