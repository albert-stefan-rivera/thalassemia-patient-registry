// Mock Firebase modules used across the application
import { vi } from 'vitest';

// Mock firebase/auth
export const mockAuth = {
  currentUser: null
};

export const signInWithEmailAndPassword = vi.fn();
export const signOut = vi.fn();
export const onAuthStateChanged = vi.fn((auth, callback) => {
  callback(null);
  return vi.fn(); // unsubscribe
});
export const GoogleAuthProvider = vi.fn();
export const signInWithPopup = vi.fn();
export const sendPasswordResetEmail = vi.fn();
export const updateProfile = vi.fn();
export const getAuth = vi.fn(() => mockAuth);

// Mock firebase/firestore
export const mockDb = {};

export const collection = vi.fn();
export const doc = vi.fn();
export const getDoc = vi.fn();
export const getDocs = vi.fn(() => ({ docs: [] }));
export const setDoc = vi.fn();
export const updateDoc = vi.fn();
export const addDoc = vi.fn(() => ({ id: 'mock-doc-id' }));
export const query = vi.fn();
export const where = vi.fn();
export const orderBy = vi.fn();
export const limit = vi.fn();
export const arrayUnion = vi.fn((val) => val);
export const arrayRemove = vi.fn((val) => val);
export const startAfter = vi.fn();
export const serverTimestamp = vi.fn();
export const onSnapshot = vi.fn();
export const Timestamp = { now: vi.fn() };

// Mock firebase/app
export const initializeApp = vi.fn(() => ({}));

// Mock firebase/functions
export const getFunctions = vi.fn(() => ({}));
export const connectFunctionsEmulator = vi.fn();

// Mock firebase/storage
export const getStorage = vi.fn(() => ({}));
export const connectStorageEmulator = vi.fn();

export const getFirestore = vi.fn(() => mockDb);
export const connectFirestoreEmulator = vi.fn();
export const connectAuthEmulator = vi.fn();

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  connectAuthEmulator: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  startAfter,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  connectFirestoreEmulator: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  connectFunctionsEmulator: vi.fn()
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  connectStorageEmulator: vi.fn()
}));

vi.mock('../../config/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
  functions: {},
  storage: {},
  default: {}
}));
