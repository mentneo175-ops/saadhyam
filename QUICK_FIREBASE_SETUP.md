# Quick Firebase Setup for Saadhyam AI

## 🚨 Current Status
Your app is ready but needs Firebase configuration to enable Google OAuth.

## ⚡ Quick Setup (5 minutes)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: `saadhyam-ai`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Google Authentication
1. In Firebase Console → **Authentication**
2. Click **Get started**
3. **Sign-in method** tab
4. Click **Google** → Toggle **Enable**
5. Set support email → **Save**

### 3. Create Web App
1. **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click Web icon (`</>`)
4. App nickname: `saadhyam-web`
5. Click **Register app**
6. **Copy the config object**

### 4. Update Frontend Environment
Replace the values in `Frontend/.env`:

```env
# Replace with your actual Firebase values
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=saadhyam-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=saadhyam-ai
VITE_FIREBASE_STORAGE_BUCKET=saadhyam-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 5. Test Authentication
1. Restart your frontend: `npm run dev`
2. Go to `http://localhost:5173/login`
3. Click "Continue with Google"
4. Should work! 🎉

## 🔧 Backend Setup (Optional for now)
The backend will work without Firebase initially. For full functionality:

1. **Project Settings** → **Service accounts**
2. **Generate new private key**
3. Download JSON → rename to `firebase-service-account.json`
4. Place in `Backend/` directory
5. Update `Backend/.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
   FIREBASE_PROJECT_ID=saadhyam-ai
   ```

## 🚨 Current Error Fix
The errors you're seeing are because:
1. ✅ Firebase package is installed
2. ❌ Firebase environment variables are placeholder values

Once you update the `.env` file with real Firebase values, everything will work!

## 📞 Need Help?
If you get stuck:
1. Make sure you copy the EXACT values from Firebase Console
2. Restart your dev server after updating `.env`
3. Check browser console for specific errors
4. The app will show helpful error messages

Your authentication system is ready - just needs the Firebase project! 🚀