import React from 'react';
import AdminOverview from './AdminOverview';
import AdminStudents from './AdminStudents';
import AdminBuses from './AdminBuses';
import AdminRoutes from './AdminRoutes';
import AdminStops from './AdminStops';
import AdminStaff from './AdminStaff';
import AdminPasses from './AdminPasses';
import AdminAttendance from './AdminAttendance';
import AdminReports from './AdminReports';
import AdminNotifications from './AdminNotifications';
import AdminAuditLogs from './AdminAuditLogs';
import AdminSettings from './AdminSettings';
import AdminPassPricing from './AdminPassPricing';

interface AdminDashboardProps {
  tab: 'dashboard' | 'students' | 'buses' | 'routes' | 'stops' | 'staff' | 'passes' | 'pricing' | 'attendance' | 'reports' | 'notifications' | 'audit' | 'settings';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tab }) => {
  switch (tab) {
    case 'dashboard':
      return <AdminOverview />;
    case 'students':
      return <AdminStudents />;
    case 'buses':
      return <AdminBuses />;
    case 'routes':
      return <AdminRoutes />;
    case 'stops':
      return <AdminStops />;
    case 'staff':
      return <AdminStaff />;
    case 'passes':
      return <AdminPasses />;
    case 'pricing':
      return <AdminPassPricing />;
    case 'attendance':
      return <AdminAttendance />;
    case 'reports':
      return <AdminReports />;
    case 'notifications':
      return <AdminNotifications />;
    case 'audit':
      return <AdminAuditLogs />;
    case 'settings':
      return <AdminSettings />;
    default:
      return <AdminOverview />;
  }
};
export default AdminDashboard;
