# Authentication Flow Test Guide

## 🧪 Test Scenarios

### **Scenario 1: New User Registration**
1. **Email Registration**: 
   - Go to `/signup`
   - Enter new email + password
   - **Expected**: Goes to `/onboarding`

2. **Google Registration**:
   - Go to `/signup` 
   - Click "Continue with Google"
   - Use new Google account
   - **Expected**: Goes to `/onboarding`

### **Scenario 2: Duplicate Email Registration (FIXED)**
1. **Email Registration with Existing Email**:
   - Go to `/signup`
   - Enter existing email + password
   - **Expected**: Shows "Email already registered" error with "Sign in instead" link

2. **Google Registration with Existing Email**:
   - Go to `/signup`
   - Click "Continue with Google" 
   - Use Google account with existing email
   - **Expected**: 
     - If business setup completed → Goes to `/dashboard`
     - If business setup not completed → Goes to `/onboarding`

### **Scenario 3: Existing User Login**
1. **Email Login**:
   - Go to `/login`
   - Enter existing email + password
   - **Expected**:
     - If business setup completed → Goes to `/dashboard`
     - If business setup not completed → Goes to `/onboarding`

2. **Google Login**:
   - Go to `/login`
   - Click "Continue with Google"
   - Use existing Google account
   - **Expected**:
     - If business setup completed → Goes to `/dashboard`
     - If business setup not completed → Goes to `/onboarding`

## ✅ **Fixed Issues**

1. **Duplicate Account Prevention**: Email registration now properly rejects existing emails
2. **Smart Routing**: Both signup and login check business setup status before routing
3. **Account Merging**: Google OAuth properly merges with existing email accounts
4. **Business Setup Preservation**: Existing business setup is never lost during account merging
5. **Better Error Messages**: Clear guidance when email already exists

## 🔍 **Backend Logs to Watch**

When testing, look for these log messages:

### **Successful Account Merge**:
```
🔗 Merging existing email account with Google OAuth: user@example.com
✅ Account merged. Business setup PRESERVED: True
🎉 REAL Google authentication successful for user: user@example.com
```

### **Duplicate Email Registration**:
```
Registration attempt with existing email: user@example.com
```

### **Business Setup Status Check**:
```
📊 Business setup status for user@example.com: True
```

## 🚀 **Test Your Specific Case**

**Your Email**: `saikiranmain1708@gmail.com`

1. **Try Google Sign-Up**: Should go to Dashboard (business setup completed)
2. **Try Email Registration**: Should show "Email already registered" error
3. **Try Google Sign-In**: Should go to Dashboard (business setup completed)
4. **Try Email Sign-In**: Should go to Dashboard (business setup completed)