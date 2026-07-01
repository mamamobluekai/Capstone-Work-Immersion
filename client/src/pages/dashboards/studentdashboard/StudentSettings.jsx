import { useEffect, useState } from 'react';
import { Moon, Sun, User, Bell, Shield, Save } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './StudentSettings.css';

const StudentSettings = ({ onNavigate, onLogout, role = 'student' }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('student-dark-mode') === 'true');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    document.body.classList.toggle('student-dark-mode', dark);
    localStorage.setItem('student-dark-mode', String(dark));
  }, [dark]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSaving(false);
    setToast('Settings saved.');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div className="settings-shell">
      <Sidebar activeItem="settings" onNavigate={onNavigate} onLogout={onLogout} role={role} />
      <main className="settings-main">
        <div className="settings-topbar">
          <div>
            <h1>Settings</h1>
            <p>Manage your preferences</p>
          </div>
        </div>

        <section className="settings-card">
          <div className="settings-section-header">
            <Moon size={20} />
            <h2>Appearance</h2>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <strong>Night Mode</strong>
              <span>Switch between light and dark theme</span>
            </div>
            <button
              className={`toggle-btn ${dark ? 'active' : ''}`}
              type="button"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle night mode"
            >
              <span className="toggle-track">
                <span className="toggle-thumb">{dark ? <Moon size={12} /> : <Sun size={12} />}</span>
              </span>
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-header">
            <Bell size={20} />
            <h2>Notifications</h2>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <strong>Email Notifications</strong>
              <span>Receive updates about your requirements</span>
            </div>
            <button
              className={`toggle-btn ${notifications ? 'active' : ''}`}
              type="button"
              onClick={() => setNotifications((v) => !v)}
              aria-label="Toggle notifications"
            >
              <span className="toggle-track">
                <span className="toggle-thumb"><Bell size={12} /></span>
              </span>
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-header">
            <Shield size={20} />
            <h2>Account</h2>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <strong>Change Password</strong>
              <span>Update your account password</span>
            </div>
            <button className="ghost-btn" type="button" disabled>Coming soon</button>
          </div>
        </section>

        <button className="save-settings" type="button" onClick={handleSave} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {toast && <div className="settings-toast">{toast}</div>}
      </main>
    </div>
  );
};

export default StudentSettings;
