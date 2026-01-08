import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/sonner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FleetPage from './pages/FleetPage';
import EmployeesPage from './pages/EmployeesPage';
import ClientsPage from './pages/ClientsPage';
import ReservationsPage from './pages/ReservationsPage';
import GPSTrackingPage from './pages/GPSTrackingPage';
import SettingsPage from './pages/SettingsPage';
import ContractsPage from './pages/ContractsPage';
import PaymentsPage from './pages/PaymentsPage';
import MaintenancePage from './pages/MaintenancePage';
import InfractionsPage from './pages/InfractionsPage';
import ReportsPage from './pages/ReportsPage';
import SuperAdminPage from './pages/SuperAdminPage';
import MessagesPage from './pages/MessagesPage';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
    </div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on role
    if (user.role === 'superadmin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  // Determine default redirect based on role
  const getDefaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/admin';
    return '/dashboard';
  };
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getDefaultRoute()} replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/fleet" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><FleetPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute allowedRoles={['locateur']}><EmployeesPage /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><ClientsPage /></ProtectedRoute>} />
      <Route path="/gps-tracking" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><GPSTrackingPage /></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><ReservationsPage /></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><ContractsPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><PaymentsPage /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><MaintenancePage /></ProtectedRoute>} />
      <Route path="/infractions" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><InfractionsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['locateur']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute allowedRoles={['locateur', 'employee']}><MessagesPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <AppRoutes />
            <Toaster position="top-right" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
