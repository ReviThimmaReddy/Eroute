import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeToggleProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import PortalLayout from './components/layout/PortalLayout';
import Loader from './components/common/Loader';

// Landing & Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentPass from './pages/student/StudentPass';
import StudentDigitalPass from './pages/student/StudentDigitalPass';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentTripHistory from './pages/student/StudentTripHistory';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentFeedback from './pages/student/StudentFeedback';
import StudentProfile from './pages/student/StudentProfile';

// Staff Pages
import ConductorDashboard from './pages/conductor/ConductorDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();

  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  if (!role || !['admin', 'conductor', 'student'].includes(role)) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return <PortalLayout>{children}</PortalLayout>;
};

export const AppContent: React.FC = () => {
  const { currentUser, role, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public Authentication Routes */}
        <Route 
          path="/login" 
          element={currentUser && role && ['student', 'admin', 'conductor'].includes(role) ? <Navigate to={`/${role}/dashboard`} replace /> : <Login />} 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Portal Sub-routes */}
        <Route 
          path="/admin" 
          element={<Navigate to="/admin/dashboard" replace />} 
        />
        <Route 
          path="/admin/dashboard" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="dashboard" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/students" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="students" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/buses" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="buses" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/routes" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="routes" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/stops" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="stops" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/staff" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="staff" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/passes" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="passes" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/pricing" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="pricing" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/attendance" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="attendance" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/reports" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="reports" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/notifications" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="notifications" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/audit" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="audit" /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/settings" 
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard tab="settings" /></ProtectedRoute>} 
        />

        {/* Student Portal Routes */}
        <Route 
          path="/student" 
          element={<Navigate to="/student/dashboard" replace />} 
        />
        <Route 
          path="/student/dashboard" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/student/pass" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentPass /></ProtectedRoute>} 
        />
        <Route 
          path="/student/pass/digital" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentDigitalPass /></ProtectedRoute>} 
        />
        <Route 
          path="/student/attendance" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} 
        />
        <Route 
          path="/student/trips" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentTripHistory /></ProtectedRoute>} 
        />
        <Route 
          path="/student/notifications" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} 
        />
        <Route 
          path="/student/feedback" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentFeedback /></ProtectedRoute>} 
        />
        <Route 
          path="/student/profile" 
          element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} 
        />

        {/* Conductor Portal Routes */}
        <Route 
          path="/conductor" 
          element={<Navigate to="/conductor/dashboard" replace />} 
        />
        <Route 
          path="/conductor/dashboard" 
          element={<ProtectedRoute allowedRoles={['conductor']}><ConductorDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/conductor/scanner" 
          element={<ProtectedRoute allowedRoles={['conductor']}><ConductorDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/conductor/roster" 
          element={<ProtectedRoute allowedRoles={['conductor']}><ConductorDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/conductor/attendance" 
          element={<ProtectedRoute allowedRoles={['conductor']}><ConductorDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/conductor/trips" 
          element={<ProtectedRoute allowedRoles={['conductor']}><ConductorDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/conductor/profile" 
          element={<ProtectedRoute allowedRoles={['conductor']}><ConductorDashboard /></ProtectedRoute>} 
        />

        {/* Root Fallback */}
        <Route 
          path="*" 
          element={<Navigate to={currentUser && role && ['student', 'admin', 'conductor'].includes(role) ? `/${role}/dashboard` : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeToggleProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeToggleProvider>
  );
};

export default App;
