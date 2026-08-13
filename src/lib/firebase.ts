import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Helper to resolve config either from auto-generated config or env vars
const getFirebaseConfig = () => {
  if (firebaseConfigJson && firebaseConfigJson.projectId && firebaseConfigJson.apiKey) {
    return {
      apiKey: firebaseConfigJson.apiKey,
      authDomain: firebaseConfigJson.authDomain,
      projectId: firebaseConfigJson.projectId,
      storageBucket: firebaseConfigJson.storageBucket,
      messagingSenderId: firebaseConfigJson.messagingSenderId,
      appId: firebaseConfigJson.appId,
      measurementId: firebaseConfigJson.measurementId || undefined,
    };
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA-Oj3kASl2zrMFtri-MaR3NkrmN4z45fg',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hellosribordi.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hellosribordi',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hellosribordi.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '670914984216',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:670914984216:web:1b42138263d356928a066d',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VJ362JR457',
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase app once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics conditionally
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

// Firebase Auth instance
export const auth = getAuth(app);

// Firestore instance
const firestoreDbId = (firebaseConfigJson && (firebaseConfigJson as { firestoreDatabaseId?: string }).firestoreDatabaseId) || '(default)';
export const db = getFirestore(app, firestoreDbId);

// Firebase Storage instance
export const storage = getStorage(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
