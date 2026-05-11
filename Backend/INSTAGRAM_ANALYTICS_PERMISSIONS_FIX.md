# Instagram Analytics Permissions Fix

## 🔴 Current Issue

Your Instagram Analytics is showing **all zeros** because your Facebook App doesn't have the required permissions to access Instagram Insights API.

**Error Message:**
```
(#10) Application does not have permission for this action
Type: OAuthException
```

## ✅ Solution: Add Instagram Insights Permission

### Step 1: Go to Facebook Developers Console
1. Visit: https://developers.facebook.com/apps/
2. Select your app (the one you're using for Instagram integration)

### Step 2: Add Instagram Permissions
1. In the left sidebar, click **"App Review"** → **"Permissions and Features"**
2. Search for and request these permissions:

#### Required Permissions:
- ✅ `instagram_basic` - Already have (for posting)
- ⚠️ **`instagram_manage_insights`** - **MISSING! This is the key one**
- ✅ `pages_read_engagement` - For page insights
- ✅ `pages_show_list` - For listing pages

### Step 3: Request Advanced Access
Instagram Insights requires **Advanced Access** (not just Standard Access):

1. Go to **"App Review"** → **"Permissions and Features"**
2. Find `instagram_manage_insights`
3. Click **"Request Advanced Access"**
4. Fill out the form explaining:
   - **Use Case**: "Analytics dashboard for Instagram Business accounts"
   - **Purpose**: "To provide users with insights about their Instagram posts, followers, engagement, and growth metrics"
   - **Screenshots**: Show your analytics dashboard

### Step 4: Business Verification (If Required)
For `instagram_manage_insights`, Facebook may require:
- Business verification
- Privacy policy URL
- Terms of service URL
- App icon and description

### Step 5: Reconnect Instagram
After permissions are approved:
1. Go to your app's Settings → Instagram
2. Disconnect and reconnect your Instagram account
3. The new permissions will be included in the access token

## 🔄 Alternative: Use Test Mode

While waiting for permission approval, you can test with:

### Test Users
1. Go to **"Roles"** → **"Test Users"**
2. Add test users
3. Test users automatically get all permissions

### Development Mode
Your app in Development Mode has access to test accounts with full permissions.

## 📊 What Data You'll Get After Fix

Once `instagram_manage_insights` permission is granted, you'll see:

### Account Metrics:
- Follower count and growth
- Impressions and reach
- Profile views
- Website clicks
- Email/phone contacts

### Post Metrics:
- Likes, comments, shares, saves
- Impressions and reach per post
- Engagement rate
- Best performing posts

### Audience Insights:
- Age and gender breakdown
- Top cities and countries
- Follower activity times
- Best times to post

### AI Features:
- Growth predictions
- Content recommendations
- Trend detection
- Engagement optimization tips

## 🛠️ Technical Details

### Current Permissions (Working):
```
instagram_basic - ✅ Working
instagram_content_publish - ✅ Working (for posting)
pages_show_list - ✅ Working
```

### Missing Permission:
```
instagram_manage_insights - ❌ MISSING
```

### API Endpoints That Need This Permission:
- `/{ig-user-id}/insights` - Account insights
- `/{ig-media-id}/insights` - Media insights
- `/{ig-user-id}/audience_insights` - Audience demographics

## 📝 Notes

1. **Permission Review Time**: Usually 1-3 business days
2. **Business Verification**: May take 1-2 weeks if required
3. **Test Mode**: Works immediately for testing
4. **Production**: Requires approved permissions

## 🚀 After Permissions Are Approved

1. Reconnect your Instagram account in the app
2. Go to Instagram → Analytics tab
3. Click "Refresh Data"
4. Wait 30 seconds for sync to complete
5. You'll see real analytics data!

## 📞 Need Help?

If you have issues:
1. Check Facebook App Dashboard for permission status
2. Verify your Instagram account is a Business account
3. Ensure the Facebook Page is connected to Instagram
4. Check the backend logs for specific error messages

---

**Current Status**: ⚠️ Waiting for `instagram_manage_insights` permission
**Date Parsing Issue**: ✅ Fixed in latest update
