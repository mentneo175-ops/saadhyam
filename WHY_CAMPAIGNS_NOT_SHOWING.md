# Why Your Campaigns Are Not Showing in Meta Ads Manager

## Quick Answer

Your campaigns are **CREATED** but **NOT VISIBLE** in Meta Ads Manager because:

### 1. Meta Account Setup Incomplete ⚠️

Meta requires these to be completed before showing campaigns:

- ✅ **Business Information** - Name, address, phone
- ✅ **Payment Method** - Credit card or PayPal
- ✅ **Ad Account Verification** - Identity verification
- ✅ **Terms Acceptance** - Meta's advertising terms

**How to Fix:**
1. Go to https://business.facebook.com/settings
2. Complete all sections marked with ⚠️ warning icon
3. Add payment method at https://business.facebook.com/settings/payment-methods
4. Wait 5-10 minutes for Meta to process
5. Refresh Meta Ads Manager

---

### 2. Campaigns Created in Database Only ❌

Sometimes the Meta API call fails but the campaign is saved to your database anyway.

**How to Check:**
```bash
cd "c:\Users\Sai kiran\Desktop\Sadhyam"
python check_meta_campaigns.py
```

This will show:
- ✅ Campaigns with Meta campaign ID (successfully created in Meta)
- ❌ Campaigns without Meta campaign ID (only in database, not in Meta)

**If campaigns have NO Meta campaign ID:**
- Meta API call failed
- Check backend logs for errors
- Verify access token is valid
- Try creating a new campaign

---

### 3. Wrong Ad Account Selected 🔄

You might be viewing a different ad account in Meta Ads Manager.

**How to Fix:**
1. Open Meta Ads Manager
2. Look at top-left corner for ad account dropdown
3. Click it and select the correct ad account
4. The ad account ID should match what's in your Saadhyam app

**To find your ad account ID:**
- Go to Dashboard → Meta Ads in Saadhyam
- Look for "Ad Account: act_XXXXXXXXXX"
- This is your ad account ID

---

### 4. Filter Settings Hide Campaigns 🔍

Meta Ads Manager has filters that might hide your campaigns.

**How to Fix:**
1. In Meta Ads Manager, click "Campaigns" tab
2. Look for filter icon (funnel) at top
3. Click "Status" filter
4. Enable **"Show paused campaigns"**
5. Enable **"Show all campaigns"**
6. Clear any date range filters

---

### 5. Campaigns Are There But Empty 📭

Your campaigns might be created but have no ad sets or ads yet.

**Why This Happens:**
- Campaign creation succeeded
- But ad set or creative creation failed
- Campaign exists but is "empty"

**How to Check:**
1. In Meta Ads Manager, click "Campaigns" tab
2. Look for your campaign name
3. Click to expand it
4. Check if it has ad sets and ads inside

**If empty:**
- Check backend logs for "Ad Set" or "Creative" errors
- The issue is likely with Instagram media ID or creative creation
- Try creating a new campaign with a different post

---

## Step-by-Step Troubleshooting

### Step 1: Run Diagnostic Script

```bash
cd "c:\Users\Sai kiran\Desktop\Sadhyam"
python check_meta_campaigns.py
```

This will tell you:
- How many campaigns are in your database
- Which campaigns have Meta campaign IDs
- Which campaigns failed to create in Meta

### Step 2: Check Backend Logs

Look for these messages in your backend server logs:

**✅ Success:**
```
✅ Campaign created successfully!
   Campaign ID: 123456789
   Campaign Name: My Campaign
```

**❌ Failure:**
```
❌ Meta API Error: {...}
Failed to create campaign: ...
```

**If you see failures:**
- Note the error message
- Common errors:
  - "Invalid OAuth access token" → Reconnect Meta account
  - "Insufficient permissions" → Grant more permissions
  - "Ad account not found" → Verify ad account ID
  - "Payment method required" → Add payment method

### Step 3: Verify Meta Account Connection

1. Go to Dashboard → Meta Ads in Saadhyam
2. Check connection status
3. If "Connected", note the ad account ID
4. If "Not Connected", reconnect:
   - Click "Connect Meta Account"
   - Follow OAuth flow
   - Grant all requested permissions

### Step 4: Complete Meta Business Manager Setup

1. Go to https://business.facebook.com/settings
2. Complete these sections:

**Business Info:**
- Business name
- Business address
- Business phone
- Business website
- Business email

**Payment Methods:**
- Add credit/debit card
- Or add PayPal
- Verify payment method

**Ad Accounts:**
- Verify ad account is active
- Check spending limit
- Verify currency (INR for India)

**Pages:**
- Verify Facebook Page is connected
- Check page permissions

**Instagram Accounts:**
- Verify Instagram Business account is connected
- Check Instagram permissions

### Step 5: Check Meta Ads Manager

1. Go to https://business.facebook.com/adsmanager
2. Select correct ad account (top-left dropdown)
3. Click "Campaigns" tab
4. Enable filters:
   - ✅ Show paused campaigns
   - ✅ Show all statuses
   - ✅ All time (date range)
5. Look for your campaigns by name

**If you see them:**
- ✅ Campaigns are created successfully!
- They're just paused (for safety)
- Click toggle to activate

**If you don't see them:**
- Check if you're in the correct ad account
- Check if filters are hiding them
- Run diagnostic script (Step 1)

---

## Common Error Messages and Solutions

### "Invalid OAuth access token"

**Cause:** Access token expired or invalid

**Solution:**
1. Go to Dashboard → Meta Ads
2. Click "Disconnect"
3. Click "Connect Meta Account"
4. Complete OAuth flow again
5. Try creating campaign again

### "Insufficient permissions"

**Cause:** Meta account doesn't have required permissions

**Solution:**
1. Reconnect Meta account
2. When granting permissions, enable:
   - ✅ ads_management
   - ✅ ads_read
   - ✅ business_management
   - ✅ pages_read_engagement
   - ✅ instagram_basic
   - ✅ instagram_content_publish

### "Ad account not found"

**Cause:** Ad account ID is incorrect or account was deleted

**Solution:**
1. Go to https://business.facebook.com/settings/ad-accounts
2. Verify ad account exists
3. Note the ad account ID (act_XXXXXXXXXX)
4. Reconnect Meta account in Saadhyam

### "Payment method required"

**Cause:** No payment method added to ad account

**Solution:**
1. Go to https://business.facebook.com/settings/payment-methods
2. Click "Add Payment Method"
3. Add credit card or PayPal
4. Verify payment method
5. Try creating campaign again

### "Campaign created but not showing"

**Cause:** Campaign created in database but not in Meta

**Solution:**
1. Run diagnostic script to confirm
2. Check backend logs for Meta API errors
3. If Meta API failed, delete campaign from database:
   ```sql
   DELETE FROM ad_campaigns WHERE campaign_id IS NULL;
   ```
4. Try creating campaign again
5. Watch backend logs for errors

---

## How to Verify Campaigns Are Actually Created

### Method 1: Check Database

```sql
SELECT 
    id,
    campaign_id,
    campaign_name,
    status,
    daily_budget,
    created_at
FROM ad_campaigns
ORDER BY created_at DESC
LIMIT 10;
```

**Look for:**
- `campaign_id` column should have a value (e.g., "123456789")
- If `campaign_id` is NULL, campaign was NOT created in Meta

### Method 2: Check Meta API Directly

Use Meta's Graph API Explorer:
1. Go to https://developers.facebook.com/tools/explorer
2. Select your app
3. Get access token
4. Make request:
   ```
   GET /act_XXXXXXXXXX/campaigns
   ```
5. Look for your campaigns in the response

### Method 3: Check Backend Logs

Search logs for:
```
Campaign created successfully
Campaign ID: XXXXXXXXX
```

If you see this, campaign was created in Meta.

---

## Prevention: How to Avoid This Issue

### 1. Complete Setup Before Creating Campaigns

Before creating your first campaign:
- ✅ Complete Meta Business Manager setup
- ✅ Add payment method
- ✅ Verify business information
- ✅ Connect Facebook Page
- ✅ Connect Instagram account
- ✅ Test Meta account connection

### 2. Monitor Backend Logs

When creating campaigns:
- Keep backend logs visible
- Watch for success/error messages
- If you see errors, stop and fix them
- Don't create multiple campaigns if first one fails

### 3. Start with Test Campaign

Create a small test campaign first:
- ₹100 daily budget
- 1 day duration
- Verify it appears in Meta Ads Manager
- Then create real campaigns

### 4. Use Saadhyam Dashboard

Don't rely only on Meta Ads Manager:
- Your Saadhyam app shows all campaigns
- Even if Meta Ads Manager doesn't show them
- Use Saadhyam to manage campaigns
- Use Meta Ads Manager for detailed analytics

---

## Still Not Working?

If campaigns still don't show after following all steps:

### 1. Contact Meta Support

- Go to https://www.facebook.com/business/help
- Click "Get Started"
- Select "Ads Manager"
- Describe the issue:
  - "Created campaigns via API but not showing in Ads Manager"
  - Provide campaign IDs
  - Provide ad account ID

### 2. Check Meta Status

- Go to https://developers.facebook.com/status
- Check if Meta API is having issues
- Check if there are any ongoing incidents

### 3. Verify API Version

Your app uses Meta API v21.0. Verify:
- This version is still supported
- No breaking changes were introduced
- Your access token is compatible

### 4. Check Rate Limits

Meta has rate limits:
- 200 calls per hour per user
- 4800 calls per hour per app
- If exceeded, wait and try again

---

## Summary Checklist

Before creating campaigns:
- [ ] Meta Business Manager setup complete
- [ ] Payment method added
- [ ] Business information verified
- [ ] Facebook Page connected
- [ ] Instagram account connected
- [ ] Meta account connected in Saadhyam
- [ ] Backend server running without errors

When creating campaigns:
- [ ] Use POSTED Instagram posts (not scheduled)
- [ ] Set minimum ₹100 daily budget
- [ ] Watch backend logs for errors
- [ ] Verify campaign appears in Saadhyam dashboard
- [ ] Check Meta Ads Manager with filters enabled

If campaigns don't show:
- [ ] Run diagnostic script
- [ ] Check backend logs
- [ ] Verify Meta account connection
- [ ] Complete Meta Business Manager setup
- [ ] Check filters in Meta Ads Manager
- [ ] Verify correct ad account selected

---

**Last Updated:** 2026-05-17
**Status:** Troubleshooting Guide
**Priority:** HIGH
