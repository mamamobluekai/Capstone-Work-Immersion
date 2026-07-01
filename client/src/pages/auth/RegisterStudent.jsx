import { useState } from 'react';
import './auth.css';
import api from '../../api/axios';

const RegisterStudent = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    student_id: '',
    grade_level: '12',
    strand: '',
    phone: '',
    role: 'student',
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
      setSuccess('Registration successful! Your account is pending approval. You can log in once approved.');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #2d1515 0%, #4a1c1c 30%, #6b2727 60%, #4a1c1c 100%)' }}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📚</div>
          <h1>Student Registration</h1>
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
            <label>Student ID <span className="required">*</span></label>
            <input type="text" name="student_id" value={formData.student_id} onChange={handleChange} required placeholder="e.g., MNHS-2024-001" />
          </div>

          <div className="form-group">
            <label>Email Address <span className="required">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter email" />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Strand <span className="required">*</span></label>
              <select name="strand" value={formData.strand} onChange={handleChange} required>
                <option value="">Select strand</option>
                <option value="ABM">ABM</option>
                <option value="GAS">GAS</option>
                <option value="HUMSS">HUMSS</option>
                <option value="STEM">STEM</option>
                <option value="TVL-ICT">TVL-ICT</option>
                <option value="TVL-HE">TVL-HE</option>
                <option value="TVL-IA">TVL-IA</option>
              </select>
            </div>
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
            {loading ? 'Registering...' : 'Register as Student'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="#" onClick={() => onNavigate('login')}>Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
