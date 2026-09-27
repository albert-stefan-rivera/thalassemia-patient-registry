/**
 * Tests for Patient ID utility functions
 *
 * Dev-spec requirements tested:
 * - 4.1 Patient Registration: Patients get unique IDs
 * - Patient ID format: THAL-YYYY-NNNNNN
 */
import { describe, it, expect } from 'vitest';
import { generatePatientId, isValidPatientId, parsePatientId, hashPatientId } from '../patientId';

describe('Patient ID Generation (Req 4.1 - Patient Registration)', () => {
  describe('generatePatientId', () => {
    it('should generate a patient ID in THAL-YYYY-NNNNNN format', () => {
      const id = generatePatientId();
      expect(id).toMatch(/^THAL-\d{4}-\d{6}$/);
    });

    it('should use the current year', () => {
      const id = generatePatientId();
      const currentYear = new Date().getFullYear().toString();
      expect(id).toContain(`THAL-${currentYear}-`);
    });

    it('should generate unique IDs across multiple calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generatePatientId());
      }
      // With 6-digit random numbers, collisions in 100 calls should be extremely rare
      expect(ids.size).toBeGreaterThan(90);
    });

    it('should pad the sequence number to 6 digits', () => {
      const id = generatePatientId();
      const parts = id.split('-');
      expect(parts[2]).toHaveLength(6);
    });
  });

  describe('isValidPatientId', () => {
    it('should validate correctly formatted IDs', () => {
      expect(isValidPatientId('THAL-2025-000001')).toBe(true);
      expect(isValidPatientId('THAL-2024-999999')).toBe(true);
      expect(isValidPatientId('THAL-2023-123456')).toBe(true);
    });

    it('should reject incorrectly formatted IDs', () => {
      expect(isValidPatientId('INVALID')).toBe(false);
      expect(isValidPatientId('THAL-2025-00001')).toBe(false); // only 5 digits
      expect(isValidPatientId('THAL-25-000001')).toBe(false);  // only 2-digit year
      expect(isValidPatientId('thal-2025-000001')).toBe(false); // lowercase
      expect(isValidPatientId('')).toBe(false);
      expect(isValidPatientId(null)).toBe(false);
      expect(isValidPatientId(undefined)).toBe(false);
    });

    it('should reject IDs with extra characters', () => {
      expect(isValidPatientId('THAL-2025-000001-extra')).toBe(false);
      expect(isValidPatientId('X-THAL-2025-000001')).toBe(false);
    });
  });

  describe('parsePatientId', () => {
    it('should parse a valid patient ID into components', () => {
      const result = parsePatientId('THAL-2025-000042');
      expect(result).toEqual({
        prefix: 'THAL',
        year: 2025,
        sequence: 42
      });
    });

    it('should return null for invalid IDs', () => {
      expect(parsePatientId('INVALID')).toBeNull();
      expect(parsePatientId('')).toBeNull();
    });

    it('should correctly parse the year as a number', () => {
      const result = parsePatientId('THAL-2024-100000');
      expect(result.year).toBe(2024);
      expect(typeof result.year).toBe('number');
    });

    it('should correctly parse the sequence as a number', () => {
      const result = parsePatientId('THAL-2025-000001');
      expect(result.sequence).toBe(1);
      expect(typeof result.sequence).toBe('number');
    });
  });

  describe('hashPatientId', () => {
    it('should return a hexadecimal string', () => {
      const hash = hashPatientId('THAL-2025-000001');
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce consistent hashes for the same input', () => {
      const hash1 = hashPatientId('THAL-2025-000001');
      const hash2 = hashPatientId('THAL-2025-000001');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashPatientId('THAL-2025-000001');
      const hash2 = hashPatientId('THAL-2025-000002');
      expect(hash1).not.toBe(hash2);
    });
  });
});
