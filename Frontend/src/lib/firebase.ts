/**
 * Firebase Configuration and Authentication - PRODUCTION ONLY
 * Google OAuth authentication using Firebase - NO MOCK/DEMO MODE
 * Updated: 2026-05-06 - PRODUCTION READY
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Main App Firebase configuration - REQUIRED for main app features (e.g. Google OAuth)
const mainFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Landing/Waitlist Firebase configuration - REQUIRED for waitlist features
const landingFirebaseConfig = {
  apiKey: import.meta.env.VITE_LANDING_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_LANDING_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_LANDING_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_LANDING_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_LANDING_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_LANDING_FIREBASE_APP_ID,
};

// Validate a Firebase configuration
const isConfigValid = (config: Record<string, string | undefined>) => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  return requiredFields.every(field => 
    config[field] && 
    config[field] !== '' &&
    !config[field]?.startsWith('your-firebase-')
  );
};

// Helper to get missing configuration fields for helpful warning messages
const getMissingFields = (config: Record<string, string | undefined>) => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  return requiredFields.filter(field => 
    !config[field] ||
    config[field] === '' ||
    config[field]?.startsWith('your-firebase-')
  );
};

// Initialize Default App (Main Firebase) - PRODUCTION ONLY
let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseConfigured = false;

if (isConfigValid(mainFirebaseConfig)) {
  try {
    app = initializeApp(mainFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Configure Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    firebaseConfigured = true;
    console.log('🔥 Main Firebase (default) initialized successfully:', mainFirebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Failed to initialize Main Firebase:', error);
  }
} else {
  const missing = getMissingFields(mainFirebaseConfig);
  console.warn(`⚠️ Main Firebase config incomplete (missing: ${missing.join(', ')}). Running in development mode with mock auth.`);
}

if (!firebaseConfigured) {
  // Create a mock auth object to prevent crashes
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      callback(null);
      return () => {};
    }
  };
  db = null;
}

// Initialize Named App (Landing/Waitlist Firebase) - PRODUCTION ONLY
let landingApp: any = null;
let authLanding: any = null;
let dbLanding: any = null;
let landingFirebaseConfigured = false;

if (isConfigValid(landingFirebaseConfig)) {
  try {
    landingApp = initializeApp(landingFirebaseConfig, "landing");
    authLanding = getAuth(landingApp);
    dbLanding = getFirestore(landingApp);
    landingFirebaseConfigured = true;
    console.log('🔥 Landing Firebase (named: landing) initialized successfully:', landingFirebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Failed to initialize Landing Firebase:', error);
  }
} else {
  const missing = getMissingFields(landingFirebaseConfig);
  console.warn(`⚠️ Landing Firebase config incomplete (missing: ${missing.join(', ')}). Running in development mode with mock services.`);
}

if (!landingFirebaseConfigured) {
  authLanding = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      callback(null);
      return () => {};
    }
  };
  dbLanding = null;
}

export { auth, db, authLanding, dbLanding };

export interface GoogleAuthResult {
  user: FirebaseUser;
  idToken: string;
}

/**
 * Sign in with Google using Firebase - PRODUCTION ONLY
 * NO MOCK/DEMO MODE - REAL FIREBASE ONLY
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  // Check if Firebase is properly initialized
  if (!firebaseConfigured || !auth || !googleProvider) {
    const error = '⚠️ Firebase not configured. Please set up Firebase in .env file to enable Google authentication.';
    console.warn(error);
    throw new Error('Firebase authentication not available. Please configure Firebase or use email/password login.');
  }

  try {
    console.log('🔍 Starting Google sign-in with Firebase...');
    
    // Use REAL Firebase popup authentication
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('✅ Google sign-in successful');
    console.log('📧 User email:', user.email);
    console.log('🆔 Firebase UID:', user.uid);
    
    // Get the REAL Firebase ID token
    const idToken = await user.getIdToken();
    console.log('🔑 Firebase ID token obtained');
    
    return {
      user,
      idToken
    };
    
  } catch (error) {
    const authError = error as AuthError;
    console.error('❌ Google sign-in failed:', authError);
    
    // Handle specific Firebase error codes
    switch (authError.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in was cancelled by user');
      case 'auth/popup-blocked':
        throw new Error('Sign-in popup was blocked by browser. Please allow popups and try again.');
      case 'auth/cancelled-popup-request':
        throw new Error('Sign-in was cancelled');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection and try again.');
      case 'auth/too-many-requests':
        throw new Error('Too many sign-in attempts. Please wait a moment and try again.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled. Please contact support.');
      case 'auth/operation-not-allowed':
        throw new Error('Google sign-in is not enabled. Please contact support.');
      default:
        console.error('Unexpected Firebase auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
    }
  }
};

/**
 * Sign out from Firebase - PRODUCTION ONLY
 */
export const signOutFromFirebase = async (): Promise<void> => {
  if (!firebaseConfigured || !auth) {
    console.warn('⚠️ Firebase not configured');
    return;
  }

  try {
    console.log('🔍 Signing out from Firebase...');
    await signOut(auth);
    console.log('✅ Firebase sign-out successful');
  } catch (error) {
    console.error('❌ Firebase sign-out error:', error);
    throw new Error('Failed to sign out from Firebase');
  }
};

/**
 * Get current Firebase user - PRODUCTION ONLY
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  if (!auth) {
    console.warn('⚠️ Firebase not configured');
    return null;
  }
  return auth.currentUser;
};

/**
 * Get current user's Firebase ID token - PRODUCTION ONLY
 */
export const getCurrentUserIdToken = async (): Promise<string | null> => {
  const user = getCurrentFirebaseUser();
  if (!user) {
    console.warn('⚠️ No Firebase user found');
    return null;
  }
  
  try {
    const token = await user.getIdToken();
    console.log('🔑 Firebase ID token retrieved');
    return token;
  } catch (error) {
    console.error('❌ Error getting Firebase ID token:', error);
    return null;
  }
};

export default app;