# Instagram Post Boost / Campaign Creation Guide

## Understanding the System

Your application creates campaigns in **YOUR DATABASE** and in **META ADS MANAGER**, but they work differently:

### What You're Seeing in Meta Ads Manager

The screenshot shows:
- "Get set up to run ads"
- "Confirm a few details in Account Overview"
- No campaigns visible

This is because:
1. **Campaigns are created in PAUSED status** (for safety)
2. **Meta requires account setup** before showing campaigns
3. **Your app's campaigns ARE being created** but need activation

---

## Where to Find Your Campaigns

### Option 1: In Your Saadhyam App (RECOMMENDED)

1. Go to **Dashboard → Meta Ads** page
2. You'll see all campaigns created through your app
3. Each campaign shows:
   - Campaign name
   - Status (PAUSED/ACTIVE)
   - Budget and duration
   - AI recommendations
   - Performance metrics

### Option 2: In Meta Ads Manager

1. Go to https://business.facebook.com/adsmanager
2. Click on **"All ads"** tab (not just "Campaigns")
3. Look for filter options and select **"Show paused campaigns"**
4. Your campaigns should appear there

---

## How to Create Instagram Boost Campaigns

### Method 1: From Instagram Analytics (RECOMMENDED)

1. **Go to Dashboard → Instagram**
2. **Scroll to "Your Posts" section**
3. **Find a POSTED post** (status must be "posted", not "scheduled")
4. **Click "Promote Post" button** (purple/pink gradient button)
5. **AI will analyze your post** and generate:
   - Audience recommendations (age, gender, interests, locations)
   - Budget recommendations (daily budget, duration, total cost)
   - Estimated reach and engagement
6. **Configure your campaign**:
   - Campaign Name (optional - auto-generated if empty)
   - Objective (Engagement, Traffic, Awareness, Leads, Sales)
   - Daily Budget (minimum ₹100)
   - Duration (days)
   - Call to Action (optional)
   - WhatsApp Number (optional)
7. **Click "Create Campaign"**
8. **Campaign is created in PAUSED status** - review and activate when ready

### Method 2: From Scheduled Posts

1. **Go to Dashboard → Instagram**
2. **Create a post** using the content creator
3. **Publish the post to Instagram**
4. **Wait for post to be published**
5. **Click "Promote Post"** on the published post
6. Follow steps 5-8 from Method 1

---

## Why Campaigns Are Created as PAUSED

For safety and best practices:

1. **Review Before Spending**: You can review all settings before money is spent
2. **Meta Account Setup**: Ensures your Meta account is properly configured
3. **Payment Method**: Verify payment method is added
4. **Compliance**: Check that campaign follows Meta's advertising policies
5. **Budget Confirmation**: Double-check budget and targeting

---

## How to Activate a Campaign

### In Your Saadhyam App

1. Go to **Dashboard → Meta Ads**
2. Find your campaign
3. Click **"Activate"** or **"Edit Status"**
4. Change status from PAUSED to ACTIVE
5. Confirm activation

### In Meta Ads Manager

1. Go to https://business.facebook.com/adsmanager
2. Find your campaign (filter by "Paused")
3. Toggle the switch from OFF to ON
4. Campaign will start running

---

## Meta Account Setup Requirements

Before campaigns can run, Meta requires:

### 1. Business Verification
- Business name
- Business address
- Business phone number
- Business website

### 2. Payment Method
- Credit/Debit card
- Or PayPal
- Or other payment methods

### 3. Ad Account Setup
- Currency (INR for India)
- Time zone
- Account name

### 4. Page Connection
- Facebook Page must be connected
- Instagram account must be connected
- Proper permissions granted

### How to Complete Setup

1. Go to https://business.facebook.com/settings
2. Click **"Business Info"** → Complete all fields
3. Click **"Payment Methods"** → Add payment method
4. Click **"Ad Accounts"** → Verify account is active
5. Click **"Pages"** → Verify page is connected
6. Click **"Instagram Accounts"** → Verify Instagram is connected

---

## Troubleshooting

### "No campaigns showing in Meta Ads Manager"

**Solution**:
1. Check if campaigns are in your Saadhyam app (Dashboard → Meta Ads)
2. In Meta Ads Manager, click "All ads" tab
3. Enable "Show paused campaigns" filter
4. Complete Meta account setup (see above)

### "Campaign creation failed with foreign key error"

**Solution**: This was fixed! Make sure backend server is restarted.
- The fix ensures campaigns can be created from both scheduled posts and analytics posts
- Error: `instagram_post_id=0` → Fixed to use `NULL` for analytics posts

### "Can't promote post - button is disabled"

**Reasons**:
1. Post is not published yet (status must be "posted")
2. Post doesn't have an Instagram media ID
3. Meta account not connected

**Solution**:
1. Publish the post to Instagram first
2. Wait for Instagram to process the post
3. Refresh the analytics
4. Try promoting again

### "Daily budget too low error"

**Solution**:
- Meta requires minimum ₹95.31 per day
- Your app enforces minimum ₹100 for safety
- Increase daily budget to at least ₹100

### "AI recommendations not loading"

**Solution**:
1. Check backend server is running
2. Check API keys are configured (Gemini AI)
3. Check network connection
4. Try refreshing the page

---

## Campaign Creation Flow (Technical)

```
User clicks "Promote Post"
    ↓
Frontend: PromotePostModal opens
    ↓
AI generates recommendations (parallel):
    - Audience recommendations (age, gender, interests, locations)
    - Budget recommendations (daily budget, duration, total)
    ↓
User configures campaign:
    - Name, objective, budget, duration, CTA, WhatsApp
    ↓
Frontend calls: POST /meta-ads/promote-post
    ↓
Backend: campaign_automation_service.promote_post()
    ↓
Steps:
    1. Generate AI audience recommendations
    2. Generate AI budget recommendations
    3. Create Meta Campaign (via Meta API)
    4. Create Ad Set with targeting
    5. Create Ad Creative from post
    6. Create Ad
    7. Save to database
    ↓
Campaign created in PAUSED status
    ↓
User reviews and activates when ready
```

---

## Database Schema

### ad_campaigns table
- `id`: Primary key
- `user_id`: Foreign key to users
- `meta_account_id`: Foreign key to meta_accounts
- `campaign_id`: Meta's campaign ID
- `campaign_name`: Campaign name
- `objective`: Campaign objective (ENGAGEMENT, TRAFFIC, etc.)
- `status`: PAUSED, ACTIVE, COMPLETED
- `daily_budget`: Daily budget in INR
- `instagram_post_id`: Foreign key to scheduled_posts (nullable)
- `ai_audience_suggestion`: JSON with AI recommendations
- `ai_budget_recommendation`: JSON with AI recommendations

---

## API Endpoints

### Frontend API
- `GET /meta-ads/connection-status` - Check if Meta account is connected
- `GET /meta-ads/campaigns` - Get all campaigns
- `POST /meta-ads/promote-post` - Create campaign from post
- `GET /meta-ads/dashboard-summary` - Get campaign performance summary

### Backend Routes
- `POST /meta-ads/promote-post` - Main campaign creation endpoint
- `GET /meta-ads/campaigns` - List all campaigns
- `GET /meta-ads/campaigns/{id}` - Get single campaign details
- `GET /meta-ads/campaigns/{id}/analytics` - Get campaign analytics

---

## Best Practices

### 1. Start Small
- Begin with ₹100-200 daily budget
- Run for 3-5 days initially
- Monitor performance
- Scale up if working well

### 2. Use AI Recommendations
- AI analyzes your post content
- Suggests optimal audience
- Recommends budget based on objective
- Trust the AI but adjust as needed

### 3. Test Different Objectives
- **Engagement**: For likes, comments, shares
- **Traffic**: For website visits
- **Awareness**: For brand visibility
- **Leads**: For contact form submissions
- **Sales**: For product purchases

### 4. Monitor Performance
- Check campaign daily in first 3 days
- Look at reach, impressions, clicks
- Adjust budget if needed
- Pause if not performing

### 5. A/B Testing
- Create multiple campaigns with different:
  - Audiences
  - Budgets
  - Objectives
  - CTAs
- Compare performance
- Scale the winner

---

## Cost Estimates (India Market)

Based on AI recommendations:

### Engagement Campaign
- Daily Budget: ₹100-500
- Duration: 7 days
- Total: ₹700-3,500
- Expected Reach: 3,000-50,000
- Expected Engagement: 60-1,000 interactions

### Traffic Campaign
- Daily Budget: ₹200-1,000
- Duration: 7 days
- Total: ₹1,400-7,000
- Expected Clicks: 50-500
- Expected CPC: ₹5-15

### Leads Campaign
- Daily Budget: ₹500-2,000
- Duration: 7-14 days
- Total: ₹3,500-28,000
- Expected Leads: 10-100
- Expected CPL: ₹100-500

---

## Support

If you're still having issues:

1. **Check backend logs** for errors
2. **Verify Meta account connection** in Dashboard → Meta Ads
3. **Complete Meta account setup** in Meta Business Manager
4. **Check payment method** is added and valid
5. **Verify Instagram account** is connected and has posts

---

## Quick Checklist

Before creating your first campaign:

- [ ] Meta account connected in Saadhyam app
- [ ] Instagram account connected to Meta
- [ ] Payment method added in Meta Business Manager
- [ ] Business information completed
- [ ] At least one post published on Instagram
- [ ] Backend server is running
- [ ] Minimum ₹100 budget available

---

**Last Updated**: 2026-05-17
**Status**: ✅ System Working
**Note**: Campaigns are created in PAUSED status for safety. Activate when ready!
