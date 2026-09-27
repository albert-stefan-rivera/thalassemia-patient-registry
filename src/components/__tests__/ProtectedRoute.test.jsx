/**
 * Tests for ProtectedRoute component
 *
 * Dev-spec requirements tested:
 * - 4.2 Controlled Access: Doctors can only view their own patients unless permission is granted
 * - 4.2 Administrator Override: Admins may assign or revoke access
 * - 7. Security: Role-based access control
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock the auth context
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>
}));

import ProtectedRoute from '../ProtectedRoute';

const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/doctor-login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute (Req 4.2 - Controlled Access / Req 7 - Security)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication enforcement', () => {
    it('should redirect unauthenticated users to login (Req 7 - Secure login required)', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should show loading state while authenticating', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
        loading: true
      });

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render children for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'doctor1', email: 'doctor@test.com' },
        userProfile: { role: 'doctor', permissions: {} },
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Role-based access control', () => {
    it('should restrict non-admin users from admin-only routes', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'doctor1' },
        userProfile: { role: 'doctor', permissions: {} },
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole="admin">
          <div data-testid="admin-content">Admin Only</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('should allow admin users to access admin-only routes (Req 4.2 Admin Override)', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'admin1' },
        userProfile: { role: 'admin', permissions: {} },
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredRole="admin">
          <div data-testid="admin-content">Admin Only</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  describe('Permission-based access control', () => {
    it('should restrict users without required permission', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'doctor1' },
        userProfile: {
          role: 'doctor',
          permissions: { canGenerateReports: false }
        },
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredPermission="canGenerateReports">
          <div data-testid="reports-content">Reports</div>
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('reports-content')).not.toBeInTheDocument();
    });

    it('should allow users with required permission', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'doctor1' },
        userProfile: {
          role: 'doctor',
          permissions: { canGenerateReports: true }
        },
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredPermission="canGenerateReports">
          <div data-testid="reports-content">Reports</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('reports-content')).toBeInTheDocument();
    });

    it('should grant admin access even without explicit permission flag (Req 4.2 Admin Override)', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'admin1' },
        userProfile: {
          role: 'admin',
          permissions: { canGenerateReports: false }
        },
        loading: false
      });

      renderWithRouter(
        <ProtectedRoute requiredPermission="canGenerateReports">
          <div data-testid="reports-content">Reports</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('reports-content')).toBeInTheDocument();
    });
  });
});
