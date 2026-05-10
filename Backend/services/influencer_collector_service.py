"""
Influencer Data Collector Service
Collects REAL influencer data from Apify and stores in database
"""

import os
import json
from typing import List, Dict, Any, Optional
from apify_client import ApifyClient
from sqlalchemy.orm import Session
from models.influencer import Influencer
from config.database import SyncSessionLocal as SessionLocal
import logging

logger = logging.getLogger(__name__)

# Initialize Apify client
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
apify_client = ApifyClient(APIFY_API_TOKEN) if APIFY_API_TOKEN else None


class InfluencerCollectorService:
    """
    Collects real influencer data from multiple sources
    Stores in persistent database for fast retrieval
    """

    # Industry-specific search queries for Google Search
    INDUSTRY_SEARCH_QUERIES = {
        "food": [
            "food influencer instagram india",
            "food blogger instagram",
            "chef instagram india",
            "restaurant reviewer instagram",
            "food vlogger instagram"
        ],
        "travel": [
            "travel influencer instagram india",
            "travel blogger instagram",
            "tourism creator instagram",
            "wanderlust instagram india",
            "adventure blogger instagram"
        ],
        "fitness": [
            "fitness influencer instagram india",
            "gym creator instagram",
            "workout coach instagram",
            "yoga instructor instagram",
            "fitness blogger instagram"
        ],
        "fashion": [
            "fashion influencer instagram india",
            "fashion blogger instagram",
            "style creator instagram",
            "fashion designer instagram",
            "model influencer instagram"
        ],
        "beauty": [
            "beauty influencer instagram india",
            "makeup artist instagram",
            "skincare influencer instagram",
            "beauty blogger instagram",
            "cosmetics reviewer instagram"
        ],
        "real-estate": [
            "real estate influencer instagram india",
            "property consultant instagram",
            "luxury lifestyle instagram",
            "architecture creator instagram",
            "interior designer instagram"
        ],
        "tech": [
            "tech influencer instagram india",
            "tech reviewer instagram",
            "gadget reviewer instagram",
            "tech blogger instagram",
            "developer influencer instagram"
        ],
        "lifestyle": [
            "lifestyle influencer instagram india",
            "lifestyle blogger instagram",
            "entrepreneur instagram",
            "motivation speaker instagram"
        ]
    }

    # Hashtags for Instagram search
    INDUSTRY_HASHTAGS = {
        "food": ["foodblogger", "foodinfluencer", "chef", "foodie", "foodphotography"],
        "travel": ["travelblogger", "travelinfluencer", "wanderlust", "travelgram", "explorer"],
        "fitness": ["fitnessinfluencer", "fitnessblogger", "gymlife", "workout", "fitfam"],
        "fashion": ["fashionblogger", "fashioninfluencer", "styleinspo", "ootd", "fashionista"],
        "beauty": ["beautyinfluencer", "beautyblogger", "makeuptutorial", "skincare", "beautyguru"],
        "real-estate": ["realestate", "luxurylifestyle", "architecture", "interiordesign", "propertyblogger"],
        "tech": ["techinfluencer", "techblogger", "gadgets", "technology", "techreview"],
        "lifestyle": ["lifestyleblogger", "lifestyleinfluencer", "entrepreneur", "motivation"]
    }

    @staticmethod
    def collect_influencers_for_industry(
        industry: str,
        limit: int = 50,
        location: str = "India"
    ) -> List[Dict[str, Any]]:
        """
        Collect real influencers for a specific industry using Apify
        """
        if not apify_client:
            logger.error("❌ Apify client not initialized")
            return []

        logger.info(f"🔍 Collecting {industry} influencers from Apify...")
        
        collected_influencers = []
        seen_usernames = set()

        # Get hashtags for this industry
        hashtags = InfluencerCollectorService.INDUSTRY_HASHTAGS.get(
            industry.lower(), []
        )

        # Search using hashtags
        for hashtag in hashtags[:3]:  # Use top 3 hashtags
            try:
                logger.info(f"  📱 Searching hashtag: #{hashtag}")
                
                # Run Apify Instagram Scraper
                run_input = {
                    "hashtags": [hashtag],
                    "resultsLimit": 20,
                    "searchLimit": 1,
                    "addParentData": False,
                }
                
                run = apify_client.actor("apify/instagram-scraper").call(run_input=run_input)
                
                # Fetch results
                for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
                    if item.get("type") == "Profile" or "username" in item:
                        username = item.get("username", "")
                        
                        # Skip duplicates
                        if username in seen_usernames or not username:
                            continue
                        
                        # Extract influencer data
                        influencer_data = {
                            "username": username,
                            "display_name": item.get("fullName", item.get("full_name", "")),
                            "bio": item.get("biography", item.get("bio", "")),
                            "followers": item.get("followersCount", item.get("followers", 0)),
                            "following": item.get("followsCount", item.get("following", 0)),
                            "posts_count": item.get("postsCount", 0),
                            "engagement_rate": item.get("engagementRate", 0),
                            "profile_image_url": item.get("profilePicUrl", item.get("profile_pic", "")),
                            "is_verified": item.get("verified", item.get("is_verified", False)),
                            "primary_niche": industry.lower(),
                            "hashtags": [f"#{hashtag}"],
                            "location": location,
                            "data_source": "apify",
                            "external_url": f"https://instagram.com/{username}",
                            "platform": "instagram"
                        }
                        
                        # Only collect if has reasonable followers
                        if influencer_data["followers"] >= 10000:
                            collected_influencers.append(influencer_data)
                            seen_usernames.add(username)
                            logger.info(f"    ✅ Collected: @{username} ({influencer_data['followers']} followers)")
                    
                    if len(collected_influencers) >= limit:
                        break
                
            except Exception as e:
                logger.error(f"  ❌ Error searching #{hashtag}: {str(e)}")
                continue
        
        logger.info(f"✅ Collected {len(collected_influencers)} {industry} influencers")
        return collected_influencers

    @staticmethod
    def clean_and_validate_influencer(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Clean and validate influencer data before storage
        """
        # Required fields
        if not data.get("username") or not data.get("primary_niche"):
            return None
        
        # Normalize username
        data["username"] = data["username"].lower().strip()
        
        # Validate followers
        if data.get("followers", 0) < 10000:
            return None
        
        # Calculate quality score
        quality_score = InfluencerCollectorService._calculate_quality_score(data)
        data["quality_score"] = quality_score
        
        # Calculate relevance score
        relevance_score = InfluencerCollectorService._calculate_relevance_score(data)
        data["relevance_score"] = relevance_score
        
        # Normalize location
        if data.get("location"):
            location_parts = data["location"].split(",")
            if len(location_parts) >= 1:
                data["city"] = location_parts[0].strip()
            if len(location_parts) >= 2:
                data["state"] = location_parts[1].strip()
            data["country"] = "India"
        
        # Convert lists to JSON strings for storage
        if isinstance(data.get("hashtags"), list):
            data["hashtags"] = json.dumps(data["hashtags"])
        if isinstance(data.get("secondary_niches"), list):
            data["secondary_niches"] = json.dumps(data["secondary_niches"])
        
        return data

    @staticmethod
    def _calculate_quality_score(data: Dict[str, Any]) -> float:
        """Calculate influencer quality score (0-100)"""
        score = 0.0
        
        # Engagement rate (40 points)
        engagement = data.get("engagement_rate", 0)
        if engagement > 8:
            score += 40
        elif engagement > 5:
            score += 30
        elif engagement > 3:
            score += 20
        elif engagement > 1:
            score += 10
        
        # Follower count (30 points)
        followers = data.get("followers", 0)
        if 50000 <= followers <= 500000:
            score += 30
        elif 10000 <= followers < 50000:
            score += 25
        elif 500000 <= followers <= 1000000:
            score += 20
        elif followers > 1000000:
            score += 15
        
        # Verification (20 points)
        if data.get("is_verified"):
            score += 20
        
        # Bio quality (10 points)
        bio = data.get("bio", "")
        if len(bio) > 50:
            score += 10
        elif len(bio) > 20:
            score += 5
        
        return min(100.0, score)

    @staticmethod
    def _calculate_relevance_score(data: Dict[str, Any]) -> float:
        """Calculate niche relevance score (0-100)"""
        score = 50.0  # Base score
        
        # Check bio for niche keywords
        bio = (data.get("bio", "") or "").lower()
        niche = data.get("primary_niche", "").lower()
        
        # Niche-specific keywords
        niche_keywords = {
            "food": ["food", "chef", "cook", "recipe", "restaurant", "culinary"],
            "travel": ["travel", "wanderlust", "explorer", "adventure", "tourism"],
            "fitness": ["fitness", "gym", "workout", "health", "yoga", "training"],
            "fashion": ["fashion", "style", "outfit", "designer", "model"],
            "beauty": ["beauty", "makeup", "skincare", "cosmetic"],
            "real-estate": ["realestate", "property", "luxury", "architecture", "interior"],
            "tech": ["tech", "technology", "gadget", "developer", "coding"],
            "lifestyle": ["lifestyle", "entrepreneur", "motivation"]
        }
        
        keywords = niche_keywords.get(niche, [])
        matches = sum(1 for kw in keywords if kw in bio)
        
        score += min(50.0, matches * 10)
        
        return min(100.0, score)

    @staticmethod
    def store_influencer_in_db(data: Dict[str, Any]) -> bool:
        """
        Store influencer in database (insert or update)
        """
        db: Session = SessionLocal()
        try:
            # Check if influencer already exists
            existing = db.query(Influencer).filter(
                Influencer.username == data["username"]
            ).first()
            
            if existing:
                # Update existing record
                for key, value in data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                logger.info(f"  🔄 Updated: @{data['username']}")
            else:
                # Create new record
                influencer = Influencer(**data)
                db.add(influencer)
                logger.info(f"  ✅ Stored: @{data['username']}")
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"  ❌ Error storing @{data.get('username')}: {str(e)}")
            db.rollback()
            return False
        finally:
            db.close()

    @staticmethod
    def collect_and_store_industry(industry: str, limit: int = 50):
        """
        Main method: Collect and store influencers for an industry
        """
        logger.info(f"🚀 Starting collection for {industry} industry...")
        
        # Step 1: Collect from Apify
        raw_influencers = InfluencerCollectorService.collect_influencers_for_industry(
            industry, limit
        )
        
        # Step 2: Clean and validate
        logger.info(f"🧹 Cleaning and validating {len(raw_influencers)} influencers...")
        cleaned_influencers = []
        for raw_data in raw_influencers:
            cleaned = InfluencerCollectorService.clean_and_validate_influencer(raw_data)
            if cleaned:
                cleaned_influencers.append(cleaned)
        
        logger.info(f"✅ {len(cleaned_influencers)} influencers passed validation")
        
        # Step 3: Store in database
        logger.info(f"💾 Storing influencers in database...")
        stored_count = 0
        for influencer_data in cleaned_influencers:
            if InfluencerCollectorService.store_influencer_in_db(influencer_data):
                stored_count += 1
        
        logger.info(f"✅ Stored {stored_count}/{len(cleaned_influencers)} influencers")
        logger.info(f"🎉 Collection complete for {industry}!")
        
        return stored_count
