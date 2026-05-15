# 🔐 How to Login and Test Voice Agent

## 🚨 **Current Issue**

You're seeing this error:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
/me endpoint failing
```

**Cause**: You're not logged in, so the frontend can't fetch user data.

---

## ✅ **SOLUTION: Login First**

### **Option 1: Use Google OAuth (Recommended)**

1. **Go to the login page**:
   ```
   http://localhost:8081/login
   ```

2. **Click "Sign in with Google"**

3. **Login with your Google account**

4. **You'll be redirected to the dashboard**

---

### **Option 2: Create a Test Account (If Google OAuth isn't working)**

If Firebase/Google OAuth isn't configured, you can create a test user directly in the database:

#### **Step 1: Create Test User**

Run this in a new PowerShell terminal:

```powershell
cd Backend
python -c "
from config.database import get_db_for_migration
from models.user import User
from sqlalchemy import text
import bcrypt

db = get_db_for_migration()

# Check if test user exists
existing = db.execute(text('SELECT * FROM users WHERE email = :email'), {'email': 'test@example.com'}).fetchone()

if not existing:
    # Create test user
    hashed_password = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    db.execute(text('''
        INSERT INTO users (email, name, password_hash, firebase_uid, created_at, updated_at)
        VALUES (:email, :name, :password, :uid, datetime('now'), datetime('now'))
    '''), {
        'email': 'test@example.com',
        'name': 'Test User',
        'password': hashed_password,
        'uid': 'test-user-123'
    })
    db.commit()
    print('✅ Test user created!')
    print('Email: test@example.com')
    print('Password: password123')
else:
    print('✅ Test user already exists!')
    print('Email: test@example.com')
    print('Password: password123')

db.close()
"
```

#### **Step 2: Login with Test Account**

1. Go to: http://localhost:8081/login
2. Enter:
   - **Email**: `test@example.com`
   - **Password**: `password123`
3. Click "Sign In"

---

## 🎯 **QUICK TEST WITHOUT LOGIN**

If you just want to test the Voice Agent API directly (without the frontend):

### **Test API with cURL**

```powershell
# Test if voice agent endpoint exists (should return 401 Unauthorized)
curl http://localhost:8000/api/voice-agent/campaigns

# Test health endpoint (should work without auth)
curl http://localhost:8000/health

# Test routes list
curl http://localhost:8000/api/routes
```

---

## 🔍 **TROUBLESHOOTING**

### **Issue: Google OAuth Not Working**

**Symptoms**:
- "Sign in with Google" button doesn't work
- Firebase errors in console

**Solution**:
1. Check if Firebase is configured in `Backend/.env`
2. Look for `FIREBASE_CREDENTIALS` or similar
3. If not configured, use Option 2 (test account) above

---

### **Issue: Still Getting 500 Error After Login**

**Check Backend Logs**:

```powershell
# In the terminal where backend is running, look for errors
# Or check the process output
```

**Common Causes**:
1. Database connection issue
2. Missing user data
3. Token validation failing

**Solution**:
- Check backend terminal for error details
- Share the error message and I'll help fix it

---

### **Issue: Can't Access Voice Agent Pages**

**Symptoms**:
- Redirected to login
- 404 errors
- Blank pages

**Solution**:
1. Make sure you're logged in first
2. Check URL is correct: `http://localhost:8081/dashboard/voice-agent`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito/private window

---

## 🎯 **AFTER LOGGING IN**

Once you're logged in, you can:

1. **Go to Voice Agent Dashboard**:
   ```
   http://localhost:8081/dashboard/voice-agent
   ```

2. **Create Your First Campaign**:
   ```
   http://localhost:8081/dashboard/voice-agent/create-campaign
   ```

3. **Test All Features**:
   - ✅ Create campaigns
   - ✅ Upload leads
   - ✅ Generate scripts
   - ✅ Simulate conversations
   - ✅ View analytics

---

## 📝 **SAMPLE TEST DATA**

### **Campaign Details**:
```
Name: Test Campaign
Description: Testing voice agent functionality
Language: English
Voice Type: Female
Target Audience: Small business owners
Call Purpose: Product demo
Business Context: AI-powered voice calling platform
Offer Details: Free trial for 30 days
```

### **Sample Leads CSV**:
```csv
name,phone,email
John Doe,+1234567890,john@example.com
Jane Smith,+0987654321,jane@example.com
Bob Johnson,+1122334455,bob@example.com
```

---

## 🚀 **QUICK START CHECKLIST**

- [ ] Backend running on port 8000
- [ ] Frontend running on port 8081
- [ ] Logged in (Google or test account)
- [ ] Can access dashboard
- [ ] Can access voice agent page
- [ ] Ready to create first campaign!

---

## 💡 **PRO TIP**

If you're just testing and don't want to deal with authentication:

1. **Temporarily disable auth** in the frontend (for testing only)
2. **Or** use the API directly with Postman/Insomnia
3. **Or** create a test token manually

But the easiest way is to just **login with Google** or **create a test account**!

---

**Next Step**: Login at http://localhost:8081/login and then go to http://localhost:8081/dashboard/voice-agent

