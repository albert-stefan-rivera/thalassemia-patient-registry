/**
 * Tests for notification utilities
 *
 * Dev-spec requirements tested:
 * - Notification system for patient IDs
 */
import { describe, it, expect, vi } from 'vitest';
import { sendEmailNotification, sendSMSNotification } from '../notifications';

describe('Notification Utilities', () => {
  describe('sendEmailNotification', () => {
    it('should return success response with email and patientId', async () => {
      const result = await sendEmailNotification('doctor@example.com', 'THAL-2025-000001');
      expect(result).toEqual({ success: true, message: 'Email sent successfully' });
    });

    it('should log the email and patient ID', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await sendEmailNotification('test@test.com', 'THAL-2025-000001');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test@test.com')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('THAL-2025-000001')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('sendSMSNotification', () => {
    it('should return success response with phone and patientId', async () => {
      const result = await sendSMSNotification('+639171234567', 'THAL-2025-000001');
      expect(result).toEqual({ success: true, message: 'SMS sent successfully' });
    });

    it('should log the phone number and patient ID', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await sendSMSNotification('+639171234567', 'THAL-2025-000001');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('+639171234567')
      );
      consoleSpy.mockRestore();
    });
  });
});
