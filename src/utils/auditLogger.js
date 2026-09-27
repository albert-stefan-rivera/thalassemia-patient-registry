import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

// Create audit log entry
export const createAuditLog = async ({
  action,
  patientId,
  collectionName,
  documentId,
  previousData,
  newData,
  changes,
  metadata = {}
}) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('Audit log skipped: No authenticated user');
      return null;
    }

    const logEntry = {
      action, // 'create', 'read', 'update', 'delete', 'view', 'export'
      patientId,
      collectionName,
      documentId,
      userId: user.uid,
      userEmail: user.email || 'unknown',
      userName: user.displayName || 'Unknown User',
      timestamp: new Date().toISOString(),
      previousData: previousData ? sanitizeData(previousData) : null,
      newData: newData ? sanitizeData(newData) : null,
      changes: changes || null,
      metadata,
      ipAddress: 'client-side', // In production, get from server
      userAgent: navigator.userAgent
    };

    const docRef = await addDoc(collection(db, 'auditLogs'), logEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
};

// Sanitize sensitive data before logging
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken'
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

// Get audit logs for a specific patient
export const getPatientAuditLogs = async (patientId, maxLogs = 100) => {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      where('patientId', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(maxLogs)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching patient audit logs:', error);
    return [];
  }
};

// Get all audit logs (admin only)
export const getAllAuditLogs = async (filters = {}, maxLogs = 500) => {
  try {
    let q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(maxLogs)
    );
    
    // Apply filters if provided
    if (filters.userId) {
      q = query(
        collection(db, 'auditLogs'),
        where('userId', '==', filters.userId),
        orderBy('timestamp', 'desc'),
        limit(maxLogs)
      );
    }
    
    if (filters.action) {
      q = query(
        collection(db, 'auditLogs'),
        where('action', '==', filters.action),
        orderBy('timestamp', 'desc'),
        limit(maxLogs)
      );
    }
    
    if (filters.startDate && filters.endDate) {
      // Note: Firestore doesn't support date ranges directly
      // In production, fetch all and filter in memory or use composite queries
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

// Log specific actions
export const logPatientCreate = (patientId, patientData) => {
  return createAuditLog({
    action: 'create',
    patientId,
    collectionName: 'patients',
    documentId: patientId,
    newData: patientData,
    metadata: { description: 'New patient registered' }
  });
};

export const logPatientUpdate = (patientId, previousData, newData, changes) => {
  return createAuditLog({
    action: 'update',
    patientId,
    collectionName: 'patients',
    documentId: patientId,
    previousData,
    newData,
    changes,
    metadata: { description: 'Patient record updated' }
  });
};

export const logPatientView = (patientId) => {
  return createAuditLog({
    action: 'view',
    patientId,
    collectionName: 'patients',
    documentId: patientId,
    metadata: { description: 'Patient record viewed' }
  });
};

export const logDataExport = (patientIds, reportType) => {
  return createAuditLog({
    action: 'export',
    patientId: patientIds.join(','),
    collectionName: 'multiple',
    metadata: { 
      description: `Data exported`,
      reportType,
      patientCount: patientIds.length
    }
  });
};

// Get recent activity for dashboard
export const getRecentActivity = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};
