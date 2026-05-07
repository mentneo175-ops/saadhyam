# 🧪 Voice Assistant - Testing Guide

## ✅ Pre-Testing Checklist

Before testing, ensure:
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 8080
- [ ] You are logged in to the application
- [ ] Business profile is set up
- [ ] Using Chrome or Edge browser (for best voice support)
- [ ] Microphone permissions granted
- [ ] GROQ_API_KEY is configured in Backend/.env

---

## 🚀 Quick Start Test

### 1. Open the Application
```
http://localhost:8080
```

### 2. Login
- Use your credentials
- Ensure you're authenticated

### 3. Locate the Assistant
- Look for the **"AI"** button in the bottom-right corner
- It should be a circular button with "AI" text

### 4. Open the Widget
- Click the AI button
- Widget should expand showing chat interface

### 5. Test Text Input
```
Type: "Hello"
Press: Enter or click "Send"
Expected: AI responds with a greeting
```

### 6. Test Voice Input
```
1. Click the microphone button (🎤)
2. Button should turn red
3. Speak: "What is my business name?"
4. Text should appear in input field
5. Click "Send"
6. Expected: AI responds with your business name
```

---

## 🧪 Comprehensive Test Cases

### Test Suite 1: Basic Functionality

#### TC1.1: Widget Open/Close
```
Steps:
1. Click AI button
2. Widget opens
3. Click "Close" button
4. Widget closes

Expected: Widget toggles correctly
Status: [ ]
```

#### TC1.2: Text Input
```
Steps:
1. Open widget
2. Type "test" in input field
3. Click "Send"

Expected: Message appears in chat, AI responds
Status: [ ]
```

#### TC1.3: Enter Key Submit
```
Steps:
1. Open widget
2. Type "test"
3. Press Enter key

Expected: Message submits without clicking Send
Status: [ ]
```

#### TC1.4: Empty Input Prevention
```
Steps:
1. Open widget
2. Click "Send" without typing anything

Expected: Nothing happens (validation works)
Status: [ ]
```

---

### Test Suite 2: Voice Input (Speech-to-Text)

#### TC2.1: Start Voice Input
```
Steps:
1. Open widget
2. Click microphone button

Expected:
- Button turns red
- "🎤 Listening..." message appears
- Browser asks for microphone permission (first time)
Status: [ ]
```

#### TC2.2: Voice Transcription
```
Steps:
1. Click microphone button
2. Speak clearly: "What is my business name?"
3. Wait for transcription

Expected:
- Text appears in input field
- Microphone button returns to normal
- "Listening..." message disappears
Status: [ ]
```

#### TC2.3: Stop Voice Input
```
Steps:
1. Click microphone button (starts listening)
2. Click microphone button again (stops listening)

Expected:
- Recording stops
- Button returns to normal
Status: [ ]
```

#### TC2.4: Voice Input Error Handling
```
Steps:
1. Deny microphone permission
2. Click microphone button

Expected:
- Error logged in console
- User can still use text input
Status: [ ]
```

---

### Test Suite 3: Voice Output (Text-to-Speech)

#### TC3.1: Auto-Speak Response
```
Steps:
1. Ensure speaker icon shows "enabled" (Volume2 icon)
2. Send a query: "Hello"
3. Wait for response

Expected:
- Text response appears
- Browser speaks the response aloud
- "🔊 Speaking..." indicator shows
Status: [ ]
```

#### TC3.2: Toggle Voice Off
```
Steps:
1. Click speaker icon (should show VolumeX)
2. Send a query: "Hello"

Expected:
- Text response appears
- No audio plays
Status: [ ]
```

#### TC3.3: Toggle Voice On
```
Steps:
1. Voice is off (VolumeX icon)
2. Click speaker icon (should show Volume2)
3. Send a query: "Hello"

Expected:
- Voice output resumes
- Response is spoken
Status: [ ]
```

#### TC3.4: Stop Speaking
```
Steps:
1. Send a long query to get a long response
2. While AI is speaking, click speaker icon

Expected:
- Speech stops immediately
- Voice is disabled
Status: [ ]
```

---

### Test Suite 4: Business Context Integration

#### TC4.1: Business Name Query
```
Query: "What is my business name?"

Expected Response:
- Should mention your actual business name
- Should reference business type/industry
- Should be personalized

Example: "Your business is called ABC Motors, a motorcycle 
showroom in the automotive industry."

Status: [ ]
```

#### TC4.2: Business Type Query
```
Query: "What type of business do I have?"

Expected Response:
- Should state business type
- Should provide context

Status: [ ]
```

#### TC4.3: Target Audience Query
```
Query: "Who is my target audience?"

Expected Response:
- Should mention target audience from profile
- Should provide relevant insights

Status: [ ]
```

#### TC4.4: Business Strengths Query
```
Query: "What are my business strengths?"

Expected Response:
- Should list strengths from business analysis
- Should provide actionable advice

Status: [ ]
```

#### TC4.5: Business Weaknesses Query
```
Query: "What weaknesses should I address?"

Expected Response:
- Should mention weaknesses from analysis
- Should suggest improvements

Status: [ ]
```

#### TC4.6: Opportunities Query
```
Query: "What opportunities are available?"

Expected Response:
- Should list opportunities from analysis
- Should provide strategic recommendations

Status: [ ]
```

#### TC4.7: Threats Query
```
Query: "What threats should I be aware of?"

Expected Response:
- Should mention threats from analysis
- Should suggest mitigation strategies

Status: [ ]
```

---

### Test Suite 5: Market Insights

#### TC5.1: Industry Trends
```
Query: "What are the latest trends in [your industry]?"

Expected Response:
- Should include live search data
- Should relate to your business
- Should be current information

Status: [ ]
```

#### TC5.2: Marketing Advice
```
Query: "How can I improve my marketing?"

Expected Response:
- Should provide actionable marketing tips
- Should consider your business type
- Should be specific, not generic

Status: [ ]
```

#### TC5.3: Social Media Strategy
```
Query: "What social media strategy should I use?"

Expected Response:
- Should recommend platforms
- Should consider target audience
- Should provide specific tactics

Status: [ ]
```

#### TC5.4: Competitor Analysis
```
Query: "What are competitors doing?"

Expected Response:
- Should provide market insights
- Should include live data
- Should suggest competitive strategies

Status: [ ]
```

---

### Test Suite 6: Error Handling

#### TC6.1: Network Error
```
Steps:
1. Disconnect internet
2. Send a query

Expected:
- Error message: "Sorry, I could not fetch an answer..."
- User can retry when connection restored

Status: [ ]
```

#### TC6.2: Authentication Error
```
Steps:
1. Clear localStorage (remove token)
2. Send a query

Expected:
- 401 Unauthorized error
- Redirect to login (or show auth error)

Status: [ ]
```

#### TC6.3: Empty Business Profile
```
Steps:
1. Use account without business profile
2. Send query: "What is my business name?"

Expected:
- Response indicates no profile found
- Suggests completing business setup

Status: [ ]
```

#### TC6.4: API Timeout
```
Steps:
1. Send a complex query
2. Wait for timeout (20 seconds)

Expected:
- Fallback message appears
- User can retry

Status: [ ]
```

---

### Test Suite 7: UI/UX

#### TC7.1: Message Display
```
Steps:
1. Send multiple messages
2. Observe chat history

Expected:
- User messages on right (blue)
- AI messages on left (gray)
- Messages stack vertically
- Auto-scroll to bottom

Status: [ ]
```

#### TC7.2: Loading State
```
Steps:
1. Send a query
2. Observe loading state

Expected:
- "💭 Thinking..." message appears
- Send button disabled
- Input field remains active

Status: [ ]
```

#### TC7.3: Listening State
```
Steps:
1. Click microphone
2. Observe UI changes

Expected:
- Mic button turns red
- "🎤 Listening..." message appears
- Input field shows "Listening..." placeholder

Status: [ ]
```

#### TC7.4: Speaking State
```
Steps:
1. Send query with voice enabled
2. Observe speaking state

Expected:
- "🔊 Speaking..." indicator shows
- AI button shows "🔊" emoji
- Speaking stops when complete

Status: [ ]
```

#### TC7.5: Responsive Design
```
Steps:
1. Resize browser window
2. Test on different screen sizes

Expected:
- Widget remains in bottom-right
- Content is readable
- Buttons are clickable

Status: [ ]
```

---

### Test Suite 8: Performance

#### TC8.1: Response Time
```
Steps:
1. Send query: "Hello"
2. Measure time to response

Expected:
- Response within 3-8 seconds
- No hanging or freezing

Status: [ ]
Time: _____ seconds
```

#### TC8.2: Multiple Queries
```
Steps:
1. Send 5 queries in succession
2. Observe performance

Expected:
- All queries processed correctly
- No memory leaks
- UI remains responsive

Status: [ ]
```

#### TC8.3: Long Conversation
```
Steps:
1. Send 20+ messages
2. Observe chat history

Expected:
- All messages displayed
- Scroll works smoothly
- No performance degradation

Status: [ ]
```

---

### Test Suite 9: Browser Compatibility

#### TC9.1: Chrome
```
Browser: Google Chrome
Version: _____

Voice Input: [ ] Works / [ ] Doesn't work
Voice Output: [ ] Works / [ ] Doesn't work
Overall: [ ] Pass / [ ] Fail
```

#### TC9.2: Edge
```
Browser: Microsoft Edge
Version: _____

Voice Input: [ ] Works / [ ] Doesn't work
Voice Output: [ ] Works / [ ] Doesn't work
Overall: [ ] Pass / [ ] Fail
```

#### TC9.3: Firefox
```
Browser: Mozilla Firefox
Version: _____

Voice Input: [ ] Works / [ ] Doesn't work
Voice Output: [ ] Works / [ ] Doesn't work
Overall: [ ] Pass / [ ] Fail
Notes: Voice input may have limited support
```

#### TC9.4: Safari
```
Browser: Safari
Version: _____

Voice Input: [ ] Works / [ ] Doesn't work
Voice Output: [ ] Works / [ ] Doesn't work
Overall: [ ] Pass / [ ] Fail
Notes: Voice input may have limited support
```

---

## 🎯 Sample Test Queries

### Business Information Queries:
```
✅ "What is my business name?"
✅ "Tell me about my business"
✅ "What industry am I in?"
✅ "Who is my target audience?"
✅ "Where is my business located?"
✅ "What type of business do I have?"
```

### Business Analysis Queries:
```
✅ "What are my business strengths?"
✅ "What weaknesses should I address?"
✅ "What opportunities are available?"
✅ "What threats should I be aware of?"
✅ "Give me a SWOT analysis"
```

### Market Insights Queries:
```
✅ "What are the latest trends in my industry?"
✅ "How can I improve my marketing?"
✅ "What social media platforms should I use?"
✅ "How to handle negative reviews?"
✅ "Best practices for customer service?"
✅ "How to increase sales?"
```

### General Queries:
```
✅ "Hello"
✅ "How can you help me?"
✅ "What can you do?"
✅ "Give me business advice"
```

---

## 🐛 Bug Report Template

```
Bug ID: _____
Date: _____
Tester: _____

Title: [Brief description]

Steps to Reproduce:
1. 
2. 
3. 

Expected Result:


Actual Result:


Severity: [ ] Critical / [ ] High / [ ] Medium / [ ] Low

Browser: _____
Version: _____

Screenshots/Logs:


Additional Notes:

```

---

## 📊 Test Results Summary

```
Total Test Cases: 50+
Passed: _____
Failed: _____
Skipped: _____
Pass Rate: _____%

Critical Issues: _____
High Priority: _____
Medium Priority: _____
Low Priority: _____

Overall Status: [ ] Pass / [ ] Fail

Tested By: _____
Date: _____
```

---

## 🔍 Debugging Tips

### Check Backend Logs:
```bash
# Look for errors in terminal running backend
# Check for:
- Authentication errors
- Database connection issues
- Groq API errors
- Missing environment variables
```

### Check Frontend Console:
```javascript
// Open browser DevTools (F12)
// Look for:
- Network errors (failed requests)
- JavaScript errors
- Speech API errors
- Authentication issues
```

### Test API Directly:
```bash
# Test assistant endpoint with curl
curl -X POST http://localhost:8000/assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "Hello"}'
```

### Check Database:
```sql
-- Verify business profile exists
SELECT * FROM business_profiles WHERE user_id = YOUR_USER_ID;

-- Verify business analysis exists
SELECT * FROM business_analysis WHERE user_id = YOUR_USER_ID;
```

---

## ✅ Acceptance Criteria

The Voice Assistant feature is considered complete when:

- [ ] All critical test cases pass
- [ ] Voice input works in Chrome/Edge
- [ ] Voice output works in all browsers
- [ ] Business context is correctly retrieved
- [ ] Responses are personalized and relevant
- [ ] Error handling works correctly
- [ ] UI is responsive and user-friendly
- [ ] Performance is acceptable (< 8s response time)
- [ ] No critical bugs
- [ ] Documentation is complete

---

## 📝 Test Execution Log

```
Test Session 1:
Date: _____
Tester: _____
Duration: _____
Results: _____

Test Session 2:
Date: _____
Tester: _____
Duration: _____
Results: _____

Test Session 3:
Date: _____
Tester: _____
Duration: _____
Results: _____
```

---

**🧪 Happy Testing! Report any issues you find!**
