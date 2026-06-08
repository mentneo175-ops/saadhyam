# SAADHYAM BUSINESS LLM — Team 2 Execution Handbook


---

#  1 — Project Vision

## What Is Saadhyam Business LLM?

Saadhyam is building its own AI assistant specifically designed to help small and medium businesses grow. Think of it like ChatGPT, but instead of knowing everything about everything, our AI will be an expert specifically in:

- **Marketing Strategy** — How to plan and execute marketing campaigns
- **Lead Generation** — How to find and convert potential customers
- **Branding** — How to build a strong, recognizable brand identity
- **Customer Acquisition** — How to attract and retain customers
- **Local Business Growth** — How to grow a business in a specific city or area
- **Meta Ads** — Facebook and Instagram paid advertising
- **Google Ads** — Search and display advertising on Google
- **Instagram Marketing** — Organic growth, content strategy, Reels, Stories
- **YouTube Marketing** — Video content strategy, SEO, audience growth
- **WhatsApp Marketing** — Business messaging, broadcast lists, catalogs
- **Local SEO** — Google Business Profile optimization, local search rankings

## Why Are We Building This?

Most AI assistants give generic marketing advice. A business owner in Visakhapatnam asking "How do I get more customers for my restaurant?" gets the same answer as someone in New York. Our LLM will understand Indian business contexts, local marketing strategies, budget-friendly approaches, and practical tactics that actually work for small businesses.


Our team's output directly becomes the "brain" of the AI. The quality of our training data determines how smart the final AI will be. If we write low-quality, vague, or incorrect marketing conversations, the AI will give low-quality, vague, or incorrect answers. If we write detailed, accurate, practical marketing advice, the AI will be genuinely helpful to business owners.

**Our work matters. Every single conversation we write or curate teaches the AI something.**

---

#  2 — What Is an LLM?

## Explained Simply

LLM stands for **Large Language Model**. It is a type of artificial intelligence that understands and generates human language.

**Think of it like this:** Imagine you read 10,000 books about cooking. After reading all those books, someone asks you "How do I make biryani?" You would be able to give a detailed answer because you have absorbed knowledge from thousands of sources. An LLM works the same way — it reads billions of text examples and learns patterns of language and knowledge.

## How Does an LLM Learn?

1. **Pre-training:** The base model (like Mistral) reads billions of words from the internet — books, articles, websites, conversations. This gives it general language understanding. It learns grammar, facts, reasoning patterns, and how conversations flow.

2. **Fine-tuning:** We take this pre-trained model and teach it specific knowledge by showing it examples of the exact type of conversations we want it to have. This is where OUR work comes in. We create marketing-specific training data.

3. **The result:** After fine-tuning, the model becomes an expert in marketing while retaining its general language abilities.

## What Is Training Data?

Training data is the set of examples we show the AI so it can learn. For our project, training data consists of conversations in this format:

```
User: [A business owner asks a marketing question]
Assistant: [The AI gives a detailed, helpful, practical answer]
```

Example:
```
User: How can I increase footfall to my clothing store in Vizag?
Assistant: Here are 7 proven strategies to increase footfall to your clothing store in Visakhapatnam:

1. **Google Business Profile Optimization** — Claim and fully optimize your Google Business listing. Add high-quality photos of your store, update your hours, and post weekly updates about new arrivals. This helps you appear in "clothing stores near me" searches.

2. **Instagram Reels Strategy** — Create 15-second Reels showing new arrivals, styling tips, and behind-the-scenes content. Use local hashtags like #VizagFashion #VizagShopping #VisakhapatnamStyle. Post 4-5 Reels per week.

3. **WhatsApp Broadcast Lists** — Collect customer phone numbers and create broadcast lists. Send weekly updates about new collections, special offers, and festival sales. Keep messages personal and include product images.

4. **Local Influencer Collaborations** — Partner with Vizag-based micro-influencers (5K-50K followers) who focus on fashion and lifestyle. Offer them free outfits in exchange for store visit content.

5. **Festival Marketing Campaigns** — Plan campaigns around Sankranti, Ugadi, Dussehra, and Diwali. Create festival-specific window displays and run "Festival Special" promotions.

6. **Loyalty Programs** — Implement a simple punch card system: "Buy 5, get 20% off the 6th purchase." This encourages repeat visits.

7. **In-Store Events** — Host monthly styling workshops or "New Collection Preview" events for loyal customers. This creates buzz and encourages word-of-mouth referrals.

Start with strategies 1-3 as they require the least investment and can show results within 2-4 weeks.
```

This is ONE training example. We need to create THOUSANDS of these across all marketing categories.

---

#  3 — What Is Fine-Tuning?

## The Concept

Fine-tuning is like specialized training. Imagine a doctor who went to medical school (pre-training) and then did a specialization in cardiology (fine-tuning). The base model already knows language. We fine-tune it to become a marketing expert.

## Mistral

Mistral is the base language model we are using. It is an open-source LLM created by Mistral AI, a French company. We chose Mistral because:
- It is open-source (free to use and modify)
- It performs very well for its size
- It supports fine-tuning
- It handles multiple languages well
- It runs efficiently on available hardware

Think of Mistral as the "raw brain" — it is intelligent but not yet specialized. Our training data makes it a marketing expert.

## LoRA (Low-Rank Adaptation)

Fine-tuning an entire LLM requires enormous computing power. LoRA is a technique that makes fine-tuning much more efficient. Instead of changing ALL the parameters (weights) in the model, LoRA only changes a small subset of parameters.

**Simple analogy:** Imagine you have a fully furnished house (the base model). Instead of rebuilding the entire house to add a home office, you just add a desk, chair, and bookshelf to one room. LoRA does something similar — it adds small "adapter" layers to the existing model rather than rewriting the whole thing.

## QLoRA (Quantized LoRA)

QLoRA takes LoRA one step further by compressing the model's memory usage. It uses a technique called "quantization" which reduces the precision of numbers the model uses (like rounding 3.14159 to 3.14). This makes the model use less RAM while maintaining quality.

**Simple analogy:** If LoRA is renovating one room instead of the whole house, QLoRA is doing that renovation with a smaller, more efficient toolkit. Same quality result, less resources needed.

## Unsloth

Unsloth is a software library (a tool) that makes fine-tuning with LoRA and QLoRA much faster — up to 2x faster. It optimizes the training process automatically.

**Simple analogy:** Unsloth is like having a power drill instead of a manual screwdriver when assembling furniture. Same job, much faster.

## Why You Should Know This

You do not need to understand the technical details of fine-tuning. But knowing these terms helps you understand:
- Why data quality matters so much (the model learns exactly from what we give it)
- Why we need so many examples (more examples = better learning)
- Why formatting matters (the training pipeline expects specific formats)

---

#  4 — Team 2 Responsibilities

## Our Full Title

**Marketing Dataset Research, Creation & Curation Team**

This title has three key words: **Research**, **Creation**, and **Curation**.

## Research

We do NOT only write conversations from our heads. We actively research:
- Existing marketing datasets on Kaggle, Hugging Face, GitHub
- Marketing case studies from real companies
- Marketing blogs, reports, and whitepapers
- Industry benchmarks and statistics
- Real campaign data and results
- Marketing frameworks and methodologies

Research gives us KNOWLEDGE. Knowledge helps us write BETTER training data. A conversation written by someone who has researched actual Meta Ads benchmarks will be far more accurate than one written purely from imagination.

## Creation

We create original training conversations in the instruction-response format. These conversations cover every marketing topic assigned to our team. Each conversation must be:
- Factually accurate
- Practically useful
- Detailed (not surface-level)
- Contextually relevant (Indian business context where appropriate)
- Well-formatted with clear structure

## Curation

Curation means improving, organizing, and quality-checking data. This includes:
- Reviewing conversations for accuracy and completeness
- Removing duplicate or near-duplicate entries
- Standardizing formatting across all entries
- Organizing data by category and subcategory
- Ensuring consistent quality across all team members' work
- Preparing data for the final JSONL training format

## Complete Responsibility List

1. Research relevant marketing datasets from public sources
2. Research marketing knowledge from blogs, case studies, reports
3. Find and evaluate public datasets for usability
4. Collect marketing references and statistics
5. Create original marketing training conversations
6. Curate and improve existing conversations
7. Remove duplicates and near-duplicates
8. Organize data by category and topic
9. Maintain source logs for all research
10. Format data in the required spreadsheet structure
11. Prepare final JSONL files for training handoff
12. Submit daily progress reports to the Coordinator
13. Meet weekly quality targets
14. Participate in weekly review sessions

---

#  5 — Team Structure


## Member Assignments

### Member 1 — Meta Ads & Facebook Marketing
**Scope:** Facebook advertising, Instagram advertising (paid), Meta Business Suite, ad creative strategy, audience targeting, campaign optimization, A/B testing, Meta Pixel, conversion tracking, lead generation ads, retargeting campaigns, lookalike audiences, ad budgeting, Meta Ads Manager.

### Member 2 — Google Ads & PPC
**Scope:** Google Search Ads, Google Display Ads, Google Shopping Ads, YouTube Ads, Performance Max campaigns, keyword research, bidding strategies, Quality Score, ad extensions, landing page optimization, conversion tracking, Google Analytics integration, remarketing, PPC budget management, Google Ads Editor.

### Member 3 — Instagram Marketing & YouTube Marketing
**Scope:** Instagram organic growth, Reels strategy, Stories strategy, content calendar, hashtag strategy, Instagram SEO, engagement tactics, collaboration strategies, YouTube channel optimization, video SEO, thumbnail design, YouTube Shorts, audience retention, YouTube Analytics, content repurposing, live streaming strategy.

### Member 4 — Local SEO & Google Business Profile
**Scope:** Google Business Profile optimization, local search ranking factors, NAP consistency, local citations, review management, local keyword research, Google Maps optimization, local link building, schema markup, local content strategy, competitor analysis, multi-location SEO, voice search optimization, local pack ranking.

### Member 5 — Branding & WhatsApp Marketing
**Scope:** Brand identity creation, brand positioning, brand voice, visual branding, brand storytelling, personal branding, brand consistency, WhatsApp Business setup, WhatsApp catalog, broadcast lists, WhatsApp automation, WhatsApp Business API, customer engagement through WhatsApp, WhatsApp marketing campaigns, WhatsApp community building.

## Communication Flow



- **Daily:** Members submit work to Coordinator via shared Google Drive folder
- **Daily:** Coordinator reviews submissions and provides feedback
- **Weekly:** Coordinator submits combined progress report to Training Team
- **As needed:** Members ask questions in the team whats app group chat
- **Weekly:** Team sync meeting (30 minutes) to discuss progress and issues


---

#  6 — Marketing Dataset Research vs Dataset Creation

## What Is Dataset Research?

Dataset research means finding existing data, knowledge, and reference material from public sources. You are NOT creating something new — you are FINDING what already exists and using it as a knowledge base.

**Examples of dataset research:**
- Finding a Kaggle dataset of 10,000 Facebook Ad campaigns with their performance metrics
- Finding a Hugging Face dataset of marketing Q&A pairs
- Reading a Meta Ads case study about a restaurant that tripled their delivery orders
- Collecting real CTR benchmarks from a Google Ads industry report
- Finding a GitHub repository with marketing conversation datasets

**Why research matters:**
- It gives you REAL numbers and benchmarks to include in training conversations
- It prevents you from making up inaccurate statistics
- It helps you discover marketing topics you had not thought of
- It provides inspiration for conversation topics

## What Is Dataset Creation?

Dataset creation means writing original training conversations from scratch. You use your research knowledge plus marketing expertise to write conversations that teach the AI.

**Example:**
After researching that the average CTR for Facebook Ads in the retail industry is 1.59%, you create this conversation:

```
User: What is a good click-through rate for my Facebook Ads for my retail store?
Assistant: For retail businesses on Facebook, the average click-through rate (CTR) is approximately 1.59%. Here is how to evaluate your CTR:

- **Below 1.0%** — Poor. Your ad creative or targeting needs significant improvement.
- **1.0% - 1.5%** — Average. There is room for improvement.
- **1.5% - 2.5%** — Good. Your ads are performing at or above industry standards.
- **Above 2.5%** — Excellent. Your targeting and creative are well-optimized.

To improve your CTR:
1. Test different ad images — lifestyle photos typically outperform product-only shots
2. Write compelling headlines with a clear value proposition
3. Use carousel ads to showcase multiple products
4. Narrow your audience targeting to your ideal customer profile
5. Add urgency with limited-time offers
6. Test video ads — they often achieve 20-30% higher CTR than static images
```

Notice how the RESEARCH (knowing the 1.59% benchmark) made the CREATION much better.

## The Balance

Every team member should spend approximately:
- **30% of time** on research (finding data, reading sources, collecting references)
- **60% of time** on creation (writing training conversations)
- **10% of time** on curation (reviewing, formatting, organizing)

---

#  7 — Marketing Dataset Workflow

## Complete Workflow Diagram

```
Step 1: Dataset Research
    ↓
Step 2: Dataset Collection
    ↓
Step 3: Source Validation
    ↓
Step 4: Topic Extraction
    ↓
Step 5: Conversation Creation
    ↓
Step 6: Dataset Curation
    ↓
Step 7: Quality Review
    ↓
Step 8: Spreadsheet Format
    ↓
Step 9: JSONL Preparation
    ↓
Step 10: Training Handoff
```

### Step 1: Dataset Research
Search Kaggle, Hugging Face, GitHub, Google Dataset Search, and marketing blogs for relevant data. Log every source you find in the Source Log.

### Step 2: Dataset Collection
Download useful datasets. Save relevant articles. Bookmark case studies. Organize everything in your assigned Google Drive folder under a "Research" subfolder.

### Step 3: Source Validation
Check every source for: accuracy, licensing (can we use it?), relevance (is it about marketing?), quality (is the data clean and useful?), recency (is it from the last 5 years?).

### Step 4: Topic Extraction
From your research, extract specific topics and subtopics for conversation creation. For example, from a Meta Ads case study, you might extract: "How to structure a Facebook campaign for a new restaurant," "What budget to start with for local Facebook Ads," "How to target foodies in a specific city on Facebook."

### Step 5: Conversation Creation
Write training conversations in the User/Assistant format. Each conversation should cover one clear topic. Aim for depth — detailed, actionable, practical answers.

### Step 6: Dataset Curation
Review your own work. Check for: spelling errors, factual accuracy, completeness, formatting consistency, duplicate topics.

### Step 7: Quality Review
Submit to the Coordinator for review. The Coordinator checks quality, provides feedback, and either approves or requests revisions.

### Step 8: Spreadsheet Format
Enter approved conversations into the shared Google Spreadsheet using the required column format (see Section 17).

### Step 9: JSONL Preparation
The Coordinator converts the final spreadsheet into JSONL format using the provided conversion script (see Section 18).

### Step 10: Training Handoff
The Coordinator submits the JSONL files to the Training Team along with category counts, quality notes, and source documentation.

---

#  8 — Dataset Research Sources

## 9.1 Kaggle

### What Is Kaggle?
Kaggle is the world's largest platform for data science and machine learning datasets. It hosts thousands of free datasets that anyone can download and use.

**Website:** https://www.kaggle.com/datasets

### How to Search on Kaggle

1. Go to https://www.kaggle.com/datasets
2. Use the search bar at the top
3. Type your search keyword
4. Filter by: Sort by "Most Votes" or "Most Recent"
5. Check the "Usability" score — aim for datasets with usability score above 7.0
6. Read the dataset description before downloading
7. Check the license (look for CC0, CC-BY, or Apache 2.0)

### Search Keywords for Our Project

Use these exact search terms:

**Meta Ads / Facebook:**
- `facebook ads dataset`
- `meta ads performance`
- `facebook marketing dataset`
- `social media advertising dataset`
- `facebook ad campaign`
- `digital advertising dataset`

**Google Ads:**
- `google ads dataset`
- `PPC dataset`
- `search advertising dataset`
- `google ads campaign performance`
- `keyword performance dataset`
- `paid search dataset`

**General Marketing:**
- `marketing dataset`
- `lead generation dataset`
- `customer acquisition dataset`
- `campaign performance dataset`
- `customer segmentation dataset`
- `social media dataset`
- `digital marketing dataset`
- `marketing analytics dataset`
- `email marketing dataset`
- `conversion rate dataset`

**SEO:**
- `SEO dataset`
- `local SEO dataset`
- `search engine optimization`
- `keyword ranking dataset`
- `backlink dataset`

**Social Media:**
- `instagram dataset`
- `youtube dataset`
- `social media engagement`
- `influencer marketing dataset`
- `social media analytics`

### Dataset Validation Checklist for Kaggle

Before downloading, verify:
- [ ] Dataset has at least 100 upvotes (indicates community approval)
- [ ] Usability score is 7.0 or higher
- [ ] License allows commercial/research use (CC0, CC-BY, Apache 2.0, MIT)
- [ ] Data is from the last 5 years (marketing data gets outdated quickly)
- [ ] Dataset is actually about marketing (read the description carefully)
- [ ] Data columns are clearly labeled and described
- [ ] File format is CSV, XLSX, or JSON (easy to work with)

### How to Use Kaggle Data

You do NOT upload Kaggle data directly into our training set. Instead:
1. Download the dataset
2. Open it in Google Sheets or Excel
3. Study the data to understand patterns, benchmarks, and trends
4. Use these insights to write MORE ACCURATE training conversations
5. Cite the source in your Source Log

**Example:** You find a Kaggle dataset of 10,000 Facebook Ad campaigns. The data shows that video ads have 35% higher engagement than image ads. You now create a training conversation:

```
User: Should I use video or image ads on Facebook?
Assistant: Video ads consistently outperform image ads on Facebook. Industry data shows that video ads achieve approximately 35% higher engagement rates compared to static image ads. Here is why and how to leverage this:

[...detailed answer using the real data you found...]
```

---

## 8.2 Hugging Face

### What Is Hugging Face?
Hugging Face is the largest platform for AI models and datasets. Many organizations upload their training datasets here. It is especially useful for finding conversational and instruction-following datasets.

**Website:** https://huggingface.co/datasets

### How to Search on Hugging Face

1. Go to https://huggingface.co/datasets
2. Use the search bar
3. Filter by: Task → "text-generation" or "question-answering"
4. Filter by: Language → "en" (English)
5. Sort by: "Most Downloads" or "Most Likes"
6. Read the Dataset Card (the description page) carefully

### What to Look For

- **Instruction-following datasets** — These have the User/Assistant format similar to what we need
- **Marketing Q&A datasets** — Question-and-answer pairs about marketing topics
- **Business advice datasets** — General business guidance conversations
- **Conversational datasets** — Multi-turn conversation examples we can learn from

### Useful Search Terms for Hugging Face

- `marketing instructions`
- `business advice dataset`
- `marketing Q&A`
- `customer support conversations`
- `sales conversations`
- `business chatbot training data`
- `instruction following dataset`
- `alpaca format marketing`

### Licensing on Hugging Face

Check the Dataset Card for the license. Acceptable licenses:
- **Apache 2.0** — Free to use, modify, and distribute
- **MIT** — Free to use for any purpose
- **CC-BY-4.0** — Free to use with attribution
- **CC0** — Public domain, no restrictions
- **OpenRAIL** — Open use with responsible AI guidelines

**Avoid:** Datasets with "Non-Commercial" restrictions (CC-BY-NC) unless confirmed by the Coordinator.

### How to Use Hugging Face Data

1. If you find a relevant dataset, download it
2. Review the conversations for quality and accuracy
3. Do NOT copy conversations directly into our training set
4. Instead, use them as INSPIRATION and REFERENCE for creating original conversations
5. If a conversation is high-quality and the license permits, note it in the Source Log for the Coordinator to review for potential inclusion

---

## 8.3 GitHub

### What Is GitHub?
GitHub is a platform where developers and researchers share code and data. Many marketing researchers and AI teams share their datasets and tools on GitHub.

### How to Search on GitHub

1. Go to https://github.com
2. Click "Search" or use the search bar
3. Type your search term
4. Filter by: Language → leave blank (we want data, not code)
5. Sort by: "Most Stars" (indicates popularity/quality)

### Useful Search Terms for GitHub

- `marketing dataset`
- `facebook ads dataset`
- `digital marketing training data`
- `marketing chatbot dataset`
- `SEO dataset`
- `advertising dataset`
- `LLM marketing fine-tuning`
- `business AI training data`

### How to Evaluate a GitHub Repository

- **Stars:** More stars = more community trust (aim for 50+ stars)
- **README:** A well-written README indicates a well-maintained project
- **Last Updated:** Check when the repo was last updated (within 2 years is ideal)
- **License:** Check the LICENSE file in the repo
- **Data Format:** Look for CSV, JSON, JSONL, or TXT files in the repo
- **Documentation:** Good repos explain their data collection methodology

---

## 8.4 Google Dataset Search

### What Is Google Dataset Search?
Google Dataset Search is Google's search engine specifically for finding datasets. It indexes datasets from thousands of sources including government agencies, universities, and research organizations.

**Website:** https://datasetsearch.research.google.com

### How to Use It

1. Go to the website
2. Type your search query
3. Browse results — each result shows the dataset name, source, description, and format
4. Click on a result to see more details
5. Follow the link to the original source to download

### Search Examples

- `marketing campaign performance data`
- `social media advertising statistics`
- `small business marketing survey`
- `digital advertising benchmark data`
- `customer acquisition cost data`
- `local business marketing data India`
- `online advertising click-through rate data`

---

## 8.5 Marketing Reports and Blogs

These are not traditional "datasets" but they contain valuable KNOWLEDGE that improves your conversation quality.

### Recommended Sources

**Meta/Facebook:**
- Meta Business Help Center (business.facebook.com)
- Facebook Ads case studies
- Meta for Business blog

**Google:**
- Google Ads Help Center (support.google.com/google-ads)
- Think with Google (thinkwithgoogle.com)
- Google Ads case studies

**Industry Reports:**
- HubSpot State of Marketing Report (annual, free)
- Hootsuite Social Media Trends Report
- Moz State of Local SEO Report
- Mailchimp Email Marketing Benchmarks

**Marketing Blogs:**
- Neil Patel (neilpatel.com)
- HubSpot Blog (blog.hubspot.com)
- Moz Blog (moz.com/blog)
- Search Engine Journal (searchenginejournal.com)
- Social Media Examiner (socialmediaexaminer.com)
- Backlinko (backlinko.com)

### How to Use These Sources

1. Read articles and reports
2. Note down specific statistics, benchmarks, and best practices
3. Log the source URL in your Source Log
4. Use the knowledge to create more accurate training conversations

---

## 8.6 Marketing Case Studies

Case studies are GOLD for training data because they contain real-world examples with real results.

### Where to Find Case Studies

- **Meta Ads:** facebook.com/business/success (Meta Business Success Stories)
- **Google Ads:** ads.google.com/home/resources/success-stories
- **HubSpot:** hubspot.com/case-studies
- **SEO:** Search for "[industry] SEO case study" on Google
- **General:** Search for "[topic] marketing case study results" on Google

### How to Convert a Case Study into Training Data

**Example Case Study:**
"A bakery in Hyderabad used Facebook Ads with a ₹500/day budget targeting women aged 25-45 within 10km of their store. They used carousel ads showing their best-selling cakes. After 30 days, they saw a 3x increase in store visits and 150 new customers."

**Converted Training Conversation:**
```
User: How can a small bakery use Facebook Ads to get more customers?
Assistant: Here is a proven Facebook Ads strategy for a small bakery, based on real results from bakeries in India:

**Budget:** Start with ₹500 per day (approximately ₹15,000 per month). This is enough to reach 1,000-3,000 people daily in your local area.

**Targeting Setup:**
- Location: Set a 10km radius around your bakery
- Age: 25-45 years (primary cake/pastry buyers)
- Gender: Can start with women (often higher engagement for bakery ads), then expand
- Interests: Baking, Cakes, Desserts, Food & Dining

**Ad Format:** Use Carousel Ads — show 4-6 of your best-selling items in a single ad. Each card should have:
- A high-quality photo of the product
- The product name
- The price

**Expected Results:** With consistent ₹500/day spend and good creative, bakeries typically see:
- 3x increase in store visits within 30 days
- 100-200 new customers in the first month
- Cost per new customer: ₹75-₹150

**Pro Tips:**
- Photograph your products in natural daylight
- Include a "Visit Store" or "Send Message" call-to-action button
- Run a "First Order 10% Off" promotion to encourage first visits
- Post customer reviews as social proof in your ad copy
```

---

#  9 — Source Validation Rules

Every source you use must pass these validation checks:

## Quality Check
- Is the information factually accurate?
- Is the source reputable (established company, recognized publication, or verified researcher)?
- Is the data well-organized and clearly documented?
- Are the methodologies described (how was the data collected)?

## Licensing Check
- Is the dataset or content free to use?
- What license does it use?
- Can we use it for commercial fine-tuning?
- Do we need to provide attribution?
- **When in doubt, log it and ask the Coordinator**

## Duplicate Check
- Have we already found this dataset?
- Does it overlap significantly with another source?
- Is another team member already working with this source?

## Relevance Check
- Is this about marketing, business growth, or customer acquisition?
- Is the content at the right level for our target audience (small/medium business owners)?
- Is it applicable to the Indian market or general enough to be universally useful?
- Is it from the last 5 years? (Marketing changes fast — old data may be misleading)

## Red Flags — Do NOT Use These Sources
- Datasets with unclear or restrictive licenses
- Data scraped from private sources without permission
- Content from behind paywalls (unless we have legitimate access)
- Data with personally identifiable information (PII) — phone numbers, email addresses, real customer names
- Sources with obvious factual errors
- Extremely biased promotional content disguised as educational material

---

#  10 — Source Log Template

Every team member must maintain a Source Log. Use this format:

## Source Log Table

| Date | Source Name | URL | Type | License | Category | Status | Notes |
|------|-----------|-----|------|---------|----------|--------|-------|
| 2026-06-08 | Kaggle Facebook Ads Dataset | kaggle.com/datasets/... | Dataset | CC0 | Meta Ads | Downloaded | 10K records, has CTR data |
| 2026-06-08 | Neil Patel Blog - Instagram Reels Guide | neilpatel.com/blog/... | Article | N/A (reference) | Instagram | Read | Good tips on Reels algorithm |
| 2026-06-09 | Meta Business Success Stories - Bakery | facebook.com/business/success/... | Case Study | N/A (reference) | Meta Ads | Converted | Created 3 conversations from this |

## Column Descriptions

- **Date:** When you found/used this source
- **Source Name:** A short descriptive name
- **URL:** The full web address
- **Type:** Dataset / Article / Blog Post / Case Study / Report / Video
- **License:** CC0, CC-BY, MIT, Apache 2.0, N/A (for reference-only sources)
- **Category:** Meta Ads, Google Ads, Instagram, YouTube, Local SEO, Branding, WhatsApp
- **Status:** Found / Downloaded / Read / Converted / Rejected
- **Notes:** Any relevant details

---

#  11 — Marketing Dataset Categories

## 11.1 Meta Ads & Facebook Marketing

**Subtopics to cover:**
- Facebook Ads campaign structure (Campaign, Ad Set, Ad)
- Audience targeting options (demographics, interests, behaviors, custom audiences, lookalike audiences)
- Ad formats (image, video, carousel, collection, lead ads, Messenger ads)
- Campaign objectives (awareness, traffic, engagement, leads, sales)
- Budget optimization (daily budget vs lifetime budget, CBO)
- A/B testing strategies
- Meta Pixel setup and conversion tracking
- Retargeting strategies
- Ad creative best practices
- Ad copywriting for Facebook
- Facebook Marketplace for businesses
- Facebook Groups for business growth
- Performance metrics (CTR, CPC, CPM, ROAS, CPA)
- Common mistakes in Facebook advertising
- Industry-specific strategies (restaurants, retail, services, education)

## 11.2 Google Ads & PPC

**Subtopics to cover:**
- Google Ads account structure
- Search campaigns setup and optimization
- Display campaigns strategy
- Shopping campaigns for e-commerce
- YouTube Ads through Google Ads
- Performance Max campaigns
- Keyword research and match types (broad, phrase, exact)
- Negative keywords
- Bidding strategies (manual CPC, maximize clicks, target CPA, target ROAS)
- Quality Score optimization
- Ad extensions (sitelinks, callouts, structured snippets, call extensions)
- Landing page best practices
- Conversion tracking setup
- Google Analytics integration
- Remarketing campaigns
- Budget allocation strategies
- Google Ads for local businesses
- Common Google Ads mistakes

## 11.3 Instagram Marketing

**Subtopics to cover:**
- Instagram business profile optimization
- Content strategy (feed posts, Reels, Stories, Live, Guides)
- Instagram Reels algorithm and best practices
- Hashtag strategy (size, relevance, mix)
- Instagram SEO (keywords in bio, captions, alt text)
- Engagement strategies (polls, questions, quizzes in Stories)
- Instagram Shopping setup
- Collaborations and partnerships
- Content calendar creation
- Analytics and insights interpretation
- Instagram for different industries
- Follower growth strategies (organic)
- Instagram content repurposing
- User-generated content (UGC) strategies

## 11.4 YouTube Marketing

**Subtopics to cover:**
- YouTube channel setup and optimization
- Video SEO (titles, descriptions, tags, thumbnails)
- YouTube Shorts strategy
- Content planning and scripting
- Audience retention optimization
- YouTube Analytics interpretation
- Monetization strategies
- YouTube for business promotion
- Live streaming strategy
- Community tab engagement
- Playlist optimization
- Collaboration strategies
- YouTube Ads overview (for organic creators)
- Equipment and production basics
- Consistency and upload schedule

## 11.5 Local SEO & Google Business Profile

**Subtopics to cover:**
- Google Business Profile setup and verification
- GBP optimization (categories, attributes, photos, posts)
- NAP consistency (Name, Address, Phone) across the web
- Local citations and directories
- Review management (getting reviews, responding to reviews)
- Local keyword research
- Google Maps optimization
- Local pack ranking factors
- Local link building strategies
- Schema markup for local businesses
- Voice search optimization for local
- Multi-location SEO
- Competitor analysis for local search
- Local content strategy (city pages, neighborhood guides)

## 11.6 Branding

**Subtopics to cover:**
- Brand identity creation (name, logo, colors, fonts, voice)
- Brand positioning and differentiation
- Brand storytelling
- Brand consistency across platforms
- Personal branding for business owners
- Brand guidelines creation
- Rebranding strategies
- Brand awareness measurement
- Brand loyalty programs
- Visual branding for social media
- Brand voice and tone guide
- Competitive brand analysis

## 11.7 WhatsApp Marketing

**Subtopics to cover:**
- WhatsApp Business app setup
- WhatsApp Business API overview
- WhatsApp catalog creation
- Broadcast list strategies
- WhatsApp status for marketing
- Customer engagement through WhatsApp
- WhatsApp automation (quick replies, away messages, greeting messages)
- WhatsApp for customer support
- WhatsApp community building
- WhatsApp marketing campaigns (festival, seasonal, promotional)
- Compliance and best practices (avoiding spam)
- WhatsApp for different industries

## 11.8 Lead Generation

**Subtopics to cover:**
- Lead generation funnels
- Landing page optimization
- Lead magnets (ebooks, checklists, free trials)
- Lead qualification (MQL vs SQL)
- Lead scoring
- CRM integration
- Email marketing for lead nurturing
- Social media lead generation
- Content marketing for leads
- Webinar-based lead generation
- Referral programs

## 11.9 Marketing Funnels

**Subtopics to cover:**
- TOFU, MOFU, BOFU framework
- Sales funnel design
- Content for each funnel stage
- Funnel optimization and conversion rate optimization
- Retargeting through the funnel
- Funnel analytics and metrics

## 11.10 Customer Acquisition

**Subtopics to cover:**
- Customer acquisition cost (CAC) calculation
- Customer lifetime value (CLV)
- Acquisition channels comparison
- Organic vs paid acquisition
- Referral marketing
- Partnership-based acquisition
- Community-based acquisition

---

#  12 — Marketing Topic Bank

Below are 300+ topic ideas organized by category. Each topic can become 1-3 training conversations.

## Meta Ads & Facebook Marketing (50 Topics)

1. How to create your first Facebook Ad campaign
2. Facebook Ads budget: How much should a small business spend?
3. How to target the right audience on Facebook Ads
4. Facebook Ads vs Instagram Ads: Which is better for my business?
5. How to write compelling Facebook ad copy
6. Best ad formats for Facebook advertising
7. How to set up Meta Pixel on your website
8. What is a lookalike audience and how to create one
9. How to retarget website visitors with Facebook Ads
10. Facebook Ads for restaurants: A complete guide
11. How to reduce cost per click on Facebook Ads
12. Facebook Lead Ads: How to collect leads directly on Facebook
13. How to A/B test Facebook Ads effectively
14. Understanding Facebook Ads metrics: CTR, CPC, CPM, ROAS
15. How to create a carousel ad on Facebook
16. Facebook video ads: Best practices for 2024
17. How to use Facebook Ads Manager for beginners
18. Common Facebook Ads mistakes that waste money
19. How to create custom audiences on Facebook
20. Facebook Ads for e-commerce: Product catalog campaigns
21. How to scale Facebook Ads without losing ROAS
22. Facebook Ads for local businesses: Location targeting
23. How to create effective Facebook ad images
24. What is CBO (Campaign Budget Optimization) and when to use it
25. How to run Facebook Ads for a service business
26. Facebook Ads for real estate agents
27. Facebook Ads for education and coaching businesses
28. How to use Facebook Groups for business growth
29. Facebook Marketplace selling tips for businesses
30. How to handle negative comments on Facebook Ads
31. Facebook Ads for app installs
32. How to create urgency in Facebook ad copy
33. Facebook Ads reporting: What metrics to track weekly
34. How to use Facebook Ads for brand awareness
35. Seasonal Facebook Ads strategies (Diwali, Christmas, Summer)
36. Facebook Ads for B2B businesses
37. How to write Facebook ad headlines that convert
38. Understanding the Facebook Ads auction system
39. Facebook Ads for healthcare and wellness businesses
40. How to create a Facebook Ads funnel
41. Retargeting strategies for abandoned carts using Facebook Ads
42. Facebook Ads creative refresh: When and how to update ads
43. How to use dynamic product ads on Facebook
44. Facebook Ads frequency: How often should people see your ad?
45. How to use social proof in Facebook Ads
46. Facebook Ads for event promotion
47. How to target competitors' audiences on Facebook
48. Facebook Ads placements: Automatic vs manual
49. How to run Facebook Ads for a new product launch
50. Facebook Ads compliance: What you can and cannot advertise

## Google Ads & PPC (50 Topics)

1. How to create your first Google Ads campaign
2. Google Ads for beginners: Complete setup guide
3. How to do keyword research for Google Ads
4. Understanding keyword match types in Google Ads
5. How to write effective Google Ads copy
6. What is Quality Score and why it matters
7. Google Ads bidding strategies explained
8. How to set a budget for Google Ads
9. Google Ads vs Facebook Ads: Which to choose?
10. How to use negative keywords in Google Ads
11. Google Ads extensions: All types explained
12. How to create a Google Shopping campaign
13. Google Display Ads: When and how to use them
14. What is Performance Max and how does it work?
15. How to track conversions in Google Ads
16. Google Ads for local service businesses
17. How to reduce cost per click in Google Ads
18. Google Ads remarketing: Re-engaging past visitors
19. How to optimize landing pages for Google Ads
20. Google Ads for e-commerce businesses
21. Understanding Google Ads auction and Ad Rank
22. How to use Google Ads Editor for bulk changes
23. Google Ads for restaurants and food delivery
24. How to write compelling call-to-action in Google Ads
25. Google Ads for healthcare professionals
26. Long-tail keywords strategy for Google Ads
27. How to use Google Analytics with Google Ads
28. Google Ads for mobile app promotion
29. How to set up conversion tracking with Google Tag Manager
30. Google Ads for real estate businesses
31. How to create responsive search ads
32. Google Ads smart campaigns: Pros and cons
33. YouTube Ads through Google Ads platform
34. How to target competitors' keywords in Google Ads
35. Google Ads for seasonal businesses
36. B2B Google Ads strategy
37. How to improve Google Ads Quality Score step by step
38. Google Ads for education and coaching
39. How to use audience targeting in Google Ads
40. Google Ads for dental clinics and medical practices
41. How to handle high CPC in competitive industries
42. Google Ads location targeting for local businesses
43. How to use Google Ads scripts for automation
44. Common Google Ads mistakes and how to fix them
45. Google Ads for SaaS companies
46. How to calculate ROAS for Google Ads campaigns
47. Google Ads campaign structure best practices
48. How to use Google Ads experiments for A/B testing
49. Google Ads for automotive dealerships
50. Google Ads for fitness and gym businesses

## Instagram Marketing (40 Topics)

1. How to optimize your Instagram business profile
2. Instagram Reels algorithm: How it works in 2024
3. How to create viral Instagram Reels
4. Instagram hashtag strategy: How many and which ones
5. Instagram content calendar: How to plan 30 days of content
6. How to grow Instagram followers organically
7. Instagram Stories: Engagement strategies that work
8. Instagram SEO: How to get discovered through search
9. How to use Instagram for a restaurant business
10. Instagram collaboration and partnership strategies
11. How to create an Instagram shop
12. Instagram analytics: What metrics to track and why
13. How to repurpose content across Instagram formats
14. Instagram Live: How to use it for business
15. Instagram for fashion and clothing businesses
16. User-generated content strategy for Instagram
17. How to write engaging Instagram captions
18. Instagram bio optimization for conversions
19. Instagram Guides: How to use them for business
20. How to handle Instagram algorithm changes
21. Instagram for beauty and salon businesses
22. Instagram content themes and pillars
23. How to use Instagram Insights for growth
24. Instagram for fitness coaches and trainers
25. Instagram for real estate agents
26. How to create Instagram carousel posts that educate
27. Instagram engagement: How to build a community
28. Instagram for jewellery and handicraft businesses
29. How to use Instagram polls and quizzes for engagement
30. Instagram marketing for B2B companies
31. Instagram Reels vs TikTok: Where should businesses focus?
32. How to plan and execute Instagram giveaways
33. Instagram for travel and tourism businesses
34. How to create aesthetic Instagram feeds
35. Instagram marketing for startups on a budget
36. How to use Instagram highlights for your business
37. Instagram for educational institutions
38. How to recover from Instagram engagement drops
39. Instagram for food bloggers and restaurants
40. Instagram marketing metrics: Benchmarks by industry

## YouTube Marketing (35 Topics)

1. How to start a YouTube channel for your business
2. YouTube SEO: How to rank videos on YouTube search
3. How to create effective YouTube thumbnails
4. YouTube Shorts strategy for business growth
5. YouTube content ideas for small businesses
6. How to write YouTube video titles that get clicks
7. YouTube analytics: Understanding your channel performance
8. How to increase YouTube watch time and retention
9. YouTube for local businesses: How to attract local viewers
10. YouTube live streaming for business engagement
11. How to monetize your YouTube channel
12. YouTube video description optimization
13. How to create a YouTube content calendar
14. YouTube for product demonstrations and reviews
15. YouTube collaboration strategies
16. YouTube for educational content and courses
17. How to use YouTube Community tab for engagement
18. YouTube playlist optimization strategy
19. YouTube for real estate marketing
20. How to repurpose YouTube content for other platforms
21. YouTube advertising options for businesses
22. How to grow YouTube subscribers organically
23. YouTube for restaurant and food businesses
24. YouTube equipment guide for beginners on a budget
25. YouTube video editing basics for business content
26. YouTube for tech product companies
27. How to use end screens and cards on YouTube
28. YouTube for fitness and health businesses
29. YouTube shorts vs long-form content strategy
30. How to handle negative comments on YouTube
31. YouTube for coaching and consulting businesses
32. YouTube for behind-the-scenes business content
33. YouTube for customer testimonials and case studies
34. YouTube for event coverage and highlights
35. YouTube SEO tools and keyword research

## Local SEO & Google Business Profile (35 Topics)

1. How to set up and verify Google Business Profile
2. Google Business Profile optimization checklist
3. How to get more Google reviews for your business
4. How to respond to negative Google reviews
5. Local SEO ranking factors explained
6. What is NAP consistency and why it matters
7. How to add photos to Google Business Profile
8. Google Business Profile posts: How to use them
9. Local keyword research for small businesses
10. How to rank in the Google Map Pack
11. Local citations: What they are and where to build them
12. Google Business Profile categories: How to choose correctly
13. Local SEO for restaurants
14. Voice search optimization for local businesses
15. How to track local SEO performance
16. Local SEO for multi-location businesses
17. Google Business Profile Q&A: Best practices
18. Local SEO for dental clinics
19. Schema markup for local businesses explained simply
20. How to handle fake Google reviews
21. Local SEO vs organic SEO: Key differences
22. Local link building strategies
23. Local SEO for salons and beauty parlors
24. How to optimize for "near me" searches
25. Google Business Profile attributes: Complete guide
26. Local SEO for gyms and fitness studios
27. Local SEO competitor analysis
28. Google Business Profile messaging setup
29. Local SEO for real estate agents
30. How to create local content for SEO
31. Local SEO for hotels and hospitality
32. Google Business Profile insights: Understanding your data
33. Local SEO for medical and healthcare practices
34. Local SEO for educational institutes and coaching centers
35. Local SEO audit: Step-by-step guide

## Branding (25 Topics)

1. How to create a brand identity from scratch
2. Choosing the right brand name for your business
3. Brand positioning: How to stand out from competitors
4. Creating a brand voice and tone guide
5. Visual branding: Colors, fonts, and logo essentials
6. Brand storytelling: How to connect with your audience
7. Personal branding for business owners
8. Brand consistency across social media platforms
9. How to create brand guidelines
10. Rebranding: When and how to do it
11. Building brand loyalty through customer experience
12. Brand awareness campaigns for small businesses
13. How to differentiate your brand in a crowded market
14. Brand identity for service-based businesses
15. Building trust through branding
16. Branding for startups on a budget
17. Cultural branding for Indian businesses
18. Emotional branding strategies
19. Brand audit: Evaluating your current brand
20. Brand collaborations and co-branding strategies
21. Brand monitoring and reputation management
22. Creating a memorable brand tagline
23. Branding for e-commerce businesses
24. Local branding strategies for city-specific businesses
25. Brand identity vs brand image: Understanding the difference

## WhatsApp Marketing (30 Topics)

1. How to set up WhatsApp Business app
2. WhatsApp Business vs regular WhatsApp: Key differences
3. How to create a WhatsApp Business catalog
4. WhatsApp broadcast lists: How to use them for marketing
5. WhatsApp marketing for restaurants
6. WhatsApp automation: Quick replies and greeting messages
7. WhatsApp status marketing strategies
8. WhatsApp for customer support and engagement
9. WhatsApp Business API: What it is and who needs it
10. WhatsApp marketing for retail stores
11. How to collect WhatsApp numbers ethically
12. WhatsApp marketing compliance and anti-spam rules
13. WhatsApp for appointment-based businesses
14. WhatsApp marketing for real estate
15. Creating effective WhatsApp promotional messages
16. WhatsApp community feature for business
17. WhatsApp for healthcare and clinic businesses
18. WhatsApp integration with Facebook Ads (Click-to-WhatsApp)
19. WhatsApp marketing metrics: What to track
20. WhatsApp for education and coaching businesses
21. Festival marketing through WhatsApp
22. WhatsApp for B2B sales communication
23. WhatsApp label management for business contacts
24. WhatsApp for gym and fitness businesses
25. WhatsApp marketing funnel strategy
26. WhatsApp for travel and tourism businesses
27. How to avoid getting blocked on WhatsApp Business
28. WhatsApp chatbot basics for small businesses
29. WhatsApp for event marketing and RSVPs
30. Integrating WhatsApp with your CRM

## Lead Generation & Customer Acquisition (35 Topics)

1. What is lead generation and why it matters
2. Creating an effective lead generation funnel
3. Lead magnets: 10 ideas for different industries
4. Landing page optimization for lead generation
5. Lead qualification: MQL vs SQL explained
6. How to calculate customer acquisition cost (CAC)
7. Customer lifetime value (CLV): How to calculate and improve it
8. Referral marketing: Getting customers to bring more customers
9. Email marketing for lead nurturing
10. Content marketing for lead generation
11. Lead scoring: How to prioritize your leads
12. Cold outreach strategies that work
13. Webinar-based lead generation
14. Online forms optimization for more conversions
15. Social proof strategies for customer acquisition
16. Partnership-based customer acquisition
17. Community-based marketing for customer growth
18. Free trial strategy for SaaS and service businesses
19. Upselling and cross-selling strategies
20. Customer retention strategies
21. Marketing funnel stages: TOFU, MOFU, BOFU
22. CRM setup for small businesses
23. How to follow up with leads effectively
24. Content upgrades for lead generation
25. Lead generation through LinkedIn
26. Lead generation for real estate businesses
27. Lead generation for education businesses
28. Lead generation for healthcare
29. Customer journey mapping
30. Conversion rate optimization basics
31. Lead generation through Google Ads
32. Lead generation through Facebook Lead Ads
33. Lead generation through Instagram DMs
34. Offline to online lead capture strategies
35. Lead generation analytics and reporting

**Total Topics: 300+**

---

#  15 — Conversation Creation Process

## Step-by-Step Process

### Step 1: Choose Your Topic
Select a topic from the Topic Bank (Section 13) or from your research. Make sure no other team member is working on the same topic — check the shared tracker.

### Step 2: Research the Topic
Spend 10-15 minutes researching the topic. Look for:
- Current best practices
- Real statistics and benchmarks
- Common mistakes people make
- Step-by-step processes
- Tools and resources related to the topic

### Step 3: Write the User Question
Write a natural question that a real business owner would ask. Make it specific enough to be useful but broad enough to allow a comprehensive answer.

**Good:** "How can I reduce the cost per lead on my Facebook Ads for my tutoring center?"
**Too vague:** "How to do marketing?"
**Too narrow:** "What color should the CTA button be on my ad?"

### Step 4: Write the Assistant Response
Write a detailed, practical, actionable answer. Follow these guidelines:
- Start with a brief context or framework
- Use numbered lists or bullet points for clarity
- Include specific numbers, benchmarks, or examples where possible
- End with a next-step recommendation
- Aim for 200-500 words per response (depending on complexity)

### Step 5: Self-Review
Before submitting, check:
- [ ] Is the information factually accurate?
- [ ] Is the answer detailed enough to be genuinely helpful?
- [ ] Are there any spelling or grammar errors?
- [ ] Is the formatting consistent (bold headers, numbered lists)?
- [ ] Does the response sound professional but approachable?
- [ ] Would a real business owner find this useful?

### Step 6: Submit
Add the conversation to the shared spreadsheet with all required fields filled.

---


## Sections 15 


**Team Members:**
- Member 1: Meta Ads & Facebook Marketing
- Member 2: Google Ads & PPC
- Member 3: Instagram Marketing & YouTube Marketing
- Member 4: Local SEO & Google Business Profile
- Member 5: Branding & WhatsApp Marketing

---

#  15 — Good Dataset Examples

This section contains complete example training conversations that demonstrate the quality, depth, and formatting expected from every team member. Study each example carefully. Your own conversations should match this standard in length, detail, and practical usefulness. Every Assistant response must be between 200 and 400 words, must include specific numbers, step-by-step instructions, and real-world tactics that a business owner could immediately apply.

---

### Example 1 — Meta Ads (Member 1 Category)

**User:** I run a small bakery in Hyderabad and I want to use Facebook Ads to get more customers. I have a budget of 500 rupees per day. How should I set up my first campaign?

**Assistant:** Starting Facebook Ads for your Hyderabad bakery with a daily budget of 500 rupees is a smart move, and here is exactly how you should set up your first campaign step by step.

First, go to Meta Ads Manager at business.facebook.com. Click the green Create button. Choose the campaign objective called Traffic if you want people to visit your website, or choose Awareness if you want people in your area to simply learn about your bakery. For a small local bakery, I recommend starting with the Traffic objective because it sends people directly to your page or website where they can see your menu.

Second, set your daily budget to 500 rupees. Meta will spend this amount evenly throughout the day. Over a week, that comes to 3,500 rupees, and in a month you will spend roughly 15,000 rupees. This is a very reasonable starting budget for a local business.

Third, set your targeting. Under location, type Hyderabad and set the radius to 10 kilometers around your bakery. This ensures only people near your shop see the ad. For age, set it to 18 to 55 years old. Under interests, add interests like Baking, Cakes, Desserts, Coffee, Birthday Celebrations, and Food Delivery. This narrows your audience to people who are most likely to care about a bakery.

Fourth, create your ad. Use a high-quality photo of your best-selling product, such as a chocolate truffle cake or a fresh croissant. Write a headline like "Freshly Baked Every Morning — Order from Hyderabad's Favorite Bakery." In the description, include your address, a phone number, and a call to action like "Order Now on WhatsApp." Use a single image ad format for your first campaign because it is simple and performs well.

Fifth, choose your placement. Select Automatic Placements to let Meta show your ad on Facebook, Instagram, and Messenger wherever it performs best.

Finally, publish the ad and let it run for at least 5 to 7 days before making any changes. Meta's algorithm needs time to learn who responds best to your ad. After 7 days, check your results in Ads Manager. Look at the cost per link click. If it is below 5 rupees, your campaign is performing well. If it is above 10 rupees, you may need to change your image or targeting. Start with this single campaign and once you see results, you can scale up your budget to 1,000 rupees per day.

---

### Example 2 — Google Ads (Member 2 Category)

**User:** I own a dental clinic in Bangalore and I want to run Google Ads to get more patients. What type of campaign should I choose, and what keywords should I bid on?

**Assistant:** For a dental clinic in Bangalore, Google Ads is one of the most effective ways to attract new patients because people actively search for dental services when they need them. Here is exactly what you should do.

Start with a Search Campaign. This is the best campaign type for a dental clinic because your ads will appear when someone types a query like "dentist near me" or "dental clinic in Bangalore" into Google. These people are already looking for a dentist, so the intent is very high.

For your keywords, create three ad groups. The first ad group should target general dental keywords: "dentist in Bangalore," "dental clinic near me," "best dentist Bangalore," and "dental hospital Koramangala" if your clinic is in that area. The second ad group should target specific treatment keywords: "teeth cleaning Bangalore," "root canal treatment cost Bangalore," "dental implants Bangalore," and "braces cost in Bangalore." The third ad group should target emergency keywords: "emergency dentist Bangalore," "tooth pain treatment near me," and "24 hour dentist Bangalore."

Set your daily budget between 800 and 1,500 rupees. In the dental industry in Bangalore, the average cost per click is roughly 20 to 60 rupees depending on the keyword. With a budget of 1,000 rupees per day, you can expect 15 to 40 clicks daily.

Use location targeting to show your ads only within a 5 to 8 kilometer radius of your clinic. Set your ad schedule to run from 8 AM to 9 PM since most people search for dentists during these hours.

Write your ad copy with a strong headline like "Trusted Dental Clinic in Bangalore — Book Your Appointment Today." Include your clinic name, a special offer like "Free Dental Checkup for New Patients," and a call extension so people can call you directly from the ad. Add sitelink extensions for your services page, pricing page, and location page.

For your landing page, do not send people to your homepage. Create a dedicated page that says "Book Your Dental Appointment" with a form that asks for name, phone number, and preferred time. This will convert far better than a generic homepage.

Track your results by setting up conversion tracking. A conversion is when someone fills out the appointment form or calls your clinic. After two weeks, check which keywords are bringing in the most conversions and pause the ones that are only getting clicks but no appointments.

---

### Example 3 — Instagram Marketing (Member 3 Category)

**User:** I run a clothing boutique and I want to grow my Instagram followers from 500 to 5,000 in the next three months. What content strategy should I follow?

**Assistant:** Growing your Instagram from 500 to 5,000 followers in three months is absolutely achievable for a clothing boutique if you follow a consistent content strategy. Here is a detailed plan you can start using this week.

Post at least once every day. Consistency is the single most important factor for Instagram growth. On Monday, Wednesday, and Friday, post product photos showing your best outfits styled on a model or mannequin. Use natural lighting and a clean background. On Tuesday and Thursday, post Reels. Reels get 2 to 3 times more reach than static posts on Instagram in 2024. Create 15 to 30 second videos showing outfit transitions, styling tips like "3 ways to wear a dupatta," or behind-the-scenes clips of new stock arriving. On Saturday, post a carousel with 5 to 8 slides, such as "Top 5 Trending Kurta Designs This Season." On Sunday, post a customer testimonial or a repost from a customer who tagged your boutique.

Use 25 to 30 hashtags on every post. Mix them into three groups. Five popular hashtags with over one million posts, like BoutiqueFashion, IndianFashion, and EthnicWear. Ten medium hashtags with 100,000 to 500,000 posts, like KurtaStyle, FashionBoutique, and DesignerKurtas. Ten to fifteen niche hashtags with under 100,000 posts, like HyderabadBoutique, IndianBoutiqueShopping, and HandloomKurtas.

Engage with 30 accounts every day. Spend 15 minutes in the morning liking and commenting on posts from similar boutiques, fashion influencers in your city, and potential customers who follow your competitors. Write meaningful comments, not just emojis. This drives profile visits and follows.

Use Instagram Stories every single day. Post 3 to 5 stories daily showing new arrivals, polls asking "Which color do you prefer?", question stickers, and countdown stickers for upcoming sales. Stories keep your account at the top of people's feeds.

Collaborate with two to three micro-influencers each month. Find local fashion influencers with 2,000 to 10,000 followers. Offer them a free outfit in exchange for one Reel and three Stories. This alone can bring you 200 to 500 new followers per collaboration.

If you follow this plan consistently for 90 days, you should gain roughly 50 new followers per day, reaching your goal of 5,000 followers.

---

### Example 4 — YouTube Marketing (Member 3 Category)

**User:** I want to start a YouTube channel for my real estate business to generate leads. What kind of videos should I make and how often should I upload?

**Assistant:** YouTube is an excellent lead generation tool for real estate because property buyers spend a lot of time researching online before making a decision. Here is a complete plan for your real estate YouTube channel.

Upload two videos per week. Consistency matters more than volume on YouTube, and two videos per week is sustainable while giving you enough content to grow. Upload on Tuesday and Friday mornings at 10 AM, as this is when most property buyers are browsing.

Create five types of videos and rotate between them. The first type is Property Tour Videos. Walk through a property with your phone or camera, showing every room, the balcony, parking area, and the surrounding neighborhood. Title these videos specifically, like "3 BHK Flat Tour in Gachibowli Hyderabad — 85 Lakhs — Full Walkthrough." These videos rank very well in search because buyers type exact queries like this. The second type is Area Review Videos. Pick a neighborhood and talk about its pros and cons, property price trends, upcoming developments, schools nearby, and commute times. Title example: "Is Narsingi a Good Area to Buy a Flat in 2024? Full Area Review." The third type is Buyer Guide Videos. Educate your audience on topics like "Home Loan Process Explained Step by Step," "5 Legal Documents to Check Before Buying a Flat," or "RERA Explained in 10 Minutes." These build trust and position you as an expert. The fourth type is Market Update Videos. Share monthly price trends, new project launches, and government policy changes affecting real estate. The fifth type is Comparison Videos. Compare two or three projects side by side, like "Prestige vs My Home vs Aparna — Which Builder is Best in Hyderabad?"

For each video, write a keyword-rich title and description. Use tags like "flats in Hyderabad," "real estate Hyderabad 2024," and the specific area name. Pin a comment on every video saying "Interested in this property? WhatsApp me at [your number]." Add your phone number and website link in the video description.

Keep your videos between 8 and 15 minutes long. Aim for a thumbnail that shows the property clearly with large text showing the price and BHK size. After 30 videos, you should start seeing 5 to 15 leads per month directly from YouTube.

---

### Example 5 — Local SEO and Google Business Profile (Member 4 Category)

**User:** I own a salon in Pune and my Google Business Profile gets very few views. How can I optimize it to appear in the top 3 results when someone searches for salons near them?

**Assistant:** Getting your salon into the Google Maps top 3 results, which is called the Local Pack, requires optimizing your Google Business Profile systematically. Here is exactly what you need to do.

First, complete every single field in your profile. Go to business.google.com and make sure your business name is your exact real name without keyword stuffing. Your address must match your signage and your website exactly, character for character. Choose your primary category as "Beauty Salon" and add secondary categories like "Hair Salon," "Nail Salon," and "Spa" if those services apply. Fill in your business description with a 750-character paragraph that mentions your location, your key services, and what makes your salon unique. For example: "Glamour Studio is a premium beauty salon in Koregaon Park, Pune, offering haircuts, hair coloring, bridal makeup, facials, manicures, and pedicures. With 8 years of experience and trained stylists, we provide salon services for men and women."

Second, add at least 20 high-quality photos. Upload photos of your salon interior, your styling chairs, your staff at work, before-and-after hair transformations, and your storefront. Google profiles with more than 20 photos get 35 percent more clicks than those with fewer photos. Add 2 to 3 new photos every week to keep your profile fresh.

Third, focus heavily on reviews. Ask every satisfied customer to leave a Google review. The best time to ask is right after the service when they are happy. Send them a direct link to your review page via WhatsApp. Aim for at least 50 reviews with an average rating of 4.5 or higher. Respond to every single review, both positive and negative, within 24 hours.

Fourth, post Google Business updates every week. Use the Posts feature to share offers like "20 Percent Off Hair Coloring This Week," new service announcements, or seasonal promotions. These posts show up on your profile and signal to Google that your business is active.

Fifth, make sure your Name, Address, and Phone number (called NAP) are exactly the same on your website, your Facebook page, Justdial, Sulekha, and every other directory where your salon is listed. Inconsistent NAP information confuses Google and pushes your ranking down.

Sixth, add all your services with prices to the Services section of your profile. List every service individually: Women's Haircut 300 rupees, Hair Smoothening 3,500 rupees, Bridal Makeup Package 15,000 rupees. This helps Google match your profile to specific searches like "bridal makeup salon Pune."

If you do all of these steps consistently for 60 to 90 days, you should see a significant jump in your profile views and start appearing in the top 3 results for salon-related searches in your area.

---

### Example 6 — WhatsApp Marketing (Member 5 Category)

**User:** I run a grocery delivery service and I want to use WhatsApp to send daily offers to my customers. How should I set this up without getting my number blocked?

**Assistant:** WhatsApp is a powerful tool for grocery delivery services because your customers check WhatsApp multiple times a day. However, you must set it up correctly to avoid getting your number blocked. Here is the complete process.

First, use WhatsApp Business, not regular WhatsApp. Download the WhatsApp Business app from the Play Store or App Store. Set up your business profile with your grocery store name, address, business hours, website, and a catalog showing your top products with prices. The catalog feature lets customers browse items directly inside WhatsApp.

Second, build your contact list the right way. Never add people and message them without permission. Instead, collect phone numbers by placing a sign at your store saying "Join our WhatsApp list for daily offers — give your number at the counter." When customers place orders, ask them if they want to receive daily deal updates on WhatsApp. Use a Google Form on your social media to let people opt in. Aim to collect 500 to 1,000 opted-in numbers in your first month.

Third, create Broadcast Lists instead of Groups. A broadcast list lets you send a message to up to 256 contacts at once, and each person receives it as a private message, not a group message. Create multiple broadcast lists organized by area or customer type. For example, one list for Apartment Complex A, another for Apartment Complex B.

Fourth, send only one message per day, and make it valuable. The best time to send grocery offers is between 8 AM and 9 AM when people are planning their day. Keep your message short and structured. Example: "Good morning! Today's fresh deals: Tomatoes 30 rupees per kg (market price 50), Onions 25 rupees per kg, Fresh Paneer 80 rupees per 200g. Free delivery on orders above 300 rupees. Order now by replying here or call 98765-43210." Include one photo showing the fresh produce.

Fifth, never send more than two messages per day. If you send too many messages, people will report you as spam and WhatsApp will ban your number. Stick to one morning offer message and one evening message only if you have a special flash sale.

Sixth, use Quick Replies to respond faster. In WhatsApp Business settings, create quick replies for common questions like delivery charges, delivery time, minimum order value, and payment methods. This saves you time when managing hundreds of customer chats.

Seventh, track your results weekly. Count how many orders came through WhatsApp each day. If you have 500 contacts and you are getting 20 to 30 orders per day from WhatsApp, that is a 4 to 6 percent conversion rate, which is excellent for messaging marketing.

---

### Example 7 — Branding (Member 5 Category)

**User:** I am starting a new organic food brand and I need to build a brand identity from scratch. Where do I start and what are the key elements I need?

**Assistant:** Building a brand identity for a new organic food brand is one of the most important steps you will take because your brand is what makes customers choose you over the dozens of other organic brands on the shelf. Here is a step-by-step process to create a strong brand identity from scratch.

Start with your Brand Purpose and Positioning. Write down in one sentence why your brand exists. For example: "We exist to make clean, chemical-free food accessible to every Indian family at fair prices." Then define your positioning statement: "For health-conscious families who want organic food but find it too expensive, our brand offers certified organic staples at prices only 20 percent above conventional products." This positioning tells customers exactly what you stand for and how you are different.

Next, choose your Brand Name. Your name should be easy to pronounce, easy to remember, and relevant to your category. For an organic food brand, names that evoke nature, purity, or earth work well. Check that the name is available as a dot-com domain, as an Instagram handle, and that no other food brand in India has trademarked it. You can check trademarks at ipindiaonline.gov.in.

Third, design your Visual Identity. This includes your logo, color palette, typography, and packaging style. For an organic food brand, use earthy colors like green, brown, warm beige, and off-white. Avoid bright neon colors. Your logo should be simple and work well on packaging, social media, and business cards. Hire a professional designer or use a platform like 99designs. Choose two fonts: one for headings that has personality, and one for body text that is clean and readable.

Fourth, define your Brand Voice. This is how your brand speaks in all written communication. For an organic food brand, your voice should be warm, honest, knowledgeable, and approachable. You should sound like a friendly nutrition expert, not a corporate company. Write sample sentences in your brand voice: "We know exactly which farm your dal comes from — and we think you should too."

Fifth, create your Brand Story. Write a 200-word origin story that you can use on your website, packaging, and social media. Talk about why you started this brand, what problem you saw in the market, and what you believe about food and health.

Sixth, build your Brand Guidelines document. This is a PDF that contains your logo usage rules, color codes in hex and CMYK, font names and sizes, photography style, and sample social media templates. Share this document with everyone who creates content for your brand so that everything looks and feels consistent everywhere customers encounter your brand.

---

#  16 — Bad Dataset Examples

This section shows you what poor-quality conversations look like and explains exactly why each one fails. Study these examples so you can recognize and avoid these mistakes in your own work.

---

### Bad Example 1 — Too Short

**User:** How do I run Facebook Ads?

**Assistant:** Go to Facebook Ads Manager and create a campaign. Pick your audience and budget, then launch the ad.

**Why This Is Bad:** The Assistant response is only 23 words. It gives no useful detail whatsoever. There are no steps, no budget guidance, no targeting advice, no ad format suggestions, and no metrics to track. A business owner reading this answer would still not know how to actually run a Facebook Ad. Our minimum standard is 200 words with specific, actionable steps. This response fails every quality check.

---

### Bad Example 2 — Too Vague

**User:** What is the best way to do Google Ads for a restaurant?

**Assistant:** Google Ads is a great way to promote your restaurant. You should create good ads and target the right audience. Make sure your budget is appropriate and track your results. Use keywords related to your restaurant. Write compelling ad copy that attracts customers. Also make sure your landing page is good. With the right approach, Google Ads can help you get more customers.

**Why This Is Bad:** This response is vague and generic. It says "target the right audience" without explaining what that audience should look like. It says "use keywords related to your restaurant" without giving a single keyword example. It says "make sure your budget is appropriate" without suggesting any number. Every sentence could apply to literally any business in any industry. There is no restaurant-specific advice. A good response would include specific keywords like "restaurant near me," "best biryani in Hyderabad," would suggest a budget range like 500 to 1,000 rupees per day, and would recommend specific campaign types like Local Search Ads or Performance Max for local businesses.

---

### Bad Example 3 — Factually Wrong

**User:** What is a good click-through rate for Instagram Reels ads?

**Assistant:** A good click-through rate for Instagram Reels ads is 15 to 20 percent. Most businesses can easily achieve this. Instagram Reels ads perform much better than any other ad format and have the highest CTR in digital marketing history.

**Why This Is Bad:** The numbers are completely wrong. The average click-through rate for Instagram Reels ads is between 0.5 and 1.5 percent. A CTR of 15 to 20 percent is unrealistic and does not exist in any ad platform. Claiming it is the "highest in digital marketing history" is a fabricated statement with no basis in reality. When our LLM gives wrong numbers to a business owner, they will make bad decisions based on false expectations. Always verify your statistics from reliable sources before including them. If you are not sure about a number, research it. Never invent statistics.

---

### Bad Example 4 — No Structure

**User:** How should I set up a Google Business Profile for my clinic?

**Assistant:** So basically you need to go to Google and create a profile and then you need to add your details like name and address and phone number and also add some photos and you should ask patients to leave reviews because reviews help a lot and also you should post updates regularly and make sure your hours are correct and also add your services and also make sure you reply to reviews and you should use keywords in your description and that is pretty much it.

**Why This Is Bad:** This response is one massive run-on sentence with no paragraphs, no numbered steps, no bullet points, and no clear structure. It is extremely hard to read and follow. A business owner looking for help would get lost halfway through. The information is technically not wrong, but the delivery is terrible. Good responses use numbered steps, separate paragraphs for each major point, specific examples, and clear formatting. Always structure your responses so they are easy to scan and follow.

---

### Bad Example 5 — Off-Topic

**User:** How can I improve my Google Ads Quality Score?

**Assistant:** Quality Score is important for Google Ads. But before we talk about that, let me explain how Google was founded. Google was started by Larry Page and Sergey Brin in 1998 at Stanford University. They created a search engine called Backrub which later became Google. The company went public in 2004 and has since become one of the largest companies in the world. Google Ads was originally called Google AdWords and was launched in the year 2000. Now, regarding Quality Score, it is a metric that Google uses to measure ad relevance. You should try to improve it by making your ads better.

**Why This Is Bad:** More than 70 percent of this response is a history lesson about Google that the user did not ask for. The user asked a specific tactical question about improving Quality Score, and the response wastes their time with irrelevant background information. When someone asks "how do I improve X," your answer should immediately start explaining how to improve X. The actual advice given at the end, "making your ads better," is uselessly vague. A good response would explain the three components of Quality Score (expected click-through rate, ad relevance, landing page experience) and give specific tips for improving each one.

---

### Bad Example 6 — Overly Generic and Applicable to Any Industry

**User:** How should a gym use WhatsApp marketing to get more members?

**Assistant:** WhatsApp marketing is a great way to reach customers. You should build a contact list, send regular messages, and provide value to your subscribers. Make sure your messages are interesting and not too frequent. You can share offers and updates. WhatsApp is one of the most popular messaging apps in the world with over 2 billion users. Using it for marketing can help your business grow significantly.

**Why This Is Bad:** This response could be about absolutely any business. There is nothing gym-specific in the entire answer. It does not mention membership offers, class schedules, transformation photos, personal training promotions, trial session invites, or any other gym-related WhatsApp tactics. It also includes a random statistic about WhatsApp's global user count, which does not help a gym owner in any way. Every conversation we create must be tailored to the specific business or industry mentioned in the question. Generic advice that could apply to any business is not acceptable.

---

#  17 — Dataset Spreadsheet Format

Every conversation you create must be logged in the team's shared Google Spreadsheet. This section explains the exact column structure, naming conventions, and data entry rules. Every team member must follow this format exactly.

## Column Structure

The spreadsheet has ten columns. Each column is described in detail below.

### Column A — ID

This is a unique identification number for every conversation. Use a simple sequential numbering system. The first conversation created by the team is number 1, the second is number 2, and so on. Never reuse an ID number. If a conversation is deleted, do not reassign its ID to a new conversation. The coordinator will maintain a running count.

### Column B — Category

This is the main marketing category the conversation belongs to. Use exactly one of the following category names. Do not create variations or abbreviations.

- Meta Ads
- Google Ads
- Instagram Marketing
- YouTube Marketing
- Local SEO
- Google Business Profile
- Branding
- WhatsApp Marketing

### Column C — Subcategory

This is a more specific topic within the main category. Examples:

- For Meta Ads: Campaign Setup, Audience Targeting, Ad Creative, Budget Optimization, Retargeting, Lookalike Audiences, A/B Testing, Pixel Setup
- For Google Ads: Search Campaign, Display Campaign, Shopping Ads, Keyword Research, Quality Score, Bidding Strategy, Ad Extensions, Conversion Tracking
- For Instagram Marketing: Content Strategy, Reels Strategy, Hashtag Strategy, Influencer Marketing, Instagram Ads, Story Engagement, Profile Optimization
- For YouTube Marketing: Channel Setup, Video SEO, Thumbnail Design, Content Planning, YouTube Ads, Analytics, Shorts Strategy
- For Local SEO: On-Page SEO, Citation Building, Review Management, Local Keywords, Competitor Analysis, Link Building
- For Google Business Profile: Profile Setup, Photo Optimization, Post Strategy, Review Responses, Category Selection, Service Listing
- For Branding: Brand Identity, Brand Voice, Logo Design, Brand Story, Brand Guidelines, Brand Positioning
- For WhatsApp Marketing: Broadcast Lists, Business Profile Setup, Catalog Setup, Customer Engagement, Automation, Campaign Planning

### Column D — User

This is the user question or prompt. Write the full question exactly as it appears in the conversation. It should be a realistic question that a business owner, marketer, or entrepreneur would ask.

### Column E — Assistant

This is the complete assistant response. Paste the full response here. It must be between 200 and 400 words, structured with steps or paragraphs, and include specific practical advice.

### Column F — Source

Write where you found the information used in the response. Examples:
- "Meta Business Help Center"
- "Google Ads Help documentation"
- "HubSpot blog article on Instagram strategy"
- "Neil Patel YouTube video on Local SEO"
- "Kaggle Marketing Dataset"
- "Original knowledge based on platform documentation"

If you used multiple sources, list all of them separated by commas.

### Column G — Created By

Write your full name. This identifies who created the conversation so the coordinator can track individual contributions and provide personalized feedback.

### Column H — Date

Write the date the conversation was created in DD-MM-YYYY format. Example: 07-06-2026.

### Column I — Status

Every conversation goes through three stages. Use exactly one of these labels:

- **Draft** — You have written the conversation but have not reviewed it yourself yet.
- **Reviewed** — You have self-reviewed the conversation and believe it meets quality standards.
- **Approved** — The coordinator has reviewed and approved the conversation for the final dataset.

Only the coordinator can change a status to Approved.

### Column J — Notes

Use this column for any additional notes. Examples:
- "Needs fact-checking on the CPM numbers"
- "Industry-specific example for real estate"
- "Revised after coordinator feedback on 10-06-2026"
- "Duplicate check passed"

Leave blank if there are no special notes.

---

## Example Rows

Below are example rows to show you how a filled-out spreadsheet looks.

| ID | Category | Subcategory | User | Assistant | Source | Created By | Date | Status | Notes |
|----|----------|-------------|------|-----------|--------|------------|------|--------|-------|
| 1 | Meta Ads | Campaign Setup | I run a bakery in Hyderabad and want to run Facebook Ads with a budget of 500 rupees per day. How do I set up my first campaign? | [Full 300-word response about setting up a bakery Facebook Ads campaign with targeting, budget, creative, and placement instructions] | Meta Business Help Center, Facebook Ads Guide | Member 1 Name | 07-06-2026 | Approved | Good beginner-level example |
| 2 | Google Ads | Keyword Research | What keywords should a dental clinic in Bangalore bid on for Google Ads? | [Full 280-word response listing specific keywords organized by ad group with match types and bid suggestions] | Google Ads Keyword Planner, Google Ads Help | Member 2 Name | 07-06-2026 | Reviewed | Needs coordinator approval |
| 3 | Instagram Marketing | Reels Strategy | How often should a clothing boutique post Reels on Instagram to grow followers? | [Full 320-word response with posting frequency, content types, hashtag strategy, and engagement tactics] | Instagram Business Blog, HubSpot Instagram Guide | Member 3 Name | 08-06-2026 | Draft | First draft, self-review pending |
| 4 | Local SEO | Review Management | How can a restaurant get more Google reviews from customers? | [Full 260-word response with review request tactics, timing, QR codes, and response templates] | Moz Local SEO Guide, BrightLocal Survey 2024 | Member 4 Name | 08-06-2026 | Approved | Verified statistics from BrightLocal |

---

#  18 — JSONL Format

## What Is JSONL?

JSONL stands for JSON Lines. It is a simple text file format where each line is a complete JSON object. It is the format used by most LLM training frameworks, including those used for the Saadhyam Business LLM. When we finish our dataset, all conversations will be converted from the Google Spreadsheet into JSONL format before being handed off to the training team.

You do not need to write in JSONL format during your daily work. You will write conversations in the spreadsheet. However, you must understand the JSONL format so that you can verify the final output and catch any formatting errors before handoff.

## JSONL Rules

1. Each line in the file is one complete conversation. There are no multi-line entries.
2. Each line is a valid JSON object. If even one character is wrong (a missing quote, a missing comma, an extra bracket), the entire line will fail to parse and the conversation will be lost.
3. The file extension is .jsonl, not .json.
4. There are no trailing commas after the last key-value pair in each object.
5. All string values must use double quotes, not single quotes.

## Format Option 1 — Instruction Format

This format uses three fields: instruction, input, and output. The instruction field contains the user question. The input field is left empty for our dataset. The output field contains the assistant response.

```json
{"instruction": "I run a small bakery in Hyderabad and I want to use Facebook Ads to get more customers. I have a budget of 500 rupees per day. How should I set up my first campaign?", "input": "", "output": "Starting Facebook Ads for your Hyderabad bakery with a daily budget of 500 rupees is a smart move. First, go to Meta Ads Manager at business.facebook.com. Click the green Create button. Choose the Traffic objective to send people to your page or website. Set your daily budget to 500 rupees, which is about 15,000 rupees per month. For targeting, set your location to Hyderabad with a 10 kilometer radius, age 18 to 55, and add interests like Baking, Cakes, Desserts, and Coffee. Use a high-quality photo of your best-selling product as your ad creative. Write a headline like Freshly Baked Every Morning and include your address and phone number. Select Automatic Placements and let the ad run for 5 to 7 days before making any changes. After 7 days, check your cost per link click in Ads Manager. If it is below 5 rupees, your campaign is performing well."}
```

```json
{"instruction": "What keywords should a dental clinic in Bangalore bid on for Google Ads?", "input": "", "output": "For a dental clinic in Bangalore, create three ad groups with different keyword themes. The first ad group should target general keywords like dentist in Bangalore, dental clinic near me, and best dentist Bangalore. The second ad group should target treatment-specific keywords like teeth cleaning Bangalore, root canal treatment cost Bangalore, and dental implants Bangalore. The third ad group should target emergency keywords like emergency dentist Bangalore and tooth pain treatment near me. Use phrase match and exact match, not broad match, to control your spending. Set your daily budget between 800 and 1500 rupees. In the dental category in Bangalore, expect a cost per click of 20 to 60 rupees. Add negative keywords like dental college, dental jobs, and free dental treatment to avoid wasting money on irrelevant clicks."}
```

## Format Option 2 — Messages Format

This format uses a messages array with role and content fields. This is the preferred format for chat-style fine-tuning.

```json
{"messages": [{"role": "user", "content": "How can a clothing boutique grow Instagram followers from 500 to 5000 in three months?"}, {"role": "assistant", "content": "Growing your Instagram from 500 to 5000 followers in three months requires a consistent daily content strategy. Post once every day. On Monday, Wednesday, and Friday, post product photos with professional styling. On Tuesday and Thursday, post Reels showing outfit transitions or styling tips, as Reels get 2 to 3 times more reach than static posts. On Saturday, post carousels like Top 5 Trending Kurta Designs. On Sunday, post customer testimonials. Use 25 to 30 hashtags on every post, mixing 5 popular hashtags, 10 medium hashtags, and 10 to 15 niche hashtags specific to your city and style. Engage with 30 accounts every day by liking and commenting meaningfully. Post 3 to 5 Instagram Stories daily with polls, questions, and countdowns. Collaborate with 2 to 3 micro-influencers each month by offering a free outfit in exchange for a Reel and Stories. This strategy should generate about 50 new followers per day."}]}
```

```json
{"messages": [{"role": "user", "content": "How should I set up a Google Business Profile for my salon in Pune to appear in the top 3 local results?"}, {"role": "assistant", "content": "To get your salon into the Google Maps top 3 results, start by completing every field in your Google Business Profile. Set your primary category to Beauty Salon and add secondary categories like Hair Salon and Nail Salon. Write a 750-character description mentioning your location, services, and differentiators. Add at least 20 high-quality photos of your interior, staff, and before-and-after results, and add 2 to 3 new photos every week. Focus on reviews by asking every satisfied customer to leave a Google review immediately after their service. Aim for 50 or more reviews with a 4.5 rating or higher. Respond to every review within 24 hours. Post weekly updates using the Google Posts feature to share offers and announcements. Ensure your name, address, and phone number are exactly identical on your website, Facebook, Justdial, and every online directory. Add all services with prices to the Services section. Follow this consistently for 60 to 90 days to see significant ranking improvement."}]}
```

---




## Day 1 — Onboarding and Tool Setup

### Objective
Every team member gets their tools set up, reads the handbook, and understands the project goals and quality standards.

### Member 1 Tasks (Meta Ads & Facebook)
1. Read Part 1 of the handbook (Sections 1 through 14) completely.
2. Read Part 2 of the handbook (Sections 15 through 26) completely.
3. Set up access to the shared Google Spreadsheet.
4. Create a bookmark folder for Meta Ads research sources including Meta Business Help Center, Facebook Ads Library, and AdEspresso blog.
5. Write a test conversation about Facebook Ads basics to check understanding of the format.

### Member 2 Tasks (Google Ads & PPC)
1. Read Part 1 and Part 2 of the handbook completely.
2. Set up access to the shared Google Spreadsheet.
3. Create a bookmark folder for Google Ads research sources including Google Ads Help Center, Google Skillshop, and WordStream blog.
4. Explore Google Ads Keyword Planner to understand how keyword research works.
5. Write a test conversation about Google Ads basics to check understanding of the format.

### Member 3 Tasks (Instagram & YouTube)
1. Read Part 1 and Part 2 of the handbook completely.
2. Set up access to the shared Google Spreadsheet.
3. Create a bookmark folder for Instagram and YouTube research sources including Instagram Business Blog, YouTube Creator Academy, and Later blog.
4. Browse 10 popular business Instagram accounts and note their strategies.
5. Write a test conversation about Instagram content strategy to check understanding of the format.

### Member 4 Tasks (Local SEO & GBP)
1. Read Part 1 and Part 2 of the handbook completely.
2. Set up access to the shared Google Spreadsheet.
3. Create a bookmark folder for Local SEO research sources including Moz Local SEO Guide, BrightLocal blog, and Google Business Profile Help.
4. Search for five local businesses on Google Maps and observe their profiles.
5. Write a test conversation about Google Business Profile setup to check understanding of the format.

### Member 5 Tasks (Branding & WhatsApp)
1. Read Part 1 and Part 2 of the handbook completely.
2. Set up access to the shared Google Spreadsheet.
3. Create a bookmark folder for Branding and WhatsApp research sources including WhatsApp Business Help Center, Canva Design School, and Branding Strategy Insider.
4. Download WhatsApp Business app and explore its features.
5. Write a test conversation about brand naming to check understanding of the format.

### Coordinator Tasks
1. Create the shared Google Spreadsheet with all 10 columns as defined in Section 17.
2. Set up the team communication channel (WhatsApp group or Slack channel).
3. Share the handbook with all members.
4. Create a source log template for each member.
5. Schedule the daily standup time and send calendar invites.

### Research Tasks
No formal research today. Focus is on reading the handbook and understanding the project.

### Deliverables
1. Every member has spreadsheet access confirmed.
2. Every member has submitted one test conversation for format validation.
3. Communication channel is active with all members joined.

### Quality Checks
Review each member's test conversation. Verify: Is it at least 200 words? Does it have specific details? Is it formatted with clear steps or paragraphs? Provide immediate feedback.

### Common Mistakes to Watch For
1. Members skimming the handbook instead of reading it completely — they will miss important formatting and quality rules.
2. Test conversations being too short or too vague because members have not yet internalized the quality standards.

---

## Day 2 — Onboarding Completion and Practice

### Objective
Complete onboarding, revise test conversations based on feedback, and begin exploring research sources to prepare for the research phase.

### Member 1 Tasks (Meta Ads & Facebook)
1. Revise the test conversation from Day 1 based on coordinator feedback.
2. Read the Meta Business Help Center documentation on campaign objectives, ad formats, and audience targeting.
3. Explore the Facebook Ads Library to see real ads from businesses in India.
4. Write 2 practice conversations about Meta Ads (these will count toward the dataset if quality is approved).
5. Log sources used in the source tracker.

### Member 2 Tasks (Google Ads & PPC)
1. Revise the test conversation from Day 1 based on coordinator feedback.
2. Read Google Ads Help pages on campaign types, keyword match types, and bidding strategies.
3. Explore Google Skillshop free courses on Google Ads fundamentals.
4. Write 2 practice conversations about Google Ads (these will count toward the dataset if quality is approved).
5. Log sources used in the source tracker.

### Member 3 Tasks (Instagram & YouTube)
1. Revise the test conversation from Day 1 based on coordinator feedback.
2. Read Instagram Business Blog articles on Reels, Stories, and content strategy.
3. Watch 2 YouTube Creator Academy videos on channel growth and video SEO.
4. Write 2 practice conversations, one on Instagram and one on YouTube.
5. Log sources used in the source tracker.

### Member 4 Tasks (Local SEO & GBP)
1. Revise the test conversation from Day 1 based on coordinator feedback.
2. Read the Moz Beginner's Guide to Local SEO.
3. Read Google's official documentation on Google Business Profile optimization.
4. Write 2 practice conversations, one on Local SEO and one on GBP.
5. Log sources used in the source tracker.

### Member 5 Tasks (Branding & WhatsApp)
1. Revise the test conversation from Day 1 based on coordinator feedback.
2. Read WhatsApp Business API documentation and feature guides.
3. Read 3 articles on brand identity creation for small businesses.
4. Write 2 practice conversations, one on Branding and one on WhatsApp.
5. Log sources used in the source tracker.

### Coordinator Tasks
1. Review and provide detailed feedback on all test conversations from Day 1.
2. Approve or request revisions on the 2 practice conversations from each member.
3. Create a master topic list for each category with at least 30 subtopics per category.
4. Set up the conversation count tracker with targets for each member.
5. Prepare a quick reference card summarizing the most common quality issues.

### Research Tasks
Each member should spend at least 1 hour exploring their primary research sources and bookmarking useful articles.

### Deliverables
1. Revised test conversations from all members.
2. 2 practice conversations from each member (10 total).
3. Master topic list created by coordinator.

### Quality Checks
Verify that revised test conversations address all feedback. Check that practice conversations meet the 200-word minimum and include specific, actionable advice with real numbers.

### Common Mistakes to Watch For
1. Members copying content directly from sources instead of writing original responses in their own words.
2. Practice conversations being too similar to the test conversation, showing lack of topic variety.

---

## Day 3 — Research Phase Begins

### Objective
Begin deep research into each category. Explore Kaggle, HuggingFace, GitHub, and industry blogs to gather ideas, topics, and data that will fuel conversation creation.

### Member 1 Tasks (Meta Ads & Facebook)
1. Search Kaggle for Facebook Ads and Meta Ads datasets. Download and review at least 2 datasets.
2. Search HuggingFace for any marketing-related datasets.
3. Read 5 case studies of successful Facebook Ad campaigns for small businesses in India.
4. Create a list of 20 user questions that real business owners might ask about Facebook Ads.
5. Write 3 conversations based on your research findings.

### Member 2 Tasks (Google Ads & PPC)
1. Search Kaggle for Google Ads and PPC datasets. Download and review at least 2 datasets.
2. Read Google Ads benchmarks reports from WordStream for 2023-2024.
3. Read 5 case studies of successful Google Ads campaigns for service businesses.
4. Create a list of 20 user questions about Google Ads.
5. Write 3 conversations based on your research findings.

### Member 3 Tasks (Instagram & YouTube)
1. Search Kaggle for Instagram marketing and YouTube analytics datasets.
2. Read the latest Instagram algorithm update articles from Social Media Examiner.
3. Read 3 case studies about brands that grew on Instagram Reels.
4. Create a list of 20 user questions, 10 about Instagram and 10 about YouTube.
5. Write 3 conversations, at least 1 on YouTube topics.

### Member 4 Tasks (Local SEO & GBP)
1. Search Kaggle for Local SEO and Google Maps datasets.
2. Read the BrightLocal Local Consumer Review Survey for the latest year available.
3. Read 3 case studies about local businesses improving their Google Maps ranking.
4. Create a list of 20 user questions, 10 about Local SEO and 10 about GBP.
5. Write 3 conversations based on your research findings.

### Member 5 Tasks (Branding & WhatsApp)
1. Search Kaggle and GitHub for branding and WhatsApp marketing datasets.
2. Read 5 articles about building a brand identity for Indian startups.
3. Explore WhatsApp Business success stories from the WhatsApp blog.
4. Create a list of 20 user questions, 10 about Branding and 10 about WhatsApp.
5. Write 3 conversations based on your research findings.

### Coordinator Tasks
1. Review practice conversations from Day 2 and provide feedback.
2. Compile all 100 user questions (20 from each member) into a master question bank.
3. Check for question overlaps and duplicates across members.
4. Search for additional marketing datasets on HuggingFace and GitHub.
5. Write 3 conversations for underrepresented categories.

### Research Tasks
Primary research focus today: Kaggle datasets, HuggingFace datasets, and industry case studies. Each member must log at least 5 new sources in their source tracker.

### Deliverables
1. 20 user questions per member (100 total).
2. 3 conversations per member (15 total, plus 3 from coordinator).
3. At least 2 downloaded datasets per member.

### Quality Checks
Review the question lists for variety and realism. Ensure no two questions are essentially asking the same thing. Verify that conversations derived from research are original and not copied.

### Common Mistakes to Watch For
1. Creating questions that are too academic or theoretical instead of practical business questions.
2. Downloading datasets but not actually reviewing them for useful insights.

---

## Day 4 — Research Deep Dive

### Objective
Continue deep research, expand the question bank, and increase conversation output to 5 per member.

### Member 1 Tasks (Meta Ads & Facebook)
1. Research Facebook Pixel setup and retargeting strategies.
2. Read about Lookalike Audiences and how small businesses use them.
3. Study Meta Ads reporting metrics (CPM, CPC, CTR, ROAS, Frequency).
4. Write 5 conversations covering pixel setup, retargeting, lookalike audiences, budget scaling, and ad creative testing.
5. Update source log with all references used.

### Member 2 Tasks (Google Ads & PPC)
1. Research Google Ads Quality Score in depth: what affects it, how to improve it.
2. Read about Google Ads bidding strategies: Manual CPC, Enhanced CPC, Target CPA, Maximize Conversions.
3. Study negative keywords and how they save budget.
4. Write 5 conversations covering Quality Score, bidding strategies, negative keywords, ad extensions, and landing page optimization.
5. Update source log.

### Member 3 Tasks (Instagram & YouTube)
1. Research Instagram algorithm ranking factors for Feed, Reels, and Explore.
2. Study YouTube SEO: titles, tags, descriptions, thumbnails, and watch time.
3. Read about Instagram Shopping and how product-based businesses use it.
4. Write 5 conversations: 3 on Instagram (algorithm, shopping, influencer partnerships) and 2 on YouTube (SEO, content planning).
5. Update source log.

### Member 4 Tasks (Local SEO & GBP)
1. Research NAP consistency and local citation building.
2. Study how Google determines local search rankings (relevance, distance, prominence).
3. Read about schema markup for local businesses.
4. Write 5 conversations: 3 on Local SEO (citations, ranking factors, schema) and 2 on GBP (posting strategy, Q&A feature).
5. Update source log.

### Member 5 Tasks (Branding & WhatsApp)
1. Research brand positioning strategies and competitive differentiation.
2. Study WhatsApp Business API features including automated messages and catalogs.
3. Read about color psychology in branding for different industries.
4. Write 5 conversations: 3 on Branding (positioning, color psychology, brand voice) and 2 on WhatsApp (catalog setup, automated messages).
5. Update source log.

### Coordinator Tasks
1. Review Day 3 conversations from all members (15 conversations).
2. Approve or return with feedback.
3. Update the master tracker with counts.
4. Research industry-specific angles (restaurants, clinics, salons, gyms, real estate) that can be used across categories.
5. Assign industry-specific topics to each member for Day 5.

### Research Tasks
Focus on platform-specific documentation and intermediate-level topics. Each member must read at least one detailed platform guide or whitepaper.

### Deliverables
1. 5 conversations per member (25 total, plus coordinator contributions).
2. Updated source logs from all members.
3. Coordinator feedback on Day 3 work.

### Quality Checks
Verify that conversations are becoming more detailed and specific compared to earlier days. Check that conversations are covering different subtopics and not repeating themes.

### Common Mistakes to Watch For
1. Writing multiple conversations that all follow the exact same structure (question about setup leads to step-by-step guide). Vary the question types.
2. Forgetting to include real numbers like budgets, timelines, and performance benchmarks.

---

## Day 5 — Research Phase Final Day

### Objective
Complete the research phase. Every member should have a comprehensive understanding of their category and a large pool of topics ready for the creation sprint starting Day 6.

### Member 1 Tasks (Meta Ads & Facebook)
1. Research Facebook Ads for specific industries: restaurants, e-commerce, coaching institutes, and real estate.
2. Study A/B testing strategies for ad creatives and audiences.
3. Read about Meta Advantage+ campaigns and automated ad features.
4. Write 5 industry-specific conversations (one for each industry: restaurant, e-commerce, coaching, real estate, salon).
5. Finalize your topic list with at least 40 unique topics ready for the creation sprint.

### Member 2 Tasks (Google Ads & PPC)
1. Research Google Ads for specific industries: dental clinics, law firms, plumbing services, and tutoring centers.
2. Study Performance Max campaigns and how they work for local businesses.
3. Read about Google Ads remarketing lists and display retargeting.
4. Write 5 industry-specific conversations.
5. Finalize your topic list with at least 40 unique topics.

### Member 3 Tasks (Instagram & YouTube)
1. Research Instagram and YouTube strategies for specific industries: fashion boutiques, fitness trainers, food bloggers, and travel agencies.
2. Study Instagram Ads Manager and how to run paid promotions on Reels.
3. Read about YouTube monetization and how it connects to business branding.
4. Write 5 conversations: 3 Instagram and 2 YouTube, all industry-specific.
5. Finalize your topic list with at least 40 unique topics.

### Member 4 Tasks (Local SEO & GBP)
1. Research Local SEO for specific industries: doctors, lawyers, auto repair shops, and tutoring centers.
2. Study Google Maps ranking factors in depth.
3. Read about GBP Insights and how to interpret analytics data.
4. Write 5 industry-specific conversations.
5. Finalize your topic list with at least 40 unique topics.

### Member 5 Tasks (Branding & WhatsApp)
1. Research branding strategies for specific industries: food brands, fashion brands, tech startups, and service businesses.
2. Study WhatsApp marketing case studies from Indian businesses.
3. Read about brand guidelines documents and what they should include.
4. Write 5 conversations: 3 Branding and 2 WhatsApp, all industry-specific.
5. Finalize your topic list with at least 40 unique topics.

### Coordinator Tasks
1. Review Day 4 conversations from all members (25 conversations).
2. Compile running totals: by this point the team should have approximately 60 to 70 conversations.
3. Review each member's topic list and identify gaps.
4. Assign new topics to fill gaps.
5. Prepare the creation sprint briefing for Day 6.

### Research Tasks
Final research day. Each member should have their source library fully built and ready for reference during the creation sprint.

### Deliverables
1. 5 conversations per member (25 total).
2. Finalized topic lists from all members (200+ topics total across all categories).
3. Complete source logs.

### Quality Checks
Review topic lists for completeness. Ensure every major subtopic in each category is covered. Check that industry-specific conversations mention real details about those industries.

### Common Mistakes to Watch For
1. Having a topic list that only covers beginner-level topics. Make sure to include intermediate and advanced topics.
2. Industry-specific conversations that are actually generic and just swap out the business name.

---

## Day 6 — First Creation Sprint Begins

### Objective
Begin the first full creation sprint. Each member targets 8 conversations today, focusing on beginner-level topics that are straightforward to write.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 8 conversations on beginner Meta Ads topics: what is Facebook Ads, how to create a Business Manager account, choosing campaign objectives, setting a daily budget, basic audience targeting, creating a simple image ad, understanding the Ads Manager dashboard, and how to read basic ad metrics.
2. Enter all 8 conversations into the spreadsheet with all columns filled.
3. Self-review all 8 conversations before end of day.
4. Set all reviewed conversations to Reviewed status.
5. Log all sources used.

### Member 2 Tasks (Google Ads & PPC)
1. Write 8 conversations on beginner Google Ads topics: what is Google Ads, how to set up a Google Ads account, understanding Search vs Display campaigns, choosing keywords, setting a budget, writing ad copy, understanding CPC and CTR, and how to enable conversion tracking.
2. Enter all into the spreadsheet.
3. Self-review all conversations.
4. Set status to Reviewed.
5. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 8 conversations: 5 on Instagram beginners topics (setting up a business profile, content types, posting frequency, hashtag basics, bio optimization) and 3 on YouTube beginner topics (creating a channel, uploading a video, basic video SEO).
2. Enter all into the spreadsheet.
3. Self-review all conversations.
4. Set status to Reviewed.
5. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 8 conversations: 4 on Local SEO beginner topics (what is local SEO, why it matters, basic on-page factors, getting listed in directories) and 4 on GBP beginner topics (claiming a profile, adding business info, uploading photos, choosing categories).
2. Enter all into the spreadsheet.
3. Self-review all conversations.
4. Set status to Reviewed.
5. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 8 conversations: 4 on Branding beginner topics (what is branding, choosing a brand name, selecting brand colors, writing a brand tagline) and 4 on WhatsApp beginner topics (setting up WhatsApp Business, creating a business profile, setting up a product catalog, creating broadcast lists).
2. Enter all into the spreadsheet.
3. Self-review all conversations.
4. Set status to Reviewed.
5. Log sources.

### Coordinator Tasks
1. Review Day 5 conversations (25 conversations).
2. Begin reviewing Day 6 conversations as they come in during the afternoon.
3. Send mid-day check-in message to team to confirm everyone is on track.
4. Write 3 to 5 conversations for underrepresented categories.
5. Update the master tracker.

### Research Tasks
Minimal research today. Members should use their pre-built source library. Only do additional research if you encounter a topic you are not confident about.

### Deliverables
1. 8 conversations per member (40 total).
2. All conversations entered in the spreadsheet with status set to Reviewed.
3. Running total should reach approximately 100 to 110 conversations.

### Quality Checks
Verify that beginner topics are genuinely helpful and not overly simplistic. Beginner does not mean low quality. The responses should still be 200+ words with specific, practical advice.

### Common Mistakes to Watch For
1. Writing beginner conversations that are too basic, like "Facebook Ads is a way to advertise on Facebook." Even beginner answers need depth and detail.
2. Rushing through 8 conversations and sacrificing quality for quantity.

---

## Day 7 — Beginner Creation Continues

### Objective
Complete beginner-level topics and begin transitioning to intermediate topics. Each member writes 8 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 4 more beginner conversations: Facebook Page optimization for ads, understanding ad placements, mobile vs desktop targeting, and scheduling ads.
2. Write 4 intermediate conversations: custom audience creation, retargeting website visitors, A/B testing ad images, and analyzing campaign results.
3. Enter all 8 into the spreadsheet. Self-review. Set to Reviewed.
4. Cross-check against the master list to avoid duplicates.
5. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 4 more beginner conversations: ad scheduling, location targeting, ad preview tool, and understanding Google Ads billing.
2. Write 4 intermediate conversations: keyword match types explained, using negative keywords, ad group structuring, and sitelink extensions.
3. Enter all 8 into the spreadsheet. Self-review. Set to Reviewed.
4. Cross-check for duplicates.
5. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 4 more beginner conversations: 2 Instagram (follower engagement basics, linking Instagram to Facebook) and 2 YouTube (custom thumbnails, channel art design).
2. Write 4 intermediate conversations: 2 Instagram (Reels algorithm, Instagram analytics) and 2 YouTube (watch time optimization, end screens and cards).
3. Enter all 8 into the spreadsheet. Self-review. Set to Reviewed.
4. Cross-check for duplicates.
5. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 4 more beginner conversations: 2 Local SEO (Google My Business vs Google Business Profile naming, what are local citations) and 2 GBP (adding business hours, writing a business description).
2. Write 4 intermediate conversations: 2 Local SEO (building local backlinks, optimizing for "near me" searches) and 2 GBP (using Google Posts, responding to negative reviews).
3. Enter all 8 into the spreadsheet. Self-review. Set to Reviewed.
4. Cross-check for duplicates.
5. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 4 more beginner conversations: 2 Branding (brand mission vs brand vision, choosing fonts for your brand) and 2 WhatsApp (WhatsApp Business greeting messages, adding quick replies).
2. Write 4 intermediate conversations: 2 Branding (creating a brand style guide, brand voice examples) and 2 WhatsApp (WhatsApp marketing campaign planning, handling customer complaints on WhatsApp).
3. Enter all 8 into the spreadsheet. Self-review. Set to Reviewed.
4. Cross-check for duplicates.
5. Log sources.

### Coordinator Tasks
1. Complete review of all Day 6 conversations (40 conversations).
2. Compile weekly progress report: Week 1 target is 150 conversations.
3. Identify the top 3 best conversations of the week and share as examples.
4. Identify the 3 most common quality issues and send a correction guide.
5. Update the tracker and plan intermediate topics for next week.

### Research Tasks
Members should do 30 minutes of research on intermediate topics they will be covering in the next few days.

### Deliverables
1. 8 conversations per member (40 total).
2. Running total should reach approximately 150 conversations (Week 1 target).
3. Week 1 progress report from coordinator.

### Quality Checks
Compare beginner and intermediate conversations. The intermediate ones should show more depth, more specific metrics, and more nuanced advice. If the intermediate conversations look the same as the beginner ones, the team needs to increase their depth.

### Common Mistakes to Watch For
1. Intermediate conversations that are just longer versions of beginner conversations instead of covering genuinely more advanced topics.
2. Skipping the self-review step due to end-of-week fatigue.

---

## Day 8 — Intermediate Creation Sprint

### Objective
Full focus on intermediate-level conversations. Each member writes 8 to 10 conversations. The team enters Week 2 with strong momentum.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations on intermediate Meta Ads topics: Lookalike Audiences, Custom Audiences from email lists, conversion campaigns, lead generation campaigns, video ad strategies, carousel ad best practices, Instagram placement for Meta Ads, retargeting cart abandoners, campaign budget optimization, and using Facebook Ads for app installs.
2. Enter all into the spreadsheet. Self-review. Set to Reviewed.
3. Verify that each response is at least 250 words with specific numbers.
4. Log all sources.
5. Flag any conversations that need fact-checking in the Notes column.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 conversations on intermediate Google Ads topics: Performance Max campaigns, responsive search ads, call-only campaigns, Google Shopping ads setup, remarketing lists for search ads, geographic bid adjustments, dayparting strategy, competitor keyword bidding, impression share analysis, and Google Ads Editor tool.
2. Enter all into the spreadsheet. Self-review. Set to Reviewed.
3. Verify word counts and specific details.
4. Log sources.
5. Flag uncertain items.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations: 5 Instagram (Instagram Ads campaign setup, Instagram Story ads, influencer collaboration contracts, Instagram analytics deep dive, content calendar creation) and 5 YouTube (YouTube Ads types: TrueView, bumper, non-skippable; YouTube Analytics key metrics, optimizing video descriptions, YouTube Shorts strategy, collaboration strategies for channel growth).
2. Enter all into the spreadsheet. Self-review. Set to Reviewed.
3. Log sources.
4. Verify each response has practical advice, not just definitions.
5. Flag uncertain items.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 conversations: 5 Local SEO (local keyword research tools, competitor local SEO analysis, getting featured in the Local Pack, review generation strategies, local landing page optimization) and 5 GBP (GBP Insights analytics interpretation, GBP messaging feature, handling fake reviews, multi-location GBP management, product listing on GBP).
2. Enter all into the spreadsheet. Self-review. Set to Reviewed.
3. Log sources.
4. Verify specific, actionable advice in each response.
5. Flag uncertain items.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations: 5 Branding (rebranding strategy, brand consistency across channels, building brand trust, brand storytelling for social media, packaging design principles) and 5 WhatsApp (WhatsApp Status for business promotion, customer segmentation in WhatsApp, WhatsApp payment integration, managing high-volume WhatsApp inquiries, WhatsApp for appointment booking).
2. Enter all into the spreadsheet. Self-review. Set to Reviewed.
3. Log sources.
4. Verify quality.
5. Flag uncertain items.

### Coordinator Tasks
1. Review Day 7 conversations (40 conversations).
2. Approve high-quality conversations, return others with feedback.
3. Conduct a mid-sprint check: are all categories getting equal coverage?
4. If any category is falling behind, redistribute topics.
5. Write 5 conversations focusing on cross-category topics (for example, how branding affects ad performance).

### Research Tasks
Minimal. Use existing research. Only research new topics if encountered during creation.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 200 conversations.
3. Coordinator review of Day 7 work completed.

### Quality Checks
With 10 conversations per day, quality must not drop. Random-check 3 conversations per member to ensure they meet all standards.

### Common Mistakes to Watch For
1. Copy-pasting structures from one conversation to another, making all responses sound identical.
2. Not varying the industry context of questions (all questions being generic instead of mentioning specific business types).

---

## Day 9 — Intermediate Creation Continues

### Objective
Continue intermediate-level conversations. Each member writes 10 conversations. Focus on bringing in industry-specific variations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations on Meta Ads with industry-specific angles: Facebook Ads for a gym (membership campaigns), a restaurant (food delivery promotions), a real estate agent (property listing ads), an online tutor (course enrollment ads), a wedding photographer (seasonal campaigns), a clothing store (catalog sales), a car dealership (lead gen ads), a hotel (booking campaigns), a mobile repair shop (local awareness), and a pet store (product promotions).
2. Enter all into the spreadsheet. Self-review. Set to Reviewed.
3. Ensure each response mentions the specific industry's unique needs.
4. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 industry-specific Google Ads conversations: Google Ads for a plumber (emergency service keywords), a lawyer (high-CPC legal keywords), a dentist (treatment-specific campaigns), a real estate developer (project-based ads), a coaching institute (course keyword targeting), a travel agency (seasonal campaigns), a hospital (department-wise campaigns), an electronics store (shopping ads), a home cleaning service (local service ads), and a photographer (portfolio-based ads).
2. Enter all. Self-review. Set to Reviewed.
3. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 industry-specific conversations: Instagram for a bakery (food photography tips), a gym (transformation Reels), a jeweler (product showcase carousels), a travel agency (destination Reels), a spa (service highlight Stories); YouTube for a real estate agent (property tour videos), a cooking instructor (recipe tutorials), a fitness trainer (workout series), a tutor (educational explainers), and a tech reviewer (product comparison videos).
2. Enter all. Self-review. Set to Reviewed.
3. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 industry-specific conversations: Local SEO for a dentist (dental keywords), a restaurant (food-related local search), a gym (fitness-related local search), a salon (beauty service keywords), a law firm (legal service local SEO); GBP for a hospital (multi-department profile), a hotel (amenities and photos), an auto repair shop (services listing), a tutoring center (subject-specific categories), and a pharmacy (product listing and hours).
2. Enter all. Self-review. Set to Reviewed.
3. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 industry-specific conversations: Branding for a coffee shop (cafe branding identity), a fitness brand (athletic brand voice), a baby products brand (trust-focused branding), an organic food brand (health-conscious positioning), a tech startup (innovative brand identity); WhatsApp for a restaurant (daily menu broadcasts), a clinic (appointment reminders), a tutor (class schedule updates), a real estate agent (property update messages), and a grocery store (daily deals broadcasts).
2. Enter all. Self-review. Set to Reviewed.
3. Log sources.

### Coordinator Tasks
1. Review Day 8 conversations (50 conversations — break into two review sessions).
2. Track category balance across all conversations.
3. Identify any quality dips and send corrective feedback.
4. Write 3 cross-category conversations.
5. Update master tracker.

### Research Tasks
No formal research block. Members may do quick fact-checking as needed during creation.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 250 conversations.

### Quality Checks
Verify that industry-specific conversations include real details about those industries, not just the business name inserted into a generic template.

### Common Mistakes to Watch For
1. Writing a "template" response and changing only the business name across 10 conversations.
2. Forgetting to include industry-specific metrics, budgets, and strategies that differ by industry.

---

## Day 10 — Intermediate Creation Push

### Objective
Continue building intermediate conversations. Focus on optimization and analytics topics across all categories. Each member writes 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations about Meta Ads optimization: reducing cost per lead, improving ad relevance score, testing different ad placements, scaling a winning campaign, reading and interpreting Ads Manager reports, Facebook Ads frequency management, split testing audiences, optimizing for mobile conversions, seasonal campaign planning, and managing multiple campaigns simultaneously.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 conversations about Google Ads optimization: improving Quality Score step by step, reducing cost per conversion, search term report analysis, ad copy A/B testing, landing page optimization for ads, adjusting bids by device, optimizing for call conversions, budget allocation across campaigns, understanding attribution models, and pausing underperforming keywords.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations: 5 Instagram (Instagram analytics interpretation, improving engagement rate, growing through collaborations, Reels editing tips for business, handling negative comments) and 5 YouTube (YouTube Analytics interpretation, improving click-through rate on thumbnails, YouTube Community tab strategy, live streaming for business, YouTube Playlists for watch time).
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 conversations: 5 Local SEO (tracking local rankings, monitoring competitor local SEO, local SEO audit checklist, mobile optimization for local search, voice search optimization for local businesses) and 5 GBP (tracking GBP performance metrics, GBP seasonal updates, handling GBP spam, GBP website builder, and using GBP for event promotions).
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations: 5 Branding (measuring brand awareness, social media brand audit, brand crisis management, influencer partnerships for brand building, brand differentiation strategies) and 5 WhatsApp (measuring WhatsApp marketing ROI, reducing WhatsApp unsubscribe rates, WhatsApp for customer feedback collection, WhatsApp Business labels for organizing chats, seasonal WhatsApp campaigns).
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 9 conversations (50 conversations).
2. Run duplicate check on conversations 200 through 250.
3. Prepare a mid-sprint quality report.
4. Write 3 conversations.
5. Adjust topic assignments if any subtopics are overrepresented.

### Research Tasks
Quick research only. Members should fact-check any statistics they include in their conversations.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 300 conversations.
3. Coordinator mid-sprint quality report.

### Quality Checks
Verify that optimization-focused conversations include specific actionable steps, not just general principles. Check for accurate statistics and metrics.

### Common Mistakes to Watch For
1. Using vague advice like "optimize your ads" without explaining exactly how to do it.
2. Including outdated statistics from before 2023.

---

## Day 11 — Intermediate to Advanced Transition

### Objective
Begin transitioning from intermediate to advanced topics. Conversations should become more detailed, more strategic, and more specific. Each member writes 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 5 advanced Meta Ads conversations: full-funnel Facebook advertising strategy, advanced Lookalike Audience stacking, Dynamic Product Ads setup for e-commerce, Meta Ads attribution windows explained, and ROAS-based campaign optimization.
2. Write 5 intermediate conversations on subtopics not yet covered: Facebook Marketplace ads, event promotion campaigns, Page Like campaigns, Messenger ad campaigns, and Instagram Shopping ads via Meta.
3. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 5 advanced Google Ads conversations: full PPC account audit process, advanced bidding with Target ROAS, Google Ads scripts for automation, cross-channel attribution in Google Ads, and Google Ads for B2B lead generation.
2. Write 5 intermediate conversations: Google Local Service Ads, Google Ads for app promotion, video campaigns on YouTube via Google Ads, call tracking setup, and Google Ads display network targeting options.
3. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 5 advanced conversations: Instagram content funnel strategy (awareness to conversion), advanced Reels editing for viral content, building an Instagram content team, YouTube channel monetization strategy, and YouTube SEO advanced techniques (timestamp optimization, chapter markers).
2. Write 5 intermediate conversations: Instagram shopping setup, user-generated content campaigns on Instagram, YouTube sponsorship deals, YouTube community engagement, and cross-promotion between Instagram and YouTube.
3. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 5 advanced conversations: local SEO for multi-location businesses, advanced local link building strategies, local SEO content strategy (city pages, neighborhood pages), GBP API and third-party management tools, and reputation management for negative search results.
2. Write 5 intermediate conversations: Google Maps advertising, local business schema markup guide, managing GBP reviews at scale, GBP for service-area businesses, and local SEO for franchises.
3. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 5 advanced conversations: developing a complete brand book from scratch, brand architecture for companies with multiple product lines, creating a brand ambassador program, WhatsApp Business API for medium enterprises, and omnichannel brand experience design.
2. Write 5 intermediate conversations: brand monitoring tools, co-branding partnerships, personal branding for business owners, WhatsApp chatbot setup basics, and WhatsApp for team internal communication.
3. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 10 conversations (50 conversations).
2. Verify quality of advanced conversations — they must show significantly more depth.
3. Track category balance and ensure no category is falling behind.
4. Write 3 advanced conversations as quality benchmarks.
5. Update master tracker.

### Research Tasks
Members should do 30 minutes of research on advanced topics they will write about in the coming days. Focus on detailed guides, case studies, and expert-level resources.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 350 conversations.

### Quality Checks
Advanced conversations must be clearly more sophisticated than beginner or intermediate ones. They should include strategic thinking, multi-step processes, and expert-level detail.

### Common Mistakes to Watch For
1. Advanced conversations that are just intermediate conversations with a "comprehensive" or "advanced" label.
2. Using jargon without explaining it, making the response unhelpful.

---

## Day 12 — Advanced Creation Day

### Objective
Full day of advanced conversation creation. Each member writes 10 conversations on advanced and strategic topics.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 advanced conversations: complete campaign restructuring guide, advanced retargeting funnels (3-stage retargeting), Meta Ads creative testing framework, budget optimization across multiple ad sets, campaign scaling from 500 to 5000 rupees per day, Facebook Ads for high-ticket products, lead quality optimization, ad fatigue detection and solutions, seasonal ad strategy calendar, and integrating Meta Ads with CRM systems.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 advanced conversations: Google Ads account restructuring, advanced keyword grouping with SKAGs, Google Ads competitive analysis, landing page A/B testing for PPC, Google Ads for SaaS businesses, budgeting for multiple campaign types, Google Ads conversion rate optimization, Google Ads for e-commerce with product feeds, managing seasonal PPC campaigns, and PPC reporting dashboards.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 advanced conversations: building a content production system for Instagram, Instagram brand partnerships and pricing, advanced hashtag research tools, Instagram Reels algorithm deep dive, viral content formulas; YouTube advanced thumbnailing strategy, YouTube retention optimization, building a YouTube content calendar for 12 months, YouTube community building, and YouTube revenue diversification.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 advanced conversations: advanced local link building outreach, local SEO for competitive industries, GBP optimization for high-competition areas, managing online reputation during a PR crisis, local SEO reporting for clients, local search ranking correlation studies, advanced review response strategies, local SEO for new businesses with no reviews, GBP for healthcare providers (HIPAA considerations), and multi-language local SEO.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 advanced conversations: complete brand audit process, brand refresh vs rebrand decision framework, luxury brand positioning, brand loyalty program design, competitive brand analysis; WhatsApp Business API pricing and setup, WhatsApp for e-commerce order management, bulk messaging compliance and anti-spam rules, WhatsApp customer service KPIs, and integrating WhatsApp with a CRM system.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 11 conversations (50 conversations).
2. Approve high-quality work, return revisions with detailed feedback.
3. Write 3 advanced conversations.
4. Prepare for the quality review phase starting Day 16.
5. Update tracker — running total should be nearing 400.

### Research Tasks
Advanced topics may require deeper research. Members should budget 20 to 30 minutes for any topic they are not confident about.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 400 conversations.

### Quality Checks
Advanced conversations must demonstrate strategic thinking and deep platform knowledge. Quick spot-check: does the response teach something that a beginner guide would NOT cover?

### Common Mistakes to Watch For
1. Losing steam and writing shorter, less detailed responses as the day goes on.
2. Repeating the same advice from earlier conversations in a slightly different way.

---

## Day 13 — Industry-Specific Advanced Conversations

### Objective
Create advanced, industry-specific conversations that show deep knowledge of both the marketing channel and the specific business type. Each member writes 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations pairing Meta Ads with specific business challenges: Facebook Ads for a new restaurant launch, scaling Facebook Ads for a D2C beauty brand, Facebook lead ads for a B2B consulting firm, seasonal Facebook campaigns for a travel agency, local awareness campaigns for a new gym opening, Facebook Ads for a coaching institute enrollment drive, promoting a mobile app with Facebook Ads, Facebook Ads for a political campaign, nonprofit donation campaigns on Facebook, and Flash sale promotion strategy on Facebook.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 industry-specific advanced conversations: Google Ads for an immigration consultancy, PPC for a wedding venue, Google Shopping for a jewelry store, Google Ads for a SaaS free trial campaign, local service ads for an electrician, Google Ads for a hospital's specialty department, PPC for a pest control service, Google Ads for a recruitment agency, display ads for a real estate developer, and Google Ads for a food delivery startup.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations: Instagram for a luxury hotel (lifestyle content strategy), Instagram for a pet grooming business (before-after Reels), Instagram for a book store (reader community building), YouTube for an accounting firm (educational tax videos), YouTube for a music school (student showcase videos), Instagram for a dermatologist (skin care education), YouTube for a car dealership (test drive videos), Instagram for an event planner (portfolio showcasing), YouTube for a language school (lesson previews), and Instagram for a home décor store (styling inspiration).
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 industry-specific conversations: Local SEO for a wedding photographer, GBP for a veterinary clinic, local SEO for a yoga studio, GBP for a coworking space, local SEO for a bakery chain with 3 locations, GBP for an optician, local SEO for an Ayurvedic clinic, GBP for a car wash, local SEO for a music school, and GBP for a dry cleaning service.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations: branding for a children's clothing brand (playful identity), branding for a financial advisory firm (trust and authority), branding for a cloud kitchen (food-first brand), WhatsApp marketing for a fitness trainer (class scheduling), WhatsApp for a jewelry store (collection launches), branding for an eco-friendly products company (sustainability messaging), WhatsApp for a tuition center (parent communication), branding for a logistics startup (reliability positioning), WhatsApp for a salon (appointment and offer management), and branding for an EdTech startup (modern education brand).
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 12 conversations (50 conversations).
2. Run a category-wide quality comparison to ensure consistency.
3. Identify the strongest and weakest conversations and share examples with the team.
4. Write 3 conversations.
5. Update tracker. Running total should be approximately 450.

### Research Tasks
If any industry-specific topic requires special knowledge, members should spend 15 minutes researching that industry before writing the conversation.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total: approximately 450 conversations.

### Quality Checks
Industry-specific conversations must include details that are truly specific to that industry. A conversation about Google Ads for a jewelry store should mention product feed optimization and high-quality image requirements, not just generic Google Ads advice.

### Common Mistakes to Watch For
1. Writing industry-specific conversations that only mention the industry name once and then give generic advice.
2. Not knowing enough about a specific industry and writing inaccurate advice as a result.

---

## Day 14 — Week 2 Completion Sprint

### Objective
Complete Week 2 targets. Push to reach 500 conversations total. Each member writes 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations covering remaining Meta Ads topics from the topic list: Facebook Ads policies and common rejection reasons, Instagram Reels ads via Meta Ads Manager, Meta Ads for WhatsApp click-to-message campaigns, video ad creative best practices, catalogue sales campaigns, understanding Meta Ads auction, campaign structure best practices (CBO vs ABO), Facebook Ads reporting templates, Meta Ads for event registrations, and holiday season ad planning.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 conversations: Google Ads policy violations and how to fix them, Google Ads for YouTube video promotion, Google Ads Smart Campaigns pros and cons, setting up Google Ads for a new website, Google Ads phone call tracking, Google Ads for lead generation forms, understanding Google Ads auction insights, Google Ads for seasonal businesses, PPC budget planning for startups, and Google Ads vs Facebook Ads comparison.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations covering remaining topics: Instagram account recovery after a hack, Instagram algorithm myths debunked, scheduling Instagram posts with tools, Instagram Guides feature for businesses, micro-influencer marketing ROI; YouTube copyright issues and fair use, YouTube shorts monetization, YouTube analytics audience retention explained, YouTube premiere feature, and YouTube channel branding (watermark, banner, trailer).
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 conversations: local SEO tools comparison (Moz Local, BrightLocal, Whitespark), Google Business Profile suspension and recovery, local SEO for newly opened businesses, GBP booking feature setup, local SEO content marketing strategy, GBP for home-based businesses, handling fake negative reviews, local SEO vs organic SEO differences, GBP attributes and why they matter, and local SEO for seasonal businesses.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations: personal branding on LinkedIn for business owners, brand storytelling frameworks, employer branding basics, brand color palette selection guide, brand naming mistakes to avoid; WhatsApp Business vs WhatsApp Business API differences, WhatsApp marketing metrics to track, WhatsApp for post-sale follow up, building a WhatsApp community, and WhatsApp for real estate lead nurturing.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 13 conversations (50 conversations).
2. Compile Week 2 progress report.
3. Calculate running totals by category. Ensure balanced representation.
4. Prepare for the quality review phase (Days 16-17).
5. Write 5 conversations to fill category gaps.

### Research Tasks
No formal research. Focus entirely on production.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 500 conversations. Week 2 target met.
3. Week 2 progress report from coordinator.

### Quality Checks
End-of-week quality audit: randomly select 5 conversations from each member and score them on the quality checklist. Share scores and feedback.

### Common Mistakes to Watch For
1. Rushing to hit the weekly target and letting quality slip.
2. Conversations becoming formulaic after two weeks of writing.

---

## Day 15 — Advanced Scenarios and Edge Cases

### Objective
Create conversations about advanced scenarios, edge cases, and problem-solving topics that business owners commonly face. Each member writes 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations about Meta Ads problems and troubleshooting: why Facebook Ads are not delivering, how to fix a disapproved ad, dealing with high CPM, reducing ad fatigue, Facebook Ads account disabled and how to recover, low conversion rate troubleshooting, ad creative that violates policies, handling high-frequency ads, Facebook Pixel not firing correctly, and low click-through rate fixes.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 troubleshooting conversations: why Google Ads are not showing, fixing a low Quality Score, dealing with click fraud, Google Ads account suspended recovery, high cost per click reduction strategies, Google Ads conversion tracking not working, limited by budget alert resolution, Google Ads disapproved ad fixes, search terms report showing irrelevant queries, and landing page experience improvement.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations: Instagram reach dropping causes and fixes, Instagram shadowban myths and reality, Instagram engagement rate declining solutions, YouTube video not ranking in search, YouTube watch time dropping, dealing with negative comments on YouTube, YouTube channel not growing troubleshooting, Instagram follower count stagnant solutions, YouTube copyright strike resolution, and Instagram content ideas when running out of ideas.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 conversations: Google Business Profile suspended and recovery steps, local rankings dropped suddenly causes, negative SEO attacks on local businesses, competitor listing appearing above yours, duplicate GBP listings, GBP reviews not showing, GBP phone number mismatch issues, local citations with wrong information, GBP category not available for your business, and local SEO audit for underperforming listings.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations: brand reputation damaged by a social media crisis, rebranding without losing existing customers, brand voice inconsistency across channels, brand being copied by a competitor, WhatsApp number blocked due to spam reports and recovery, low WhatsApp broadcast open rates, WhatsApp customer service response time optimization, dealing with negative feedback on WhatsApp, brand confusion between similar brands, and WhatsApp group spam prevention.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 14 conversations (50 conversations).
2. Begin preparing for the quality review phase.
3. Create a quality review checklist spreadsheet for Days 16-17.
4. Write 3 troubleshooting conversations.
5. Update tracker. Running total should be approximately 550.

### Research Tasks
Troubleshooting topics may require specific research into platform help forums and community discussions.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total: approximately 550 conversations.

### Quality Checks
Troubleshooting conversations must clearly identify the problem, explain why it happens, and give step-by-step solutions. Do not just say "contact support."

### Common Mistakes to Watch For
1. Troubleshooting answers that only say "go to settings and fix it" without explaining which settings and what to change.
2. Giving incorrect troubleshooting advice that could make the problem worse.

---

## Day 16 — Quality Review and Curation Day 1

### Objective
Pause new creation. Every member reviews their own past work and the coordinator reviews the full dataset for quality issues, duplicates, and gaps.

### Member 1 Tasks (Meta Ads & Facebook)
1. Re-read every conversation you have created so far (approximately 90 to 100 conversations).
2. Check each one against the quality checklist in Section 23.
3. Fix any conversations that are under 200 words.
4. Fix any conversations with vague or generic advice.
5. Flag any conversations that might be too similar to another conversation.

### Member 2 Tasks (Google Ads & PPC)
1. Re-read all your conversations (approximately 90 to 100).
2. Check against the quality checklist.
3. Fix short or vague responses.
4. Fix any factual inaccuracies discovered during re-reading.
5. Flag potential duplicates.

### Member 3 Tasks (Instagram & YouTube)
1. Re-read all your conversations.
2. Quality-check each one.
3. Fix issues with length, specificity, or accuracy.
4. Ensure there is good balance between Instagram and YouTube topics.
5. Flag duplicates.

### Member 4 Tasks (Local SEO & GBP)
1. Re-read all your conversations.
2. Quality-check each one.
3. Fix issues.
4. Ensure balance between Local SEO and GBP topics.
5. Flag duplicates.

### Member 5 Tasks (Branding & WhatsApp)
1. Re-read all your conversations.
2. Quality-check each one.
3. Fix issues.
4. Ensure balance between Branding and WhatsApp topics.
5. Flag duplicates.

### Coordinator Tasks
1. Run a comprehensive duplicate check across the entire spreadsheet.
2. Identify conversations that are too similar and mark them for rewriting.
3. Check category distribution: are all 8 categories getting adequate coverage?
4. Identify subtopics that are missing and create a gap list.
5. Prepare assignments for the gap-filling conversations.

### Research Tasks
No new research. Focus entirely on review and quality improvement.

### Deliverables
1. All existing conversations reviewed and improved by their creators.
2. Duplicate list from coordinator.
3. Gap list from coordinator.
4. No new conversation count today — quality over quantity.

### Quality Checks
This entire day IS a quality check. Every conversation must pass the checklist.

### Common Mistakes to Watch For
1. Superficial review where members just skim their work and mark it as fine without actually reading it.
2. Not fixing issues that are found because of time pressure.

---

## Day 17 — Quality Review and Curation Day 2

### Objective
Complete the quality review. Rewrite duplicates. Fill topic gaps. Resume creation with improved quality awareness.

### Member 1 Tasks (Meta Ads & Facebook)
1. Rewrite any conversations flagged as duplicates by the coordinator.
2. Write 5 new conversations to fill gaps identified in the Meta Ads category.
3. Review 10 conversations from Member 2 (cross-review for fresh perspective).
4. Note any quality concerns found during cross-review.
5. Update the spreadsheet with all revisions.

### Member 2 Tasks (Google Ads & PPC)
1. Rewrite flagged duplicates.
2. Write 5 new conversations to fill gaps.
3. Cross-review 10 conversations from Member 1.
4. Note concerns.
5. Update spreadsheet.

### Member 3 Tasks (Instagram & YouTube)
1. Rewrite flagged duplicates.
2. Write 5 new conversations to fill gaps.
3. Cross-review 10 conversations from Member 4.
4. Note concerns.
5. Update spreadsheet.

### Member 4 Tasks (Local SEO & GBP)
1. Rewrite flagged duplicates.
2. Write 5 new conversations to fill gaps.
3. Cross-review 10 conversations from Member 3.
4. Note concerns.
5. Update spreadsheet.

### Member 5 Tasks (Branding & WhatsApp)
1. Rewrite flagged duplicates.
2. Write 5 new conversations to fill gaps.
3. Cross-review 10 conversations from Member 5's own work (final self-review).
4. Note concerns.
5. Update spreadsheet.

### Coordinator Tasks
1. Review all cross-review notes from members.
2. Make final decisions on flagged conversations: approve, rewrite, or delete.
3. Update category counts and confirm gap-filling progress.
4. Prepare assignments for the second research sprint (Day 18).
5. Write 3 gap-filling conversations.

### Research Tasks
Research only for gap-filling topics that need factual support.

### Deliverables
1. All duplicates resolved.
2. Gap-filling conversations written (approximately 25 new conversations from gap-filling).
3. Running total should stabilize around 575 to 600 conversations.

### Quality Checks
Cross-review feedback must be constructive and specific. Each reviewer should flag at least 2 conversations for improvement.

### Common Mistakes to Watch For
1. Cross-reviewers being too lenient because they do not want to criticize a teammate.
2. Gap-filling conversations being rushed and lower quality than the original conversations.

---

## Day 18 — Second Research Sprint

### Objective
Conduct a focused research sprint to gather new material for the remaining conversations. Each member identifies new topics, angles, and industry-specific scenarios.

### Member 1 Tasks (Meta Ads & Facebook)
1. Research Meta Ads updates and new features released in the last 6 months.
2. Read 3 new case studies about Facebook Ads for Indian businesses.
3. Explore Meta Ads community forums for common advertiser questions.
4. Create a new list of 15 conversation topics based on today's research.
5. Write 5 conversations based on new research findings.

### Member 2 Tasks (Google Ads & PPC)
1. Research Google Ads new features (broad match improvements, AI-powered campaigns).
2. Read 3 new case studies about PPC for Indian service businesses.
3. Explore Google Ads community forums for common questions.
4. Create a list of 15 new conversation topics.
5. Write 5 conversations based on new research.

### Member 3 Tasks (Instagram & YouTube)
1. Research Instagram 2024-2025 feature updates and algorithm changes.
2. Research YouTube Shorts monetization updates and strategy shifts.
3. Read 3 case studies about brands growing on Reels and Shorts.
4. Create a list of 15 new conversation topics.
5. Write 5 conversations based on new research.

### Member 4 Tasks (Local SEO & GBP)
1. Research Google Business Profile new features and 2024-2025 updates.
2. Read the latest local search ranking factor studies.
3. Explore local SEO forums for common questions from business owners.
4. Create a list of 15 new conversation topics.
5. Write 5 conversations based on new research.

### Member 5 Tasks (Branding & WhatsApp)
1. Research WhatsApp Business platform updates and new features.
2. Read 3 case studies about Indian brands with strong brand identities.
3. Explore branding forums and communities for common questions.
4. Create a list of 15 new conversation topics.
5. Write 5 conversations based on new research.

### Coordinator Tasks
1. Review Day 17 work (gap-filling and cross-review results).
2. Compile the new topic lists from all members (75 new topics total).
3. Remove any overlap with existing conversations.
4. Write 3 conversations.
5. Update tracker. Running total should be approximately 625 to 650.

### Research Tasks
This entire day is a research day. Every member should spend at least 2 hours on research.

### Deliverables
1. 15 new topics per member (75 total).
2. 5 conversations per member (25 total).
3. Updated source logs.

### Quality Checks
New conversations from fresh research should bring renewed energy and quality. Verify that they cover genuinely new angles, not rehashes of existing conversations.

### Common Mistakes to Watch For
1. "New" topics that are just rephrased versions of topics already covered.
2. Research that does not translate into actionable conversation content.

---

## Day 19 — Creation Sprint Resumes

### Objective
Resume full-speed creation with fresh research material. Each member writes 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 10 conversations on new topics from Day 18 research: Meta Advantage+ Shopping campaigns, Facebook Ads for B2B companies, Messenger Ads for lead capture, Instagram Stories ads optimization, Meta Ads creative hub usage, Facebook Group promotion through ads, carousel ad storytelling techniques, audience exclusions to reduce waste, daily budget vs lifetime budget comparison, and Meta Ads for nonprofit fundraising.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 conversations: Google Ads for healthcare providers, PPC landing page copywriting, Google Ads automated rules setup, Google Ads for subscription services, Google Ads API basics, YouTube masthead ad overview, Google Ads customer match, Google Ads for high-ticket B2B services, Google Ads for mobile app downloads, and PPC for seasonal sales events.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations: Instagram broadcast channels for business, Instagram close friends feature for VIP customers, Instagram collaborative posts, YouTube Shorts editing workflow, YouTube community guidelines compliance, Instagram bio optimization tools, YouTube end screen best practices, Instagram pinned posts strategy, YouTube keyword research tools, and Instagram vs TikTok for business comparison.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 conversations: local SEO for businesses without a physical address, GBP for multi-practitioner medical clinics, hyperlocal content strategy, local SEO and social media connection, GBP business description keyword optimization, local SEO link building through community sponsorships, GBP appointment URL setup, local SEO for e-commerce with local delivery, GBP short name setup and usage, and local search intent analysis.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations: brand partnership pitch creation, brand tone of voice for different platforms, visual branding for social media, WhatsApp for abandoned cart recovery, WhatsApp interactive buttons for business, brand naming brainstorming techniques, WhatsApp for event invitations and RSVPs, brand identity for personal trainers, WhatsApp for delivery tracking updates, and building a brand community online.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 18 conversations (25 conversations).
2. Begin reviewing Day 19 conversations as they come in.
3. Track progress toward the 700 conversation target for Week 3.
4. Write 3 conversations.
5. Update tracker. Running total should be approximately 700.

### Research Tasks
Minimal. Use existing research from Day 18.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should reach approximately 700 conversations.

### Quality Checks
Conversations from fresh research should feel different in tone and topic from the earlier bulk. Verify variety.

### Common Mistakes to Watch For
1. Mental fatigue causing shorter, less detailed responses.
2. Forgetting to include specific numbers and actionable steps.

---

## Day 20 — Continued Creation and Catch-Up

### Objective
Continue creation. Any member behind target catches up. Each member writes 8 to 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 8 conversations covering remaining topics on the topic list.
2. Focus on any subtopics that are underrepresented in your contribution.
3. Self-review all.
4. Log sources.
5. Check personal count against target (should be approximately 140 conversations by now).

### Member 2 Tasks (Google Ads & PPC)
1. Write 8 conversations on remaining topics.
2. Fill any subtopic gaps.
3. Self-review all.
4. Log sources.
5. Check personal count (target: approximately 140).

### Member 3 Tasks (Instagram & YouTube)
1. Write 8 conversations (maintain good balance between Instagram and YouTube).
2. Fill gaps.
3. Self-review.
4. Log sources.
5. Check count.

### Member 4 Tasks (Local SEO & GBP)
1. Write 8 conversations (maintain balance between Local SEO and GBP).
2. Fill gaps.
3. Self-review.
4. Log sources.
5. Check count.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 8 conversations (maintain balance between Branding and WhatsApp).
2. Fill gaps.
3. Self-review.
4. Log sources.
5. Check count.

### Coordinator Tasks
1. Review Day 19 conversations (50 conversations).
2. Check each member's individual count. Identify anyone behind target.
3. Assign catch-up tasks to members who are behind.
4. Write 3 conversations.
5. Update tracker. Running total should be approximately 740 to 750.

### Research Tasks
Only as needed for specific conversations.

### Deliverables
1. 8 to 10 conversations per member (40 to 50 total).
2. Running total: approximately 750 conversations.

### Quality Checks
At this point in the project, quality should be consistently high. Do a random quality spot-check on 5 conversations.

### Common Mistakes to Watch For
1. Members who are behind target writing quickly and sacrificing quality.
2. Subtopic imbalance within a category (too many on one topic, too few on another).

---

## Day 21 — Complex Multi-Step Conversations

### Objective
Create conversations that involve complex, multi-step marketing scenarios. These are longer and more detailed, targeting advanced users. Each member writes 8 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 8 complex conversations: building a complete Facebook Ads funnel from scratch (awareness, consideration, conversion), launching a new product with a 3-phase Facebook Ads strategy, creating a 30-day Facebook Ads plan for a new business, Facebook Ads audit checklist and improvement plan, complete retargeting strategy from pixel installation to conversion, building and testing 5 different audience segments, complete A/B test plan for ad creative over 2 weeks, and Facebook Ads monthly reporting guide.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 8 complex conversations: building a complete Google Ads account from scratch for a service business, 30-day Google Ads launch plan, complete keyword research workflow from brainstorming to final keyword list, Google Ads quality optimization checklist (10 steps), complete PPC audit and restructure guide, building a multi-campaign account for a multi-service business, Google Ads and Google Analytics integration guide, and monthly PPC reporting template explanation.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 8 complex conversations: building a 30-day Instagram content calendar from scratch, complete Instagram launch plan for a new business, YouTube channel launch strategy step by step over 90 days, complete Instagram Reels strategy from scripting to posting, building a YouTube content production workflow, Instagram growth strategy combining organic and paid, YouTube channel audit and improvement plan, and cross-platform strategy linking Instagram and YouTube.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 8 complex conversations: complete local SEO setup guide for a new business, 90-day local SEO strategy for a competitive market, GBP optimization checklist with 15 items, complete local citation building plan, local SEO monthly reporting guide, GBP crisis response plan for negative reviews, multi-location local SEO strategy, and complete local SEO audit process.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 8 complex conversations: complete brand identity creation process from research to guidelines, brand launch checklist with 20 items, WhatsApp marketing campaign planning from audience to follow-up, complete brand audit process, WhatsApp customer service SOP for a small business, building a brand from scratch in 30 days, WhatsApp for product launch communication plan, and creating a brand style guide with all elements.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 20 conversations.
2. Review initial complex conversations for depth and quality.
3. Write 3 complex cross-category conversations.
4. Update tracker. Running total should be approximately 790 to 800.
5. Begin planning the final sprint phase.

### Research Tasks
Complex conversations may require consulting multiple sources. Budget 30 minutes for research.

### Deliverables
1. 8 conversations per member (40 total).
2. Running total: approximately 800 conversations.

### Quality Checks
Complex conversations must be genuinely multi-step and detailed. If a "complete guide" conversation is under 300 words, it is not detailed enough.

### Common Mistakes to Watch For
1. Creating "complex" conversations that are just longer versions of simple conversations.
2. Multi-step guides that skip important steps.

---

## Day 22 — Complex Conversations Continue

### Objective
Continue creating complex and funnel-related conversations. Each member writes 8 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 8 conversations: Facebook Ads funnel for e-commerce (top, middle, bottom), creating a Facebook Ads creative testing framework, using Meta Ads for cross-selling to existing customers, Facebook Ads for webinar registrations, complete Lookalike Audience strategy from seed to scaling, Facebook Ads budget allocation across funnel stages, Meta Ads for subscription box businesses, and Facebook Ads performance benchmarks by industry.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 8 conversations: PPC funnel strategy (search for high-intent, display for awareness), Google Ads for lead nurturing with remarketing, complete Google Shopping feed optimization, Google Ads for franchise marketing, PPC competitive analysis workflow, Google Ads for real estate lead generation funnel, Google Ads experiment and draft campaigns, and Google Ads performance benchmarks by industry.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 8 conversations: Instagram marketing funnel (attract, engage, convert), YouTube content funnel strategy, Instagram and e-commerce integration complete guide, building a YouTube email list from viewers, Instagram ambassador program setup, YouTube paid sponsorship negotiation guide, Instagram contest and giveaway strategy for growth, and YouTube playlist optimization for session time.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 8 conversations: local SEO and content marketing funnel, GBP for driving foot traffic complete strategy, local SEO competitor benchmarking process, GBP for professional service firms (accounting, legal), local SEO for home service businesses complete guide, local SEO and online reviews comprehensive strategy, GBP for restaurants complete optimization, and local search ranking recovery after algorithm update.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 8 conversations: building a brand funnel from awareness to loyalty, WhatsApp for customer retention strategy, brand consistency audit across all touchpoints, WhatsApp drip messaging sequence for new leads, brand positioning for premium vs budget segments, WhatsApp for two-way customer engagement, building brand equity over time, and WhatsApp marketing compliance and privacy guidelines.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 21 complex conversations (40 conversations).
2. Verify that complex conversations are truly multi-step.
3. Track running total. Should be approximately 840.
4. Write 3 conversations.
5. Begin planning the cross-category review.

### Research Tasks
None unless specific topics require verification.

### Deliverables
1. 8 conversations per member (40 total).
2. Running total: approximately 840 conversations.

### Quality Checks
Funnel-related conversations should clearly explain each funnel stage and its purpose.

### Common Mistakes to Watch For
1. Funnel conversations that only describe the funnel without giving actionable implementation steps.
2. Using marketing jargon without defining it for the reader.

---

## Day 23 — Complex Conversations Final Day

### Objective
Complete complex conversation topics. Each member writes 8 conversations to wrap up multi-step and strategic topics.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 8 remaining complex Meta Ads conversations focusing on strategic and business-outcome topics: measuring Facebook Ads ROI for small businesses, Meta Ads and email marketing integration, Facebook Ads for local store grand opening strategy, using Facebook Ads data to inform product decisions, Meta Ads automation using rules and scheduling, year-over-year Facebook Ads performance analysis, Facebook Ads for seasonal businesses planning guide, and Meta Ads for service-based businesses lead pipeline.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 2 Tasks (Google Ads & PPC)
1. Write 8 conversations: measuring Google Ads ROI for service businesses, Google Ads and CRM integration for lead tracking, PPC for seasonal businesses comprehensive strategy, Google Ads for multi-location businesses, PPC reporting and client communication, Google Ads optimization weekly routine, PPC and organic search combined strategy, and Google Ads for new market entry.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 3 Tasks (Instagram & YouTube)
1. Write 8 conversations: measuring Instagram marketing ROI, Instagram and email marketing integration, YouTube and website traffic connection strategy, social media content repurposing across Instagram and YouTube, building a content team for both platforms, Instagram and YouTube analytics comparison, social media crisis management for Instagram and YouTube, and end-of-year social media strategy planning.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 4 Tasks (Local SEO & GBP)
1. Write 8 conversations: measuring local SEO ROI, local SEO and paid ads combined strategy, GBP and website integration best practices, local SEO end-of-year review process, local SEO for businesses expanding to new locations, GBP for businesses with seasonal hours, local SEO technology stack recommendations, and local SEO future trends and preparation.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 8 conversations: measuring branding ROI and brand equity, WhatsApp and social media integration strategy, brand annual review and refresh process, WhatsApp analytics and performance tracking, building a brand playbook for team members, WhatsApp marketing technology stack, brand and WhatsApp marketing combined strategy for product launches, and future trends in branding and messaging marketing.
2. Enter all. Self-review. Set to Reviewed. Log sources.

### Coordinator Tasks
1. Review Day 22 conversations (40 conversations).
2. Update tracker. Running total should be approximately 880.
3. Prepare for the cross-category review phase starting Day 24.
4. Write 3 conversations.
5. Calculate each member's remaining quota for the final sprint.

### Research Tasks
None unless needed.

### Deliverables
1. 8 conversations per member (40 total).
2. Running total: approximately 880 conversations.

### Quality Checks
These final complex conversations should represent the team's best work. Ensure they are comprehensive, accurate, and uniquely valuable.

### Common Mistakes to Watch For
1. Conversations becoming repetitive in the final stretch.
2. Final conversations feeling rushed or incomplete.

---

## Day 24 — Cross-Category Review and Duplicate Removal

### Objective
Every member reviews conversations from other categories. Identify and remove duplicates. Ensure consistency in quality across all categories.

### Member 1 Tasks (Meta Ads & Facebook)
1. Review 30 conversations from Members 3, 4, and 5 (10 from each).
2. Check for factual accuracy, formatting, and quality.
3. Log any issues found on the review tracking sheet.
4. Write 3 new conversations to replace any that are removed during deduplication.
5. Update the spreadsheet.

### Member 2 Tasks (Google Ads & PPC)
1. Review 30 conversations from Members 3, 4, and 5 (10 from each).
2. Check for quality and accuracy.
3. Log issues.
4. Write 3 replacement conversations.
5. Update spreadsheet.

### Member 3 Tasks (Instagram & YouTube)
1. Review 30 conversations from Members 1, 2, and 5 (10 from each).
2. Check quality.
3. Log issues.
4. Write 3 replacement conversations.
5. Update spreadsheet.

### Member 4 Tasks (Local SEO & GBP)
1. Review 30 conversations from Members 1, 2, and 5 (10 from each).
2. Check quality.
3. Log issues.
4. Write 3 replacement conversations.
5. Update spreadsheet.

### Member 5 Tasks (Branding & WhatsApp)
1. Review 30 conversations from Members 1, 2, and 3 (10 from each).
2. Check quality.
3. Log issues.
4. Write 3 replacement conversations.
5. Update spreadsheet.

### Coordinator Tasks
1. Run a full duplicate check on the entire dataset.
2. Compare all user questions for similarity and flag near-duplicates.
3. Compile all cross-review feedback.
4. Make final decisions on flagged conversations.
5. Update tracker with accurate post-deduplication counts.

### Research Tasks
None.

### Deliverables
1. Cross-review completed for 150 conversations.
2. Duplicates removed and replacements written.
3. Updated conversation count.

### Quality Checks
This day is a quality check. Focus on catching issues that the original creator missed.

### Common Mistakes to Watch For
1. Reviewers passing conversations because they do not understand the other category well enough to judge quality.
2. Removing conversations that are actually different enough to keep.

---

## Day 25 — Cross-Category Review Completion

### Objective
Complete the cross-category review. All flagged conversations are resolved. Dataset is clean and ready for the final creation sprint.

### Member 1 Tasks (Meta Ads & Facebook)
1. Review remaining cross-review assignments.
2. Rewrite any of your conversations that received negative feedback from cross-reviewers.
3. Write 5 new conversations to fill any remaining gaps.
4. Update the spreadsheet.
5. Verify your personal count and quality approval rate.

### Member 2 Tasks (Google Ads & PPC)
1. Complete cross-review assignments.
2. Rewrite flagged conversations.
3. Write 5 gap-filling conversations.
4. Update spreadsheet.
5. Verify personal count.

### Member 3 Tasks (Instagram & YouTube)
1. Complete cross-review assignments.
2. Rewrite flagged conversations.
3. Write 5 gap-filling conversations.
4. Update spreadsheet.
5. Verify count.

### Member 4 Tasks (Local SEO & GBP)
1. Complete cross-review assignments.
2. Rewrite flagged conversations.
3. Write 5 gap-filling conversations.
4. Update spreadsheet.
5. Verify count.

### Member 5 Tasks (Branding & WhatsApp)
1. Complete cross-review assignments.
2. Rewrite flagged conversations.
3. Write 5 gap-filling conversations.
4. Update spreadsheet.
5. Verify count.

### Coordinator Tasks
1. Resolve all remaining flagged conversations.
2. Calculate final gap analysis: what topics are still missing?
3. Assign final sprint topics to each member.
4. Update tracker. Running total should be approximately 920 to 950 after deduplication and new additions.
5. Prepare the final sprint briefing for Day 26.

### Research Tasks
None.

### Deliverables
1. All cross-review issues resolved.
2. 5 new conversations per member (25 total).
3. Running total: approximately 950 conversations.

### Quality Checks
Every resolved conversation must meet the quality standards before being marked as Approved.

### Common Mistakes to Watch For
1. Rushing through rewrites.
2. Writing gap-filling conversations that overlap with existing ones.

---

## Day 26 — Final Creation Sprint Day 1

### Objective
Sprint to hit the 1,000 conversation target. Each member writes 10 conversations focused on remaining gaps and underrepresented topics.

### Member 1 Tasks (Meta Ads & Facebook)
1. Check your assigned gap topics from the coordinator.
2. Write 10 conversations on assigned topics.
3. Focus on variety: different industries, different business sizes, different objectives.
4. Self-review all. Set to Reviewed.
5. Log sources. Update tracker.

### Member 2 Tasks (Google Ads & PPC)
1. Write 10 conversations on assigned gap topics.
2. Ensure variety in industries and question types.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Update tracker.

### Member 3 Tasks (Instagram & YouTube)
1. Write 10 conversations on assigned gap topics.
2. Maintain balance between Instagram and YouTube.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Update tracker.

### Member 4 Tasks (Local SEO & GBP)
1. Write 10 conversations on assigned gap topics.
2. Maintain balance between Local SEO and GBP.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Update tracker.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 10 conversations on assigned gap topics.
2. Maintain balance between Branding and WhatsApp.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Update tracker.

### Coordinator Tasks
1. Review Day 25 conversations.
2. Monitor sprint progress in real-time.
3. Provide immediate feedback on submitted conversations.
4. Write 5 conversations.
5. Update tracker. Running total should reach approximately 1,000 to 1,010.

### Research Tasks
Only as needed for specific unfamiliar topics.

### Deliverables
1. 10 conversations per member (50 total).
2. Running total should hit approximately 1,000.

### Quality Checks
Even in a sprint, quality must not drop. The coordinator should spot-check 3 conversations per member.

### Common Mistakes to Watch For
1. Sacrificing quality for quantity in the final sprint.
2. Writing conversations on topics that already have sufficient coverage.

---

## Day 27 — Final Creation Sprint Day 2

### Objective
Exceed the 1,000 conversation minimum. Build a buffer of extra conversations. Each member writes 8 to 10 conversations.

### Member 1 Tasks (Meta Ads & Facebook)
1. Write 8 to 10 final conversations on any remaining Meta Ads topics.
2. Prioritize unique, interesting scenarios that have not been covered.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Calculate final personal count.

### Member 2 Tasks (Google Ads & PPC)
1. Write 8 to 10 final conversations.
2. Cover any uncovered angles.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Calculate final personal count.

### Member 3 Tasks (Instagram & YouTube)
1. Write 8 to 10 final conversations.
2. Ensure YouTube has sufficient representation.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Final count.

### Member 4 Tasks (Local SEO & GBP)
1. Write 8 to 10 final conversations.
2. Cover any uncovered subtopics.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Final count.

### Member 5 Tasks (Branding & WhatsApp)
1. Write 8 to 10 final conversations.
2. Cover remaining topics.
3. Self-review. Set to Reviewed.
4. Log sources.
5. Final count.

### Coordinator Tasks
1. Review Day 26 conversations.
2. Track final numbers. Running total should be approximately 1,050 to 1,100.
3. Identify any final quality issues.
4. Write 3 to 5 final conversations.
5. Prepare for the final quality review phase.

### Research Tasks
None.

### Deliverables
1. 8 to 10 conversations per member (40 to 50 total).
2. Running total: approximately 1,050 to 1,100 conversations.

### Quality Checks
Final conversations are the last additions. They must be strong.

### Common Mistakes to Watch For
1. Adding filler conversations just to pad the count.
2. Rushing because "it is almost over."

---

## Day 28 — Final Quality Review

### Objective
No new creation. The entire team focuses on a final quality review of the complete dataset.

### Member 1 Tasks (Meta Ads & Facebook)
1. Re-read every single one of your conversations from beginning to end.
2. Fix any remaining issues: length, accuracy, formatting, specificity.
3. Verify all sources are logged.
4. Confirm that your status column is correctly updated for all conversations.
5. Submit a personal completion report to the coordinator.

### Member 2 Tasks (Google Ads & PPC)
1. Re-read all your conversations.
2. Fix remaining issues.
3. Verify sources.
4. Update statuses.
5. Submit completion report.

### Member 3 Tasks (Instagram & YouTube)
1. Re-read all conversations.
2. Fix issues.
3. Verify sources.
4. Update statuses.
5. Submit completion report.

### Member 4 Tasks (Local SEO & GBP)
1. Re-read all conversations.
2. Fix issues.
3. Verify sources.
4. Update statuses.
5. Submit completion report.

### Member 5 Tasks (Branding & WhatsApp)
1. Re-read all conversations.
2. Fix issues.
3. Verify sources.
4. Update statuses.
5. Submit completion report.

### Coordinator Tasks
1. Receive completion reports from all members.
2. Run a final duplicate check on the entire dataset.
3. Run a final category balance check.
4. Approve remaining conversations in the review queue.
5. Prepare the JSONL conversion plan for Day 29.

### Research Tasks
None.

### Deliverables
1. All conversations reviewed and finalized.
2. Completion reports from all members.
3. Final duplicate check completed.

### Quality Checks
This is the final quality gate. Every conversation that passes today goes into the final dataset.

### Common Mistakes to Watch For
1. Skipping the final review because "I already reviewed these before."
2. Not fixing small issues because they seem minor — small issues compound.

---

## Day 29 — Formatting and JSONL Preparation

### Objective
Convert the spreadsheet data into JSONL format. Verify formatting. Prepare the dataset files for handoff.

### Member 1 Tasks (Meta Ads & Facebook)
1. Export your conversations from the spreadsheet into a category-specific JSONL file.
2. Verify that every line is valid JSON.
3. Check that no responses are cut off or incomplete.
4. Verify character encoding (no broken characters).
5. Submit the JSONL file to the coordinator.

### Member 2 Tasks (Google Ads & PPC)
1. Export your conversations to JSONL format.
2. Verify JSON validity.
3. Check for truncated responses.
4. Check encoding.
5. Submit to coordinator.

### Member 3 Tasks (Instagram & YouTube)
1. Export to JSONL.
2. Verify validity.
3. Check completeness.
4. Check encoding.
5. Submit.

### Member 4 Tasks (Local SEO & GBP)
1. Export to JSONL.
2. Verify validity.
3. Check completeness.
4. Check encoding.
5. Submit.

### Member 5 Tasks (Branding & WhatsApp)
1. Export to JSONL.
2. Verify validity.
3. Check completeness.
4. Check encoding.
5. Submit.

### Coordinator Tasks
1. Receive all JSONL files from members.
2. Merge into a single master JSONL file.
3. Run a JSON validation script on the entire file.
4. Spot-check 20 random entries for accuracy.
5. Prepare the handoff documentation.

### Research Tasks
None.

### Deliverables
1. Individual JSONL files from each member.
2. Master merged JSONL file.
3. JSON validation report.
4. Handoff documentation draft.

### Quality Checks
Every line in the JSONL must parse correctly. Run a validation tool. Fix any parsing errors immediately.

### Common Mistakes to Watch For
1. Incorrect JSON formatting: missing quotes, extra commas, unescaped special characters.
2. Responses that contain line breaks inside the JSON string (line breaks must be replaced with the escape sequence \n).

---

## Day 30 — Final Handoff and Submission

### Objective
Complete all final preparations and hand off the dataset to the training team. Celebrate the team's achievement.

### Member 1 Tasks (Meta Ads & Facebook)
1. Do a final check of your JSONL file.
2. Write a brief category summary: how many conversations in Meta Ads, what subtopics were covered, what industries are represented.
3. Submit the summary to the coordinator.
4. Archive all your personal notes and research materials.
5. Attend the final team meeting.

### Member 2 Tasks (Google Ads & PPC)
1. Final JSONL check.
2. Write category summary.
3. Submit to coordinator.
4. Archive notes.
5. Attend final meeting.

### Member 3 Tasks (Instagram & YouTube)
1. Final JSONL check.
2. Write category summary.
3. Submit to coordinator.
4. Archive notes.
5. Attend final meeting.

### Member 4 Tasks (Local SEO & GBP)
1. Final JSONL check.
2. Write category summary.
3. Submit to coordinator.
4. Archive notes.
5. Attend final meeting.

### Member 5 Tasks (Branding & WhatsApp)
1. Final JSONL check.
2. Write category summary.
3. Submit to coordinator.
4. Archive notes.
5. Attend final meeting.

### Coordinator Tasks
1. Compile all category summaries into a master handoff document.
2. Verify the final JSONL file one last time.
3. Prepare the handoff package: JSONL file, spreadsheet, handoff notes, category summaries, and quality metrics.
4. Submit the handoff package to the training team lead.
5. Lead the final team meeting: share results, celebrate milestones, and gather feedback.

### Research Tasks
None.

### Deliverables
1. Final handoff package submitted to training team.
2. Category summaries from all members.
3. Project completion confirmation.

### Quality Checks
Final spot-check of 10 random conversations from the JSONL file. If all 10 pass, the dataset is ready.

### Common Mistakes to Watch For
1. Forgetting to include the handoff notes with the JSONL file.
2. Submitting the file without a final validation check.

---

#  21 — Weekly Milestones

## Week 1: Days 1 through 7 — Setup, Research, and First Conversations

**Target:** 150 conversations completed.

Week 1 is the foundation phase. During the first two days, every member completes onboarding, reads the handbook, sets up their tools, and writes test conversations to validate their understanding of the format. Days 3 through 5 are dedicated to deep research where members explore Kaggle, HuggingFace, GitHub, industry blogs, and platform documentation to build their knowledge base and create comprehensive topic lists. Days 6 and 7 mark the beginning of the first creation sprint, where each member writes 8 conversations per day, starting with beginner-level topics. By the end of Week 1, the team should have approximately 150 conversations in the spreadsheet, covering beginner and early intermediate topics across all 8 categories. The coordinator should have reviewed and approved at least 80 of these conversations and provided feedback that helps improve quality for Week 2.

## Week 2: Days 8 through 14 — Core Creation Sprint

**Target:** 400 conversations completed (cumulative).

Week 2 is the core production phase. Every member writes 10 conversations per day, covering intermediate and advanced topics. The focus shifts from learning and setup to high-volume, high-quality output. Industry-specific conversations become a major focus, ensuring the dataset covers advice for restaurants, clinics, salons, gyms, real estate, e-commerce, coaching, and other common Indian business types. By Day 14, the team should reach 400 total conversations. The coordinator reviews 40 to 50 conversations daily, maintains the master tracker, and conducts a mid-sprint quality check to catch any systemic issues. The Week 2 progress report should show balanced category coverage and consistently high quality across all members.

## Week 3: Days 15 through 21 — Advanced Creation and First Major Review

**Target:** 700 conversations completed (cumulative).

Week 3 combines continued creation with the first major quality review. Days 15 covers advanced troubleshooting and edge-case scenarios. Days 16 and 17 are dedicated entirely to quality review, where every member re-reads their work, the coordinator checks for duplicates, and cross-reviews are conducted. Day 18 is a second research sprint to refresh the team's knowledge and identify new topics. Days 19 through 21 resume creation with a focus on complex, multi-step conversations that demonstrate strategic marketing thinking. By Day 21, the team should have approximately 700 conversations, with the majority reviewed and approved. The dataset should cover beginner through advanced topics and include conversations about over 15 different business types.

## Week 4: Days 22 through 30 — Final Sprint, Review, and Handoff

**Target:** 1,000 to 1,200 conversations completed (cumulative).

Week 4 is the final push. Days 22 and 23 complete the complex conversation topics. Days 24 and 25 focus on cross-category review and duplicate removal to ensure the dataset is clean. Days 26 and 27 are the final creation sprint to hit and exceed the 1,000 conversation target. Day 28 is a final quality review where every member re-reads their complete body of work. Day 29 is dedicated to JSONL conversion and formatting verification. Day 30 is the handoff day where the final dataset is packaged and submitted to the training team. By the end of Week 4, the team should deliver 1,000 to 1,200 high-quality conversations in a clean, validated JSONL file, supported by a comprehensive handoff document.

---

#  22 — Coordinator SOP (Standard Operating Procedures)

## Daily Procedures

**Morning (9:00 AM to 9:30 AM):** Open the shared spreadsheet. Check the total conversation count. Review overnight messages from team members. Check if any member has flagged conversations for urgent review. Plan the review order for the day.

**Morning Review (9:30 AM to 12:30 PM):** Review all conversations submitted the previous day. For each conversation, check: Is the user question realistic and specific? Is the response at least 200 words? Does the response include specific numbers, steps, or examples? Is the formatting clear? Is the information factually accurate? Is the conversation on-topic for its category? If a conversation passes all checks, change its status to Approved. If it fails any check, write specific feedback in the Notes column explaining what needs to be fixed and change the status back to Draft.

**Afternoon (12:30 PM to 1:00 PM):** Compile feedback from the morning review. Group common issues. Send a summary message to the team highlighting patterns. Send individual messages to members who need to revise specific conversations.

**Afternoon Review (2:00 PM to 3:00 PM):** Run a duplicate check. Compare user questions across the spreadsheet. Flag any two conversations that ask essentially the same question. Assign one to be rewritten.

**Process Improvement (3:00 PM to 4:00 PM):** Update the master tracker with current counts by category, by member, and by status. Identify categories or subtopics that are underrepresented. Research and prepare new topic assignments. Update the handbook if any process changes need to be documented.

**Creation (4:00 PM to 5:00 PM):** Write 3 to 5 conversations yourself, focusing on underrepresented categories or complex topics that serve as quality benchmarks.

**Standup (5:00 PM to 5:30 PM):** Lead the daily standup meeting. Share overall progress, highlight examples of great work, address issues, and assign tasks for the next day.

## Weekly Procedures

**Every Monday:** Review the previous week's numbers. Calculate the approval rate for each member. Identify the member with the highest quality and share their approach with the team. Set the week's targets.

**Every Wednesday:** Conduct a mid-week progress check. If any member is more than 10 conversations behind target, schedule a one-on-one call to understand blockers and provide support.

**Every Friday:** Compile a weekly report with total conversations, category breakdown, quality metrics, and highlights. Share with the team. Plan the following week.

## Review Process

When reviewing a conversation, use this process:
1. Read the user question. Is it realistic? Would a real business owner ask this?
2. Read the first sentence of the response. Does it directly address the question?
3. Scan the response structure. Is it organized with numbered steps or clear paragraphs?
4. Read the full response. Does it include specific numbers, tools, timelines, or metrics?
5. Check the word count. Is it between 200 and 400 words?
6. Verify accuracy. Are the statistics, prices, and platform features mentioned correct?
7. Check for the category match. Does the conversation actually belong in its listed category?
8. Make your decision: Approve, or return with specific feedback for revision.

## Approval Process

A conversation can only be marked as Approved by the coordinator. The three status levels are:
- **Draft:** Written by a member, not yet self-reviewed.
- **Reviewed:** Self-reviewed by the member, submitted for coordinator approval.
- **Approved:** Passed the coordinator's quality review. Ready for the final dataset.

Conversations must progress through all three stages. No conversation can go directly from Draft to Approved.

---

#  23 — Quality Assurance Checklist

Use this checklist to review every conversation before submission. The coordinator uses this same checklist for approval reviews.

1. **Minimum Length:** Is the assistant response at least 200 words?
2. **Maximum Length:** Is the assistant response no longer than 400 words?
3. **Direct Answer:** Does the response directly answer the user's question in the first sentence or two?
4. **Specific Numbers:** Does the response include at least 2 to 3 specific numbers (budgets, timelines, percentages, metrics)?
5. **Actionable Steps:** Does the response include at least 3 specific, actionable steps the user can follow?
6. **Formatting:** Is the response formatted with clear paragraphs or numbered steps?
7. **No Run-On Sentences:** Are there no excessively long run-on sentences?
8. **Spelling and Grammar:** Is the response free of spelling and grammar errors?
9. **Factual Accuracy:** Are all statistics, platform features, and recommendations factually accurate?
10. **On-Topic:** Does the response stay on-topic without unnecessary tangents?
11. **Category Match:** Is the conversation filed under the correct category and subcategory?
12. **Industry Specificity:** If the question mentions a specific industry, does the response include industry-specific advice?
13. **No Plagiarism:** Is the response written in original words, not copied from any source?
14. **Realistic Question:** Is the user question something a real business owner would actually ask?
15. **No Duplicate:** Does the spreadsheet not already have a very similar conversation?
16. **Source Logged:** Is the Source column filled with at least one reference?
17. **Created By Filled:** Is the Created By column filled with the member's name?
18. **Date Filled:** Is the Date column filled with the correct date?
19. **Tone Consistency:** Is the tone professional yet friendly and approachable?
20. **No Jargon Without Explanation:** If marketing jargon is used, is it explained for a non-expert reader?
21. **Completeness:** Does the response cover the topic fully without leaving obvious gaps?
22. **Call to Action:** Does the response end with a clear next step or recommendation?
23. **Platform Accuracy:** Are platform-specific instructions (like menu locations and button names) accurate for the current version?
24. **No Filler:** Does the response avoid filler phrases like "in today's world" or "as we all know"?

---

#  24 — Common Mistakes to Avoid

1. **Writing responses under 200 words.** Every response must be at least 200 words. Short responses are automatically rejected during review.

2. **Being too vague.** Saying "target the right audience" without explaining who that audience is and how to set it up is not helpful. Always give specific parameters.

3. **Including wrong statistics.** Never invent numbers. If you are not sure about a statistic, research it. Wrong numbers in training data will make the LLM give wrong advice to real users.

4. **No structure in responses.** Responses must use numbered steps or clear paragraphs. A wall of text without structure is difficult to read and fails quality review.

5. **Going off-topic.** If the question is about improving Google Ads Quality Score, do not spend half the response explaining the history of Google. Answer the question directly.

6. **Generic advice that applies to any business.** Every response should include advice specific to the business type or industry mentioned in the question.

7. **Copying text from websites.** All responses must be written in your own words. Copying text is plagiarism and will be flagged during review.

8. **Forgetting to fill all spreadsheet columns.** Every column from A to J must be filled for every conversation. Missing data creates problems during JSONL conversion.

9. **Writing duplicate conversations.** Before writing a conversation, check the spreadsheet to make sure no one has already written on the same topic. If in doubt, pick a different angle or industry.

10. **Using outdated information.** Do not reference features or metrics that were accurate in 2020 but have changed. Use current information from 2023 to 2025.

11. **Not self-reviewing before submission.** Always re-read your conversation before changing the status to Reviewed. Many errors are caught during a simple re-read.

12. **Inconsistent formatting.** Use the same formatting style across all your conversations. If you use numbered steps in one, do not use random bullet points in the next without reason.

13. **Starting responses with filler phrases.** Avoid starting with "In the modern digital landscape" or "As we know, marketing is important." Start directly with actionable advice.

14. **Using jargon without explaining it.** If you write "improve your ROAS," make sure you explain that ROAS means Return on Ad Spend and what a good ROAS looks like.

15. **Writing questions that are too simple.** Questions like "What is Facebook?" are too basic for our dataset. Our questions should be from business owners who already know the basics and want practical implementation advice.

16. **Writing questions that are too complex.** Questions like "Explain the mathematical formula behind Google Ads auction" are too academic. Our audience is business owners, not data scientists.

17. **Not including enough variety.** If you write 10 conversations about Facebook Ads, do not make all 10 about campaign setup. Cover different subtopics: targeting, budgets, creative, analytics, optimization.

18. **Forgetting the source log.** Every source you reference must be logged. This creates accountability and allows the coordinator to verify information.

19. **Not attending the daily standup.** The standup is essential for team coordination. Missing it means you miss important updates and feedback.

20. **Ignoring coordinator feedback.** When the coordinator returns a conversation for revision, fix it promptly. Ignoring feedback leads to a growing backlog of unresolved conversations.

21. **Writing in a robotic tone.** The responses should sound like a knowledgeable human marketing advisor, not a textbook. Be friendly, practical, and encouraging.

22. **Including personal opinions as facts.** If you write "Facebook Ads are better than Google Ads," that is an opinion. Present balanced advice and let the user decide based on their specific situation.

23. **Not verifying platform interface details.** If you reference a specific button or menu in Facebook Ads Manager, make sure it actually exists and is in the location you describe. Platform interfaces change frequently.

---

#  25 — Training Handoff Process

The training handoff is the final step in the dataset creation process. This is when we transfer our completed dataset to the training team that will use it to fine-tune the Saadhyam Business LLM. Every step must be done carefully to ensure the training team receives a clean, complete, and usable dataset.

## Step 1 — Organize the Spreadsheet

Before any conversion, the spreadsheet must be organized. Sort all conversations by Category (Column B) so that all Meta Ads conversations are together, all Google Ads conversations are together, and so on. Within each category, sort by Subcategory (Column C). Remove any conversations that are still in Draft status — only Approved conversations go into the final dataset. Delete any rows that were flagged for removal during the cross-category review. Verify that every remaining row has all columns filled correctly.

## Step 2 — Export Category-Specific Files

Export the conversations into category-specific files. Create one JSONL file per category: meta_ads.jsonl, google_ads.jsonl, instagram_marketing.jsonl, youtube_marketing.jsonl, local_seo.jsonl, google_business_profile.jsonl, branding.jsonl, and whatsapp_marketing.jsonl. This allows the training team to fine-tune on specific categories if needed or to combine them into a single training file.

## Step 3 — Create the Master JSONL File

Merge all category-specific JSONL files into one master file called saadhyam_marketing_dataset.jsonl. This file should contain every approved conversation. Verify the total line count matches the total number of approved conversations in the spreadsheet.

## Step 4 — Validate the JSONL File

Run a JSON validation check on every line of the master file. You can use a simple Python script or an online JSON validator. Every line must parse as valid JSON. Check for common issues: unescaped quotation marks inside responses, line breaks that break the JSON format, missing closing braces, and trailing commas. Fix any issues found and re-validate.

## Step 5 — Write Handoff Notes

Create a handoff document that includes the following information:
- Total number of conversations in the dataset.
- Breakdown by category (how many conversations in each category).
- Breakdown by difficulty level (beginner, intermediate, advanced).
- Quality metrics: total conversations created, total approved, approval rate percentage.
- Any known limitations or gaps in the dataset.
- Format used (instruction format or messages format, as defined in Section 18).
- Team members and their category assignments.
- Date range of the project.
- Any special notes about specific conversations (for example, conversations that cover controversial topics or edge cases).

## Step 6 — Prepare the Handoff Package

Assemble the complete handoff package into a single folder. The folder should contain:
1. saadhyam_marketing_dataset.jsonl (master file)
2. Individual category JSONL files (8 files)
3. The original Google Spreadsheet (shared or exported as CSV)
4. The handoff notes document
5. The source log
6. A copy of this handbook (for reference)

## Step 7 — Transfer to Training Team

Share the handoff package folder with the training team lead. Schedule a 30-minute handoff meeting where the coordinator walks the training team through the dataset structure, explains the format, and answers any questions. Confirm that the training team can successfully parse the JSONL file before closing the handoff.

---

#  26 — Final Targets

## Total Conversation Target

The team's goal is to create a minimum of 1,000 and a maximum of 1,200 high-quality training conversations in 30 days. The ideal target is 1,100 conversations, which provides a comfortable buffer above the 1,000 minimum.

## Per Member Target

Each of the 5 team members is responsible for creating 200 to 240 conversations over the 30-day period. This breaks down to approximately 8 to 10 conversations per day during active creation days (Days 6 through 27). The coordinator will also contribute approximately 50 to 80 conversations, primarily focused on gap-filling and quality benchmark examples.

## Breakdown by Category

The conversations should be distributed across categories as follows:

| Category | Target Range | Percentage |
|----------|-------------|------------|
| Meta Ads | 150 to 180 | 15% |
| Google Ads | 150 to 180 | 15% |
| Instagram Marketing | 120 to 150 | 12% |
| YouTube Marketing | 80 to 100 | 8% |
| Local SEO | 100 to 130 | 10% |
| Google Business Profile | 100 to 130 | 10% |
| Branding | 120 to 150 | 12% |
| WhatsApp Marketing | 100 to 130 | 10% |
| Cross-Category Topics | 40 to 60 | 5% to 8% |

These targets ensure balanced representation across all categories while allowing flexibility for naturally deeper categories like Meta Ads and Google Ads.

## Quality Goals

- **Approval Rate:** 90 percent or higher of all created conversations should be approved on the first or second review.
- **Minimum Response Length:** 100 percent of responses must be at least 200 words.
- **Factual Accuracy:** Zero tolerance for factually incorrect statistics or platform instructions. Every fact must be verifiable.
- **Duplicate Rate:** Less than 2 percent of the final dataset should contain near-duplicate conversations.
- **Category Balance:** No category should have less than 8 percent or more than 18 percent of the total conversations.



---



