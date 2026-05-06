# Quick Start Guide - Content Creator & Image Generator APIs

## 🚀 Getting Started

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. HuggingFace token set in `.env` (for FLUX and Mistral API mode)
3. (Optional) Automatic1111 WebUI running for Stable Diffusion

---

## 📋 Step-by-Step Usage

### Step 1: Start the Backend

```bash
cd Backend
python main.py
```

Wait for the startup message:
```
✅ Application startup complete
```

---

### Step 2: Test Content Generation

**Using Python:**
```python
import requests

url = "http://localhost:8000/content/generate"
data = {
    "business_type": "Salon",
    "platform": "instagram",
    "goal": "promotion",
    "tone": "friendly",
    "language": "english"
}

response = requests.post(url, json=data)
print(response.json())
```

**Using cURL:**
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

**Expected Response:**
```json
{
  "status": "success",
  "content": {
    "caption": "Your generated caption here...",
    "hashtags": ["#salon", "#instagram", "#promotion"],
    "script": "Your generated script here..."
  }
}
```

---

### Step 3: Test Image Generation

**Using Python:**
```python
import requests

url = "http://localhost:8000/image/generate"
data = {
    "business_type": "Salon",
    "use_case": "poster",
    "offer": "20% discount",
    "style": "premium",
    "model": "flux"
}

response = requests.post(url, json=data)
result = response.json()
print(f"Image URL: {result['image_url']}")
```

**Using cURL:**
```bash
curl -X POST http://localhost:8000/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "business_type": "Salon",
    "use_case": "poster",
    "offer": "20% discount",
    "style": "premium",
    "model": "flux"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "image_url": "/output/images/salon_20260504_123456.png",
  "model_used": "flux"
}
```

---

### Step 4: Access Generated Image

Once you have the `image_url` from the response, access it via:

```
http://localhost:8000/output/images/salon_20260504_123456.png
```

Or in your browser, just navigate to that URL.

---

## 🧪 Run Automated Tests

```bash
cd Backend
python test_new_apis.py
```

This will test:
- ✅ Health check endpoints
- ✅ Content generation
- ✅ Image generation

---

## 📊 API Documentation

Once the backend is running, visit:

```
http://localhost:8000/docs
```

You'll see the new endpoints:
- **Content Creator** section with `/content/generate` and `/content/health`
- **Image Generator** section with `/image/generate` and `/image/health`

You can test the APIs directly from the Swagger UI!

---

## 🎯 Example Use Cases

### Use Case 1: Generate Instagram Post for Salon

```python
import requests

# Step 1: Generate content
content_response = requests.post(
    "http://localhost:8000/content/generate",
    json={
        "business_type": "Beauty Salon",
        "platform": "instagram",
        "goal": "promotion",
        "tone": "friendly",
        "language": "english"
    }
)
content = content_response.json()["content"]

# Step 2: Generate image
image_response = requests.post(
    "http://localhost:8000/image/generate",
    json={
        "business_type": "Beauty Salon",
        "use_case": "poster",
        "offer": "20% off on all services",
        "style": "premium",
        "model": "flux"
    }
)
image_url = image_response.json()["image_url"]

# Step 3: Use the content and image
print(f"Caption: {content['caption']}")
print(f"Hashtags: {' '.join(content['hashtags'])}")
print(f"Image: http://localhost:8000{image_url}")
```

---

### Use Case 2: Generate Facebook Banner for Restaurant

```python
import requests

# Generate content
content = requests.post(
    "http://localhost:8000/content/generate",
    json={
        "business_type": "Restaurant",
        "platform": "facebook",
        "goal": "engagement",
        "tone": "professional",
        "language": "english"
    }
).json()

# Generate banner
image = requests.post(
    "http://localhost:8000/image/generate",
    json={
        "business_type": "Restaurant",
        "use_case": "banner",
        "offer": "Grand Opening Special",
        "style": "vibrant",
        "model": "flux"
    }
).json()

print(f"Content: {content}")
print(f"Image: {image}")
```

---

### Use Case 3: Multi-language Content for Local Business

```python
import requests

languages = ["english", "hindi", "telugu"]

for lang in languages:
    response = requests.post(
        "http://localhost:8000/content/generate",
        json={
            "business_type": "Local Store",
            "platform": "instagram",
            "goal": "branding",
            "tone": "local",
            "language": lang
        }
    )
    content = response.json()["content"]
    print(f"\n{lang.upper()} Content:")
    print(f"Caption: {content['caption']}")
```

---

## ⚙️ Configuration Options

### Content Generation Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| `business_type` | Any string | Type of business (e.g., "Salon", "Restaurant") |
| `platform` | instagram, facebook, reels | Target social media platform |
| `goal` | promotion, engagement, branding | Content objective |
| `tone` | professional, friendly, local | Content tone/style |
| `language` | english, hindi, telugu | Content language |

### Image Generation Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| `business_type` | Any string | Type of business |
| `use_case` | poster, product, banner | Image type |
| `offer` | Any string | Special offer text (optional) |
| `style` | modern, premium, vibrant | Visual style |
| `model` | flux, sd | AI model to use |

---

## 🔍 Troubleshooting

### Issue: "Missing HUGGINGFACE_TOKEN"

**Solution:** Add to `Backend/.env`:
```
HUGGINGFACE_TOKEN=your_token_here
```

### Issue: "Stable Diffusion API request failed"

**Solution:** Start Automatic1111 WebUI:
```bash
cd stable-diffusion-webui
python launch.py --api
```

### Issue: Content generation is slow

**Solution:** This is normal. Content generation takes 2-10 seconds, image generation takes 30-60 seconds.

### Issue: Import errors when starting backend

**Solution:** Install dependencies:
```bash
cd Backend
pip install -r requirements-updated.txt
```

---

## 📞 Support

If you encounter issues:
1. Check the backend logs for error messages
2. Verify all environment variables are set
3. Ensure HuggingFace token has access to required models
4. Check that output directory exists: `Backend/output/images/`

---

## ✅ Verification Checklist

Before using the APIs, verify:

- [ ] Backend is running on port 8000
- [ ] `/docs` endpoint shows new APIs
- [ ] `/content/health` returns 200 OK
- [ ] `/image/health` returns 200 OK
- [ ] `HUGGINGFACE_TOKEN` is set in `.env`
- [ ] `Backend/output/images/` directory exists

---

**You're all set! Start generating amazing content and images! 🎉**
