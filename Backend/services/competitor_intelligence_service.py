"""
Competitor Intelligence AI Service
Tracks competitor advertisements, discounts, customer reviews, social media, pricing updates, and market demand.
Supports Gemini SDK with search grounding and a highly detailed programmatic fallback.
"""

import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import CompetitorIntelligence, BusinessAnalysis
from models.user import User
from services.gemini_business_analysis_service import _make_gemini_request_with_rotation, GEMINI_API_KEYS

logger = logging.getLogger(__name__)


class CompetitorIntelligenceService:
    """
    Service to manage, monitor, and analyze competitor intelligence.
    """

    @staticmethod
    async def get_competitors(user_id: int, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Fetch all tracked competitors for a user.
        """
        try:
            stmt = select(CompetitorIntelligence).where(CompetitorIntelligence.user_id == user_id).order_by(CompetitorIntelligence.created_at.desc())
            result = await db.execute(stmt)
            competitors = result.scalars().all()

            return [
                CompetitorIntelligenceService._serialize_competitor(c)
                for c in competitors
            ]
        except Exception as e:
            logger.error(f"[CompetitorService] Error fetching competitors: {e}", exc_info=True)
            return []

    @staticmethod
    async def get_competitor(user_id: int, competitor_id: int, db: AsyncSession) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific competitor's details.
        """
        try:
            stmt = select(CompetitorIntelligence).where(
                CompetitorIntelligence.id == competitor_id,
                CompetitorIntelligence.user_id == user_id
            )
            result = await db.execute(stmt)
            competitor = result.scalars().first()
            
            if not competitor:
                return None
                
            return CompetitorIntelligenceService._serialize_competitor(competitor)
        except Exception as e:
            logger.error(f"[CompetitorService] Error fetching competitor {competitor_id}: {e}", exc_info=True)
            return None

    @staticmethod
    async def add_competitor(
        user: User,
        name: str,
        location: Optional[str],
        website_or_social: Optional[str],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Add a competitor to monitor, generating analysis via Gemini Grounded Search or Mockup.
        """
        try:
            logger.info(f"[CompetitorService] Starting monitoring scan for competitor '{name}' in '{location}'")

            # 1. Fetch latest BusinessAnalysis to get user's business context if any
            analysis_stmt = (
                select(BusinessAnalysis)
                .where(
                    BusinessAnalysis.user_id == user.id,
                    BusinessAnalysis.analysis_status == 'completed'
                )
                .order_by(BusinessAnalysis.last_analyzed_at.desc())
                .limit(1)
            )
            analysis_result = await db.execute(analysis_stmt)
            analysis = analysis_result.scalars().first()

            business_type = (analysis.business_type if analysis else None) or user.business_type or "Local Business"
            user_business_name = (analysis.business_name if analysis else None) or user.business_name or "My Business"

            has_gemini_keys = len(GEMINI_API_KEYS) > 0
            competitor_data = None
            source = "mock"

            if has_gemini_keys:
                try:
                    logger.info("[CompetitorService] Analyzing competitor with Gemini API (Search Grounding)")
                    competitor_data = await CompetitorIntelligenceService._analyze_with_gemini(
                        name, location or "your locality", website_or_social or "", user_business_name, business_type
                    )
                    source = "gemini"
                except Exception as ex:
                    logger.error(f"[CompetitorService] Gemini analysis failed: {ex}. Falling back to mockup.", exc_info=True)

            if not competitor_data:
                logger.info("[CompetitorService] Utilizing programmatic mock generator for competitor")
                competitor_data = CompetitorIntelligenceService._generate_mock_analysis(
                    name, location or "your locality", business_type
                )
                source = "fallback_mock"

            # 2. Insert into the database
            new_competitor = CompetitorIntelligence(
                user_id=user.id,
                name=name,
                location=location,
                website_or_social=website_or_social,
                activity_score=competitor_data.get("activity_score", 50),
                trending_offers=json.dumps(competitor_data.get("trending_offers", [])),
                review_sentiment=competitor_data.get("review_sentiment", "N/A"),
                pricing_trend=competitor_data.get("pricing_trend", "Stable"),
                ads_data=json.dumps(competitor_data.get("ads_data", {})),
                offers_data=json.dumps(competitor_data.get("offers_data", {})),
                reviews_data=json.dumps(competitor_data.get("reviews_data", {})),
                social_data=json.dumps(competitor_data.get("social_data", {})),
                pricing_data=json.dumps(competitor_data.get("pricing_data", {})),
                demand_data=json.dumps(competitor_data.get("demand_data", {})),
                recommendations=json.dumps(competitor_data.get("recommendations", []))
            )

            db.add(new_competitor)
            await db.flush()  # Populate autoincrement ID
            
            serialized = CompetitorIntelligenceService._serialize_competitor(new_competitor)
            
            await db.commit()
            
            logger.info(f"[CompetitorService] Successfully stored competitor ID #{new_competitor.id} for user {user.id}")
            return {
                "status": "success",
                "source": source,
                "competitor": serialized
            }

        except Exception as e:
            logger.error(f"[CompetitorService] Error adding competitor: {e}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to add competitor: {str(e)}"
            }

    @staticmethod
    async def delete_competitor(user_id: int, competitor_id: int, db: AsyncSession) -> Dict[str, Any]:
        """
        Delete a competitor from tracking.
        """
        try:
            stmt = delete(CompetitorIntelligence).where(
                CompetitorIntelligence.id == competitor_id,
                CompetitorIntelligence.user_id == user_id
            )
            result = await db.execute(stmt)
            await db.commit()

            if result.rowcount == 0:
                return {
                    "status": "error",
                    "message": "Competitor not found or does not belong to user"
                }

            return {
                "status": "success",
                "competitor_id": competitor_id
            }
        except Exception as e:
            logger.error(f"[CompetitorService] Error deleting competitor: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e)
            }

    @staticmethod
    def _serialize_competitor(c: CompetitorIntelligence) -> Dict[str, Any]:
        """
        Convert SQL model object into dict, parsing JSON columns.
        """
        def safe_json_loads(data, default):
            if not data:
                return default
            try:
                return json.loads(data)
            except Exception:
                return default

        return {
            "id": c.id,
            "name": c.name,
            "location": c.location,
            "website_or_social": c.website_or_social,
            "activity_score": c.activity_score,
            "trending_offers": safe_json_loads(c.trending_offers, []),
            "review_sentiment": c.review_sentiment,
            "pricing_trend": c.pricing_trend,
            "ads_data": safe_json_loads(c.ads_data, {}),
            "offers_data": safe_json_loads(c.offers_data, {}),
            "reviews_data": safe_json_loads(c.reviews_data, {}),
            "social_data": safe_json_loads(c.social_data, {}),
            "pricing_data": safe_json_loads(c.pricing_data, {}),
            "demand_data": safe_json_loads(c.demand_data, {}),
            "recommendations": safe_json_loads(c.recommendations, []),
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        }

    @staticmethod
    async def _analyze_with_gemini(
        name: str,
        location: str,
        website_or_social: str,
        user_business_name: str,
        business_type: str
    ) -> Dict[str, Any]:
        """
        Call Gemini with Search Grounding to research competitor intelligence.
        """
        prompt = f"""
You are Saadhyam AI Competitor Intelligence Agent.
We need to run a real-time competitor audit and scan on the following competitor:
Competitor Name: {name}
Competitor Location: {location}
Competitor Website/Social Link: {website_or_social}

For context, our business is:
My Business Name: {user_business_name}
My Business Type: {business_type}

Using Google Search grounding, look up real information about {name} in {location}. Extract active advertising campaigns, pricing sheets, discount offers, social media engagement patterns (from Instagram/Facebook), and Google Reviews sentiment/patterns. Compile the details into a highly comprehensive, structured JSON.

Return the response ONLY as a JSON object, without markdown code fence wrappers (like ```json), matching this schema:
{{
  "activity_score": 82,
  "review_sentiment": "85% Positive (from 150+ reviews)",
  "pricing_trend": "Premium pricing, discounts on select packages",
  "trending_offers": [
    "15% off first styling treatment",
    "Package discounts"
  ],
  "ads_data": {{
    "facebook_ads": ["List of active Facebook promotions or campaigns..."],
    "instagram_promotions": ["Recent sponsored posts or promotions..."],
    "google_ads": ["Ad text variants running on Google Search..."],
    "local_promotions": ["Local flyer or newspaper coupon campaigns if any..."],
    "summary": "High-level summary of their overall ad strategy."
  }},
  "offers_data": {{
    "discount_campaigns": ["Details of flat discount campaigns..."],
    "bundle_offers": ["Combo services or package offers..."],
    "limited_time_deals": ["Offers expiring soon..."],
    "summary": "Analysis of their discount frequency."
  }},
  "reviews_data": {{
    "sources": ["Google Maps", "Facebook Reviews"],
    "positive_patterns": ["Reviewers highly praise speed/friendliness..."],
    "negative_patterns": ["Frequent complaints about long wait times..."],
    "summary": "Key review takeaways."
  }},
  "social_data": {{
    "channels": ["Instagram", "Facebook"],
    "engagement_trends": "Strong engagement on Reels, moderate on text posts.",
    "follower_growth": "Gained 300+ followers in last 30 days (+5%).",
    "summary": "Social content overview."
  }},
  "pricing_data": {{
    "level": "Above market average / Premium positioning",
    "price_changes": ["Increased standard consultation fee by 10%..."],
    "summary": "Analysis of their price changes."
  }},
  "demand_data": {{
    "search_trends": "Rising search queries for their brand name.",
    "buying_behavior": "Customers prefer weekend bookings, weekdays are lower demand.",
    "market_demand_signals": ["High demand in local neighborhood for organic/vegan alternatives..."],
    "summary": "Comparison of customer search spikes."
  }},
  "recommendations": [
    {{
      "title": "Competitor reviews complain about delay",
      "description": "Reviews indicate customers are frustrated with billing wait times. Run a campaign highlighting Saadhyam's contactless instant checkout.",
      "action": "Launch Campaign",
      "priority": "High",
      "category": "Customer Experience",
      "threat_level": "Medium"
    }},
    {{
      "title": "Price competition on bundle packages",
      "description": "Competitor is gaining traction with combo deals. Introduce a similar bundle package at a 5% lower entry price.",
      "action": "Adjust Pricing",
      "priority": "High",
      "category": "Pricing",
      "threat_level": "High"
    }}
  ]
}}
"""
        response_data = await _make_gemini_request_with_rotation(prompt)
        
        if response_data.get("status") != "success":
            raise Exception("Gemini request was unsuccessful")

        content = response_data.get("content", "").strip()
        
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        parsed_json = json.loads(content)
        return parsed_json

    @staticmethod
    def _generate_mock_analysis(name: str, location: str, business_type: str) -> Dict[str, Any]:
        """
        Generate detailed, contextual mockup competitor analysis based on user's business type.
        """
        btype = business_type.lower()
        
        # 1. Cafe / Food / Restaurant
        if any(w in btype for w in ["cafe", "restaurant", "food", "bakery", "coffee", "dine"]):
            return {
                "activity_score": 85,
                "review_sentiment": "88% Positive (from 320 reviews)",
                "pricing_trend": "Slightly cheaper on weeknight dinner combos",
                "trending_offers": [
                    "Buy 1 Get 1 Free Mocktails (Tues-Thurs)",
                    "15% student discount coupon"
                ],
                "ads_data": {
                    "facebook_ads": ["Sponsored post: Weekend Brunch Buffet with live music registration"],
                    "instagram_promotions": ["Reel promotion showing cheese pull pizza with 40k views"],
                    "google_ads": ["Search Ad: Top Rated Italian Cafe in Bangalore. Book Table Online!"],
                    "local_promotions": ["Printed pamphlets offering free coffee with any dessert order"],
                    "summary": "Focused heavily on visual Instagram promotions and Google Local Search optimization."
                },
                "offers_data": {
                    "discount_campaigns": ["15% discount on delivery orders above ₹799"],
                    "bundle_offers": ["Family Combo: 2 Pizzas + Garlic Bread + Drinks for ₹999"],
                    "limited_time_deals": ["Free dessert on orders placed before 7 PM today"],
                    "summary": "Frequently uses limited-time combos to boost average order value."
                },
                "reviews_data": {
                    "sources": ["Google Maps", "Zomato", "Instagram Reviews"],
                    "positive_patterns": ["Customers love the aesthetic ambiance", "Quick table seating"],
                    "negative_patterns": ["Food delivery gets delayed during rainy hours", "Valet parking is limited"],
                    "summary": "Ambiance and speed are highly praised, but logistics and delivery timing are areas of customer dissatisfaction."
                },
                "social_data": {
                    "channels": ["Instagram", "Facebook", "TikTok"],
                    "engagement_trends": "Highly active on Reels with food-influencer collaborations.",
                    "follower_growth": "Gained 1,200 followers (+12%) after a local influencer review.",
                    "summary": "Social presence is highly engaging, utilizing high-quality short video formats."
                },
                "pricing_data": {
                    "level": "Moderate / Competitive with nearby cafes",
                    "price_changes": ["Increased prices of gourmet coffees by ₹30 last week"],
                    "summary": "Pricing remains stable, but beverages are marked up above the market average."
                },
                "demand_data": {
                    "search_trends": "Search volume for 'iced lattes' and 'work cafes' in the area has risen 40%.",
                    "buying_behavior": "Heavy rush between 4 PM to 8 PM, low occupancy during lunch hours.",
                    "market_demand_signals": ["Growing local requests for vegan/gluten-free desserts"],
                    "summary": "Local market demand shifts strongly toward cold coffee formulations and workspace-friendly cafes."
                },
                "recommendations": [
                    {
                        "title": "Competitor cheese-pull reel is viral",
                        "description": f"Competitor '{name}' is gaining strong engagement on Instagram. Recommended: film and post 3 reels showcasing Saadhyam's signature desserts this week.",
                        "action": "Create Post",
                        "priority": "High",
                        "category": "Content",
                        "threat_level": "Medium"
                    },
                    {
                        "title": "Valet parking complaints are rising",
                        "description": f"Customers are complaining about parking at '{name}'. Recommended: launch a local campaign highlighting Saadhyam's ample free parking spaces.",
                        "action": "Launch Campaign",
                        "priority": "Medium",
                        "category": "Customer Experience",
                        "threat_level": "Low"
                    },
                    {
                        "title": "Competitor mid-week combo deals",
                        "description": f"Mid-week dinner combos are drawing local traffic to '{name}'. Launch a competitive Tuesday combo offer to retain market share.",
                        "action": "Create Offer",
                        "priority": "High",
                        "category": "Pricing",
                        "threat_level": "High"
                    }
                ]
            }
            
        # 2. Salon / Spa / Beauty
        elif any(w in btype for w in ["salon", "spa", "beauty", "hair", "nails", "makeup", "groom"]):
            return {
                "activity_score": 78,
                "review_sentiment": "82% Positive (from 180 reviews)",
                "pricing_trend": "Increasing pricing on advanced treatments, offering discounts on basics",
                "trending_offers": [
                    "Free hair wash with any haircut",
                    "20% off bridal package booking"
                ],
                "ads_data": {
                    "facebook_ads": ["Local sponsored post: Get party-ready this festive season with 15% discount"],
                    "instagram_promotions": ["Before/After carousel posts showing hair transformation"],
                    "google_ads": ["Search Ad: Best Hair Salon in Bangalore. Book Appointment Today!"],
                    "local_promotions": ["Partnership with local gyms offering gym members 10% discount cards"],
                    "summary": "Active local geotargeting on Instagram showcasing before/after styling transformations."
                },
                "offers_data": {
                    "discount_campaigns": ["Flat 15% off on weekdays between 11 AM to 4 PM"],
                    "bundle_offers": ["Hair Spa + Head Massage + Pedicure combo for ₹1499"],
                    "limited_time_deals": ["Monsoon frizz-control packages valid till end of month"],
                    "summary": "Relies on weekday discounts to fill low-occupancy service slots."
                },
                "reviews_data": {
                    "sources": ["Google Maps", "Justdial"],
                    "positive_patterns": ["Friendly staff", "Expert hair stylists are highly praised"],
                    "negative_patterns": ["Delayed waiting times even with prior bookings", "Upselling of premium products is pushy"],
                    "summary": "Excellent technical service, but front-desk coordination and pushy sales staff frustrate customers."
                },
                "social_data": {
                    "channels": ["Instagram", "Pinterest"],
                    "engagement_trends": "Pinterest boards get high monthly views, Instagram stories drive direct bookings.",
                    "follower_growth": "Steady growth of +4% monthly.",
                    "summary": "Visual styling content dominates, driving highly active user appointment conversions."
                },
                "pricing_data": {
                    "level": "Premium positioning / High-end services",
                    "price_changes": ["Increased global hair coloring packages by ₹400"],
                    "summary": "Pricing is positioned as a luxury tier with high margins on coloring and spas."
                },
                "demand_data": {
                    "search_trends": "Search volume for 'keratin treatment' and 'gel extensions' up 35% locally.",
                    "buying_behavior": "Bookings are heavily concentrated on weekends (Fri-Sun).",
                    "market_demand_signals": ["Rising preference for chemical-free, organic hair products"],
                    "summary": "Local market demand shifts toward organic treatments and professional nail extensions."
                },
                "recommendations": [
                    {
                        "title": "Complaints about pushy product upselling",
                        "description": f"Customers are reacting negatively to product pushiness at '{name}'. Launch a social post highlighting Saadhyam's transparent, relaxation-first booking experience.",
                        "action": "Create Post",
                        "priority": "Medium",
                        "category": "Customer Experience",
                        "threat_level": "Low"
                    },
                    {
                        "title": "Rise in Keratin Treatment searches",
                        "description": "Local search volume for keratin styling is spiking. Launch a targeted campaign on Meta Ads offering a premium treatment package.",
                        "action": "Run Campaign",
                        "priority": "High",
                        "category": "Campaign",
                        "threat_level": "High"
                    }
                ]
            }

        # 3. Agency / Software / Tech / Digital
        elif any(w in btype for w in ["software", "agency", "tech", "digital", "consult", "marketing", "web"]):
            return {
                "activity_score": 90,
                "review_sentiment": "92% Positive (from 60 reviews)",
                "pricing_trend": "Value-based project pricing, free initial consultation",
                "trending_offers": [
                    "Free SEO audit & local visibility analysis",
                    "No-code landing page free with annual retainer"
                ],
                "ads_data": {
                    "facebook_ads": ["B2B Ad: Grow your business leads by 3x. Download our free ebook."],
                    "instagram_promotions": ["Carousel posts explaining SEO algorithms & UI best practices"],
                    "google_ads": ["Search Ad: Top Rated Digital Marketing Agency Bangalore. Free Quote!"],
                    "local_promotions": ["Offline workshop flyers for small business owners on digital setups"],
                    "summary": "B2B performance marketing centered around lead magnets (free audits, ebooks) on LinkedIn and Google Search."
                },
                "offers_data": {
                    "discount_campaigns": ["10% discount on initial 3-month setup fees"],
                    "bundle_offers": ["Growth bundle: Web Design + SEO Optimization + Social Retainer"],
                    "limited_time_deals": ["Free Google Maps verification for local shops this week only"],
                    "summary": "Uses free audits as a primary client acquisition mechanism."
                },
                "reviews_data": {
                    "sources": ["Clutch", "Google Maps", "LinkedIn Recommendations"],
                    "positive_patterns": ["Highly professional communication", "Data-driven dashboards"],
                    "negative_patterns": ["Initial onboarding takes 3 weeks", "Communication gets delayed during crunch weeks"],
                    "summary": "Technical competence is strong, but slow onboarding and customer response lags are noted."
                },
                "social_data": {
                    "channels": ["LinkedIn", "YouTube", "Twitter"],
                    "engagement_trends": "LinkedIn posts receive high engagement, YouTube tutorials get steady traffic.",
                    "follower_growth": "Strong LinkedIn network growth (+15% monthly).",
                    "summary": "Thought leadership content establishes credibility and draws organic enterprise queries."
                },
                "pricing_data": {
                    "level": "Mid to Premium retainer pricing",
                    "price_changes": ["Raised minimum monthly retainer from ₹25,000 to ₹35,000"],
                    "summary": "Shifted pricing structure upward to focus on higher-value enterprise clients."
                },
                "demand_data": {
                    "search_trends": "Hyperlocal searches for 'AI Integration' and 'AEO / Voice Search Optimization' up 60%.",
                    "buying_behavior": "Decision makers prefer long consultation calls before signing contracts.",
                    "market_demand_signals": ["Local companies increasingly requesting custom CRM integrations"],
                    "summary": "Market shifts away from standard web templates toward AI-driven workflows and search optimization."
                },
                "recommendations": [
                    {
                        "title": "Competitor offering Free SEO Audits",
                        "description": f"'{name}' is acquiring small business clients by offering free local visibility audits. Recommended: Launch Saadhyam's AEO scanner landing page to capture these leads first.",
                        "action": "Generate Leads",
                        "priority": "High",
                        "category": "Campaign",
                        "threat_level": "High"
                    },
                    {
                        "title": "Onboarding delays noted at competitor",
                        "description": f"Clients are unhappy with slow kickoff at '{name}'. Highlight Saadhyam's 24-hour rapid setup guarantee on your landing pages.",
                        "action": "Pitch Website",
                        "priority": "Medium",
                        "category": "Customer Experience",
                        "threat_level": "Medium"
                    }
                ]
            }

        # Default Generic fallback
        else:
            return {
                "activity_score": 70,
                "review_sentiment": "80% Positive (from 95 reviews)",
                "pricing_trend": "Stable pricing, holiday seasonal discounts",
                "trending_offers": [
                    "Buy 2 Get 1 Free on all items",
                    "10% cashback on loyalty app registrations"
                ],
                "ads_data": {
                    "facebook_ads": ["Standard product photo catalog ad with local shipping discount"],
                    "instagram_promotions": ["Carousel posts detailing product features & user feedback"],
                    "google_ads": ["Search Ad: Buy Quality Products Online. Best Prices, Fast Shipping!"],
                    "local_promotions": ["Local newspaper ads detailing branch relocation discounts"],
                    "summary": "Relies on generic product promotion and retail-based local marketing channels."
                },
                "offers_data": {
                    "discount_campaigns": ["Seasonal clearance: up to 30% off old stock"],
                    "bundle_offers": ["Starter kit bundle: buy main product and get secondary items 50% off"],
                    "limited_time_deals": ["Weekend flash sale: 15% site-wide discount"],
                    "summary": "Maintains seasonal pricing structures with occasional discount codes."
                },
                "reviews_data": {
                    "sources": ["Google Maps", "Trustpilot"],
                    "positive_patterns": ["Good product quality", "Friendly customer support staff"],
                    "negative_patterns": ["Exchange process takes too long", "Limited payment options at offline counter"],
                    "summary": "Reliable quality, but customer return policies and payment flexibility require improvement."
                },
                "social_data": {
                    "channels": ["Instagram", "Facebook"],
                    "engagement_trends": "Moderate comment section activity, low video views.",
                    "follower_growth": "Stable, matching local demographic growth (+2% monthly).",
                    "summary": "Maintains basic branding presence with low video engagement."
                },
                "pricing_data": {
                    "level": "Average / Value positioning",
                    "price_changes": ["Adjusted baseline pricing up by 5% due to supply costs"],
                    "summary": "Follows standard market rates closely without premium positioning."
                },
                "demand_data": {
                    "search_trends": "Search volume for 'same-day local delivery' up 50% in this area.",
                    "buying_behavior": "Spike in orders on holidays, stable during regular weekdays.",
                    "market_demand_signals": ["Customers demanding WhatsApp order integrations"],
                    "summary": "Demand shifts toward fast delivery services and conversational ordering interfaces."
                },
                "recommendations": [
                    {
                        "title": "Demand for Same-Day Local Delivery",
                        "description": f"Competitor '{name}' has not optimized local delivery formats. Recommended: Launch Saadhyam's WhatsApp automated sales bot to offer instant order taking and express shipping.",
                        "action": "Contact now",
                        "priority": "High",
                        "category": "Customer Experience",
                        "threat_level": "High"
                    },
                    {
                        "title": "Low engagement on competitor video channels",
                        "description": f"'{name}' is only posting images. Recommended: post 3 short high-quality reels on Instagram detailing your product utility to capture the local audience.",
                        "action": "Create Post",
                        "priority": "Medium",
                        "category": "Content",
                        "threat_level": "Low"
                    }
                ]
            }

    @staticmethod
    def suggest_competitors(business_type: str, query: str = "") -> List[str]:
        """
        Generate list of suggested local competitor names based on business type and optional search query.
        These are generic suggestions to help users discover common competitors to track.
        """
        btype = business_type.lower() if business_type else ""
        query_lower = query.lower().strip()

        suggestions_map = {
            "cafe": [
                "Café Coffee Day", "Starbucks", "Third Wave Coffee", "Blue Tokai", "Dyu Art Café",
                "Matteo Coffea", "Filter Story", "Araku Coffee", "InstaCuppa", "Brewberrys",
                "The Coffee Co.", "Social", "Kitty Ko", "Hole in the Wall Café", "Smoke House Deli"
            ],
            "restaurant": [
                "Barbeque Nation", "Punjab Grill", "Truffles", "The Fatty Bao", "Ab's - Absolute Barbecues",
                "Meghana Foods", "CTR (Shivaji Military Hotel)", "Vidyarthi Bhavan", "Brahmin's Coffee Bar",
                "Permit Room", "Toit Brewpub", "Prost Brewpub", "Ebony", "Only Fish", "Rameshwaram Café"
            ],
            "bakery": [
                "Iyengar Bakery", "Daily Bread", "Sweet Chariot", "Corner House", "Baskin Robbins",
                "Mani's Dum Biryani", "Ribbon Bakes", "Cakeaway", "The Belgian Waffle Co.", "Krispy Kreme"
            ],
            "salon": [
                "Naturals Salon", "Lakmé Salon", "Green Trends", "YLG Salon", "Enrich Salon",
                "VLCC", "Jawed Habib Hair & Beauty", "L'Oréal Professionnel Salon", "Tony & Guy",
                "Geetanjali Salon", "Jean-Claude Biguine", "Truefitt & Hill", "Toni&Guy",
            ],
            "spa": [
                "O2 Spa", "Four Fountains De-Stress Spa", "Kaya Skin Clinic", "Aura Thai Spa",
                "Vedic Sutra Wellness", "Tattva Spa", "Ananda in the Himalayas", "Clarins Spa",
                "Lotus Spa", "Shreyas Retreat"
            ],
            "gym": [
                "Gold's Gym", "Cult Fit", "Anytime Fitness", "Snap Fitness", "Fitness First",
                "CrossFit", "Golds Gym", "The Altitude Gym", "Planet Fitness", "1MORE Gym"
            ],
            "retail": [
                "Big Bazaar", "Reliance Digital", "Croma", "Lifestyle", "Max Fashion",
                "Westside", "H&M", "Zara", "Miniso", "Decathlon"
            ],
            "jewelry": [
                "Tanishq", "Malabar Gold & Diamonds", "PC Jeweller", "Kalyan Jewellers",
                "Senco Gold", "Jos Alukkas", "Joyalukkas", "Bhima Jewellers", "PNG Jewellers"
            ],
            "software": [
                "Infosys", "Wipro", "TCS", "HCL Technologies", "Mphasis",
                "Mindtree", "Persistent Systems", "Hexaware", "Tech Mahindra", "Zensar"
            ],
            "agency": [
                "WATConsult", "iProspect", "Dentsu Digital", "Ogilvy India",
                "Schbang", "Social Beat", "Webchutney", "JWT", "Grey India", "FCB Ulka"
            ],
            "hospital": [
                "Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals", "Columbia Asia",
                "Narayana Health", "Aster Hospitals", "BGS Gleneagles", "Sakra World Hospital"
            ],
            "pharmacy": [
                "Apollo Pharmacy", "MedPlus", "Netmeds", "1mg", "PharmEasy",
                "Wellness Forever", "Piramal Pharma", "Sastasundar"
            ],
        }

        # Map business type to category
        matched_key = None
        if any(w in btype for w in ["cafe", "coffee", "tea"]):
            matched_key = "cafe"
        elif any(w in btype for w in ["restaurant", "food", "dine", "biryani", "dhaba"]):
            matched_key = "restaurant"
        elif any(w in btype for w in ["bakery", "bake", "cake", "pastry"]):
            matched_key = "bakery"
        elif any(w in btype for w in ["salon", "hair", "beauty", "nail", "makeup", "groom"]):
            matched_key = "salon"
        elif any(w in btype for w in ["spa", "massage", "wellness", "ayurved"]):
            matched_key = "spa"
        elif any(w in btype for w in ["gym", "fitness", "crossfit", "yoga"]):
            matched_key = "gym"
        elif any(w in btype for w in ["jewel", "gold", "diamond"]):
            matched_key = "jewelry"
        elif any(w in btype for w in ["software", "saas", "app", "tech", "it "]):
            matched_key = "software"
        elif any(w in btype for w in ["agency", "digital", "marketing", "brand", "media"]):
            matched_key = "agency"
        elif any(w in btype for w in ["hospital", "clinic", "health", "medical", "doctor"]):
            matched_key = "hospital"
        elif any(w in btype for w in ["pharma", "chemist", "drug", "medicine"]):
            matched_key = "pharmacy"
        elif any(w in btype for w in ["retail", "shop", "store", "boutique", "fashion"]):
            matched_key = "retail"

        all_suggestions = suggestions_map.get(matched_key, [
            "Swiggy", "Zomato", "Urban Company", "OYO", "Ola",
            "Lenskart", "Mamaearth", "boAt", "mCaffeine", "WOW Skin Science",
            "Sugar Cosmetics", "Nykaa", "Myntra", "BigBasket", "JioMart"
        ])


        # Filter by query if provided
        if query_lower:
            filtered = [s for s in all_suggestions if query_lower in s.lower()]
            return filtered[:8] if filtered else all_suggestions[:8]

        return all_suggestions[:10]


# Global instance
competitor_intelligence_service = CompetitorIntelligenceService()

