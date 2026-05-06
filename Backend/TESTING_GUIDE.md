# Testing Guide - Content Creator & Image Generator

## 🧪 Testing Overview

This guide explains how to test the newly integrated Content Creator and Image Generator APIs.

---

## 📋 Pre-Testing Checklist

Before running tests, ensure:

- [ ] Backend is running on `http://localhost:8000`
- [ ] `HUGGINGFACE_TOKEN` is set in `Backend/.env`
- [ ] Python dependencies are installed
- [ ] Output directory exists: `Backend/output/images/`

---

## 🚀 Quick Verification

### Step 1: Verify Imports
```bash
cd Backend
python test_imports.py
```

**Expected Output:**
```
✅ ALL IMPORT TESTS PASSED!
```

### Step 2: Quick Verification
```bash
cd Backend
python verify_content_creator.py
```

**Expected Output:**
```
✅ CONTENT CREATOR INTEGRATION VERIFIED!
```

---

## 🧪 Test Scripts

### 1. Import Tests (`test_imports.py`)
**Purpose:** Verify all modules can be imported correctly

**Run:**
```bash
cd Backend
python test_imports.py
```

**Tests:**
- ✅ Content creator service import
- ✅ Image generator service import
- ✅ Content creator route import
- ✅ Image generator route import
- ✅ Content creator app path
- ✅ Content creator app imports
- ✅ Output directory
- ✅ Function signatures

---

### 2. Quick Verification (`verify_content_creator.py`)
**Purpose:** Quick check if backend is running and endpoints work

**Run:**
```bash
cd Backend
python verify_content_creator.py
```

**Tests:**
- ✅ Backend is running
- ✅ Health check endpoint
- ✅ Content generation endpoint
- ✅ Basic content generation

**Note:** Backend must be running first!

---

### 3. Detailed Content Creator Tests (`test_content_creator_detailed.py`)
**Purpose:** Comprehensive testing of all Content Creator features

**Run:**
```bash
cd Backend
python test_content_creator_detailed.py
```

**Tests:**
- ✅ Health check
- ✅ Instagram promotion (English)
- ✅ Facebook engagement (English)
- ✅ Reels branding (English)
- ✅ Hindi content
- ✅ Telugu content
- ✅ Professional tone
- ✅ Local tone
- ✅ Invalid request handling

**Note:** This takes 5-10 minutes to complete!

---

### 4. Complete API Tests (`test_new_apis.py`)
**Purpose:** Test both Content Creator and Image Generator

**Run:**
```bash
cd Backend
python test_new_apis.py
```

**Tests:**
- ✅ Health checks (both APIs)
- ✅ Content generation
- ✅ Image generation

**Note:** Image generation takes 30-60 seconds!

---

## 🎯 Testing Workflow

### For First-Time Setup

1. **Install dependencies:**
   ```bash
   cd Backend
   pip install -r requirements-updated.txt
   ```

2. **Set environment variable:**
   ```bash
   # Add to Backend/.env
   HUGGINGFACE_TOKEN=your_token_here
   ```

3. **Test imports (backend OFF):**
   ```bash
   python test_imports.py
   ```

4. **Start backend:**
   ```bash
   python main.py
   ```

5. **Quick verification (backend ON):**
   ```bash
   # In another terminal
   cd Backend
   python verify_content_creator.py
   ```

6. **Comprehensive tests (backend ON):**
   ```bash
   python test_content_creator_detailed.py
   ```

---

### For Daily Development

1. **Start backend:**
   ```bash
   cd Backend
   python main.py
   ```

2. **Quick check:**
   ```bash
   # In another terminal
   cd Backend
   python verify_content_creator.py
   ```

3. **If issues, check imports:**
   ```bash
   python test_imports.py
   ```

---

## 🔍 Manual Testing

### Using cURL

**Test Content Generation:**
```bash
curl -X POST http://localhost:8000/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "business_type": "Salon",
    "platform": "instagram",
    "goal": "promotion",
    "tone": "friendly",
    "language": "english"
  }'
```

**Test Health Check:**
```bash
curl http://localhost:8000/content/health
```

---

### Using Python

```python
import requests

# Test content generation
response = requests.post(
    "http://localhost:8000/content/generate",
    json={
        "business_type": "Salon",
        "platform": "instagram",
        "goal": "promotion",
        "tone": "friendly",
        "language": "english"
    }
)
print(response.json())
```

---

### Using Swagger UI

1. Start backend: `python main.py`
2. Open browser: `http://localhost:8000/docs`
3. Find "Content Creator" section
4. Click "Try it out" on `/content/generate`
5. Fill in the request body
6. Click "Execute"

---

## ✅ Expected Results

### Content Generation Response
```json
{
  "status": "success",
  "content": {
    "caption": "Your generated caption here...",
    "hashtags": [
      "#salon",
      "#instagram",
      "#promotion",
      "#smallbusiness",
      "#marketing"
    ],
    "script": "Your generated script here..."
  }
}
```

### With Fallback (if AI unavailable)
```json
{
  "status": "success",
  "content": {
    "caption": "🌟 Discover amazing wonderful at Salon! Check out our latest offers at Salon!",
    "hashtags": [
      "#salon",
      "#instagram",
      "#promotion",
      "#smallbusiness",
      "#local"
    ],
    "script": "Exciting news from Salon! We're offering special promotions..."
  },
  "note": "Generated using fallback template (AI model unavailable)"
}
```

---

## 🐛 Troubleshooting

### Issue: Import errors

**Symptom:**
```
ModuleNotFoundError: No module named 'app.services'
```

**Solution:**
1. Check file structure:
   ```bash
   ls Backend/ai_models/content_creator/app/services/
   ```
2. Verify `__init__.py` files exist
3. Run: `python test_imports.py`

---

### Issue: Backend won't start

**Symptom:**
```
ImportError: cannot import name 'router'
```

**Solution:**
1. Check syntax: `python -m py_compile main.py`
2. Check routes exist: `ls Backend/routes/`
3. Check logs for detailed error

---

### Issue: Content generation fails

**Symptom:**
```
{
  "status": "success",
  "note": "Generated using fallback template (AI model unavailable)"
}
```

**This is actually OK!** The fallback system is working. To use AI:
1. Set `HUGGINGFACE_TOKEN` in `.env`
2. Verify token is valid
3. Check internet connection

---

### Issue: Slow response times

**Symptom:** Content generation takes >30 seconds

**This is normal for:**
- First request (model loading)
- API mode (HuggingFace API)

**To speed up:**
- Use local mode (if adapter available)
- Wait for model to cache (subsequent requests faster)

---

### Issue: Test timeouts

**Symptom:**
```
requests.exceptions.Timeout
```

**Solution:**
1. Increase timeout in test script
2. Check backend is running
3. Check backend logs for errors
4. Try again (first request may timeout while loading)

---

## 📊 Test Coverage

### Content Creator Features

| Feature | Test Script | Status |
|---------|-------------|--------|
| Health check | All | ✅ |
| Content generation | All | ✅ |
| Instagram platform | Detailed | ✅ |
| Facebook platform | Detailed | ✅ |
| Reels platform | Detailed | ✅ |
| Promotion goal | Detailed | ✅ |
| Engagement goal | Detailed | ✅ |
| Branding goal | Detailed | ✅ |
| Professional tone | Detailed | ✅ |
| Friendly tone | Detailed | ✅ |
| Local tone | Detailed | ✅ |
| English language | Detailed | ✅ |
| Hindi language | Detailed | ✅ |
| Telugu language | Detailed | ✅ |
| Caption generation | All | ✅ |
| Hashtag generation | All | ✅ |
| Script generation | All | ✅ |
| Error handling | Detailed | ✅ |
| Input validation | Detailed | ✅ |
| Fallback content | Automatic | ✅ |

---

## 🎯 Success Criteria

Tests pass when:

- ✅ All imports successful
- ✅ Backend starts without errors
- ✅ Health check returns 200 OK
- ✅ Content generation returns valid JSON
- ✅ Response contains caption, hashtags, and script
- ✅ All platforms work
- ✅ All goals work
- ✅ All tones work
- ✅ All languages work
- ✅ Invalid requests properly rejected
- ✅ Fallback works when AI unavailable

---

## 📝 Test Logs

### Where to find logs

**Backend logs:**
```bash
# Console output when running
python main.py
```

**Test logs:**
```bash
# Console output when running tests
python test_content_creator_detailed.py
```

### What to look for

**Success indicators:**
```
✅ content_creator_service imported successfully
✅ Health endpoint working
✅ Content generation working!
✅ TEST PASSED
```

**Error indicators:**
```
❌ Failed to import
❌ Health endpoint failed
❌ Content generation failed
❌ TEST FAILED
```

---

## 🔄 Continuous Testing

### During Development

1. Make code changes
2. Run: `python test_imports.py`
3. Restart backend
4. Run: `python verify_content_creator.py`
5. If issues, run: `python test_content_creator_detailed.py`

### Before Deployment

1. Run all tests:
   ```bash
   python test_imports.py
   python verify_content_creator.py
   python test_content_creator_detailed.py
   python test_new_apis.py
   ```

2. Verify all pass
3. Check backend logs for warnings
4. Test manually via Swagger UI

---

## 📞 Getting Help

If tests fail:

1. **Check this guide** for troubleshooting
2. **Check backend logs** for detailed errors
3. **Run import tests** to isolate issues
4. **Check environment variables** are set
5. **Verify file structure** is correct

---

**Happy Testing! 🧪**
