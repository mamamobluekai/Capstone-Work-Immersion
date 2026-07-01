import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './auth.css';
import api from '../../api/axios';

const Login = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/api/auth/login', formData);
      loginUser(data.user, data.accessToken);

      const roleRoutes = {
        admin: 'admin/dashboard',
        coordinator: 'coordinator/dashboard',
        teacher: 'teacher/dashboard',
        supervisor: 'supervisor/dashboard',
        student: 'student/dashboard',
      };

      onNavigate(roleRoutes[data.user.role] || 'login');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🏫</div>
          <h1>Welcome Back</h1>
          <p>Work Immersion Management System</p>
          <p className="subtitle">Marinduque National High School</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? Register as:</p>
          <div className="role-links">
            <a href="#" className="role-link" onClick={() => onNavigate('register/student')}>Student</a>
            <a href="#" className="role-link" onClick={() => onNavigate('register/teacher')}>Teacher</a>
            <a href="#" className="role-link" onClick={() => onNavigate('register/coordinator')}>Coordinator</a>
            <a href="#" className="role-link" onClick={() => onNavigate('register/supervisor')}>Supervisor</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
