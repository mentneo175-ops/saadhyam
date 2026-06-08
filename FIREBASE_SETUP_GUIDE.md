# 🔥 Firebase & Firestore Setup Guide

## ✅ Issue Fixed
Added Landing Firebase configuration to `.env` file - using same Firebase project for both main app and landing page.

---

## 🚀 Enable Firestore Database

To fix the "Firestore instance not available" error, you need to enable Firestore in your Firebase project:

### **Step 1: Go to Firebase Console**
1. Visit: https://console.firebase.google.com/
2. Select your project: **saadhyam-ai**

### **Step 2: Enable Firestore Database**
1. Click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"** or **"Start in test mode"**
   - **Production mode**: Secure (requires authentication)
   - **Test mode**: Open for 30 days (good for testing)

4. Select your Firestore location (e.g., `asia-south1` for India)
5. Click **"Enable"**

### **Step 3: Set Up Firestore Rules (Optional)**

For the landing page waitlist, you can use these rules:

**Test Mode (Development):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Production Mode (Secure):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Waitlist collection - anyone can add, only auth users can read
    match /waitlist/{document} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // All other collections require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Step 4: Create Waitlist Collection (Optional)**

If you want to manually create the collection:
1. Go to **Firestore Database** in Firebase Console
2. Click **"Start collection"**
3. Collection ID: `waitlist`
4. Add a test document:
   ```
   name: "Test User"
   email: "test@example.com"
   phone: "1234567890"
   organization: "Test Org"
   message: "Test message"
   timestamp: (current timestamp)
   ```

---

## 🔧 Environment Variables Configured

Your `Frontend/.env` now has:

### **Main Firebase (Authentication)**
```env
VITE_FIREBASE_API_KEY=AIzaSyDd1fIagx6GD_0KEbK1x6n4a-nUb0oSDHA
VITE_FIREBASE_AUTH_DOMAIN=saadhyam-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=saadhyam-ai
VITE_FIREBASE_STORAGE_BUCKET=saadhyam-ai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=236291647572
VITE_FIREBASE_APP_ID=1:236291647572:web:645bc23148d930df0925c1
```

### **Landing Firebase (Waitlist)**
```env
VITE_LANDING_FIREBASE_API_KEY=AIzaSyDd1fIagx6GD_0KEbK1x6n4a-nUb0oSDHA
VITE_LANDING_FIREBASE_AUTH_DOMAIN=saadhyam-ai.firebaseapp.com
VITE_LANDING_FIREBASE_PROJECT_ID=saadhyam-ai
VITE_LANDING_FIREBASE_STORAGE_BUCKET=saadhyam-ai.firebasestorage.app
VITE_LANDING_FIREBASE_MESSAGING_SENDER_ID=236291647572
VITE_LANDING_FIREBASE_APP_ID=1:236291647572:web:645bc23148d930df0925c1
```

*Currently using the same Firebase project for both. You can create a separate project later if needed.*

---

## ✅ Verification Steps

### **1. Check Browser Console**
Open http://localhost:8081 and press F12:
- Should see: `🔥 Main Firebase (default) initialized successfully: saadhyam-ai`
- Should see: `🔥 Landing Firebase (named: landing) initialized successfully: saadhyam-ai`

### **2. Test Landing Page Form**
1. Go to: http://localhost:8081
2. Fill in the waitlist form:
   - Name
   - Email
   - Phone
   - Organization
   - Message
3. Click **"Register Interest"**
4. Should save successfully to Firestore

### **3. Check Firestore Data**
1. Go to Firebase Console > Firestore Database
2. Look for `waitlist` collection
3. Should see your submitted entry

---

## 🐛 Troubleshooting

### **Issue: "Firestore instance not available"**
**Solution:** Enable Firestore Database in Firebase Console (see Step 2 above)

### **Issue: "Permission denied" when saving**
**Solution:** Update Firestore rules to allow write access (see Step 3 above)

### **Issue: Firebase not initialized**
**Check:**
1. All environment variables are set correctly
2. No typos in `.env` file
3. Frontend server was restarted after changing `.env`
4. Browser console shows Firebase initialization messages

### **Issue: Still seeing errors**
**Try:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Restart frontend server:
   ```bash
   # Stop current process
   # Then restart:
   cd Frontend
   npm run dev
   ```

---

## 🎯 Next Steps

After enabling Firestore:

1. **Test Landing Page**: http://localhost:8081
2. **Submit Waitlist Form**: Fill and submit
3. **Verify in Firebase**: Check Firestore Database
4. **Test Google Sign-In**: Click "Continue with Google"
5. **Access Dashboard**: http://localhost:8081/dashboard
6. **Try Review Management Agent**: http://localhost:8081/dashboard/agents/review-management

---

## 📊 What Works Now

✅ Frontend environment configured  
✅ Landing Firebase initialized  
✅ Main Firebase initialized  
✅ Google authentication ready  
✅ Firestore connection ready (once enabled)  

---

## 🔐 Security Notes

- **Never commit** `.env` files to git
- **Use production mode** Firestore rules for live deployment
- **Enable App Check** for additional security
- **Rotate API keys** regularly
- **Monitor Firebase usage** to avoid overages

---

**Last Updated:** June 8, 2026  
**Status:** Firebase configured, Firestore needs to be enabled in console
