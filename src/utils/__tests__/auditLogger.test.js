/**
 * Tests for Audit Logger utility
 *
 * Dev-spec requirements tested:
 * - 4.1 Edit Log: An audit trail records what was changed, who made the change, and when
 * - 7. Security: All users subject to role-based access control
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase modules before importing auditLogger
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-audit-log-id' })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [
      {
        id: 'log1',
        data: () => ({
          action: 'create',
          patientId: 'THAL-2025-000001',
          userId: 'doctor1',
          userEmail: 'doctor@test.com',
          userName: 'Dr. Test',
          timestamp: '2025-01-15T10:00:00.000Z',
          metadata: { description: 'New patient registered' }
        })
      }
    ]
  })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'doctor1',
      email: 'doctor@test.com',
      displayName: 'Dr. Test'
    }
  }))
}));

vi.mock('../../config/firebase', () => ({
  db: {},
  auth: {}
}));

// Import after mocks
const {
  createAuditLog,
  getPatientAuditLogs,
  getAllAuditLogs,
  logPatientCreate,
  logPatientUpdate,
  logPatientView,
  logDataExport
} = await import('../auditLogger');

const { addDoc, getDocs } = await import('firebase/firestore');

describe('Audit Logger (Req 4.1 - Edit Log / Audit Trail)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry with user info, timestamp, and action', async () => {
      const result = await createAuditLog({
        action: 'create',
        patientId: 'THAL-2025-000001',
        collectionName: 'patients',
        documentId: 'THAL-2025-000001',
        newData: { firstName: 'Juan', lastName: 'Dela Cruz' },
        metadata: { description: 'New patient registered' }
      });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callArgs = addDoc.mock.calls[0][1];

      // Verify audit log records WHO made the change
      expect(callArgs.userId).toBe('doctor1');
      expect(callArgs.userEmail).toBe('doctor@test.com');
      expect(callArgs.userName).toBe('Dr. Test');

      // Verify audit log records WHAT was changed
      expect(callArgs.action).toBe('create');
      expect(callArgs.patientId).toBe('THAL-2025-000001');
      expect(callArgs.collectionName).toBe('patients');

      // Verify audit log records WHEN the change was made
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).getTime()).not.toBeNaN();

      expect(result).toBe('mock-audit-log-id');
    });

    it('should sanitize sensitive data before logging', async () => {
      await createAuditLog({
        action: 'update',
        patientId: 'THAL-2025-000001',
        collectionName: 'patients',
        newData: {
          firstName: 'Juan',
          password: 'secret123',
          token: 'jwt-token',
          apiKey: 'api-key-123',
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      });

      const callArgs = addDoc.mock.calls[0][1];
      const loggedData = callArgs.newData;

      // Sensitive fields should be redacted
      expect(loggedData.password).toBe('[REDACTED]');
      expect(loggedData.token).toBe('[REDACTED]');
      expect(loggedData.apiKey).toBe('[REDACTED]');
      expect(loggedData.accessToken).toBe('[REDACTED]');
      expect(loggedData.refreshToken).toBe('[REDACTED]');

      // Non-sensitive fields should remain
      expect(loggedData.firstName).toBe('Juan');
    });

    it('should not throw when audit logging fails (non-blocking)', async () => {
      addDoc.mockRejectedValueOnce(new Error('Firestore error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await createAuditLog({
        action: 'create',
        patientId: 'THAL-2025-000001',
        collectionName: 'patients'
      });

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should skip logging when no authenticated user', async () => {
      const { getAuth } = await import('firebase/auth');
      getAuth.mockReturnValueOnce({ currentUser: null });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await createAuditLog({
        action: 'create',
        patientId: 'test'
      });

      expect(result).toBeNull();
      expect(addDoc).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should record both previous and new data for updates', async () => {
      const previousData = { firstName: 'Old Name' };
      const newData = { firstName: 'New Name' };

      await createAuditLog({
        action: 'update',
        patientId: 'THAL-2025-000001',
        collectionName: 'patients',
        previousData,
        newData,
        changes: { firstName: { old: 'Old Name', new: 'New Name' } }
      });

      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.previousData).toEqual(previousData);
      expect(callArgs.newData).toEqual(newData);
      expect(callArgs.changes).toEqual({ firstName: { old: 'Old Name', new: 'New Name' } });
    });
  });

  describe('getPatientAuditLogs', () => {
    it('should fetch audit logs for a specific patient', async () => {
      const logs = await getPatientAuditLogs('THAL-2025-000001');
      expect(getDocs).toHaveBeenCalled();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('log1');
      expect(logs[0].patientId).toBe('THAL-2025-000001');
    });

    it('should return empty array on error', async () => {
      getDocs.mockRejectedValueOnce(new Error('Firestore error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logs = await getPatientAuditLogs('THAL-2025-000001');
      expect(logs).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('getAllAuditLogs', () => {
    it('should fetch all audit logs for admin view', async () => {
      const logs = await getAllAuditLogs();
      expect(getDocs).toHaveBeenCalled();
      expect(logs).toHaveLength(1);
    });

    it('should support filtering by action type', async () => {
      await getAllAuditLogs({ action: 'create' });
      expect(getDocs).toHaveBeenCalled();
    });

    it('should support filtering by userId', async () => {
      await getAllAuditLogs({ userId: 'doctor1' });
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe('Convenience logging functions', () => {
    it('logPatientCreate should log a create action', async () => {
      await logPatientCreate('THAL-2025-000001', { firstName: 'Test' });
      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.action).toBe('create');
      expect(callArgs.metadata.description).toBe('New patient registered');
    });

    it('logPatientUpdate should log an update action with previous and new data', async () => {
      const prev = { firstName: 'Old' };
      const next = { firstName: 'New' };
      await logPatientUpdate('THAL-2025-000001', prev, next, { firstName: 'changed' });
      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.action).toBe('update');
      expect(callArgs.metadata.description).toBe('Patient record updated');
    });

    it('logPatientView should log a view action', async () => {
      await logPatientView('THAL-2025-000001');
      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.action).toBe('view');
      expect(callArgs.metadata.description).toBe('Patient record viewed');
    });

    it('logDataExport should log an export action with patient count', async () => {
      await logDataExport(['THAL-2025-000001', 'THAL-2025-000002'], 'PhilHealth');
      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.action).toBe('export');
      expect(callArgs.metadata.reportType).toBe('PhilHealth');
      expect(callArgs.metadata.patientCount).toBe(2);
    });
  });
});
