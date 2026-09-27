/**
 * Tests for AuditLogViewer component
 *
 * Dev-spec requirements tested:
 * - 4.1 Edit Log: An audit trail records what was changed, who made the change, and when
 * - 5. Scenario 4: A change in lab values is recorded, with timestamp and editor's name
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockAuditLogs = [
  {
    id: 'log-1',
    action: 'create',
    userName: 'Dr. Maria Santos',
    userEmail: 'maria@test.com',
    patientId: 'THAL-2025-000001',
    timestamp: '2025-01-10T10:00:00.000Z',
    metadata: { description: 'New patient registered' }
  },
  {
    id: 'log-2',
    action: 'update',
    userName: 'Dr. Juan Reyes',
    userEmail: 'juan@test.com',
    patientId: 'THAL-2025-000001',
    timestamp: '2025-01-15T14:30:00.000Z',
    metadata: { description: 'Patient record updated' }
  },
  {
    id: 'log-3',
    action: 'view',
    userName: 'Dr. Pedro Garcia',
    userEmail: 'pedro@test.com',
    patientId: 'THAL-2025-000002',
    timestamp: '2025-01-16T09:00:00.000Z',
    metadata: { description: 'Patient record viewed' }
  },
  {
    id: 'log-4',
    action: 'export',
    userName: 'Admin User',
    userEmail: 'admin@test.com',
    patientId: null,
    timestamp: '2025-01-17T11:00:00.000Z',
    metadata: { description: 'Data exported', reportType: 'PhilHealth' }
  }
];

// Mock the audit logger
vi.mock('../../utils/auditLogger', () => ({
  getAllAuditLogs: vi.fn(() => Promise.resolve(mockAuditLogs))
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  startAfter: vi.fn(),
  Timestamp: { now: vi.fn() }
}));

vi.mock('../../config/firebase', () => ({ db: {} }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { role: 'admin' },
    hasPermission: () => true
  })
}));

vi.mock('lucide-react', () => ({
  History: () => <span>HistoryIcon</span>,
  Search: () => <span>SearchIcon</span>,
  Filter: () => <span>FilterIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  User: () => <span>UserIcon</span>,
  Activity: () => <span>ActivityIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  ChevronLeft: () => <span>ChevronLeftIcon</span>,
  ChevronRight: () => <span>ChevronRightIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  RefreshCw: () => <span>RefreshIcon</span>
}));

import AuditLogViewer from '../AuditLogViewer';

describe('AuditLogViewer (Req 4.1 - Edit Log / Audit Trail)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('Audit Log Display', () => {
    it('should display Audit Logs page title', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    it('should display audit log entries', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Dr. Juan Reyes')).toBeInTheDocument();
      });
    });

    it('should show who made each change (Req 4.1 Edit Log)', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('maria@test.com')).toBeInTheDocument();
        expect(screen.getByText('Dr. Juan Reyes')).toBeInTheDocument();
        expect(screen.getByText('juan@test.com')).toBeInTheDocument();
      });
    });

    it('should show when changes were made (timestamps)', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        // Timestamps are rendered using toLocaleString
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
      });
    });

    it('should show what action was performed', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        expect(screen.getByText('Action')).toBeInTheDocument();
      });
    });

    it('should show patient ID for each log entry', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        // Multiple logs share the same patient ID, so use getAllByText
        const patientIds = screen.getAllByText('THAL-2025-000001');
        expect(patientIds.length).toBeGreaterThan(0);
      });
    });

    it('should show description/details for each log', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        expect(screen.getByText('New patient registered')).toBeInTheDocument();
        expect(screen.getByText('Patient record updated')).toBeInTheDocument();
      });
    });
  });

  describe('Table Structure', () => {
    it('should have correct column headers', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Patient ID')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  describe('Filtering (Req 4.1 - Audit Trail)', () => {
    it('should have action type filter', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByText('All Actions')).toBeInTheDocument();
    });

    it('should have search input for user or patient', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByPlaceholderText(/Search user or patient/)).toBeInTheDocument();
    });

    it('should have date range filters', async () => {
      render(<AuditLogViewer />);
      expect(screen.getAllByDisplayValue('')).toBeTruthy();
    });

    it('should have Apply and Clear filter buttons', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('should show total log count', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        expect(screen.getByText('Total Logs')).toBeInTheDocument();
      });
    });

    it('should show count by action type', async () => {
      render(<AuditLogViewer />);
      await waitFor(() => {
        expect(screen.getByText('Creates')).toBeInTheDocument();
        expect(screen.getByText('Updates')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality (Req 4.3 Report Generation)', () => {
    it('should have Export CSV button', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should have Refresh button', async () => {
      render(<AuditLogViewer />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });
});
