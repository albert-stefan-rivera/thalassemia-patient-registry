import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import PatientFormPage from './components/PatientFormPage';
import ConfirmationPage from './components/ConfirmationPage';
import DoctorLogin from './components/DoctorLogin';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import PatientDetail from './components/PatientDetail';
import PhilHealthReport from './components/PhilHealthReport';
import AuditLogViewer from './components/AuditLogViewer';
import ProtectedRoute from './components/ProtectedRoute';
import { LogOut, User, Settings, Menu, X } from 'lucide-react';

// Main Layout Component
const Layout = ({ children }) => {
  const { currentUser, logout, userProfile } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">Thalassemia Registry</span>
              </Link>

              {currentUser && (
                <div className="hidden md:flex ml-10 space-x-4">
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/patients/new"
                    className="px-3 py-2 text-gray-700 hover:text-blue-600"
                  >
                    New Patient
                  </Link>
                  {userProfile?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className="px-3 py-2 text-gray-700 hover:text-blue-600"
                      >
                        Admin
                      </Link>
                      <Link
                        to="/reports"
                        className="px-3 py-2 text-gray-700 hover:text-blue-600"
                      >
                        Reports
                      </Link>
                      <Link
                        to="/audit-logs"
                        className="px-3 py-2 text-gray-700 hover:text-blue-600"
                      >
                        Audit Logs
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700 hidden sm:block">
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{currentUser.displayName}</p>
                        <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/doctor-login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Doctor Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Thalassemia Patient Registry © {new Date().getFullYear()}
            </p>
            <p className="text-sm text-gray-500">
              Compliant with Philippine Data Privacy Act
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />
            <Route path="/patient-form" element={<PatientFormPage />} />
            <Route path="/confirmation/:id?" element={<ConfirmationPage />} />

            {/* Protected Routes - All Authenticated Users */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/patient/:id" element={
              <ProtectedRoute>
                <PatientDetail />
              </ProtectedRoute>
            } />

            <Route path="/patients/new" element={
              <ProtectedRoute>
                <PatientFormPage />
              </ProtectedRoute>
            } />

            <Route path="/patients/:id/edit" element={
              <ProtectedRoute>
                <PatientFormPage isEditMode={true} />
              </ProtectedRoute>
            } />

            {/* Admin Only Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute requiredPermission="canGenerateReports">
                <PhilHealthReport />
              </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
              <ProtectedRoute requiredRole="admin">
                <AuditLogViewer />
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
