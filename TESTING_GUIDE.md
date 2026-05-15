# 🧪 SAADHYAM AI - COMPLETE TESTING GUIDE

This guide provides step-by-step instructions to test all features of the Saadhyam AI Voice Agent system.

---

## 📋 PREREQUISITES

### Services Must Be Running
1. ✅ Backend: `http://localhost:8000`
2. ✅ Frontend: `http://localhost:8081`
3. ✅ Redis: `localhost:6379`
4. ✅ Celery Worker: Running
5. ✅ Celery Beat: Running

### Test Credentials
- **Email**: `testuser@example.com`
- **Password**: `password123`

---

## 🔐 STEP 1: AUTHENTICATION TESTING

### 1.1 Test User Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Expected Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "id": 27,
  "email": "testuser@example.com",
  "name": "Test User",
  "created_at": "2026-05-14T11:08:15.734621"
}
```

**Save the `access_token` for the next tests!**

### 1.2 Test Get Current User Info
```bash
curl -X GET http://localhost:8000/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "id": 27,
  "email": "testuser@example.com",
  "created_at": "2026-05-14T11:08:15.734621"
}
```

---

## 🎤 STEP 2: VOICE AGENT API TESTING

### 2.1 Get Dashboard Statistics
```bash
curl -X GET http://localhost:8000/api/v2/voice-agent/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "stats": {
    "total_calls": 0,
    "active_campaigns": 0,
    "conversion_rate": 0,
    "calls_today": 0,
    "leads_added_today": 0,
    "avg_call_duration": 0
  }
}
```

### 2.2 Create a Campaign
```bash
curl -X POST http://localhost:8000/api/v2/voice-agent/campaigns \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "Test Campaign",
    "campaign_goal": "Generate leads",
    "language": "english",
    "voice_type": "female",
    "target_audience": "Business owners",
    "call_purpose": "Product demo",
    "business_context": "SaaS platform",
    "offer_details": "Free trial for 30 days"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "campaign_id": 1,
  "campaign_name": "Test Campaign",
  "status": "active",
  "created_at": "2026-05-15T11:00:00"
}
```

**Save the `campaign_id` for the next tests!**

### 2.3 Generate Opening Script
```bash
curl -X POST http://localhost:8000/api/v2/voice-agent/script/opening \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_name": "Test Campaign",
    "campaign_goal": "Generate leads",
    "business_context": "SaaS platform",
    "offer_details": "Free trial for 30 days",
    "target_audience": "Business owners",
    "call_purpose": "Product demo",
    "language": "english"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "script": "Hi, this is a call from [Company Name]. I'm reaching out to business owners like you who are looking to streamline their operations. We have a SaaS platform that can help you save time and increase productivity. Would you be interested in learning more about our free trial for 30 days?"
}
```

### 2.4 Generate Objection Handling Script
```bash
curl -X POST http://localhost:8000/api/v2/voice-agent/script/objections \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objection": "I am not interested",
    "campaign_goal": "Generate leads",
    "business_context": "SaaS platform",
    "language": "english"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "response": "I understand, and I appreciate your honesty. Many of our clients felt the same way initially, but after seeing how much time and money they saved, they became our biggest advocates. Would you be open to a quick 5-minute call to see if this could work for you?"
}
```

### 2.5 Add a Lead
```bash
curl -X POST http://localhost:8000/api/v2/voice-agent/campaigns/1/leads \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1-555-0123",
    "email": "john@example.com",
    "company": "Acme Corp",
    "designation": "CEO"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "lead_id": 1,
  "name": "John Doe",
  "status": "pending",
  "created_at": "2026-05-15T11:00:00"
}
```

### 2.6 Get Campaign Details
```bash
curl -X GET http://localhost:8000/api/v2/voice-agent/campaigns/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "campaign": {
    "id": 1,
    "campaign_name": "Test Campaign",
    "campaign_goal": "Generate leads",
    "status": "active",
    "total_leads": 1,
    "calls_made": 0,
    "conversion_rate": 0,
    "created_at": "2026-05-15T11:00:00"
  }
}
```

### 2.7 Get Campaign Leads
```bash
curl -X GET http://localhost:8000/api/v2/voice-agent/campaigns/1/leads \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "leads": [
    {
      "id": 1,
      "name": "John Doe",
      "phone": "+1-555-0123",
      "email": "john@example.com",
      "company": "Acme Corp",
      "status": "pending",
      "created_at": "2026-05-15T11:00:00"
    }
  ]
}
```

### 2.8 Simulate Conversation
```bash
curl -X POST http://localhost:8000/api/v2/voice-agent/conversation/simulate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_goal": "Generate leads",
    "business_context": "SaaS platform",
    "offer_details": "Free trial for 30 days",
    "language": "english",
    "customer_response": "Tell me more about your product"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "agent_response": "Great question! Our platform helps businesses automate their workflows, saving them an average of 10 hours per week. With our free 30-day trial, you can experience these benefits firsthand without any commitment. Would you like me to set up a demo for you?"
}
```

---

## 📊 STEP 3: FRONTEND TESTING

### 3.1 Access Frontend
Open your browser and navigate to:
```
http://localhost:8081
```

### 3.2 Test Login
1. Click on "Login" button
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `password123`
3. Click "Sign In"
4. **Expected**: Redirected to dashboard

### 3.3 Test Dashboard
1. Verify you see the dashboard
2. Check if user profile is displayed
3. Verify no console errors

### 3.4 Test Voice Agent Dashboard
1. Navigate to Voice Agent section
2. Click "Create Campaign"
3. Fill in campaign details:
   - Campaign Name: "Test Campaign"
   - Campaign Goal: "Generate leads"
   - Language: "English"
   - Voice Type: "Female"
   - Target Audience: "Business owners"
   - Call Purpose: "Product demo"
   - Business Context: "SaaS platform"
   - Offer Details: "Free trial for 30 days"
4. Click "Create"
5. **Expected**: Campaign created successfully

### 3.5 Test Lead Upload
1. In Voice Agent Dashboard, click "Upload Leads"
2. Create a CSV file with the following content:
```csv
name,phone,email,company,designation
John Doe,+1-555-0123,john@example.com,Acme Corp,CEO
Jane Smith,+1-555-0124,jane@example.com,Tech Inc,Manager
Bob Johnson,+1-555-0125,bob@example.com,StartUp LLC,Founder
```
3. Upload the CSV file
4. **Expected**: Leads uploaded successfully

### 3.6 Test Script Generation
1. In Voice Agent Dashboard, click "Generate Script"
2. Click "Generate Opening Script"
3. **Expected**: Script generated and displayed

### 3.7 Test Conversation Simulation
1. In Voice Agent Dashboard, click "Test Conversation"
2. Enter a customer response: "Tell me more about your product"
3. Click "Send"
4. **Expected**: AI response generated

---

## 🔄 STEP 4: CELERY TASK TESTING

### 4.1 Check Celery Worker Status
```bash
# In the Celery Worker terminal, you should see:
# [tasks]
#   . celery_worker.fetch_analytics
#   . celery_worker.post_to_instagram_task
#   . celery_worker.process_scheduled_posts
#   . celery_worker.retry_failed_posts
```

### 4.2 Check Celery Beat Status
```bash
# In the Celery Beat terminal, you should see:
# [2026-05-15 11:00:01,031: INFO/MainProcess] beat: Starting...
# [2026-05-15 11:00:01,245: INFO/MainProcess] Scheduler: Sending due task...
```

### 4.3 Monitor Task Execution
```bash
# Check Redis for task results
redis-cli
> KEYS *
> GET celery-task-meta-*
```

---

## ✅ FINAL VERIFICATION CHECKLIST

- [ ] Backend responds to requests
- [ ] Frontend loads without errors
- [ ] Login works with test credentials
- [ ] `/me` endpoint returns user data
- [ ] Campaign creation works
- [ ] Script generation works
- [ ] Lead management works
- [ ] Conversation simulation works
- [ ] Dashboard displays statistics
- [ ] Celery worker is running
- [ ] Celery Beat is running
- [ ] No console errors
- [ ] No database errors
- [ ] All API endpoints respond correctly

---

## 🐛 TROUBLESHOOTING

### Backend Not Responding
```bash
# Check if backend is running
curl http://localhost:8000/docs

# If not, restart backend
cd Backend
python main.py
```

### Frontend Not Loading
```bash
# Check if frontend is running
curl http://localhost:8081

# If not, restart frontend
cd Frontend
npm run dev
```

### Redis Not Running
```bash
# Check Redis status
netstat -ano | findstr 6379

# If not running, start Redis
redis-server
```

### Celery Worker Errors
```bash
# Check Celery worker logs
# Look for error messages in the terminal

# Restart Celery worker
cd Backend
celery -A celery_worker worker --loglevel=info --concurrency=4
```

### Database Errors
```bash
# Check database file exists
ls Backend/test.db

# If not, backend will create it on startup
```

---

## 📞 SUPPORT

For issues or questions:
1. Check the logs in each terminal
2. Verify all services are running
3. Check the troubleshooting section above
4. Review the DEPLOYMENT_READY.md file

---

**Last Updated**: 2026-05-15  
**Status**: Ready for Testing ✅
