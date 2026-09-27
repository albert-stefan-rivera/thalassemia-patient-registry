/**
 * Generates a unique patient ID for the Thalassemia Registry
 * Format: THAL-YYYY-NNNNNN (e.g., THAL-2025-000001)
 */

// Generate a new patient ID
export const generatePatientId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `THAL-${year}-${randomNum}`;
};

// Validate patient ID format
export const isValidPatientId = (id) => {
  const pattern = /^THAL-\d{4}-\d{6}$/;
  return pattern.test(id);
};

// Extract components from patient ID
export const parsePatientId = (id) => {
  if (!isValidPatientId(id)) {
    return null;
  }
  
  const parts = id.split('-');
  return {
    prefix: parts[0],
    year: parseInt(parts[1]),
    sequence: parseInt(parts[2])
  };
};

// Generate a hash for patient ID (for URLs)
export const hashPatientId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export default {
  generatePatientId,
  isValidPatientId,
  parsePatientId,
  hashPatientId
};
