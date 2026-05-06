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

// Firebase configuration - REQUIRED
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration - FAIL FAST if not configured
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingFields = requiredFields.filter(field => 
    !firebaseConfig[field as keyof typeof firebaseConfig] ||
    firebaseConfig[field as keyof typeof firebaseConfig] === `your-firebase-${field.toLowerCase()}-here`
  );
  
  if (missingFields.length > 0) {
    const error = `❌ CRITICAL: Missing Firebase configuration fields: ${missingFields.join(', ')}`;
    console.error(error);
    console.error('❌ Please configure your Firebase environment variables in .env file');
    throw new Error(`Firebase configuration incomplete: ${missingFields.join(', ')}`);
  }
  
  console.log('✅ Firebase configuration validated');
  return true;
};

// Initialize Firebase - PRODUCTION ONLY
let app: any = null;
let auth: any = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  // Validate configuration first
  validateFirebaseConfig();
  
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Configure Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  
  // Set custom parameters for better UX
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log('🔥 Firebase initialized successfully');
  console.log('📋 Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  console.error('❌ CRITICAL: Firebase initialization failed:', error);
  console.error('❌ Application cannot start without proper Firebase configuration');
  // Don't throw here to allow app to show error message
}

export { auth };

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
  if (!auth || !googleProvider) {
    const error = '❌ CRITICAL: Firebase not properly configured. Please check your environment variables.';
    console.error(error);
    throw new Error('Firebase authentication not available. Please contact support.');
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
  if (!auth) {
    throw new Error('Firebase not configured. Cannot sign out.');
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