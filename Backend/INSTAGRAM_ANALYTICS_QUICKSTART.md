# Instagram Analytics Dashboard - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Facebook App

1. Go to https://developers.facebook.com/
2. Create a new app (or use existing)
3. Add **Instagram Graph API** product
4. Add **Instagram Basic Display** product
5. Configure OAuth Redirect URI:
   ```
   http://localhost:8000/api/instagram-analytics/oauth/callback
   ```

6. Request these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`

### Step 2: Update Environment Variables

Add to `Backend/.env`:

```env
# Instagram/Facebook Credentials
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:8000/api/instagram-analytics/oauth/callback
```

### Step 3: Run Database Migration

The migration runs automatically on startup, or run manually:

```bash
cd Backend
python migrations/add_instagram_analytics_tables.py
```

### Step 4: Start the Backend

```bash
cd Backend
python main.py
```

Server will start at: `http://localhost:8000`

### Step 5: Connect Instagram Account

#### Option A: Using cURL

```bash
# Get OAuth URL
curl http://localhost:8000/api/instagram-analytics/connect/oauth-url

# After user authorizes, connect account
curl -X POST http://localhost:8000/api/instagram-analytics/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ig_account_id": "17841400000000000",
    "access_token": "EAAxxxxxxxxxxxxx",
    "facebook_page_id": "123456789",
    "facebook_page_name": "My Business Page"
  }'
```

#### Option B: Using Python

```python
import requests

# Your JWT token from authentication
jwt_token = "your_jwt_token_here"

# Instagram account details from OAuth
data = {
    "ig_account_id": "17841400000000000",
    "access_token": "EAAxxxxxxxxxxxxx",
    "facebook_page_id": "123456789",
    "facebook_page_name": "My Business Page"
}

response = requests.post(
    "http://localhost:8000/api/instagram-analytics/connect",
    headers={
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    },
    json=data
)

print(response.json())
```

### Step 6: View Dashboard

```bash
# Get dashboard overview
curl http://localhost:8000/api/instagram-analytics/dashboard/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Common Use Cases

### 1. Get Follower Growth Analytics

```python
import requests

response = requests.get(
    "http://localhost:8000/api/instagram-analytics/analytics/1/growth?days=30",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

growth_data = response.json()
print(f"Total Growth: {growth_data['total_growth']}")
print(f"Growth Rate: {growth_data['growth_rate']}%")
```

### 2. Get AI Recommendations

```python
response = requests.get(
    "http://localhost:8000/api/instagram-analytics/recommendations/1",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

recommendations = response.json()['recommendations']
for rec in recommendations:
    print(f"[{rec['priority'].upper()}] {rec['title']}")
    print(f"  {rec['recommendation']}")
    print(f"  Confidence: {rec['confidence_score']*100}%\n")
```

### 3. Get Top Performing Posts

```python
response = requests.get(
    "http://localhost:8000/api/instagram-analytics/content/1/top-posts?limit=5",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

top_posts = response.json()['posts']
for post in top_posts:
    print(f"Post: {post['media_id']}")
    print(f"  Engagement: {post['engagement_rate']}%")
    print(f"  Likes: {post['like_count']}")
    print(f"  Comments: {post['comment_count']}\n")
```

### 4. Get Growth Predictions

```python
response = requests.get(
    "http://localhost:8000/api/instagram-analytics/predictions/1",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

predictions = response.json()['predictions']
for pred in predictions:
    print(f"{pred['prediction_period'].title()} Prediction:")
    print(f"  Predicted Followers: {pred['predicted_followers']}")
    print(f"  Expected Growth: +{pred['predicted_follower_growth']}")
    print(f"  Confidence: {pred['confidence_score']*100}%\n")
```

### 5. Trigger Manual Sync

```python
response = requests.post(
    "http://localhost:8000/api/instagram-analytics/sync/1",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

print(response.json()['message'])

# Check sync status
status_response = requests.get(
    "http://localhost:8000/api/instagram-analytics/sync/1/status",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

print(f"Sync Status: {status_response.json()['sync_status']}")
```

### 6. Get Audience Insights

```python
response = requests.get(
    "http://localhost:8000/api/instagram-analytics/audience/1",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

insights = response.json()['insights']
print(f"Top Cities: {insights['top_cities']}")
print(f"Top Countries: {insights['top_countries']}")
print(f"Peak Activity Hour: {insights['peak_activity_hour']}:00")
```

### 7. Get Notifications

```python
response = requests.get(
    "http://localhost:8000/api/instagram-analytics/notifications?unread_only=true",
    headers={"Authorization": f"Bearer {jwt_token}"}
)

notifications = response.json()['notifications']
print(f"Unread Notifications: {response.json()['unread_count']}")

for notif in notifications:
    print(f"[{notif['priority'].upper()}] {notif['title']}")
    print(f"  {notif['message']}\n")
```

## 🔧 Troubleshooting

### Issue: "Account not found"
**Solution**: Make sure you're using the correct account_id and the account belongs to the authenticated user.

### Issue: "Failed to fetch analytics from Instagram"
**Solution**: 
1. Check if access token is valid
2. Verify Instagram Business account permissions
3. Ensure Facebook page is connected to Instagram account
4. Check if Instagram account is a Business or Creator account

### Issue: "Sync status is 'failed'"
**Solution**:
1. Check sync error message: `GET /api/instagram-analytics/sync/{account_id}/status`
2. Verify access token hasn't expired
3. Check Instagram API rate limits
4. Review sync history for error patterns

### Issue: "No recommendations available"
**Solution**: 
1. Ensure at least 5 posts exist
2. Wait for initial sync to complete
3. Check if account has sufficient historical data (7+ days)

### Issue: "Predictions not available"
**Solution**:
1. Need at least 5 analytics snapshots (5+ days of data)
2. Wait for daily sync to collect more data points
3. Predictions improve with more historical data

## 📈 Best Practices

### 1. Sync Frequency
- **Initial Setup**: Manual sync immediately after connection
- **Regular Updates**: Automatic sync every 6 hours
- **Before Important Decisions**: Manual sync for latest data

### 2. Data Interpretation
- **Engagement Rate**: 1-3% is average, 3-6% is good, 6%+ is excellent
- **Growth Rate**: 1-2% monthly is healthy for established accounts
- **Confidence Scores**: 0.7+ indicates reliable recommendations

### 3. Acting on Recommendations
- **High Priority + High Confidence**: Implement immediately
- **Medium Priority**: Test and monitor results
- **Low Priority**: Consider for long-term strategy

### 4. Monitoring Performance
- Check dashboard daily for trends
- Review recommendations weekly
- Analyze predictions monthly
- Track notification patterns

## 🎯 Next Steps

1. **Explore the API**: Visit http://localhost:8000/docs for interactive API documentation
2. **Build Frontend**: Use the API to create beautiful dashboards
3. **Set Up Automation**: Schedule regular syncs and reports
4. **Monitor Growth**: Track your Instagram performance over time
5. **Optimize Strategy**: Implement AI recommendations and measure results

## 📚 Additional Resources

- [Full Documentation](./INSTAGRAM_ANALYTICS_README.md)
- [API Reference](http://localhost:8000/docs)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Meta Business Suite](https://business.facebook.com/)

## 💡 Pro Tips

1. **Connect Multiple Accounts**: The system supports multiple Instagram accounts per user
2. **Export Data**: Use the API to export analytics for external reporting
3. **Webhook Integration**: Set up webhooks for real-time notifications
4. **Custom Dashboards**: Build custom visualizations using the analytics data
5. **A/B Testing**: Use recommendations to test different content strategies

---

**Ready to grow your Instagram presence? Start analyzing! 🚀**
