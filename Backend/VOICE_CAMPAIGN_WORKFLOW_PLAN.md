# AI Voice Campaign - Complete Workflow Implementation Plan

## 🎯 Goal
Build a complete end-to-end workflow for AI voice campaigns where users can:
1. Create a campaign
2. Add contacts
3. Configure call settings
4. Start automated calling
5. Monitor calls in real-time
6. View results and leads

---

## 📋 Current Status

### ✅ Already Implemented
- **Backend API**: All routes exist (`/api/voice-agent/*`)
- **Database Models**: VoiceCampaign, VoiceContact, VoiceCall, VoiceLead
- **Frontend Pages**:
  - Create Campaign page
  - Campaigns list page
  - Campaign details page with tabs (Overview, Contacts, Calls, Leads)
- **Basic Features**:
  - Campaign creation
  - Contact bulk upload
  - Status updates (draft → active → paused)
  - Analytics display

### ❌ Missing Features (To Be Built)
1. **Call Initiation System**: No actual calling mechanism
2. **Real-time Call Interface**: No live call monitoring UI
3. **Voice Integration**: No integration with voice API (Twilio/Exotel/etc.)
4. **Call Queue Management**: No system to process contacts sequentially
5. **Live Transcription**: No real-time speech-to-text
6. **AI Conversation Engine**: No real-time AI response generation during calls
7. **Call Recording**: No audio recording/storage
8. **Webhook Handlers**: No endpoints to receive call status updates

---

## 🏗️ Implementation Plan

### Phase 1: Call Initiation & Queue System ⭐ PRIORITY

#### 1.1 Backend: Call Queue Service
**File**: `Backend/services/voice_call_queue_service.py`

```python
class VoiceCallQueueService:
    def start_campaign_calls(campaign_id, db):
        """
        - Get all pending contacts for campaign
        - Create call records with status='queued'
        - Add to Celery queue for processing
        """
    
    def process_next_call(campaign_id, contact_id):
        """
        - Get contact details
        - Initiate call via voice API
        - Update call status to 'in_progress'
        """
    
    def handle_call_completion(call_id, duration, transcript):
        """
        - Update call record
        - Generate lead if interested
        - Queue next call
        """
```

#### 1.2 Backend: Celery Tasks
**File**: `Backend/tasks/voice_call_tasks.py`

```python
@celery.task
def initiate_campaign_calls(campaign_id):
    """Start processing all contacts in campaign"""

@celery.task
def make_voice_call(call_id, contact_id, campaign_id):
    """Make individual call"""

@celery.task
def process_call_result(call_id, result_data):
    """Process completed call"""
```

#### 1.3 Backend: New API Endpoints
**File**: `Backend/routes/voice_agent.py`

```python
@router.post("/campaigns/{campaign_id}/start-calling")
async def start_campaign_calling(campaign_id):
    """
    - Validate campaign has contacts
    - Update status to 'active'
    - Trigger Celery task to start calls
    - Return job_id for tracking
    """

@router.get("/campaigns/{campaign_id}/call-progress")
async def get_call_progress(campaign_id):
    """
    - Return real-time progress
    - Active calls count
    - Completed/failed counts
    - Current call details
    """

@router.post("/webhooks/call-status")
async def handle_call_status_webhook(call_id, status, data):
    """
    - Receive updates from voice API
    - Update call record
    - Trigger next actions
    """
```

### Phase 2: Real-time Call Monitoring UI

#### 2.1 Frontend: Live Calling Interface
**File**: `Frontend/src/routes/dashboard.voice-agent.campaigns.$campaignId.calling.tsx`

**Features**:
- 🔴 Live indicator showing "Calling in Progress"
- 📊 Real-time progress bar (X/Y calls completed)
- 📞 Current call details:
  - Contact name & phone
  - Call duration (live timer)
  - Call status (ringing, connected, ended)
- 💬 Live transcript display (speech-to-text)
- 🤖 AI responses being sent
- ⏸️ Pause/Resume campaign button
- 🛑 Stop campaign button

#### 2.2 Frontend: WebSocket Connection
**File**: `Frontend/src/lib/voiceCallWebSocket.ts`

```typescript
class VoiceCallWebSocket {
  connect(campaignId: string)
  onCallStarted(callback)
  onCallProgress(callback)
  onCallEnded(callback)
  onTranscriptUpdate(callback)
  disconnect()
}
```

### Phase 3: Voice API Integration

#### 3.1 Choose Voice Provider
**Options**:
- **Twilio** (International, expensive)
- **Exotel** (India-focused, affordable)
- **Plivo** (Good balance)
- **Custom WebRTC** (Complex but flexible)

**Recommendation**: Start with **Exotel** for India market

#### 3.2 Backend: Voice API Service
**File**: `Backend/services/exotel_voice_service.py`

```python
class ExotelVoiceService:
    def make_call(to_number, campaign_script):
        """Initiate outbound call"""
    
    def handle_call_connected():
        """When customer picks up"""
    
    def send_speech(text):
        """Text-to-speech"""
    
    def get_speech_input():
        """Speech-to-text"""
    
    def end_call():
        """Terminate call"""
```

### Phase 4: AI Conversation Engine

#### 4.1 Backend: Real-time AI Service
**File**: `Backend/services/voice_conversation_ai_service.py`

```python
class VoiceConversationAI:
    def generate_opening(campaign_script, contact_name):
        """Generate personalized opening"""
    
    def process_customer_response(transcript, context):
        """
        - Analyze customer response
        - Detect intent (interested/not interested/question)
        - Generate appropriate response
        """
    
    def handle_objection(objection_text):
        """Handle common objections"""
    
    def qualify_lead(conversation_history):
        """
        - Analyze full conversation
        - Assign lead score
        - Determine interest level
        """
```

### Phase 5: Data Storage & Analytics

#### 5.1 Store Call Recordings
- Upload to S3/Cloudinary
- Link to call record
- Playback in UI

#### 5.2 Enhanced Analytics
- Call success rate by time of day
- Best performing scripts
- Common objections
- Conversion funnel

---

## 🚀 Quick Start Implementation (MVP)

### What We'll Build First (2-3 hours):

1. **"Start Calling" Button** ✅
   - Frontend: Add button in campaign details page
   - Backend: Create `/start-calling` endpoint
   - Celery: Task to process contacts

2. **Mock Calling System** ✅
   - Simulate calls without real voice API
   - Update call records with mock data
   - Generate sample transcripts

3. **Live Progress UI** ✅
   - Show calling progress
   - Display current call
   - Update in real-time (polling or WebSocket)

4. **Call Results** ✅
   - Store call outcomes
   - Generate leads automatically
   - Show in Leads tab

### What We'll Build Later (Full Implementation):

5. **Real Voice Integration** (Exotel/Twilio)
6. **Live Transcription** (Speech-to-text)
7. **AI Conversation** (Real-time responses)
8. **Call Recording** (Audio storage)

---

## 📊 Database Schema (Already Exists)

```sql
voice_campaigns
  - id, user_id, name, description
  - status (draft, active, paused, completed)
  - language, voice_type, script_template
  - total_contacts, calls_completed, calls_pending, calls_failed

voice_contacts
  - id, campaign_id, name, phone_number, email
  - call_attempts, is_completed, last_called_at

voice_calls
  - id, campaign_id, contact_id, phone_number
  - status (queued, ringing, connected, completed, failed)
  - duration, transcript, conversation_summary
  - customer_sentiment, call_outcome
  - started_at, ended_at

voice_leads
  - id, campaign_id, contact_id, name, phone_number
  - status (interested, not_interested, follow_up_required)
  - lead_score, interest_level
  - follow_up_required, callback_requested
  - is_converted
```

---

## 🎬 User Flow (Complete Workflow)

1. **User clicks "Create Campaign"**
   - Fills form (name, language, voice type, script)
   - Clicks "Create Campaign"
   - ✅ Redirects to campaign details page

2. **Campaign Details Page**
   - Shows campaign info
   - Status: "draft"
   - Button: "Import Contacts"

3. **User clicks "Import Contacts"**
   - Modal opens
   - Adds contacts (name, phone, email)
   - Clicks "Upload Contacts"
   - ✅ Contacts saved to database

4. **User clicks "Start Campaign"**
   - Status changes to "active"
   - ✅ Redirects to "Calling Interface" page
   - Backend starts processing calls

5. **Calling Interface (Live)**
   - Shows: "🔴 Calling in Progress"
   - Progress: "5/50 calls completed"
   - Current call:
     - Name: "John Doe"
     - Phone: "+91 98765 43210"
     - Status: "Connected"
     - Duration: "00:45"
   - Live transcript:
     - AI: "Hello John, this is calling from XYZ..."
     - Customer: "Yes, I'm interested..."
     - AI: "Great! Can I schedule a demo?"

6. **Call Completes**
   - Status updates to "completed"
   - Lead generated if interested
   - Next call starts automatically

7. **Campaign Completes**
   - All contacts called
   - Status: "completed"
   - Shows final analytics:
     - Total calls: 50
     - Successful: 45
     - Leads: 12
     - Converted: 3

---

## 🔧 Technical Stack

### Backend
- **FastAPI**: API endpoints
- **Celery**: Background job processing
- **Redis**: Queue management
- **PostgreSQL**: Data storage
- **Exotel/Twilio**: Voice API
- **GROQ/OpenAI**: AI conversation

### Frontend
- **React**: UI components
- **TanStack Router**: Routing
- **TanStack Query**: Data fetching
- **WebSocket/Polling**: Real-time updates
- **Framer Motion**: Animations

---

## 📝 Next Steps

**Immediate Action**:
1. Build mock calling system (no real voice API)
2. Add "Start Calling" button
3. Create calling progress UI
4. Test end-to-end workflow

**After MVP Works**:
1. Integrate real voice API (Exotel)
2. Add live transcription
3. Implement AI conversation engine
4. Add call recording

---

## ⚠️ Important Notes

1. **Voice API Costs**: Real calling costs money per minute
2. **Testing**: Use mock system first before real calls
3. **Compliance**: Need consent for recording calls
4. **Rate Limits**: Don't call too many numbers simultaneously
5. **Phone Numbers**: Need verified caller ID

---

**Ready to start building?** Let's begin with the MVP (mock calling system)!
