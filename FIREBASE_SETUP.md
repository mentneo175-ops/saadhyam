# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with Google OAuth for Saadhyam AI.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `saadhyam-ai` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Click on **Google** provider
5. Toggle **Enable**
6. Set **Project support email** (your email)
7. Click **Save**

## 3. Configure Web App

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Enter app nickname: `saadhyam-web`
5. Check **Also set up Firebase Hosting** (optional)
6. Click **Register app**
7. Copy the Firebase configuration object

## 4. Add Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - `your-production-domain.com` (for production)

## 5. Frontend Configuration

Create `Frontend/.env` file with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=saadhyam-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=saadhyam-ai
VITE_FIREBASE_STORAGE_BUCKET=saadhyam-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 6. Backend Configuration

### Generate Service Account Key

1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Rename it to `firebase-service-account.json`
5. Place it in your `Backend/` directory

### Update Backend Environment

Add to `Backend/.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
FIREBASE_PROJECT_ID=saadhyam-ai
```

## 7. Install Dependencies

### Frontend
```bash
cd Frontend
npm install firebase
```

### Backend
```bash
cd Backend
pip install firebase-admin google-auth
```

## 8. Run Database Migration

```bash
cd Backend
python migrations/add_firebase_fields.py
```

## 9. Test Authentication

1. Start your backend server:
   ```bash
   cd Backend
   python main.py
   ```

2. Start your frontend:
   ```bash
   cd Frontend
   npm run dev
   ```

3. Go to `http://localhost:5173/login`
4. Click "Continue with Google"
5. Complete Google OAuth flow

## 10. Production Setup

### Frontend (Vercel/Netlify)
Add environment variables in your deployment platform:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Backend (Railway/Heroku)
1. Upload `firebase-service-account.json` securely
2. Set environment variables:
   - `GOOGLE_APPLICATION_CREDENTIALS`
   - `FIREBASE_PROJECT_ID`

## Security Notes

1. **Never commit** `firebase-service-account.json` to version control
2. Add `firebase-service-account.json` to `.gitignore`
3. Use environment variables for all sensitive data
4. Enable **App Check** in production for additional security
5. Configure **Security Rules** if using Firestore

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check environment variables are loaded
   - Verify Firebase config object

2. **"Invalid API key"**
   - Verify `VITE_FIREBASE_API_KEY` is correct
   - Check authorized domains

3. **"Service account not found"**
   - Verify `firebase-service-account.json` path
   - Check file permissions

4. **"Google sign-in popup blocked"**
   - Allow popups in browser
   - Try different browser

### Debug Mode

Enable debug logging:

```javascript
// In firebase.ts
import { connectAuthEmulator } from 'firebase/auth';

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Support

If you encounter issues:
1. Check [Firebase Documentation](https://firebase.google.com/docs/auth)
2. Review browser console for errors
3. Check backend logs for authentication failures
4. Verify all environment variables are set correctly