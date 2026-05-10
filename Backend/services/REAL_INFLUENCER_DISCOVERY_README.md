# Real Influencer Discovery System

## Overview

This system discovers **REAL Instagram influencers** using public web scraping and AI-powered analysis. It **NEVER generates fake influencer names** - all data comes from actual Instagram profiles.

## Architecture

### System Flow

```
Business Profile → Generate Keywords (Groq AI) → Search Google → 
Extract Instagram URLs → Scrape Profiles → Strict Filtering → 
Extract Emails → Calculate Engagement → Score & Rank (Groq AI) → 
Return Results
```

### Components

#### 1. **businessContextService.js**
- Fetches logged-in business profile from database
- Normalizes business data
- Infers category if missing

#### 2. **keywordGenerator.js**
- Generates highly targeted search keywords using Groq AI
- Creates 8-12 niche-specific keywords
- Fallback to predefined keywords if AI fails

#### 3. **googleSearchScraper.js**
- Searches Google using Playwright
- Query format: `site:instagram.com "keyword"`
- Extracts Instagram profile URLs
- Filters out reels, posts, hashtags
- Returns only profile URLs

#### 4. **instagramProfileScraper.js**
- Scrapes public Instagram profiles using Playwright
- Extracts data from:
  - Meta tags
  - JSON-LD structured data
  - Embedded window._sharedData
  - HTML elements
- NO LOGIN REQUIRED
- Normalizes follower counts (65.4K → 65400)

#### 5. **emailExtractor.js**
- Extracts emails from bio text
- Fetches and parses external URLs
- Returns null if no email found

#### 6. **engagementEstimator.js**
- Estimates engagement rate based on follower count
- Calculates engagement score (0-100)
- Estimates average views per post
- Determines posting frequency

#### 7. **influencerScoring.js**
- Scores influencers using Groq AI
- Generates partnership recommendations
- Calculates match scores (0-100)
- Adds cost estimates based on follower count

#### 8. **realInfluencerDiscovery.js**
- Main orchestrator
- Runs complete pipeline
- Applies strict niche filtering
- Returns ranked influencers

#### 9. **real_influencer_service.py**
- Python wrapper for Node.js services
- Called by partnership_agent_service.py
- Handles subprocess communication

#### 10. **runInfluencerDiscovery.js**
- Standalone Node.js script
- Reads input from stdin
- Outputs JSON to stdout
- Called by Python backend

## Strict Niche Filtering

### Filter Keywords by Category

**Food:**
- food, chef, cook, recipe, restaurant, cuisine, meal, dish, culinary, foodie, cooking

**Fashion:**
- fashion, style, outfit, clothing, designer, model, trend, wear, wardrobe

**Tech:**
- tech, technology, gadget, software, code, developer, digital, app, programming

**Beauty:**
- beauty, makeup, skincare, cosmetic, glow, skin, hair, nail

**Fitness:**
- fitness, gym, workout, health, yoga, training, exercise, muscle

**Travel:**
- travel, trip, tour, explore, wander, adventure, destination, journey

**Real Estate:**
- realestate, property, home, house, architecture, interior, design, luxury, villa

### Negative Keywords (Exclusions)

**Real Estate excludes:**
- food, recipe, cooking, restaurant, chef, meal

**Travel excludes:**
- food blogger, recipe, cooking, restaurant review

**Fitness excludes:**
- food blogger, recipe creator, restaurant

### Filtering Rules

1. **MUST have at least 2 positive keyword matches** in bio/username/name
2. **MUST NOT have any negative keywords**
3. Profiles failing these checks are excluded

## Engagement Rate Estimation

| Follower Count | Engagement Rate |
|----------------|-----------------|
| < 1K           | 8.0%            |
| 1K - 10K       | 5.5%            |
| 10K - 50K      | 4.0%            |
| 50K - 100K     | 3.0%            |
| 100K - 500K    | 2.0%            |
| 500K - 1M      | 1.5%            |
| > 1M           | 1.0%            |

## Cost Estimates

| Follower Count | Estimated Cost (INR) |
|----------------|----------------------|
| > 1M           | ₹1,00,000 - ₹2,50,000 |
| 500K - 1M      | ₹50,000 - ₹1,00,000   |
| 100K - 500K    | ₹25,000 - ₹50,000     |
| 50K - 100K     | ₹15,000 - ₹30,000     |
| < 50K          | ₹5,000 - ₹15,000      |

## Scoring System

### Match Score (0-100)

**Factors:**
1. **Niche Relevance (40 points)** - Keyword matches in bio/username
2. **Engagement Rate (30 points)** - Higher engagement = higher score
3. **Follower Count (20 points)** - Sweet spot: 50K-500K
4. **Verification (10 points)** - Verified badge bonus

## Usage

### From Python Backend

```python
from services.real_influencer_service import RealInfluencerService

# Prepare business context
business_context = {
    "name": "My Restaurant",
    "category": "food",
    "location": "Hyderabad, India",
    "targetAudience": "Food lovers",
    "description": "Korean restaurant"
}

# Discover influencers
influencers = await RealInfluencerService.discover_real_influencers(
    business_context=business_context,
    limit=10
)

# Format for API response
formatted = RealInfluencerService.format_for_partnership_response(influencers)
```

### Test Node.js Services

```bash
cd Backend/services
node testInfluencerDiscovery.js
```

## Environment Variables

Required in `Backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
```

## Rate Limiting & Safety

### Google Search
- Random delays: 2-5 seconds between searches
- Rotating user agents
- Headless browser mode

### Instagram Scraping
- Random delays: 2-5 seconds between profiles
- Rotating user agents
- NO LOGIN (public data only)
- Respects rate limits

## Fallback System

**Priority:**
1. **Web Scraping (PRIMARY)** - Google + Instagram scraping
2. **Database Search** - Previously collected influencers
3. **Apify API** - Live API collection
4. **No Results Message** - If nothing found

**IMPORTANT:** System will show "No highly relevant influencers found" rather than generating fake data.

## Output Format

```json
{
  "username": "real_username",
  "full_name": "Real Name",
  "bio": "Real bio text",
  "profile_pic": "https://...",
  "followers": 125000,
  "followers_display": "125K",
  "engagement_rate": "4.2%",
  "is_verified": true,
  "email": "contact@example.com",
  "match_score": 95,
  "why_it_works": "Explanation based on real data",
  "suggested_campaign": "Campaign idea",
  "estimated_cost": "₹25,000 - ₹50,000",
  "estimated_reach": "100K-150K",
  "source": "real_scraping"
}
```

## Debugging

Enable detailed logs by checking console output:
- ✅ Success messages
- ⚠️ Warning messages
- ❌ Error messages
- 🔍 Search progress
- 📸 Scraping progress
- 🎯 Scoring progress

## Limitations

1. **No Login** - Can only access public Instagram data
2. **Rate Limits** - Google and Instagram may block aggressive scraping
3. **Data Availability** - Some profiles may not expose all data publicly
4. **Accuracy** - Follower counts may be approximate if not in structured data

## Future Improvements

1. Add browser session reuse for better performance
2. Implement proxy rotation for higher rate limits
3. Add caching layer for repeated searches
4. Support for other platforms (TikTok, YouTube)
5. Real-time engagement tracking

## Troubleshooting

### "No influencers found"
- Check if keywords are too specific
- Verify GROQ_API_KEY is set
- Check internet connection
- Try broader category

### "Node.js script error"
- Verify Node.js is installed
- Check all npm packages are installed
- Verify Playwright browsers are installed: `npx playwright install`

### "Scraping failed"
- Instagram may be blocking requests
- Increase delays between requests
- Check if Instagram is accessible

## Support

For issues or questions, check:
1. Console logs for detailed error messages
2. Verify all environment variables are set
3. Test Node.js services independently
4. Check Playwright browser installation
