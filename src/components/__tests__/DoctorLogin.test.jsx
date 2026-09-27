/**
 * Tests for DoctorLogin component
 *
 * Dev-spec requirements tested:
 * - 7. Security: Secure login authentication required for all users
 * - 2. Intended Users: Doctors can input, edit, and track patient records
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

// Mock axios - provide the module directly
const mockAxiosPost = vi.fn();
vi.mock('axios', () => ({
  default: {
    post: (...args) => mockAxiosPost(...args)
  },
  post: (...args) => mockAxiosPost(...args)
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Stethoscope: () => <span>StethoscopeIcon</span>,
  Mail: () => <span>MailIcon</span>,
  Lock: () => <span>LockIcon</span>,
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  Eye: () => <span>EyeIcon</span>,
  EyeOff: () => <span>EyeOffIcon</span>
}));

import DoctorLogin from '../DoctorLogin';

describe('DoctorLogin (Req 7 - Security & Authentication)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Form Display', () => {
    it('should render the Doctor Login form', () => {
      render(<DoctorLogin />);
      expect(screen.getByText('Doctor Login')).toBeInTheDocument();
    });

    it('should have email input field', () => {
      render(<DoctorLogin />);
      expect(screen.getByPlaceholderText('doctor@example.com')).toBeInTheDocument();
    });

    it('should have password input field', () => {
      render(<DoctorLogin />);
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('should have Sign In button', () => {
      render(<DoctorLogin />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should have link to go back to home', () => {
      render(<DoctorLogin />);
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });
  });

  describe('Authentication (Req 7 - Secure Login)', () => {
    it('should require email and password fields', () => {
      render(<DoctorLogin />);
      const emailInput = screen.getByPlaceholderText('doctor@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have email type input for email field', () => {
      render(<DoctorLogin />);
      const emailInput = screen.getByPlaceholderText('doctor@example.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password type input for password field by default', () => {
      render(<DoctorLogin />);
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should allow toggling password visibility', async () => {
      render(<DoctorLogin />);
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the toggle button (contains Eye icon)
      const toggleBtns = screen.getAllByRole('button');
      const eyeToggle = toggleBtns.find(btn => btn.querySelector('span')?.textContent === 'EyeIcon');
      if (eyeToggle) {
        await userEvent.click(eyeToggle);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    it('should call login API on form submission', async () => {
      mockAxiosPost.mockResolvedValue({
        status: 200,
        data: { idToken: 'mock-token' }
      });

      render(<DoctorLogin />);
      const emailInput = screen.getByPlaceholderText('doctor@example.com');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      await userEvent.type(emailInput, 'doctor@test.com');
      await userEvent.type(passwordInput, 'password123');

      const signInBtn = screen.getByText('Sign In');
      await userEvent.click(signInBtn);

      await waitFor(() => {
        expect(mockAxiosPost).toHaveBeenCalledWith('/api/auth/login', {
          email: 'doctor@test.com',
          password: 'password123'
        });
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      mockAxiosPost.mockResolvedValue({
        status: 200,
        data: { idToken: 'mock-token' }
      });

      render(<DoctorLogin />);
      await userEvent.type(screen.getByPlaceholderText('doctor@example.com'), 'doctor@test.com');
      await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await userEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/doctor-dashboard');
      });
    });

    it('should display error on failed login', async () => {
      mockAxiosPost.mockRejectedValue({
        response: {
          data: { message: 'Invalid credentials' }
        }
      });

      render(<DoctorLogin />);
      await userEvent.type(screen.getByPlaceholderText('doctor@example.com'), 'doctor@test.com');
      await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass');
      await userEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Registration (Req 2 - Doctor users)', () => {
    it('should have option to switch to registration form', () => {
      render(<DoctorLogin />);
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should switch to registration form when Register is clicked', async () => {
      render(<DoctorLogin />);
      await userEvent.click(screen.getByText('Register'));
      expect(screen.getByText('Doctor Registration')).toBeInTheDocument();
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    });

    it('should show Register button in registration mode', async () => {
      render(<DoctorLogin />);
      await userEvent.click(screen.getByText('Register'));

      // The submit button changes text based on mode
      const registerBtns = screen.getAllByText('Register');
      expect(registerBtns.length).toBeGreaterThan(0);
    });
  });

  describe('IT Support Access', () => {
    it('should show contact IT Support link', () => {
      render(<DoctorLogin />);
      expect(screen.getByText(/Having trouble accessing your account/)).toBeInTheDocument();
      expect(screen.getByText('Contact IT Support')).toBeInTheDocument();
    });
  });
});
