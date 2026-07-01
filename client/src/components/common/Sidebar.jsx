import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Upload,
  FileCheck2,
} from 'lucide-react';
import './Sidebar.css';

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'coordinator', 'teacher', 'supervisor', 'student'] },
  { id: 'requirements', label: 'Requirements', icon: FileCheck2, roles: ['student'] },
  { id: 'upload-users', label: 'Upload User', icon: Upload, roles: ['coordinator'] },
  { id: 'students-list', label: 'Students', icon: Users, roles: ['coordinator'] },
  { id: 'teachers-list', label: 'Teachers', icon: Users, roles: ['coordinator'] },
  { id: 'supervisors-list', label: 'Supervisors', icon: Users, roles: ['coordinator'] },
  { id: 'student-requirements', label: 'Students Requirements', icon: FileCheck2, roles: ['coordinator'] },
  { id: 'assign-immersion', label: 'Assign Immersion', icon: Briefcase, roles: ['coordinator'] },
  { id: 'deployment-request', label: 'Deployment Request', icon: UserCheck, roles: ['coordinator', 'supervisor'] },
  { id: 'reports', label: 'Reports', icon: ClipboardList, roles: ['admin', 'coordinator', 'teacher', 'supervisor'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'coordinator', 'teacher', 'supervisor', 'student'] },
];

const Sidebar = ({ activeItem = 'dashboard', onNavigate, onLogout, role }) => {
  const menuItems = role
    ? allMenuItems.filter((item) => item.roles.includes(role))
    : allMenuItems;
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <GraduationCap size={28} />
        </div>
        <span className="sidebar-title">WIMS</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => onNavigate?.(item.id)}
              title={item.label}
            >
              <Icon size={22} className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
              <ChevronRight size={14} className="sidebar-arrow" />
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item sidebar-logout" onClick={onLogout} title="Logout">
          <LogOut size={22} className="sidebar-icon" />
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
