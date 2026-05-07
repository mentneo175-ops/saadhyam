# 🎤 Voice Assistant Feature - Complete Guide

## Overview
The Voice Assistant is an AI-powered conversational interface that allows users to interact with their business data using voice or text. It uses Groq API for intelligent responses and accesses the user's business profile and analysis data from the database.

---

## ✨ Features

### 1. **Voice Input (Speech-to-Text)**
- Click the microphone button to speak your question
- Uses browser's native Web Speech API (no external API needed)
- Supports English language
- Real-time transcription to text input field

### 2. **Voice Output (Text-to-Speech)**
- AI responses are automatically spoken aloud
- Toggle voice on/off with the speaker button
- Natural voice synthesis using browser's native API
- Visual indicator when speaking

### 3. **Business Context Awareness**
- Accesses user's business profile from database
- Retrieves latest business analysis (SWOT)
- Provides personalized responses based on business data
- Queries include:
  - Business name, type, industry
  - Target audience and location
  - Strengths, weaknesses, opportunities, threats

### 4. **Live Market Data**
- Integrates with DuckDuckGo search for current information
- Combines business context with live market data
- Provides actionable insights and recommendations

### 5. **User-Friendly Interface**
- Floating widget in bottom-right corner
- Clean, modern chat interface
- Visual indicators for listening/speaking states
- Auto-scroll to latest messages
- Responsive design

---

## 🛠️ Technical Implementation

### Backend Changes

#### 1. **Updated `Backend/routes/assistant.py`**
```python
# Added authentication and database access
@router.post("/assistant", response_model=AssistantResponse)
async def assistant_query(
    request: AssistantRequest,
    db: Session = Depends(get_sync_db),
    current_user: User = Depends(get_current_user),
):
    response_text = await generate_response(query, db, current_user)
    return AssistantResponse(response=response_text)
```

#### 2. **Enhanced `Backend/services/assistant_service.py`**
- **New function**: `get_business_context(db, user)` - Extracts business data
- **Updated**: `generate_response()` - Now accepts db and user parameters
- **Improved**: Uses Groq `llama-3.1-70b-versatile` model for better responses
- **Optimized**: Concise responses suitable for voice interaction (2-3 sentences)

**Business Context Extraction:**
```python
def get_business_context(db: Session, user: User) -> str:
    # Fetches:
    # - Business Profile (name, type, industry, description, target audience, location)
    # - Latest Business Analysis (SWOT analysis)
    # Returns formatted context string
```

**AI System Prompt:**
```
You are a smart business AI assistant with voice interaction capabilities.

IMPORTANT RULES:
1. Keep responses CONCISE and CONVERSATIONAL (2-3 sentences max for voice)
2. Use the user's business context to personalize responses
3. Provide actionable insights and recommendations
4. Be friendly and professional
5. If asked about business details, use the provided business context
6. For market/general queries, use the live search data
7. Always relate answers back to the user's business when relevant
```

### Frontend Changes

#### 1. **Updated `Frontend/src/lib/assistantApi.js`**
```javascript
// Added authentication token support
export async function sendQuery(query, token) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    // ... rest of the code
}
```

#### 2. **Enhanced `Frontend/src/components/AssistantWidget.jsx`**

**New Features:**
- Speech Recognition (Web Speech API)
- Speech Synthesis (Web Speech API)
- Voice enable/disable toggle
- Microphone button with visual states
- Auto-speak AI responses
- Listening indicator
- Speaking indicator

**Key State Variables:**
```javascript
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [voiceEnabled, setVoiceEnabled] = useState(true);
const [speechSupported, setSpeechSupported] = useState(false);
```

**Voice Functions:**
```javascript
startListening()  // Start speech recognition
stopListening()   // Stop speech recognition
speak(text)       // Convert text to speech
stopSpeaking()    // Cancel ongoing speech
toggleVoice()     // Enable/disable voice output
```

---

## 🎯 Usage Examples

### Example Queries:

1. **Business Information:**
   - "What is my business name?"
   - "Tell me about my business"
   - "What industry am I in?"
   - "Who is my target audience?"

2. **Business Analysis:**
   - "What are my business strengths?"
   - "What weaknesses should I address?"
   - "What opportunities are available?"
   - "What threats should I be aware of?"

3. **Market Insights:**
   - "What are the latest trends in [industry]?"
   - "How can I improve my marketing?"
   - "What are competitors doing?"
   - "How to increase customer engagement?"

4. **General Business Advice:**
   - "How can I grow my business?"
   - "What social media strategy should I use?"
   - "How to handle negative reviews?"
   - "Best practices for customer service?"

---

## 🔧 Configuration

### Environment Variables

**Backend (`Backend/.env`):**
```env
# Groq API Key (Required)
GROQ_API_KEY=your_groq_api_key_here

# Database (Required for business context)
DATABASE_URL=your_database_url_here
```

**Frontend (`Frontend/.env`):**
```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

### Browser Requirements

**Speech Recognition Support:**
- Chrome/Edge: ✅ Full support
- Firefox: ⚠️ Limited support
- Safari: ⚠️ Limited support
- Mobile browsers: ⚠️ Varies by device

**Speech Synthesis Support:**
- All modern browsers: ✅ Full support

---

## 🎨 UI Components

### Widget States:

1. **Closed State:**
   - Floating "AI" button in bottom-right
   - Shows "🎤" when listening
   - Shows "🔊" when speaking

2. **Open State:**
   - Chat interface (380px width)
   - Header with title and controls
   - Message history area (scrollable)
   - Input area with mic button
   - Voice toggle button (speaker icon)

### Visual Indicators:

- **Listening:** Red microphone button + "🎤 Listening..." message
- **Speaking:** "🔊 Speaking..." in loading state
- **Thinking:** "💭 Thinking..." when processing
- **Voice Enabled:** Volume2 icon (speaker with waves)
- **Voice Disabled:** VolumeX icon (muted speaker)

---

## 🔐 Security

### Authentication:
- All assistant queries require authentication
- JWT token passed in Authorization header
- User-specific business data access
- No cross-user data leakage

### Privacy:
- Voice data processed locally in browser
- No audio sent to external servers
- Only text transcripts sent to backend
- Business data access restricted to authenticated user

---

## 🚀 Testing the Feature

### 1. Start Backend:
```bash
cd Backend
python main.py
```

### 2. Start Frontend:
```bash
cd Frontend
npm run dev
```

### 3. Test Voice Assistant:
1. Login to the application
2. Complete business profile setup (if not done)
3. Click the "AI" button in bottom-right corner
4. Try text input: Type a question and click "Send"
5. Try voice input: Click microphone button and speak
6. Toggle voice output: Click speaker icon to enable/disable

### 4. Test Queries:
```
Text: "What is my business name?"
Voice: Click mic → Speak "Tell me about my business"
```

---

## 🐛 Troubleshooting

### Issue: Microphone button not showing
**Solution:** Check browser compatibility. Use Chrome/Edge for best support.

### Issue: Voice not working
**Solution:** 
1. Check browser permissions for microphone
2. Ensure HTTPS or localhost (required for Web Speech API)
3. Check browser console for errors

### Issue: "Sorry, I could not fetch an answer"
**Solution:**
1. Check GROQ_API_KEY is set in Backend/.env
2. Verify backend is running on port 8000
3. Check authentication token is valid
4. Ensure business profile is set up

### Issue: Generic responses (not personalized)
**Solution:**
1. Complete business profile setup
2. Run business analysis
3. Check database connection
4. Verify user authentication

---

## 📊 API Endpoints

### POST `/assistant`
**Description:** Send query to AI assistant

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "What is my business name?"
}
```

**Response:**
```json
{
  "response": "Your business is called [Business Name], a [Business Type] in the [Industry] industry."
}
```

**Status Codes:**
- 200: Success
- 400: Invalid query (empty)
- 401: Unauthorized (invalid/missing token)
- 500: Server error

---

## 🎓 Best Practices

### For Users:
1. **Complete your business profile** for personalized responses
2. **Speak clearly** when using voice input
3. **Use specific questions** for better answers
4. **Toggle voice off** in noisy environments
5. **Review business analysis** regularly for updated insights

### For Developers:
1. **Keep responses concise** (2-3 sentences for voice)
2. **Handle errors gracefully** with fallback messages
3. **Test across browsers** for compatibility
4. **Monitor API usage** (Groq rate limits)
5. **Update business context** when profile changes

---

## 🔮 Future Enhancements

### Planned Features:
- [ ] Multi-language support
- [ ] Voice command shortcuts
- [ ] Conversation history persistence
- [ ] Voice customization (speed, pitch, voice selection)
- [ ] Offline mode with cached responses
- [ ] Integration with other business tools
- [ ] Voice analytics and insights
- [ ] Custom wake word ("Hey Saadhyam")

---

## 📝 Code Structure

```
Backend/
├── routes/
│   └── assistant.py              # API endpoint with auth
├── services/
│   ├── assistant_service.py      # Business logic + Groq integration
│   └── search_service.py         # DuckDuckGo search integration
└── models/
    ├── user.py                   # User model
    ├── business_profile.py       # Business profile model
    └── business_analysis.py      # Business analysis model

Frontend/
├── src/
│   ├── components/
│   │   └── AssistantWidget.jsx  # Voice-enabled chat widget
│   └── lib/
│       └── assistantApi.js       # API client with auth
```

---

## 🎉 Success Metrics

### User Engagement:
- Number of voice queries vs text queries
- Average conversation length
- Response satisfaction rate
- Feature adoption rate

### Technical Performance:
- Average response time
- Speech recognition accuracy
- API success rate
- Error rate

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Verify environment configuration
4. Check backend logs for API errors
5. Test with simple queries first

---

## 🏆 Credits

**Technologies Used:**
- **Groq API**: AI-powered responses (llama-3.1-70b-versatile)
- **Web Speech API**: Browser-native voice features
- **FastAPI**: Backend framework
- **React**: Frontend framework
- **Lucide React**: Icon library
- **TailwindCSS**: Styling

**Developed for:** Saadhyam AI Platform
**Version:** 1.0.0
**Last Updated:** May 6, 2026

---

## ✅ Checklist for Deployment

- [x] Backend authentication implemented
- [x] Business context extraction working
- [x] Groq API integration complete
- [x] Voice input (speech-to-text) working
- [x] Voice output (text-to-speech) working
- [x] UI/UX polished and responsive
- [x] Error handling implemented
- [x] Browser compatibility tested
- [ ] Production environment variables set
- [ ] Rate limiting configured
- [ ] Analytics tracking added
- [ ] User documentation created

---

**🎤 Enjoy your new Voice Assistant feature!**
