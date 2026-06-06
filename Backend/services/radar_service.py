"""
Radar AI (Opportunity Radar) Service
Proactively scans for growth opportunities (nearby, seasonal, B2B, trends) for the user's business.
Supports Gemini AI with search grounding when keys are available, and a highly detailed programmatic fallback otherwise.
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import RadarOpportunity, BusinessAnalysis
from models.user import User
from services.gemini_business_analysis_service import _make_gemini_request_with_rotation, GEMINI_API_KEYS

logger = logging.getLogger(__name__)


class RadarService:
    """
    Service to manage, scan, and update proactive growth opportunities.
    """

    @staticmethod
    async def get_opportunities(
        user_id: int,
        db: AsyncSession,
        category: Optional[str] = None,
        status: Optional[str] = "active"
    ) -> List[Dict[str, Any]]:
        """
        Fetch opportunities for a user, sorted by urgency and created time.
        """
        try:
            stmt = select(RadarOpportunity).where(RadarOpportunity.user_id == user_id)
            if status:
                stmt = stmt.where(RadarOpportunity.status == status)
            if category:
                stmt = stmt.where(RadarOpportunity.category == category)
            
            # Sort order: Urgency (high -> medium -> low), then created_at desc
            result = await db.execute(stmt)
            opportunities = result.scalars().all()
            
            # Custom sorting to put "high" first, then "medium", then "low"
            urgency_map = {"high": 0, "medium": 1, "low": 2}
            sorted_opps = sorted(
                opportunities,
                key=lambda o: (urgency_map.get(o.urgency.lower() if o.urgency else "medium", 1), -(o.created_at.timestamp() if o.created_at else 0))
            )

            return [
                {
                    "id": opp.id,
                    "title": opp.title,
                    "description": opp.description,
                    "category": opp.category,
                    "estimated_value": opp.estimated_value,
                    "urgency": opp.urgency,
                    "distance": opp.distance,
                    "action_label": opp.action_label,
                    "action_link": opp.action_link,
                    "status": opp.status,
                    "created_at": opp.created_at.isoformat() if opp.created_at else None,
                }
                for opp in sorted_opps
            ]
        except Exception as e:
            logger.error(f"[RadarService] Error fetching opportunities: {e}", exc_info=True)
            return []

    @staticmethod
    async def scan_opportunities(user: User, db: AsyncSession) -> Dict[str, Any]:
        """
        Scan and generate new opportunities for the user's business.
        Uses Gemini if keys are available, otherwise falls back to a detailed contextual mock.
        """
        try:
            logger.info(f"[RadarService] Scanning opportunities for user {user.id}")

            # 1. Fetch latest BusinessAnalysis to get business context
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

            # Extract business details
            business_name = (analysis.business_name if analysis else None) or user.business_name or "Your Business"
            business_type = (analysis.business_type if analysis else None) or user.business_type or "Local Business"
            location = (analysis.location if analysis else None) or user.business_location or "your locality"
            services = (analysis.services if analysis else None) or ""
            description = user.business_description or ""

            # Check if Gemini API is available
            has_gemini_keys = len(GEMINI_API_KEYS) > 0
            
            opportunities = []
            source = "mock"

            if has_gemini_keys:
                try:
                    logger.info("[RadarService] Generating opportunities with Gemini API")
                    opportunities = await RadarService._scan_with_gemini(
                        business_name, business_type, location, services, description
                    )
                    source = "gemini"
                except Exception as ex:
                    logger.error(f"[RadarService] Gemini generation failed: {ex}. Falling back to mock generator.", exc_info=True)

            if not opportunities:
                logger.info("[RadarService] Using programmatic mock generator")
                opportunities = RadarService._generate_mock_opportunities(business_type, location)
                source = "fallback_mock"

            # 2. Delete existing "active" opportunities to refresh the radar screen
            # Note: We keep "contacted" or "dismissed" opportunities to preserve user history.
            delete_stmt = delete(RadarOpportunity).where(
                RadarOpportunity.user_id == user.id,
                RadarOpportunity.status == "active"
            )
            await db.execute(delete_stmt)

            # 3. Insert new opportunities
            stored_opportunities = []
            for opp_data in opportunities:
                new_opp = RadarOpportunity(
                    user_id=user.id,
                    title=opp_data.get("title", "Growth Opportunity"),
                    description=opp_data.get("description", ""),
                    category=opp_data.get("category", "nearby"),
                    estimated_value=opp_data.get("estimated_value", "N/A"),
                    urgency=opp_data.get("urgency", "medium"),
                    distance=opp_data.get("distance"),
                    action_label=opp_data.get("action_label", "Contact now"),
                    action_link=opp_data.get("action_link", ""),
                    status="active"
                )
                db.add(new_opp)
                stored_opportunities.append(new_opp)

            await db.flush()
            
            opportunities_list = [
                {
                    "id": o.id,
                    "title": o.title,
                    "description": o.description,
                    "category": o.category,
                    "estimated_value": o.estimated_value,
                    "urgency": o.urgency,
                    "distance": o.distance,
                    "action_label": o.action_label,
                    "action_link": o.action_link,
                    "status": o.status
                }
                for o in stored_opportunities
            ]

            await db.commit()
            logger.info(f"[RadarService] Successfully stored {len(stored_opportunities)} opportunities for user {user.id}")

            return {
                "status": "success",
                "source": source,
                "opportunities": opportunities_list
            }

        except Exception as e:
            logger.error(f"[RadarService] Error scanning opportunities: {e}", exc_info=True)
            return {
                "status": "error",
                "message": f"Failed to scan opportunities: {str(e)}"
            }

    @staticmethod
    async def update_opportunity_status(
        opportunity_id: int,
        status: str,
        user_id: int,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Update the status of an opportunity (e.g. mark contacted or dismissed).
        """
        try:
            stmt = (
                update(RadarOpportunity)
                .where(
                    RadarOpportunity.id == opportunity_id,
                    RadarOpportunity.user_id == user_id
                )
                .values(status=status, updated_at=datetime.utcnow())
            )
            result = await db.execute(stmt)
            await db.commit()

            if result.rowcount == 0:
                return {
                    "status": "error",
                    "message": "Opportunity not found or does not belong to user"
                }

            return {
                "status": "success",
                "opportunity_id": opportunity_id,
                "new_status": status
            }
        except Exception as e:
            logger.error(f"[RadarService] Error updating opportunity {opportunity_id}: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e)
            }

    @staticmethod
    async def _scan_with_gemini(
        business_name: str,
        business_type: str,
        location: str,
        services: str,
        description: str
    ) -> List[Dict[str, Any]]:
        """
        Make API call to Gemini with Google Search grounding enabled to fetch live market opportunities.
        """
        prompt = f"""
You are Saadhyam AI Opportunity Radar, a proactive growth intelligence system for business owners.
Analyze the local market, trends, seasonal factors, and potential B2B partnerships for this business:

Business Name: {business_name}
Business Type: {business_type}
Location: {location}
Services Offered: {services}
Description: {description}

Using search grounding where relevant, generate exactly 4 to 5 high-value, highly specific and realistic growth opportunities in the locality or related to current trends and seasonality.

Categories MUST be one of: "nearby", "seasonal", "b2b", "trend"
Each opportunity must contain:
1. "title": A short catchy description (e.g., "3 local dental clinics seeking social media marketing")
2. "description": Detailed explanation of the opportunity, including why it's a match and what the user should do.
3. "category": One of "nearby" (local needs), "seasonal" (holidays/seasons/festivals), "b2b" (vendor/business needs), "trend" (consumer search trends).
4. "estimated_value": Potential revenue, formatted with currency (e.g., "₹45,000", "₹75,000", or "₹1,20,000/month")
5. "urgency": "high", "medium", or "low"
6. "distance": Approximate distance if local (e.g., "2.5 km", "4 km") or null if trend/online
7. "action_label": Action button label (e.g., "Contact now", "Apply", "View Trend", "Pitch Menu")
8. "action_link": Must be one of the existing dashboard sub-routes: "/dashboard/website" (Website builder), "/dashboard/content" (Content creator), "/dashboard/b2b-network" (B2B partnerships), "/dashboard/b2b-chat" (B2B messaging), "/dashboard/meta-ads" (Meta advertising campaigns), or "/dashboard/aeo-geo" (AI Visibility/SEO engine)

Return the response as a JSON array of objects. Do not include markdown code fence wrappers (like ```json), just raw JSON.

JSON Schema:
[
  {{
    "title": "...",
    "description": "...",
    "category": "nearby",
    "estimated_value": "₹75,000",
    "urgency": "high",
    "distance": "2 km",
    "action_label": "Contact now",
    "action_link": "/dashboard/b2b-network"
  }}
]
"""
        response_data = await _make_gemini_request_with_rotation(prompt)
        
        if response_data.get("status") != "success":
            raise Exception("Gemini request was unsuccessful")

        content = response_data.get("content", "").strip()
        
        # Clean up code fence wrappers if Gemini returned them
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        parsed_json = json.loads(content)
        if isinstance(parsed_json, list):
            return parsed_json
        elif isinstance(parsed_json, dict) and "opportunities" in parsed_json:
            return parsed_json["opportunities"]
        
        raise ValueError("Invalid format returned from Gemini")

    @staticmethod
    def _generate_mock_opportunities(business_type: str, location: str) -> List[Dict[str, Any]]:
        """
        Generate detailed, contextual mock opportunities based on business type.
        """
        btype = business_type.lower()
        loc = location or "your locality"

        # 1. Cafe / Restaurant
        if "cafe" in btype or "restaurant" in btype or "food" in btype or "bakery" in btype or "coffee" in btype:
            return [
                {
                    "title": "2 local office parks looking for daily lunch catering",
                    "description": "Both offices (holding ~120 employees combined) are looking to outsource clean, healthy vegetarian lunch meal boxes starting next week.",
                    "category": "nearby",
                    "estimated_value": "₹55,000/month",
                    "urgency": "high",
                    "distance": "1.8 km",
                    "action_label": "Pitch Menu",
                    "action_link": "/dashboard/content"
                },
                {
                    "title": "Upcoming Summer Food Stall Registrations Open",
                    "description": "The annual local township carnival is accepting food vendor slots. Cafe/bakery items have historically generated high margins at this event.",
                    "category": "seasonal",
                    "estimated_value": "₹45,000 potential",
                    "urgency": "high",
                    "distance": "3.5 km",
                    "action_label": "Register Stall",
                    "action_link": "/dashboard/b2b-network"
                },
                {
                    "title": "B2B partnership request: Nearby Co-working space snack bar",
                    "description": "Innovate Co-work is seeking a local bakery/cafe partner to stock fresh snacks, sandwich boxes, and cold brew bottles daily in their pantry.",
                    "category": "b2b",
                    "estimated_value": "₹30,000/month",
                    "urgency": "medium",
                    "distance": "2.2 km",
                    "action_label": "Submit Proposal",
                    "action_link": "/dashboard/b2b-chat"
                },
                {
                    "title": "Local search volume for 'Cold Brew Coffee' up 45%",
                    "description": "High demand spike in your area for cold brews and iced refreshers due to rising summer temperatures. Recommend listing summer combos on your menu.",
                    "category": "trend",
                    "estimated_value": "High Trend",
                    "urgency": "medium",
                    "distance": None,
                    "action_label": "Create Offer",
                    "action_link": "/dashboard/content"
                }
            ]

        # 2. Salon / Spa / Beauty
        elif "salon" in btype or "spa" in btype or "beauty" in btype or "hair" in btype or "nails" in btype or "wellness" in btype:
            return [
                {
                    "title": "Wedding group of 8 seeking bridal styling & makeup",
                    "description": "A wedding coordinator is looking for a nearby highly-rated salon to handle hair, nails, and makeup for a bridal party on the upcoming weekend.",
                    "category": "nearby",
                    "estimated_value": "₹38,000",
                    "urgency": "high",
                    "distance": "2.5 km",
                    "action_label": "Send Quote",
                    "action_link": "/dashboard/b2b-chat"
                },
                {
                    "title": "Monsoon Frizz-Control treatment searches rising",
                    "description": "Weather shifts have triggered a 35% increase in local searches for 'deep conditioning' and 'keratin hair treatments'. Launch a targeted offer.",
                    "category": "seasonal",
                    "estimated_value": "₹20,000 potential",
                    "urgency": "medium",
                    "distance": None,
                    "action_label": "Run Campaign",
                    "action_link": "/dashboard/meta-ads"
                },
                {
                    "title": "B2B: Partnership with Local Boutique for Fashion Show",
                    "description": "A boutique hotel is hosting a local clothing launch next month and needs a styling partner to do hair and styling for 6 runway models.",
                    "category": "b2b",
                    "estimated_value": "₹25,000",
                    "urgency": "medium",
                    "distance": "4.1 km",
                    "action_label": "Express Interest",
                    "action_link": "/dashboard/b2b-network"
                },
                {
                    "title": "Spike in local demand for 'Organic Gel Nails'",
                    "description": "Hyperlocal searches for vegan, toxin-free manicures have doubled this week. Introduce organic gel alternatives to attract premium clientele.",
                    "category": "trend",
                    "estimated_value": "Medium Trend",
                    "urgency": "low",
                    "distance": None,
                    "action_label": "Update Menu",
                    "action_link": "/dashboard/content"
                }
            ]

        # 3. Software Agency / Tech / Digital
        elif "software" in btype or "tech" in btype or "digital" in btype or "marketing" in btype or "agency" in btype or "web" in btype or "consult" in btype:
            return [
                {
                    "title": "3 schools nearby searching for website redesign",
                    "description": "Local private educational institutions are looking to upgrade their public portals before the new academic enrollment term starts.",
                    "category": "nearby",
                    "estimated_value": "₹1,20,000",
                    "urgency": "high",
                    "distance": "3.2 km",
                    "action_label": "Pitch Website",
                    "action_link": "/dashboard/website"
                },
                {
                    "title": "B2B Setup: 2 restaurants looking for digital menus & SEO",
                    "description": "Newly opened dining spots are looking to integrate contactless QR-code dining systems and establish a Google Maps listing to capture local foot traffic.",
                    "category": "b2b",
                    "estimated_value": "₹45,000",
                    "urgency": "high",
                    "distance": "1.5 km",
                    "action_label": "Contact Now",
                    "action_link": "/dashboard/b2b-chat"
                },
                {
                    "title": "Exam season approaching - high interest in E-learning tools",
                    "description": "A seasonal spike in search inquiries for local home tuition portals and online learning guides. Recommend pitching web apps to tutoring centers.",
                    "category": "seasonal",
                    "estimated_value": "₹80,000 potential",
                    "urgency": "medium",
                    "distance": None,
                    "action_label": "View Leads",
                    "action_link": "/dashboard/b2b-network"
                },
                {
                    "title": "Local searches for 'AEO / Search Engine Optimization' up 28%",
                    "description": "Small businesses in your postal code are increasingly looking to optimize their web visibility. High time to pitch your SEO package to local stores.",
                    "category": "trend",
                    "estimated_value": "High Trend",
                    "urgency": "medium",
                    "distance": None,
                    "action_label": "Generate Leads",
                    "action_link": "/dashboard/aeo-geo"
                }
            ]

        # 4. Gym / Fitness Studio
        elif "gym" in btype or "fitness" in btype or "yoga" in btype or "sports" in btype or "trainer" in btype:
            return [
                {
                    "title": "Corporate wellness mandate at Tech Park",
                    "description": "The HR committee at the local corporate campus is seeking wellness partners to offer discounted gym memberships and conduct weekly yoga workshops.",
                    "category": "b2b",
                    "estimated_value": "₹1,50,000/year",
                    "urgency": "high",
                    "distance": "2.8 km",
                    "action_label": "Pitch HR",
                    "action_link": "/dashboard/b2b-chat"
                },
                {
                    "title": "Post-New Year resolution rush begins",
                    "description": "Seasonal spike in search volume for 'personal trainers near me' and '3-month gym subscriptions'. Ensure your social ads are configured to target high intent.",
                    "category": "seasonal",
                    "estimated_value": "₹60,000 potential",
                    "urgency": "high",
                    "distance": None,
                    "action_label": "Launch Promo",
                    "action_link": "/dashboard/meta-ads"
                },
                {
                    "title": "Nearby residential society requesting weekend kids bootcamp",
                    "description": "A high-density apartment complex is onboarding trainers to organize weekend active sports bootcamps for children during summer break.",
                    "category": "nearby",
                    "estimated_value": "₹35,000/month",
                    "urgency": "medium",
                    "distance": "1.2 km",
                    "action_label": "Submit Plan",
                    "action_link": "/dashboard/b2b-network"
                },
                {
                    "title": "Local demand for 'Pilates & Functional Training' up 30%",
                    "description": "Search queries related to low-impact strength training and core stability have grown significantly in your city. Introduce Pilates slot formats.",
                    "category": "trend",
                    "estimated_value": "High Trend",
                    "urgency": "medium",
                    "distance": None,
                    "action_label": "Add Classes",
                    "action_link": "/dashboard/content"
                }
            ]

        # Default Generic fallback
        else:
            return [
                {
                    "title": "3 nearby retail shops looking for collaborative marketing",
                    "description": "Shops within walking distance want to run a joint cross-promotion coupon book to share customer footfalls and save advertising costs.",
                    "category": "nearby",
                    "estimated_value": "₹20,000 savings",
                    "urgency": "medium",
                    "distance": "0.8 km",
                    "action_label": "Join Network",
                    "action_link": "/dashboard/b2b-network"
                },
                {
                    "title": "Upcoming Festival Season: Local foot traffic projected to rise 30%",
                    "description": "Local holiday demand is projected to spike significantly in the coming 2 weeks. Make sure your business hours and online inventories are fully optimized.",
                    "category": "seasonal",
                    "estimated_value": "₹50,000 potential",
                    "urgency": "high",
                    "distance": None,
                    "action_label": "Optimize Listing",
                    "action_link": "/dashboard/aeo-geo"
                },
                {
                    "title": "New housing development onboarding local services",
                    "description": "A premium residential project is establishing an approved vendors list for nearby services. Perfect opportunity to register your business.",
                    "category": "b2b",
                    "estimated_value": "₹1,00,000 potential",
                    "urgency": "medium",
                    "distance": "4.5 km",
                    "action_label": "Register Now",
                    "action_link": "/dashboard/b2b-network"
                },
                {
                    "title": "Searches for your business category increased 24% this week",
                    "description": "Customers in your locality are actively searching for similar offerings. Recommend updating Google Business profile and running local post campaigns.",
                    "category": "trend",
                    "estimated_value": "High Demand",
                    "urgency": "medium",
                    "distance": None,
                    "action_label": "Create Post",
                    "action_link": "/dashboard/content"
                }
            ]


# Global instance
radar_service = RadarService()
