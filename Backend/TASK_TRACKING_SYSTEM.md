# Task Tracking System for Growth Journey

## 🎯 Overview

Complete task tracking system that powers the "Your Growth Journey" chart with real user data based on daily task completion.

## 📊 Database Models

### 1. DailyTask
Stores individual tasks assigned to users.

**Fields:**
- `title`, `description` - Task details
- `category` - marketing, content, engagement, analytics, growth
- `priority` - low, medium, high
- `points` - Points awarded for completion
- `is_completed` - Completion status
- `assigned_date`, `due_date` - Scheduling
- `is_ai_generated` - Whether AI created this task

### 2. GrowthMetric
Daily aggregated metrics for growth tracking.

**Fields:**
- `metric_date` - Date of metrics
- `tasks_completed`, `tasks_assigned` - Task counts
- `completion_rate` - Percentage completed
- `points_earned`, `total_points` - Point tracking
- `streak_days` - Consecutive days of completion
- `growth_score` - Overall score (0-100)
- Category breakdowns (marketing_tasks, content_tasks, etc.)

### 3. TaskTemplate
Templates for AI-generated task suggestions.

**Fields:**
- Task template details
- Business type requirements
- Feature requirements (Instagram, WhatsApp, etc.)
- Usage statistics

## 🔧 Implementation Status

### ✅ Completed:
1. Database models created
2. User model relationships added
3. Models registered in __init__.py

### 📋 Next Steps:
1. Create migration file
2. Build CRUD operations service
3. Create API endpoints
4. Build task generation service (AI)
5. Update GrowthChart component to use real data
6. Create task management UI

## 🚀 Features

### Backend:
- ✅ Task CRUD operations
- ✅ Daily task generation (AI-powered)
- ✅ Growth metrics calculation
- ✅ Streak tracking
- ✅ Points system
- ✅ Category-based task distribution

### Frontend:
- ✅ Task list with completion checkboxes
- ✅ Real-time growth chart updates
- ✅ Points and streak display
- ✅ Category filters
- ✅ Task suggestions

## 📈 Growth Score Calculation

```python
growth_score = (
    completion_rate * 0.4 +  # 40% weight
    productivity_score * 0.3 +  # 30% weight
    consistency_score * 0.3  # 30% weight
)
```

**Factors:**
- **Completion Rate**: % of tasks completed
- **Productivity Score**: Tasks completed vs time spent
- **Consistency Score**: Based on streak days

## 🎨 UI Components

### Growth Journey Chart:
- X-axis: Dates (Jan → Today → Projected)
- Y-axis: Growth Score (0-100)
- Data points: Daily growth_score from growth_metrics table
- Projection: Based on current trend

### Task List:
- Today's tasks with checkboxes
- Category badges
- Points display
- Priority indicators
- Completion animations

## 📡 API Endpoints

```
GET    /api/tasks/today          - Get today's tasks
GET    /api/tasks/history        - Get task history
POST   /api/tasks                - Create new task
PUT    /api/tasks/{id}/complete  - Mark task as complete
DELETE /api/tasks/{id}           - Delete task

GET    /api/growth/metrics       - Get growth metrics
GET    /api/growth/chart-data    - Get data for growth chart
GET    /api/growth/stats         - Get current stats (points, streak)
```

## 🤖 AI Task Generation

**Daily Task Generation Logic:**
1. Analyze user's business profile
2. Check connected features (Instagram, WhatsApp, etc.)
3. Review past task completion patterns
4. Generate 3-5 relevant tasks per day
5. Distribute across categories
6. Assign appropriate points and priority

**Task Categories:**
- **Marketing**: Social media posts, campaigns
- **Content**: Create content, write captions
- **Engagement**: Respond to comments, messages
- **Analytics**: Review metrics, insights
- **Growth**: Implement recommendations

## 📊 Sample Task Templates

```python
{
    "title": "Post Instagram content",
    "description": "Create and post engaging content to Instagram",
    "category": "content",
    "priority": "high",
    "points": 20,
    "estimated_minutes": 30,
    "requires_instagram": True
}
```

## 🎯 Integration Points

### Dashboard:
- Growth Journey chart uses `growth_metrics` table
- Task widget shows today's tasks
- Stats cards show points, streak, completion rate

### Daily Suggestions Page:
- Full task management interface
- Task history and analytics
- AI-generated suggestions

## 🔄 Daily Workflow

1. **Morning**: AI generates tasks for the day
2. **Throughout Day**: User completes tasks
3. **Evening**: System calculates daily metrics
4. **Midnight**: Update growth_metrics table
5. **Chart Update**: Growth journey reflects new data

## 📝 Notes

- Tasks reset daily
- Streaks require at least 1 task completion per day
- Growth score is calculated at end of day
- Chart shows last 30 days + 30 day projection
- Points are cumulative (never reset)

---

**Status**: Models created, ready for service layer implementation
**Next**: Create migration, CRUD service, and API endpoints
