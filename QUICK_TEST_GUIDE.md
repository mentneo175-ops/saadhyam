# Quick Test Guide - Partnership Agent Real Discovery

## 🚀 System Status

Both servers are running:
- **Backend**: http://localhost:8000 ✅
- **Frontend**: http://localhost:8080 ✅

---

## 🧪 Test 1: Health Check (Backend)

### Command
```bash
curl http://localhost:8000/api/partnership/health
```

### Expected Response
```json
{
  "status": "healthy",
  "service": "Partnership Agent (Real Discovery)",
  "tavily_configured": true,
  "groq_configured": true,
  "mode": "real_web_search"
}
```

### ✅ Success Criteria
- Status code: 200
- `tavily_configured`: true
- `groq_configured`: true
- `mode`: "real_web_search"

---

## 🧪 Test 2: Real Influencer Discovery (API)

### Command
```bash
curl -X POST http://localhost:8000/api/partnership/agent \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Spice Garden Restaurant",
    "industry": "food",
    "targetAudience": "Young professionals aged 25-35",
    "collaborationGoal": "Increase brand awareness and drive foot traffic",
    "partnershipType": "sponsored-post",
    "budget": "25k-50k",
    "timeline": "short",
    "location": "Kakinada"
  }'
```

### Expected Response Structure
```json
{
  "success": true,
  "results": [
    {
      "username": "real_instagram_handle",
      "full_name": "Real Influencer Name",
      "bio": "Real bio from search results",
      "followers": 50000,
      "followers_display": "50.0K",
      "platform": "Instagram",
      "profile_url": "https://instagram.com/...",
      "location": "Kakinada",
      "niche": "food",
      "matchScore": 85,
      "whyItWorks": "AI-generated partnership fit explanation",
      "suggestedCampaign": "AI-generated campaign idea",
      "estimatedCost": "₹15,000 - ₹25,000",
      "estimatedReach": "30K-60K",
      "engagementRate": "3-5%",
      "source": "tavily_real_search"
    }
  ],
  "total": 5,
  "message": "Found 5 real food influencers in Kakinada"
}
```

### ✅ Success Criteria
- `success`: true
- `results` array contains real influencer data
- `source`: "tavily_real_search"
- No fake/generated names
- Real Instagram/YouTube URLs

### ⏱️ Expected Time
- 10-20 seconds (depends on Tavily API response time)

---

## 🧪 Test 3: Frontend UI Test

### Steps

1. **Open Frontend**
   - Navigate to: http://localhost:8080
   - Login if required

2. **Go to Partnership Agent**
   - Click "AI Agents" in sidebar
   - Click "Partnership Agent"

3. **Fill Form**
   - Business Name: `Spice Garden Restaurant`
   - Industry: `Food & Beverage`
   - Target Audience: `Young professionals aged 25-35`
   - Collaboration Goal: `Increase brand awareness and drive foot traffic to our new location`
   - Partnership Type: `Sponsored Posts`
   - Budget Range: `₹25,000 - ₹50,000`
   - Timeline: `Short-term (1 month)`
   - Location: `Kakinada`

4. **Submit Form**
   - Click "Find Partnership Matches"
   - Wait for loading spinner (10-20 seconds)

5. **Verify Results**
   - Check that results appear
   - Verify influencer names are REAL (not AI-generated)
   - Check platform icons (Instagram, YouTube, Twitter)
   - Verify match scores (0-100%)
   - Check partnership fit explanations
   - Verify campaign suggestions
   - Check cost estimates

### ✅ Success Criteria
- Form submits successfully
- Loading state appears
- Results display after 10-20 seconds
- Real influencer data shown
- No fake/mock data
- Match scores visible
- Campaign suggestions present
- Cost estimates shown

---

## 🧪 Test 4: Different Industries

### Test Food Industry (Kakinada)
```json
{
  "businessName": "Coastal Delights",
  "industry": "food",
  "location": "Kakinada"
}
```
**Expected**: Food bloggers, restaurant reviewers from Kakinada/Andhra Pradesh

### Test Fashion Industry (Vizag)
```json
{
  "businessName": "Style Studio",
  "industry": "fashion",
  "location": "Visakhapatnam"
}
```
**Expected**: Fashion influencers, style bloggers from Vizag

### Test Travel Industry (Hyderabad)
```json
{
  "businessName": "Wanderlust Tours",
  "industry": "travel",
  "location": "Hyderabad"
}
```
**Expected**: Travel vloggers, tourism creators from Hyderabad/Telangana

### Test Tech Industry (Bangalore)
```json
{
  "businessName": "TechGadgets Pro",
  "industry": "tech",
  "location": "Bangalore"
}
```
**Expected**: Tech reviewers, gadget influencers from Bangalore

---

## 🧪 Test 5: Empty Results Handling

### Test Obscure Location
```json
{
  "businessName": "Test Business",
  "industry": "food",
  "location": "Very Small Village Name"
}
```

### Expected Behavior
- No fake data fallback
- Empty state message
- Suggestion to try broader search
- No error crashes

---

## 🔍 Backend Logs to Monitor

When testing, watch the backend terminal for these logs:

```
🚀 REAL INFLUENCER DISCOVERY PIPELINE
================================================================================
📋 Industry: food
📍 City: Kakinada
🎯 Target Audience: Young professionals aged 25-35
💡 Goal: Increase brand awareness
================================================================================

🔍 STEP 1: Searching web with Tavily API...
📝 Generated 10 search queries for food in Kakinada
🔍 Starting Tavily search for 10 queries...
  🔎 Searching: food influencers in Kakinada Instagram
    ✅ Found 5 results
  🔎 Searching: food bloggers Kakinada
    ✅ Found 5 results
✅ Total search results: 20

📊 STEP 2: Extracting influencer data...
📊 Extracting influencers from 20 search results...
  ✅ Extracted: Real Name (Instagram)
  ✅ Extracted: Another Real Name (YouTube)
✅ Extracted 8 influencers

🔄 STEP 3: Removing duplicates...
🔄 Removed 2 duplicates

🎯 STEP 4: Ranking influencers by relevance...
🎯 Ranking 6 influencers...
✅ Ranking complete. Top score: 85.5

🔍 STEP 5: Filtering low-quality matches...
🔍 Filtered: 6 → 5 (min score: 40.0)

🤖 STEP 6: AI-powered partnership analysis...
🤖 Analyzing 5 influencers with AI...
  🔍 Analyzing 1/5: Real Name
  🔍 Analyzing 2/5: Another Real Name
✅ Analysis complete for 5 influencers

📦 STEP 7: Formatting results for frontend...

================================================================================
✅ PIPELINE COMPLETE: 5 real influencers discovered
================================================================================
```

---

## 🐛 Troubleshooting

### Issue: "No results found"
**Possible Causes**:
- Tavily API rate limit reached
- No influencers found for that city/industry combination
- Network connectivity issues

**Solutions**:
1. Try a different city (larger cities have more results)
2. Try a different industry
3. Check Tavily API key in `Backend/.env`
4. Check backend logs for errors

### Issue: "Using demo data" alert
**Cause**: Frontend fallback to mock data on API error

**Solutions**:
1. Check backend is running on port 8000
2. Check CORS configuration
3. Check browser console for errors
4. Verify API endpoint URL in frontend

### Issue: Slow response (>30 seconds)
**Cause**: Tavily API slow response or multiple queries

**Solutions**:
1. This is normal for first request
2. Subsequent requests may be faster
3. Consider implementing caching

### Issue: AI analysis missing
**Cause**: Groq API error or rate limit

**Solutions**:
1. Check Groq API key in `Backend/.env`
2. Check Groq API quota
3. System will still return results without detailed AI analysis

---

## 📊 Expected Performance

### Response Times
- Health check: <100ms
- Influencer discovery: 10-20 seconds
- Frontend load: <2 seconds

### Result Quality
- Match scores: 40-100%
- Results per request: 5-10 influencers
- Accuracy: Depends on Tavily search quality

### API Limits
- Tavily API: Check your plan limits
- Groq API: Check your plan limits
- Recommended: Implement caching for production

---

## ✅ Final Verification Checklist

- [ ] Backend health check returns 200 OK
- [ ] Tavily API configured (tavily_configured: true)
- [ ] Groq API configured (groq_configured: true)
- [ ] Mode is "real_web_search"
- [ ] API returns real influencer data
- [ ] No fake/mock data in results
- [ ] Frontend form submits successfully
- [ ] Results display correctly
- [ ] Match scores visible
- [ ] Campaign suggestions present
- [ ] Cost estimates shown
- [ ] Platform icons display correctly
- [ ] Empty state works for no results
- [ ] Error handling works properly

---

## 🎉 Success!

If all tests pass, your Partnership Agent is fully operational with:
- ✅ Real-time web search using Tavily API
- ✅ Real influencer data extraction
- ✅ Intelligent ranking algorithm
- ✅ AI-powered partnership analysis
- ✅ Beautiful frontend UI
- ✅ No fake data generation

**The system is ready for production use!** 🚀

---

## 📞 Support

If you encounter issues:
1. Check backend logs in terminal
2. Check browser console for frontend errors
3. Verify API keys in `.env` files
4. Review `SYSTEM_STATUS_SUMMARY.md` for architecture details
5. Check `REAL_INFLUENCER_DISCOVERY_COMPLETE.md` for implementation details
