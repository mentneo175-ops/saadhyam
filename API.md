# API Documentation - Saadhyam AI

Complete API reference for Saadhyam AI platform.

## 🌐 Base URLs

- **Main API**: `http://localhost:8000`
- **Business Analysis API**: `http://localhost:9001`
- **Interactive Docs**: `/docs` (Swagger UI)

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📋 API Endpoints

### Authentication Routes (`/auth`)

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

#### Logout User
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

### Profile Management (`/api/profile`)

#### Get User Profile
```http
GET /api/profile/
Authorization: Bearer <access_token>
```

#### Get Business Profile
```http
GET /api/profile/business
Authorization: Bearer <access_token>
```

#### Update Business Profile
```http
PUT /api/profile/business
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "business_name": "My Business",
  "business_type": "Restaurant",
  "business_location": "New York, NY",
  "business_description": "A cozy Italian restaurant..."
}
```

#### Check Business Setup Status
```http
GET /api/profile/business/setup-status
Authorization: Bearer <access_token>
```

### Business Analysis (`/api/business`)

#### Analyze Business
```http
POST /api/business/analyze
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "description": "We are a restaurant serving Italian cuisine..."
}
```

**Response:**
```json
{
  "success": true,
  "business_score": 7,
  "ai_visibility_score": 65,
  "conversion_score": 75,
  "strengths": ["Good location", "Quality food"],
  "weaknesses": ["Limited online presence"],
  "opportunities": ["Social media marketing"],
  "threats": ["New competitors"],
  "recommendations": ["Create Instagram account", "Run local ads"]
}
```

#### Get Analysis History
```http
GET /api/business/history?limit=10
Authorization: Bearer <access_token>
```

#### Get Latest Analysis
```http
GET /api/business/latest
Authorization: Bearer <access_token>
```

### Review Reply AI (`/ai`)

#### Generate Review Reply
```http
POST /ai/generate-review-reply
Content-Type: application/json

{
  "review_text": "Great food but slow service",
  "rating": 4
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Thank you for your feedback! We're delighted you enjoyed our food...",
  "tone": "professional",
  "model_used": "TinyLlama"
}
```

### Instagram Integration (`/instagram`)

#### Connect Instagram Account
```http
GET /auth/instagram
```

#### Get Instagram Posts
```http
GET /instagram/posts
Authorization: Bearer <access_token>
```

#### Upload and Post
```http
POST /instagram/upload-and-post
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "image": <file>,
  "caption": "Check out our new dish!"
}
```

### Settings Management (`/api/settings`)

#### Get User Settings
```http
GET /api/settings
Authorization: Bearer <access_token>
```

#### Update Settings
```http
PUT /api/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "business_name": "My Restaurant",
  "timezone": "America/New_York"
}
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error information",
  "status_code": 400
}
```

## 🔒 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error
- `503` - Service Unavailable

## 🧪 Testing with cURL

### Register and Login
```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Business Analysis
```bash
# Analyze business (replace TOKEN with actual JWT)
curl -X POST http://localhost:8000/api/business/analyze \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"We are a small cafe serving coffee and pastries"}'
```

### Review Reply
```bash
# Generate review reply
curl -X POST http://localhost:8000/ai/generate-review-reply \
  -H "Content-Type: application/json" \
  -d '{"review_text":"Great service!","rating":5}'
```

## 🔧 Rate Limits

- **Authentication**: 10 requests per minute
- **Business Analysis**: 5 requests per minute
- **Review Reply**: 20 requests per minute
- **General API**: 100 requests per minute

## 📝 Request/Response Examples

### Business Profile Update
```bash
curl -X PUT http://localhost:8000/api/profile/business \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Bella Vista Restaurant",
    "business_type": "Restaurant",
    "business_location": "Downtown, Chicago",
    "business_description": "Family-owned Italian restaurant serving authentic cuisine since 1985. We specialize in homemade pasta and wood-fired pizzas."
  }'
```

### Get Business Analysis History
```bash
curl -X GET "http://localhost:8000/api/business/history?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚨 Error Handling

### Common Errors

**401 Unauthorized:**
```json
{
  "detail": "Could not validate credentials"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**503 Service Unavailable:**
```json
{
  "detail": "Business analysis model server is not available"
}
```

## 🔄 Webhooks (Future)

Webhook endpoints for real-time notifications:
- Business analysis completion
- Review reply generation
- Instagram post status updates

## 📚 SDK Support

Currently available:
- **JavaScript/TypeScript**: Built-in API client in frontend
- **Python**: Direct FastAPI client usage
- **cURL**: Command-line examples provided

## 🛠️ Development

### Local Testing
```bash
# Start both servers
python Backend/main.py &
python Backend/business_model.py &

# Test health endpoints
curl http://localhost:8000/health
curl http://localhost:9001/health
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

For more information, see the main README.md file.