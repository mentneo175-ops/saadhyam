# Notification System Design

## Overview
Real-time notification system for Instagram Analytics with automated trend detection and user alerts.

## Architecture

### Backend Components

#### 1. Database Model (`Backend/models/instagram_analytics.py`)
```python
class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("instagram_analytics_accounts.id"))
    
    notification_type = Column(String(50))  # viral_post, growth_spike, engagement_drop, etc.
    title = Column(String(200))
    message = Column(Text)
    
    is_read = Column(Boolean, default=False)
    is_actionable = Column(Boolean, default=False)
    action_url = Column(String(500))
    action_data = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
```

#### 2. CRUD Operations (`Backend/services/instagram_analytics_crud.py`)
- `create_notification()` - Create new notification
- `get_user_notifications()` - Get user's notifications (with unread filter)
- `mark_notification_read()` - Mark notification as read
- `mark_all_notifications_read()` - Mark all as read
- `delete_notification()` - Delete notification

#### 3. Trend Detection (`Backend/services/instagram_sync_orchestrator.py`)
Automatically detects and creates notifications for:
- **Viral Posts**: Posts with >2x average engagement rate
- **Growth Spikes**: Follower growth >50% above average
- **Engagement Drops**: Engagement rate drops >30%
- **Best Posting Times**: Optimal posting time recommendations

#### 4. API Routes (`Backend/routes/instagram_analytics.py`)
```python
GET    /api/instagram-analytics/notifications          # Get notifications
POST   /api/instagram-analytics/notifications/{id}/read # Mark as read
POST   /api/instagram-analytics/notifications/read-all  # Mark all as read
DELETE /api/instagram-analytics/notifications/{id}     # Delete notification
```

### Frontend Components

#### 1. Notification Bell (`Frontend/src/components/dashboard/TopHeader.tsx`)
- Bell icon in top header
- Badge showing unread count
- Dropdown panel with recent notifications
- Real-time updates

#### 2. Notification Types
```typescript
type NotificationType = 
  | 'viral_post'        // 🔥 Post going viral
  | 'growth_spike'      // 📈 Follower growth spike
  | 'engagement_drop'   // 📉 Engagement rate drop
  | 'best_time'         // ⏰ Best posting time
  | 'milestone'         // 🎉 Follower milestone
  | 'content_idea'      // 💡 AI content suggestion
```

#### 3. Notification UI States
- **Unread**: Bold text, blue dot indicator
- **Read**: Normal text, no indicator
- **Actionable**: Shows action button (e.g., "View Post", "Schedule Now")

## Notification Flow

### 1. Automatic Detection (During Sync)
```
Instagram Sync → Analyze Metrics → Detect Trends → Create Notifications
```

### 2. User Interaction
```
User Opens App → Fetch Notifications → Display Badge → User Clicks → Mark as Read
```

### 3. Real-time Updates
```
Backend Creates Notification → WebSocket/Polling → Frontend Updates → Badge Updates
```

## Notification Examples

### Viral Post Alert
```json
{
  "type": "viral_post",
  "title": "🔥 Viral Post Alert!",
  "message": "Your post is going viral with 8.5% engagement rate!",
  "is_actionable": true,
  "action_url": "/dashboard/instagram/posts/123",
  "action_data": {
    "media_id": "123",
    "engagement_rate": 8.5,
    "likes": 450,
    "comments": 32
  }
}
```

### Growth Spike
```json
{
  "type": "growth_spike",
  "title": "📈 Follower Growth Spike!",
  "message": "You gained 150 followers! Growth rate: 75.0%",
  "is_actionable": false
}
```

### Best Posting Time
```json
{
  "type": "best_time",
  "title": "⏰ Optimal Posting Time",
  "message": "Your audience is most active at 6:00 PM - 8:00 PM",
  "is_actionable": true,
  "action_url": "/dashboard/instagram/schedule"
}
```

## Implementation Status

### ✅ Completed
- [x] Database model (`NotificationLog`)
- [x] CRUD operations
- [x] Trend detection logic
- [x] API routes
- [x] Notification creation during sync

### 🚧 In Progress
- [ ] Frontend notification bell component
- [ ] Notification dropdown panel
- [ ] Real-time updates (WebSocket/Polling)
- [ ] Notification preferences/settings

### 📋 Planned Features
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] WhatsApp notifications
- [ ] Notification grouping
- [ ] Notification history page
- [ ] Custom notification rules

## Usage

### Backend - Create Notification
```python
from services.instagram_analytics_crud import InstagramAnalyticsCRUD

notification_data = {
    "account_id": 1,
    "notification_type": "viral_post",
    "title": "🔥 Viral Post Alert!",
    "message": "Your post is going viral!",
    "is_actionable": True,
    "action_url": "/dashboard/instagram/posts/123",
    "action_data": {"media_id": "123"}
}

notification = await InstagramAnalyticsCRUD.create_notification(
    db=db,
    user_id=user_id,
    notification_data=notification_data
)
```

### Frontend - Fetch Notifications
```typescript
const response = await fetch('/api/instagram-analytics/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const notifications = await response.json();
```

### Frontend - Mark as Read
```typescript
await fetch(`/api/instagram-analytics/notifications/${notificationId}/read`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Configuration

### Trend Detection Thresholds
```python
# In instagram_sync_orchestrator.py
VIRAL_POST_THRESHOLD = 2.0  # 2x average engagement
GROWTH_SPIKE_THRESHOLD = 1.5  # 50% above average
ENGAGEMENT_DROP_THRESHOLD = 0.7  # 30% below average
```

### Notification Limits
```python
MAX_NOTIFICATIONS_PER_USER = 100
NOTIFICATION_RETENTION_DAYS = 30
```

## Testing

### Test Notification Creation
```bash
# In Python shell
from services.instagram_analytics_crud import InstagramAnalyticsCRUD
from database import SessionLocal

db = SessionLocal()
notification = await InstagramAnalyticsCRUD.create_notification(
    db=db,
    user_id=1,
    notification_data={
        "notification_type": "test",
        "title": "Test Notification",
        "message": "This is a test"
    }
)
print(f"Created notification: {notification.id}")
```

### Test API Endpoints
```bash
# Get notifications
curl -X GET http://localhost:8000/api/instagram-analytics/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X POST http://localhost:8000/api/instagram-analytics/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

### 1. Smart Notifications
- AI-powered notification prioritization
- User behavior learning (when they check notifications)
- Adaptive notification frequency

### 2. Multi-Channel Delivery
- Email digest (daily/weekly)
- SMS for critical alerts
- WhatsApp Business integration
- Slack/Discord webhooks

### 3. Advanced Features
- Notification snoozing
- Custom notification rules builder
- Notification analytics (open rates, click rates)
- A/B testing for notification content

## Performance Considerations

### Database Indexing
```sql
CREATE INDEX idx_notifications_user_unread ON notification_logs(user_id, is_read);
CREATE INDEX idx_notifications_created ON notification_logs(created_at DESC);
```

### Caching Strategy
- Cache unread count per user (Redis)
- Cache recent notifications (5 minutes TTL)
- Invalidate cache on new notification

### Scalability
- Batch notification creation
- Async notification processing
- Queue-based delivery (Celery/RQ)

---

**Last Updated**: 2026-05-13
**Status**: Backend Complete, Frontend In Progress
