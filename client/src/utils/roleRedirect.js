export default function navigateByRole(role) {
  const roleRoutes = {
    admin: 'admin/dashboard',
    coordinator: 'coordinator/dashboard',
    teacher: 'teacher/dashboard',
    supervisor: 'supervisor/dashboard',
    student: 'student/dashboard',
  };
  return roleRoutes[role] || 'login';
}
