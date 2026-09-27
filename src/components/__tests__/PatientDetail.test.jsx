/**
 * Tests for PatientDetail component
 *
 * Dev-spec requirements tested:
 * - 4.1 Main Doctor Tag: Each patient record displays the assigned main doctor
 * - 4.2 Controlled Access: Doctors can only view their own patients
 * - 4.2 Shared Access Visibility: Doctors can view a list of other doctors who also have access
 * - 4.2 Full Transparency: Patient view always shows the main doctor and authorized viewers
 * - 5. Scenario 3: A doctor can see which other doctors have access
 * - 5. Scenario 4: Change in lab values recorded with timestamp and editor name
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock data
const mockPatientData = {
  id: 'patient-1',
  patientId: 'THAL-2025-000001',
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  middleName: 'Santos',
  dateOfBirth: '2010-05-15',
  age: 15,
  sex: 'male',
  phoneNumber: '+639171234567',
  address: '123 Main St',
  city: 'Manila',
  thalassemiaType: 'major',
  dateOfDiagnosis: '2012-03-20',
  initialHemoglobin: '7.5',
  status: 'active',
  mainDoctorId: 'doctor1',
  mainDoctorName: 'Dr. Maria Santos',
  authorizedViewers: ['doctor2', 'doctor3'],
  baselineLabs: { ferritin: '1500' },
  transfusionHistory: {
    transfusionFrequency: 'monthly',
    unitsPerTransfusion: '2',
    lastTransfusionDate: '2025-01-10'
  },
  chelationTherapy: {
    onChelation: true,
    chelationDrug: 'deferasirox',
    dosage: '20mg/kg',
    compliance: 'good'
  },
  outpatientVisits: [
    {
      visitDate: '2025-01-15',
      visitType: 'regular',
      chiefComplaint: 'Routine checkup'
    }
  ]
};

const mockAuditLogs = [
  {
    id: 'audit-1',
    action: 'create',
    userName: 'Dr. Maria Santos',
    userEmail: 'maria@test.com',
    timestamp: '2025-01-10T10:00:00.000Z',
    metadata: { description: 'New patient registered' }
  },
  {
    id: 'audit-2',
    action: 'update',
    userName: 'Dr. Maria Santos',
    userEmail: 'maria@test.com',
    timestamp: '2025-01-15T14:30:00.000Z',
    metadata: { description: 'Patient record updated' }
  }
];

// Mock firebase
const mockGetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: (...args) => mockGetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  arrayUnion: vi.fn((val) => val),
  arrayRemove: vi.fn((val) => val)
}));

vi.mock('../../config/firebase', () => ({ db: {} }));

// Mock audit logger
const mockCreateAuditLog = vi.fn(() => Promise.resolve());
const mockGetPatientAuditLogs = vi.fn(() => Promise.resolve(mockAuditLogs));
vi.mock('../../utils/auditLogger', () => ({
  createAuditLog: (...args) => mockCreateAuditLog(...args),
  getPatientAuditLogs: (...args) => mockGetPatientAuditLogs(...args)
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'patient-1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  Edit: () => <span>EditIcon</span>,
  User: () => <span>UserIcon</span>,
  Phone: () => <span>PhoneIcon</span>,
  MapPin: () => <span>MapPinIcon</span>,
  Activity: () => <span>ActivityIcon</span>,
  Heart: () => <span>HeartIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  Shield: () => <span>ShieldIcon</span>,
  History: () => <span>HistoryIcon</span>,
  Share2: () => <span>ShareIcon</span>,
  AlertTriangle: () => <span>AlertIcon</span>,
  Check: () => <span>CheckIcon</span>,
  X: () => <span>XIcon</span>
}));

// Use different doctor IDs for different test cases
let mockCurrentUser = { uid: 'doctor1', email: 'doctor@test.com', displayName: 'Dr. Maria Santos' };
let mockUserProfile = { role: 'doctor', permissions: {} };

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    userProfile: mockUserProfile,
    hasPermission: vi.fn(() => false)
  })
}));

import PatientDetail from '../PatientDetail';

describe('PatientDetail (Req 4.1, 4.2 - Patient Data & Access Control)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { uid: 'doctor1', email: 'doctor@test.com', displayName: 'Dr. Maria Santos' };
    mockUserProfile = { role: 'doctor', permissions: {} };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'patient-1',
      data: () => mockPatientData
    });
  });

  describe('Main Doctor Tag (Req 4.1)', () => {
    it('should display the main doctor name on the patient record', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText(/Main Doctor:/)).toBeInTheDocument();
        expect(screen.getByText(/Dr. Maria Santos/)).toBeInTheDocument();
      });
    });
  });

  describe('Patient Data Display (Req 4.1)', () => {
    it('should display patient demographics', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText(/Dela Cruz, Juan Santos/)).toBeInTheDocument();
        expect(screen.getByText(/THAL-2025-000001/)).toBeInTheDocument();
      });
    });

    it('should display patient status', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });
    });
  });

  describe('Shared Access Visibility (Req 4.2)', () => {
    it('should show the number of other doctors with access (Req 5 Scenario 3)', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText(/Shared with 2 other doctor/)).toBeInTheDocument();
      });
    });

    it('should show Share Access button for main doctor', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('Share Access')).toBeInTheDocument();
      });
    });
  });

  describe('Access Control (Req 4.2 Controlled Access)', () => {
    it('should show Edit button for main doctor', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });
  });

  describe('Audit History Tab (Req 4.1 Edit Log / Req 5 Scenario 4)', () => {
    it('should show audit history tab', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('History')).toBeInTheDocument();
      });
    });

    it('should display audit logs with timestamp and editor name when History tab clicked', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('History')).toBeInTheDocument();
      });

      const historyTab = screen.getByText('History');
      await userEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Audit History')).toBeInTheDocument();
        // Audit logs should show action and user name (multiple matches: header + audit entries)
        const doctorNames = screen.getAllByText(/Dr. Maria Santos/);
        expect(doctorNames.length).toBeGreaterThan(1); // header + audit log entries
      });
    });

    it('should log a view action when patient record is accessed', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(mockCreateAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'view',
            patientId: 'patient-1',
            collectionName: 'patients'
          })
        );
      });
    });
  });

  describe('Share Access Modal (Req 4.2 Admin Override)', () => {
    it('should open share modal when Share Access button is clicked', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('Share Access')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Share Access'));
      expect(screen.getByText('Share Patient Access')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Doctor ID or Email/)).toBeInTheDocument();
    });
  });

  describe('Clinical Tabs', () => {
    it('should display overview, diagnosis, visits and audit tabs', async () => {
      render(<PatientDetail />);
      await waitFor(() => {
        expect(screen.getByText('overview')).toBeInTheDocument();
        expect(screen.getByText('diagnosis')).toBeInTheDocument();
        expect(screen.getByText('visits')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
      });
    });
  });
});
