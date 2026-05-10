# 🤖 AI AGENTS - SAADHYAM AI PLATFORM

## 🎉 Welcome to Your AI-Powered Business Platform!

Your Saadhyam AI platform now includes **2 powerful AI agents** that work 24/7 to grow your business.

---

## 🚀 Quick Access

| Agent | URL | Purpose |
|-------|-----|---------|
| **Partnership Agent** | http://localhost:8080/dashboard/agents/partnership | Find Instagram influencers |
| **Customer Retention Agent** | http://localhost:8080/dashboard/agents/customer-retention | Analyze customer churn |
| **Dashboard** | http://localhost:8080/dashboard | Main dashboard |

---

## 🤝 Partnership Agent

### **What It Does:**
Discovers real Instagram influencers for brand partnerships using AI-powered matching.

### **Key Features:**
- ✅ Real influencer data from Apify & RapidAPI
- ✅ AI match scoring (0-100)
- ✅ Campaign strategy recommendations
- ✅ Industry-specific filtering (8 industries)
- ✅ Database-first architecture
- ✅ Cost estimates & engagement predictions

### **How to Use:**
1. Open the Partnership Agent
2. Fill in your business details
3. Click "Find Partnership Matches"
4. Get real influencers with AI recommendations

### **Industries Supported:**
- Food & Beverage
- Fashion & Apparel
- Travel & Tourism
- Fitness & Wellness
- Beauty & Cosmetics
- Real Estate
- Technology
- Lifestyle

### **Test Guide:**
📖 See `TEST_REAL_INFLUENCERS_NOW.md` for detailed instructions

---

## 👥 Customer Retention Agent

### **What It Does:**
Analyzes customer behavior to identify churn risk and generate retention strategies.

### **Key Features:**
- ✅ CSV upload & analysis
- ✅ Customer segmentation (4 segments)
- ✅ Retention score (0-100)
- ✅ Churn risk detection
- ✅ AI-powered recommendations (5 strategies)
- ✅ Key insights (6 data points)

### **How to Use:**
1. Open the Customer Retention Agent
2. Download sample CSV (or upload your own)
3. Upload the CSV file
4. Click "Analyze with AI"
5. Get retention insights & recommendations

### **Customer Segments:**
- **Loyal** - High visits, low inactive days
- **Inactive** - 90+ days without purchase
- **Churn Risk** - 30-89 days inactive
- **High Value** - Top 25% spenders

### **CSV Format:**
```csv
customer_name,email,last_purchase_date,total_spent,visit_count,inactive_days
John Doe,john@example.com,2024-01-15,15000,12,120
```

### **Test Guide:**
📖 See `TEST_CUSTOMER_RETENTION_AGENT.md` for detailed instructions

---

## 🎯 Quick Start (2 Minutes)

### **Test Partnership Agent:**
```
1. Go to: http://localhost:8080/dashboard/agents/partnership
2. Enter: "Coastal Spice Restaurant" (Food & Beverage)
3. Location: "Visakhapatnam, Andhra Pradesh"
4. Click: "Find Partnership Matches"
5. Result: Real Instagram food influencers!
```

### **Test Customer Retention Agent:**
```
1. Go to: http://localhost:8080/dashboard/agents/customer-retention
2. Click: "Download Sample CSV"
3. Upload: The downloaded file
4. Click: "Analyze with AI"
5. Result: Retention insights & AI recommendations!
```

---

## 🔧 System Requirements

### **Backend:**
- Python 3.13.6
- FastAPI
- SQLite database
- Groq AI API key
- Apify API token
- RapidAPI key

### **Frontend:**
- Node.js 22.18.0
- React with TypeScript
- TanStack Router
- Tailwind CSS

### **Running:**
- Backend: http://localhost:8000
- Frontend: http://localhost:8080

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Port 8080)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Partnership  │  │  Customer    │  │   Business   │     │
│  │    Agent     │  │  Retention   │  │   Analysis   │     │
│  │              │  │    Agent     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Port 8000)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Partnership  │  │  Customer    │  │  Influencer  │     │
│  │   Service    │  │  Retention   │  │  Database    │     │
│  │              │  │   Service    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Groq AI    │  │    Apify     │  │  RapidAPI    │     │
│  │  (LLaMA 3.3) │  │  Instagram   │  │  Instagram   │     │
│  │              │  │   Scraper    │  │     API      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 API Keys

All API keys are configured in `Backend/.env`:

```env
# Partnership Agent
RAPIDAPI_KEY=df0d4b7f8fmshea97f97239ba7e3p1f1276jsn27e63e432815
APIFY_API_TOKEN=apify_api_wsOrpE7286AZzOdHTBO3wuVWLVdJI64zsq7c

# Both Agents
GROQ_API_KEY=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
```

---

## 📚 Documentation

### **Quick Start:**
- 📖 `QUICK_START_GUIDE.md` - Start here!

### **Test Guides:**
- 📖 `TEST_REAL_INFLUENCERS_NOW.md` - Partnership Agent
- 📖 `TEST_CUSTOMER_RETENTION_AGENT.md` - Customer Retention Agent

### **Implementation:**
- 📖 `IMPLEMENTATION_COMPLETE.md` - Full implementation summary
- 📖 `CUSTOMER_RETENTION_AGENT_SUMMARY.md` - Retention agent details
- 📖 `AI_AGENTS_IMPLEMENTATION.md` - Technical architecture

---

## 🎯 Features Comparison

| Feature | Partnership Agent | Customer Retention Agent |
|---------|------------------|-------------------------|
| **Data Source** | Apify + RapidAPI | CSV Upload |
| **AI Model** | Groq LLaMA 3.3 70B | Groq LLaMA 3.3 70B |
| **Primary Use** | Find influencers | Reduce churn |
| **Output** | Influencer matches | Retention insights |
| **Response Time** | 8-15 seconds | 5-10 seconds |
| **Database** | Yes (persistent) | No (analysis only) |
| **Industries** | 8 supported | All businesses |
| **Scoring** | Match score 0-100 | Retention score 0-100 |

---

## 🚨 Health Checks

### **Check System Status:**

```bash
# Main backend
curl http://localhost:8000/health

# Partnership Agent
curl http://localhost:8000/api/partnership/health

# Customer Retention Agent
curl http://localhost:8000/api/customer-retention/health

# Influencer Database
curl http://localhost:8000/api/influencers/stats
```

### **Expected Response:**
```json
{
  "status": "healthy",
  "service": "...",
  "groq_configured": true
}
```

---

## 🔮 Future Enhancements (Phase 2)

### **Partnership Agent:**
- [ ] Vector search for semantic matching
- [ ] Andhra Pradesh geo-targeting
- [ ] Analytics dashboard
- [ ] Outreach automation
- [ ] Campaign tracking
- [ ] ROI measurement

### **Customer Retention Agent:**
- [ ] WhatsApp automation
- [ ] Email campaigns
- [ ] CRM integration
- [ ] Predictive analytics
- [ ] A/B testing
- [ ] Historical trends
- [ ] Auto-segmentation
- [ ] SMS campaigns

---

## 💡 Pro Tips

### **Partnership Agent:**
1. Be specific with location (e.g., "Visakhapatnam")
2. Choose exact industry match
3. Set realistic budget ranges
4. Clear collaboration goals = better AI recommendations
5. First search may take 10-15 seconds (cold start)

### **Customer Retention Agent:**
1. Use clean, accurate customer data
2. Run analysis regularly (weekly/monthly)
3. Act on AI recommendations immediately
4. Focus on high-value churn risk customers first
5. Reward loyal customers to maintain loyalty

---

## 🎨 UI Preview

### **Partnership Agent:**
```
┌─────────────────────────────────────────────────────┐
│  🤝 Partnership Agent                               │
│  Find perfect influencer matches for your business  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Business Details Form                              │
│  ├─ Business Name                                   │
│  ├─ Industry (8 options)                            │
│  ├─ Target Audience                                 │
│  ├─ Collaboration Goal                              │
│  ├─ Partnership Type                                │
│  ├─ Budget Range                                    │
│  ├─ Timeline                                        │
│  └─ Location                                        │
│                                                     │
│  [Find Partnership Matches]                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Results: 3 Perfect Matches                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ @foodie_vizag                               │   │
│  │ 47.3K followers | Match: 92%                │   │
│  │ "Food blogger in Visakhapatnam..."          │   │
│  │ ✓ Why it works: [AI explanation]            │   │
│  │ ✓ Campaign: [AI strategy]                   │   │
│  │ ✓ Cost: ₹35,000                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Customer Retention Agent:**
```
┌─────────────────────────────────────────────────────┐
│  👥 Customer Retention Agent                        │
│  Analyze customer behavior and reduce churn         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Upload Customer Data                               │
│  ┌─────────────────────────────────────────────┐   │
│  │  📄 Drag and drop CSV file                  │   │
│  │     or click to upload                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Download Sample CSV]  [Analyze with AI]           │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Retention Analysis                                 │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ 75%  │ │  2   │ │  2   │ │ 30%  │              │
│  │Score │ │Loyal │ │Inact.│ │Churn │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                     │
│  AI Recommendations:                                │
│  🎯 Launch win-back campaign...                    │
│  📧 Create re-engagement emails...                 │
│  💎 Implement VIP loyalty program...               │
│                                                     │
│  Customer Segments:                                 │
│  [Churn Risk]        [Loyal Customers]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎊 Success!

Your Saadhyam AI platform is now equipped with:

- ✅ **2 Active AI Agents**
- ✅ **Real API Integrations**
- ✅ **AI-Powered Analysis**
- ✅ **Production-Ready Features**
- ✅ **Comprehensive Documentation**

---

## 🚀 Start Now!

### **Partnership Agent:**
http://localhost:8080/dashboard/agents/partnership

### **Customer Retention Agent:**
http://localhost:8080/dashboard/agents/customer-retention

---

**Happy Building! 🎯**

**Transform your business with AI-powered intelligence!** 🚀
