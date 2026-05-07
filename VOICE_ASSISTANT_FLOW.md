# 🎤 Voice Assistant - System Flow Diagram

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              ┌─────▼─────┐              ┌─────▼─────┐
              │   VOICE   │              │   TEXT    │
              │   INPUT   │              │   INPUT   │
              │    🎤     │              │  ⌨️       │
              └─────┬─────┘              └─────┬─────┘
                    │                           │
                    │ Web Speech API            │
                    │ (Browser Native)          │
                    │                           │
                    ▼                           │
              ┌──────────────┐                 │
              │ Speech-to-   │                 │
              │ Text         │                 │
              │ Transcription│                 │
              └──────┬───────┘                 │
                     │                         │
                     └────────┬────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Component)                        │
│                  AssistantWidget.jsx                                 │
├─────────────────────────────────────────────────────────────────────┤
│  • Manages chat state                                                │
│  • Handles voice input/output                                        │
│  • Displays messages                                                 │
│  • Sends query to backend                                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTP POST /assistant
                               │ Authorization: Bearer <token>
                               │ Body: { "query": "..." }
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (FastAPI)                             │
│                  routes/assistant.py                                 │
├─────────────────────────────────────────────────────────────────────┤
│  • Validates authentication                                          │
│  • Extracts current user                                             │
│  • Calls assistant service                                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  ASSISTANT SERVICE                                   │
│              services/assistant_service.py                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Get Business Context                                       │
│  ┌────────────────────────────────────────┐                        │
│  │  get_business_context(db, user)        │                        │
│  │  • Query BusinessProfile table         │                        │
│  │  • Query BusinessAnalysis table        │                        │
│  │  • Format context string               │                        │
│  └────────────────┬───────────────────────┘                        │
│                   │                                                  │
│  Step 2: Get Live Market Data                                       │
│  ┌────────────────▼───────────────────────┐                        │
│  │  duck_search(query)                    │                        │
│  │  • Search DuckDuckGo                   │                        │
│  │  • Extract relevant results            │                        │
│  └────────────────┬───────────────────────┘                        │
│                   │                                                  │
│  Step 3: Generate AI Response                                       │
│  ┌────────────────▼───────────────────────┐                        │
│  │  Call Groq API                         │                        │
│  │  • Model: llama-3.1-70b-versatile      │                        │
│  │  • System prompt (voice-optimized)     │                        │
│  │  • User query + business context       │                        │
│  │  • Live market data                    │                        │
│  └────────────────┬───────────────────────┘                        │
│                   │                                                  │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GROQ API                                        │
│                 (External Service)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  • Processes query with context                                      │
│  • Generates intelligent response                                    │
│  • Returns concise, conversational answer                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ Response text
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND RESPONSE                                  │
│                  { "response": "..." }                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTP 200 OK
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND RECEIVES RESPONSE                        │
│                  AssistantWidget.jsx                                 │
├─────────────────────────────────────────────────────────────────────┤
│  • Display response in chat                                          │
│  • If voice enabled → speak response                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                      ┌────────────────┐
                      │ Text-to-Speech │
                      │ (Browser API)  │
                      │      🔊        │
                      └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │  USER HEARS    │
                      │   RESPONSE     │
                      │      👂        │
                      └────────────────┘
```

---

## 🔄 Detailed Flow Steps

### 1️⃣ User Input Phase

**Voice Input:**
```
User clicks mic → Browser starts recording → Speech-to-Text → Text appears in input
```

**Text Input:**
```
User types → Text appears in input field
```

### 2️⃣ Query Submission

```
User clicks "Send" or presses Enter
↓
Frontend validates query (not empty)
↓
Frontend sends HTTP POST to /assistant
↓
Includes: JWT token + query text
```

### 3️⃣ Backend Processing

```
Backend receives request
↓
Validates JWT token (authentication)
↓
Extracts current user from token
↓
Gets database session
↓
Calls assistant_service.generate_response(query, db, user)
```

### 4️⃣ Business Context Extraction

```
Query BusinessProfile table
↓
Extract: name, type, industry, description, target_audience, location
↓
Query BusinessAnalysis table (latest)
↓
Extract: strengths, weaknesses, opportunities, threats
↓
Format as context string
```

**Example Context:**
```
Business Name: ABC Motors
Business Type: Motorcycle Showroom
Industry: Automotive
Description: Premium motorcycle dealer
Target Audience: Young professionals, bike enthusiasts
Location: Mumbai, India

Business Analysis:
Strengths: Wide range of models, excellent customer service
Weaknesses: Limited online presence
Opportunities: Growing market for electric bikes
Threats: Increasing competition from online dealers
```

### 5️⃣ Live Data Search

```
Call duck_search(query)
↓
Search DuckDuckGo for relevant information
↓
Extract top results
↓
Format as search data string
```

### 6️⃣ AI Response Generation

```
Build system prompt (voice-optimized)
↓
Build user prompt with:
  • Original query
  • Business context
  • Live search data
↓
Call Groq API (llama-3.1-70b-versatile)
↓
Receive AI-generated response
↓
Return response text
```

**Example Prompt to Groq:**
```
System: You are a smart business AI assistant with voice interaction capabilities.
Keep responses CONCISE and CONVERSATIONAL (2-3 sentences max for voice).

User Query: What are my business strengths?

USER'S BUSINESS CONTEXT:
Business Name: ABC Motors
Business Type: Motorcycle Showroom
...
Strengths: Wide range of models, excellent customer service

LIVE MARKET DATA:
[Search results about motorcycle industry trends]

Provide a helpful, concise response...
```

**Example AI Response:**
```
"Your main strengths are your wide range of motorcycle models and excellent 
customer service. These are valuable assets in the competitive automotive market. 
Consider leveraging these strengths in your marketing to attract more customers."
```

### 7️⃣ Response Delivery

```
Backend returns JSON: { "response": "..." }
↓
Frontend receives response
↓
Displays in chat interface
↓
If voice enabled:
  ↓
  Call speak(response)
  ↓
  Browser Text-to-Speech API
  ↓
  User hears response
```

---

## 🗄️ Database Schema

### Tables Used:

**1. users**
```sql
- id (primary key)
- email
- name
- firebase_uid
- created_at
```

**2. business_profiles**
```sql
- id (primary key)
- user_id (foreign key → users.id)
- business_name
- business_type
- industry
- description
- target_audience
- location
- created_at
- updated_at
```

**3. business_analysis**
```sql
- id (primary key)
- user_id (foreign key → users.id)
- strengths
- weaknesses
- opportunities
- threats
- created_at
```

---

## 🔐 Authentication Flow

```
User logs in
↓
Frontend receives JWT token
↓
Token stored in:
  • useAuth context (user.token)
  • localStorage ('token')
↓
Every assistant request includes:
  Authorization: Bearer <token>
↓
Backend validates token
↓
Extracts user_id from token
↓
Uses user_id to query business data
```

---

## 🎯 Data Flow Example

**User Query:** "What is my business name?"

```
1. Voice Input:
   User speaks → "What is my business name?"
   Browser transcribes → Text: "What is my business name?"

2. Frontend:
   Sends POST /assistant
   Headers: { Authorization: "Bearer eyJ..." }
   Body: { "query": "What is my business name?" }

3. Backend Authentication:
   Validates JWT token
   Extracts user_id: 123

4. Database Query:
   SELECT * FROM business_profiles WHERE user_id = 123
   Result: { business_name: "ABC Motors", ... }

5. Context Building:
   Business Context: "Business Name: ABC Motors\nBusiness Type: Motorcycle Showroom..."

6. Groq API Call:
   Prompt: "User Query: What is my business name?\nBusiness Context: Business Name: ABC Motors..."
   Response: "Your business is called ABC Motors, a motorcycle showroom in the automotive industry."

7. Response Delivery:
   Backend → Frontend: { "response": "Your business is called ABC Motors..." }
   Frontend displays text
   Browser speaks: "Your business is called ABC Motors..."

8. User Experience:
   User sees text response
   User hears spoken response
   ✅ Complete!
```

---

## 🔄 Error Handling Flow

```
Error Occurs
↓
┌─────────────────────────────────────┐
│ Where did the error occur?          │
└─────────────────────────────────────┘
         │
         ├─→ Voice Input Error
         │   └─→ Show error in console
         │       Continue with text input
         │
         ├─→ Network Error
         │   └─→ Show "Could not fetch answer"
         │       Speak error message if voice enabled
         │
         ├─→ Authentication Error (401)
         │   └─→ Redirect to login
         │
         ├─→ Groq API Error
         │   └─→ Return fallback message
         │       "I could not find enough information..."
         │
         └─→ Database Error
             └─→ Return generic response
                 Log error for debugging
```

---

## 📊 Performance Metrics

### Response Time Breakdown:

```
Total Response Time: ~3-8 seconds

1. Frontend → Backend:        ~100ms
2. Authentication:             ~50ms
3. Database Query:             ~200ms
4. DuckDuckGo Search:          ~1-2s
5. Groq API Call:              ~2-5s
6. Backend → Frontend:         ~100ms
7. Text-to-Speech:             ~1-3s (depends on length)
```

### Optimization Points:

- ✅ Database queries are indexed
- ✅ Groq API uses fast model (70b-versatile)
- ✅ Responses limited to 500 tokens (concise)
- ✅ Search results cached (if implemented)
- ✅ Voice processing done locally (no network delay)

---

## 🎨 UI State Machine

```
Widget States:
┌─────────────┐
│   CLOSED    │ ← Initial state
└──────┬──────┘
       │ Click AI button
       ▼
┌─────────────┐
│    OPEN     │ ← Widget visible
└──────┬──────┘
       │
       ├─→ IDLE (waiting for input)
       │
       ├─→ LISTENING (mic active, recording)
       │   └─→ Returns to IDLE when done
       │
       ├─→ LOADING (processing query)
       │   └─→ Returns to IDLE when response received
       │
       └─→ SPEAKING (playing audio)
           └─→ Returns to IDLE when done
```

---

## 🔧 Configuration Dependencies

```
Environment Variables Required:

Backend:
├─ GROQ_API_KEY ────────────→ Groq API access
├─ DATABASE_URL ────────────→ PostgreSQL connection
├─ SECRET_KEY ──────────────→ JWT token signing
└─ FIREBASE_* ──────────────→ Authentication

Frontend:
└─ VITE_API_URL ────────────→ Backend endpoint

Browser:
├─ Web Speech API ──────────→ Voice input
└─ Speech Synthesis API ────→ Voice output
```

---

**🎤 This flow diagram shows the complete journey from user voice input to AI-spoken response!**
