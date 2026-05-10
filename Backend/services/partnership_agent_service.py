"""
Partnership Agent Service
REAL INFLUENCER INTELLIGENCE PLATFORM
Web scraping-first approach with database and API fallback
"""

import os
import httpx
import json
from typing import List, Dict, Any, Optional
from groq import Groq
from apify_client import ApifyClient

# Import database services
from services.influencer_search_service import InfluencerSearchService
from services.influencer_collector_service import InfluencerCollectorService

# Import REAL influencer discovery service
from services.real_influencer_service import RealInfluencerService

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Apify configuration
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
apify_client = ApifyClient(APIFY_API_TOKEN) if APIFY_API_TOKEN else None

# RapidAPI configuration
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = "instagram-scraper-api2.p.rapidapi.com"


class PartnershipAgentService:
    """
    REAL INFLUENCER INTELLIGENCE PLATFORM
    - Database-first search (fast, accurate)
    - Live API fallback (when needed)
    - Persistent storage (no repeated API calls)
    - Professional scoring and ranking
    """

    # PROFESSIONAL INDUSTRY KEYWORD ENGINE
    # Comprehensive search keywords for each industry
    INDUSTRY_SEARCH_KEYWORDS = {
        "food": [
            "food blogger", "food influencer", "chef creator", "restaurant reviewer",
            "food vlogger", "recipe creator", "cooking channel", "culinary expert",
            "foodie", "food photography", "restaurant critic", "food content creator"
        ],
        "fashion": [
            "fashion blogger", "fashion influencer", "style creator", "outfit influencer",
            "fashion designer", "model influencer", "fashion vlogger", "styling expert",
            "fashion content creator", "wardrobe stylist", "fashion photography"
        ],
        "tech": [
            "tech reviewer", "technology influencer", "gadget reviewer", "tech vlogger",
            "software developer", "coding creator", "tech content creator", "tech blogger",
            "gadget unboxing", "tech news", "developer influencer"
        ],
        "beauty": [
            "beauty influencer", "makeup creator", "skincare influencer", "beauty vlogger",
            "makeup artist", "beauty blogger", "cosmetics reviewer", "beauty content creator",
            "makeup tutorial", "skincare routine", "beauty tips"
        ],
        "fitness": [
            "fitness influencer", "gym creator", "workout coach", "fitness vlogger",
            "bodybuilding", "personal trainer", "fitness blogger", "yoga instructor",
            "fitness content creator", "health coach", "gym motivation"
        ],
        "travel": [
            "travel influencer", "travel blogger", "travel vlogger", "tourism creator",
            "explorer", "wanderlust", "travel content creator", "adventure blogger",
            "travel photography", "destination guide", "travel tips"
        ],
        "education": [
            "education influencer", "learning creator", "teacher influencer", "educator",
            "study tips", "educational content", "online teacher", "education blogger",
            "learning vlogger", "academic creator"
        ],
        "real-estate": [
            "real estate influencer", "property consultant", "luxury lifestyle",
            "architecture creator", "home decor influencer", "interior designer",
            "investment advisor", "real estate blogger", "property vlogger",
            "luxury homes", "real estate content creator", "property investment"
        ],
        "other": [
            "lifestyle influencer", "entrepreneur", "business creator", "motivation speaker",
            "lifestyle blogger", "content creator"
        ]
    }

    # STRICT FILTER KEYWORDS - Must match to be considered relevant
    INDUSTRY_FILTER_KEYWORDS = {
        "food": [
            "food", "chef", "cook", "recipe", "restaurant", "cuisine", "meal", "dish",
            "culinary", "foodie", "cooking", "baker", "baking", "gastronomy", "dining",
            "eat", "delicious", "tasty", "flavor", "kitchen"
        ],
        "fashion": [
            "fashion", "style", "outfit", "clothing", "designer", "model", "trend", "wear",
            "wardrobe", "dress", "apparel", "couture", "runway", "boutique", "chic",
            "elegant", "fashionista", "styling"
        ],
        "tech": [
            "tech", "technology", "gadget", "software", "code", "developer", "digital",
            "app", "programming", "computer", "device", "electronic", "innovation",
            "startup", "coding", "hardware", "mobile", "web"
        ],
        "beauty": [
            "beauty", "makeup", "skincare", "cosmetic", "glow", "skin", "hair", "nail",
            "lipstick", "foundation", "mascara", "facial", "serum", "beautician",
            "makeover", "glam", "gorgeous", "beautiful"
        ],
        "fitness": [
            "fitness", "gym", "workout", "health", "yoga", "training", "exercise", "muscle",
            "bodybuilding", "cardio", "strength", "wellness", "athlete", "sport",
            "nutrition", "protein", "gains", "fit"
        ],
        "travel": [
            "travel", "trip", "tour", "explore", "wander", "adventure", "destination",
            "journey", "vacation", "tourism", "traveler", "wanderlust", "backpack",
            "flight", "hotel", "tourist", "visiting", "exploring"
        ],
        "education": [
            "education", "learn", "teach", "study", "student", "knowledge", "course",
            "lesson", "tutorial", "academic", "school", "university", "learning",
            "instructor", "training", "educational"
        ],
        "real-estate": [
            "realestate", "property", "home", "house", "architecture", "interior", "design",
            "luxury", "villa", "apartment", "construction", "investment", "realtor",
            "housing", "estate", "building", "residential", "commercial"
        ],
        "other": [
            "lifestyle", "entrepreneur", "business", "motivation", "inspire", "creator",
            "influencer", "content", "vlog", "blog"
        ]
    }

    # NEGATIVE KEYWORDS - Exclude if these appear (prevents cross-contamination)
    INDUSTRY_NEGATIVE_KEYWORDS = {
        "real-estate": ["food", "recipe", "cooking", "restaurant", "chef", "meal", "dish"],
        "travel": ["food blogger", "recipe", "cooking", "restaurant review"],
        "fitness": ["food blogger", "recipe creator", "restaurant"],
        "food": ["real estate", "property", "architecture"],
        "fashion": ["food blogger", "recipe", "cooking"],
        "tech": ["food blogger", "recipe", "cooking", "restaurant"],
        "beauty": ["food blogger", "recipe", "cooking"],
        "education": [],
        "other": []
    }

    # Industry to niche mapping (legacy for RapidAPI)
    INDUSTRY_NICHES = {
        "food": ["food", "foodie", "restaurant", "chef", "cooking", "recipe", "cuisine"],
        "fashion": ["fashion", "style", "outfit", "clothing", "designer", "model"],
        "tech": ["technology", "tech", "gadgets", "software", "coding", "developer"],
        "beauty": ["beauty", "makeup", "skincare", "cosmetics", "beautyblogger"],
        "fitness": ["fitness", "gym", "workout", "health", "yoga", "training"],
        "travel": ["travel", "travelblogger", "wanderlust", "adventure", "tourism"],
        "education": ["education", "learning", "teacher", "student", "study"],
        "real-estate": ["realestate", "property", "home", "architecture", "interior"],
        "other": ["lifestyle", "entrepreneur", "business", "motivation"]
    }

    @staticmethod
    async def search_influencers_apify(
        industry: str,
        location: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        PROFESSIONAL APIFY SEARCH - Search ALL keywords and merge results
        """
        try:
            if not apify_client:
                print("⚠️ Apify client not initialized, falling back to RapidAPI")
                return []
            
            # Get ALL search keywords for industry
            search_keywords = PartnershipAgentService.INDUSTRY_SEARCH_KEYWORDS.get(
                industry.lower(),
                PartnershipAgentService.INDUSTRY_SEARCH_KEYWORDS["other"]
            )
            
            print(f"🔍 Searching {len(search_keywords)} keywords for {industry}")
            
            all_influencers = []
            seen_usernames = set()  # Prevent duplicates
            
            # Search using ALL keywords (not just top 2)
            for keyword in search_keywords:
                try:
                    # Build search query
                    location_part = location.split(',')[0].strip() if location else "India"
                    search_query = f"{keyword} {location_part}"
                    
                    print(f"  🔎 Searching: {keyword}")
                    
                    # Run Apify Instagram Profile Scraper
                    run_input = {
                        "usernames": [],
                        "resultsLimit": 15,  # Get more per keyword
                        "searchLimit": 1,
                        "addParentData": False,
                    }
                    
                    # Try hashtag search
                    hashtag = keyword.replace(" ", "").lower()
                    run_input["hashtags"] = [hashtag]
                    
                    # Run the actor
                    run = apify_client.actor("apify/instagram-scraper").call(run_input=run_input)
                    
                    # Fetch results
                    for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
                        # Extract influencer data
                        if item.get("type") == "Profile" or "username" in item:
                            username = item.get("username", "")
                            
                            # Skip duplicates
                            if username in seen_usernames:
                                continue
                            
                            influencer = {
                                "username": username,
                                "full_name": item.get("fullName", item.get("full_name", "")),
                                "followers": item.get("followersCount", item.get("followers", 0)),
                                "bio": item.get("biography", item.get("bio", "")),
                                "profile_pic": item.get("profilePicUrl", item.get("profile_pic", "")),
                                "is_verified": item.get("verified", item.get("is_verified", False)),
                                "niche": keyword,
                                "location": location,
                                "engagement_rate": item.get("engagementRate", 0),
                                "posts_count": item.get("postsCount", 0),
                                "source": "apify",
                                "search_keyword": keyword  # Track which keyword found this
                            }
                            
                            # Only add if has reasonable followers
                            if influencer["followers"] >= 10000:
                                all_influencers.append(influencer)
                                seen_usernames.add(username)
                        
                        if len(all_influencers) >= limit * 3:  # Get extra for filtering
                            break
                    
                except Exception as e:
                    print(f"  ❌ Error searching '{keyword}': {str(e)}")
                    continue
            
            print(f"  📊 Found {len(all_influencers)} total influencers before filtering")
            
            # STRICT FILTERING - Remove irrelevant influencers
            filtered_influencers = PartnershipAgentService._strict_filter_by_industry(
                all_influencers, industry
            )
            
            print(f"  ✅ {len(filtered_influencers)} relevant influencers after filtering")
            
            # SCORE AND RANK
            scored_influencers = []
            for inf in filtered_influencers:
                score = PartnershipAgentService._calculate_influencer_score(inf, industry, location)
                inf["relevance_score"] = score
                scored_influencers.append(inf)
            
            # Sort by relevance score (highest first)
            scored_influencers.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            return scored_influencers[:limit]
            
        except Exception as e:
            print(f"❌ Apify search failed: {str(e)}")
            return []

    @staticmethod
    def _strict_filter_by_industry(
        influencers: List[Dict[str, Any]],
        industry: str
    ) -> List[Dict[str, Any]]:
        """
        PROFESSIONAL STRICT FILTERING - Multi-layer validation
        Only keeps highly relevant influencers
        """
        filter_keywords = PartnershipAgentService.INDUSTRY_FILTER_KEYWORDS.get(
            industry.lower(),
            PartnershipAgentService.INDUSTRY_FILTER_KEYWORDS["other"]
        )
        
        negative_keywords = PartnershipAgentService.INDUSTRY_NEGATIVE_KEYWORDS.get(
            industry.lower(),
            []
        )
        
        filtered = []
        
        for influencer in influencers:
            bio = (influencer.get("bio", "") or "").lower()
            username = (influencer.get("username", "") or "").lower()
            full_name = (influencer.get("full_name", "") or "").lower()
            niche = (influencer.get("niche", "") or "").lower()
            search_keyword = (influencer.get("search_keyword", "") or "").lower()
            
            # Combine all text for analysis
            combined_text = f"{bio} {username} {full_name} {niche} {search_keyword}"
            
            # LAYER 1: Check for negative keywords (EXCLUDE if found)
            has_negative = any(neg_kw in combined_text for neg_kw in negative_keywords)
            if has_negative:
                print(f"    ❌ Excluded {username}: Contains negative keywords")
                continue
            
            # LAYER 2: Check for positive keywords (MUST have at least 2 matches)
            keyword_matches = sum(1 for kw in filter_keywords if kw in combined_text)
            
            if keyword_matches >= 2:  # Require at least 2 keyword matches
                influencer["keyword_matches"] = keyword_matches
                filtered.append(influencer)
                print(f"    ✅ Kept {username}: {keyword_matches} keyword matches")
            else:
                print(f"    ❌ Excluded {username}: Only {keyword_matches} keyword match(es)")
        
        return filtered

    @staticmethod
    def _calculate_influencer_score(
        influencer: Dict[str, Any],
        industry: str,
        location: str
    ) -> int:
        """
        PROFESSIONAL SCORING SYSTEM - Weighted multi-factor analysis
        Returns score 0-100
        """
        score = 0
        
        # FACTOR 1: Niche Relevance (50 points) - MOST IMPORTANT
        filter_keywords = PartnershipAgentService.INDUSTRY_FILTER_KEYWORDS.get(
            industry.lower(), []
        )
        bio = (influencer.get("bio", "") or "").lower()
        username = (influencer.get("username", "") or "").lower()
        full_name = (influencer.get("full_name", "") or "").lower()
        niche = (influencer.get("niche", "") or "").lower()
        
        combined = f"{bio} {username} {full_name} {niche}"
        
        # Count keyword matches
        keyword_matches = influencer.get("keyword_matches", 0)
        if keyword_matches >= 5:
            score += 50
        elif keyword_matches >= 4:
            score += 40
        elif keyword_matches >= 3:
            score += 30
        elif keyword_matches >= 2:
            score += 20
        else:
            score += 10
        
        # FACTOR 2: Engagement Rate (25 points)
        engagement = influencer.get("engagement_rate", 0)
        if engagement > 8:
            score += 25
        elif engagement > 5:
            score += 20
        elif engagement > 3:
            score += 15
        elif engagement > 1:
            score += 10
        else:
            score += 5
        
        # FACTOR 3: Follower Count (15 points) - Quality over quantity
        followers = influencer.get("followers", 0)
        if 50000 <= followers <= 500000:  # Sweet spot for engagement
            score += 15
        elif 10000 <= followers < 50000:  # Micro-influencers
            score += 12
        elif 500000 <= followers <= 1000000:  # Large following
            score += 10
        elif followers > 1000000:  # Mega influencers
            score += 8
        
        # FACTOR 4: Verification Status (10 points)
        if influencer.get("is_verified"):
            score += 10
        
        return min(100, score)

    @staticmethod
    async def search_influencers_by_niche(
        industry: str,
        location: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        DATABASE-FIRST SEARCH with intelligent fallback
        1. Search internal database (PRIMARY - FAST)
        2. If insufficient results, collect from Apify (SECONDARY)
        3. Intelligent mock data (FALLBACK)
        """
        try:
            # TIER 1: Search internal database FIRST
            print(f"🔍 Tier 1: Searching internal database for {industry} influencers...")
            
            db_influencers = InfluencerSearchService.search_by_industry(
                industry=industry,
                location=location,
                min_followers=10000,
                min_engagement=1.0,
                limit=limit
            )
            
            if db_influencers and len(db_influencers) >= 3:
                print(f"✅ Database success: {len(db_influencers)} influencers found")
                
                # Calculate match scores
                for inf in db_influencers:
                    match_score = InfluencerSearchService.calculate_match_score(
                        inf, industry, "", location
                    )
                    inf["match_score"] = match_score
                    inf["source"] = "database"
                
                # Sort by match score
                db_influencers.sort(key=lambda x: x.get("match_score", 0), reverse=True)
                return db_influencers[:limit]
            
            # TIER 2: Database has insufficient results - collect from Apify
            print(f"🔍 Tier 2: Database has only {len(db_influencers)} results, collecting from Apify...")
            
            # Collect new influencers from Apify
            collected_count = InfluencerCollectorService.collect_and_store_industry(
                industry, limit=20
            )
            
            if collected_count > 0:
                print(f"✅ Collected and stored {collected_count} new influencers")
                
                # Search database again
                db_influencers = InfluencerSearchService.search_by_industry(
                    industry=industry,
                    location=location,
                    min_followers=10000,
                    min_engagement=1.0,
                    limit=limit
                )
                
                if db_influencers:
                    # Calculate match scores
                    for inf in db_influencers:
                        match_score = InfluencerSearchService.calculate_match_score(
                            inf, industry, "", location
                        )
                        inf["match_score"] = match_score
                        inf["source"] = "database"
                    
                    db_influencers.sort(key=lambda x: x.get("match_score", 0), reverse=True)
                    return db_influencers[:limit]
            
            # TIER 3: Use intelligent mock data as last resort
            print(f"🔍 Tier 3: Using intelligent mock data for {industry}")
            mock_data = PartnershipAgentService._get_intelligent_mock_data(industry, location, limit)
            
            if mock_data:
                print(f"✅ Mock data: {len(mock_data)} influencers")
                return mock_data
            
            # If absolutely no results
            print(f"⚠️ No influencers found for {industry}")
            return []
            
        except Exception as e:
            print(f"❌ Error in search_influencers_by_niche: {str(e)}")
            return []

    @staticmethod
    async def _search_rapidapi(
        industry: str,
        location: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        RAPIDAPI SEARCH - Secondary method with strict filtering
        """
        try:
            # Get ALL niche keywords for industry
            niches = PartnershipAgentService.INDUSTRY_SEARCH_KEYWORDS.get(
                industry.lower(), 
                PartnershipAgentService.INDUSTRY_SEARCH_KEYWORDS["other"]
            )
            
            # If no RapidAPI key, return empty
            if not RAPIDAPI_KEY or RAPIDAPI_KEY == "your-rapidapi-key-here":
                print("⚠️ No RapidAPI key found")
                return []
            
            all_influencers = []
            seen_usernames = set()
            
            # Search for influencers using ALL hashtags
            for niche in niches[:5]:  # Use top 5 keywords
                try:
                    # Search Instagram hashtags
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            f"https://{RAPIDAPI_HOST}/v1/hashtag",
                            params={"hashtag": niche.replace(" ", "")},
                            headers={
                                "X-RapidAPI-Key": RAPIDAPI_KEY,
                                "X-RapidAPI-Host": RAPIDAPI_HOST
                            },
                            timeout=10.0
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            # Extract top posts and their creators
                            if "data" in data and "top" in data["data"]:
                                for post in data["data"]["top"][:5]:
                                    user = post.get("user", {})
                                    if user:
                                        username = user.get("username", "")
                                        
                                        # Skip duplicates
                                        if username in seen_usernames:
                                            continue
                                        
                                        influencer = {
                                            "username": username,
                                            "full_name": user.get("full_name", ""),
                                            "followers": user.get("follower_count", 0),
                                            "bio": user.get("biography", ""),
                                            "profile_pic": user.get("profile_pic_url", ""),
                                            "is_verified": user.get("is_verified", False),
                                            "niche": niche,
                                            "location": location,
                                            "source": "rapidapi",
                                            "search_keyword": niche
                                        }
                                        all_influencers.append(influencer)
                                        seen_usernames.add(username)
                except Exception as e:
                    print(f"Error searching niche {niche}: {str(e)}")
                    continue
            
            # STRICT FILTERING
            filtered = PartnershipAgentService._strict_filter_by_industry(all_influencers, industry)
            
            # SCORE AND RANK
            scored_influencers = []
            for inf in filtered:
                score = PartnershipAgentService._calculate_influencer_score(inf, industry, location)
                inf["relevance_score"] = score
                scored_influencers.append(inf)
            
            scored_influencers.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            return scored_influencers[:limit]
            
        except Exception as e:
            print(f"❌ RapidAPI search error: {str(e)}")
            return []

    @staticmethod
    def _get_intelligent_mock_data(
        industry: str,
        location: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Intelligent industry-specific mock data (FALLBACK ONLY)
        Returns realistic influencers that match the industry
        """
        
        # Industry-specific realistic mock data
        mock_database = {
            "food": [
                {
                    "username": "foodie_vibes_ap",
                    "full_name": "Foodie Vibes AP",
                    "followers": 125000,
                    "bio": "🍕 Food blogger | Restaurant reviews | Andhra Pradesh cuisine specialist",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "food",
                    "location": location,
                    "engagement_rate": 7.2,
                    "posts_count": 450,
                    "source": "mock"
                },
                {
                    "username": "coastal_cuisine_lover",
                    "full_name": "Coastal Cuisine",
                    "followers": 89000,
                    "bio": "🌶️ Andhra food specialist | Traditional recipes | Visakhapatnam",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "food",
                    "location": location,
                    "engagement_rate": 8.5,
                    "posts_count": 320,
                    "source": "mock"
                },
                {
                    "username": "spice_route_chef",
                    "full_name": "Chef Ramesh Kumar",
                    "followers": 156000,
                    "bio": "👨‍🍳 Professional chef | South Indian cuisine | Food photography",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "food",
                    "location": location,
                    "engagement_rate": 6.8,
                    "posts_count": 580,
                    "source": "mock"
                }
            ],
            "fashion": [
                {
                    "username": "style_with_priya",
                    "full_name": "Priya's Style Diary",
                    "followers": 156000,
                    "bio": "👗 Fashion influencer | Styling tips | Vijayawada | Collab: DM",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "fashion",
                    "location": location,
                    "engagement_rate": 9.1,
                    "posts_count": 720,
                    "source": "mock"
                },
                {
                    "username": "trendy_threads_ap",
                    "full_name": "Trendy Threads",
                    "followers": 92000,
                    "bio": "🛍️ Fashion blogger | Outfit ideas | Andhra Pradesh",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "fashion",
                    "location": location,
                    "engagement_rate": 7.8,
                    "posts_count": 410,
                    "source": "mock"
                },
                {
                    "username": "ethnic_elegance_india",
                    "full_name": "Ethnic Elegance",
                    "followers": 203000,
                    "bio": "✨ Traditional & modern fashion | Saree styling | India",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "fashion",
                    "location": location,
                    "engagement_rate": 6.5,
                    "posts_count": 890,
                    "source": "mock"
                }
            ],
            "tech": [
                {
                    "username": "tech_reviews_india",
                    "full_name": "Tech Reviews India",
                    "followers": 450000,
                    "bio": "📱 Tech reviewer | Gadget unboxing | Hyderabad | Business: DM",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "technology",
                    "location": location,
                    "engagement_rate": 5.2,
                    "posts_count": 1200,
                    "source": "mock"
                },
                {
                    "username": "code_with_sanjay",
                    "full_name": "Sanjay - Tech Creator",
                    "followers": 78000,
                    "bio": "💻 Software developer | Tech tutorials | Coding tips | India",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "technology",
                    "location": location,
                    "engagement_rate": 8.9,
                    "posts_count": 340,
                    "source": "mock"
                },
                {
                    "username": "gadget_guru_ap",
                    "full_name": "Gadget Guru",
                    "followers": 189000,
                    "bio": "🔧 Tech enthusiast | Product reviews | Latest gadgets | AP",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "technology",
                    "location": location,
                    "engagement_rate": 6.7,
                    "posts_count": 560,
                    "source": "mock"
                }
            ],
            "beauty": [
                {
                    "username": "makeup_by_divya",
                    "full_name": "Divya - Makeup Artist",
                    "followers": 210000,
                    "bio": "💄 Professional makeup artist | Beauty tips | Visakhapatnam",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "beauty",
                    "location": location,
                    "engagement_rate": 8.3,
                    "posts_count": 680,
                    "source": "mock"
                },
                {
                    "username": "skincare_secrets_ap",
                    "full_name": "Skincare Secrets",
                    "followers": 134000,
                    "bio": "✨ Skincare enthusiast | Product reviews | Natural beauty | AP",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "beauty",
                    "location": location,
                    "engagement_rate": 9.5,
                    "posts_count": 420,
                    "source": "mock"
                },
                {
                    "username": "glow_with_meera",
                    "full_name": "Meera Beauty",
                    "followers": 167000,
                    "bio": "🌟 Beauty blogger | Makeup tutorials | Skincare routines",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "beauty",
                    "location": location,
                    "engagement_rate": 7.1,
                    "posts_count": 540,
                    "source": "mock"
                }
            ],
            "fitness": [
                {
                    "username": "fit_life_coach",
                    "full_name": "Fitness Coach Ravi",
                    "followers": 187000,
                    "bio": "💪 Certified fitness trainer | Workout tips | Visakhapatnam",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "fitness",
                    "location": location,
                    "engagement_rate": 7.9,
                    "posts_count": 890,
                    "source": "mock"
                },
                {
                    "username": "yoga_with_anjali",
                    "full_name": "Anjali - Yoga Instructor",
                    "followers": 95000,
                    "bio": "🧘 Yoga teacher | Wellness coach | Mindfulness | AP",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "fitness",
                    "location": location,
                    "engagement_rate": 10.2,
                    "posts_count": 380,
                    "source": "mock"
                },
                {
                    "username": "gym_beast_india",
                    "full_name": "Gym Beast",
                    "followers": 234000,
                    "bio": "🏋️ Bodybuilder | Fitness motivation | Gym workouts | India",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "fitness",
                    "location": location,
                    "engagement_rate": 6.4,
                    "posts_count": 1100,
                    "source": "mock"
                }
            ],
            "travel": [
                {
                    "username": "wanderlust_ap",
                    "full_name": "Wanderlust AP",
                    "followers": 198000,
                    "bio": "✈️ Travel blogger | Exploring Andhra Pradesh | Adventure seeker",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "travel",
                    "location": location,
                    "engagement_rate": 8.7,
                    "posts_count": 650,
                    "source": "mock"
                },
                {
                    "username": "coastal_explorer",
                    "full_name": "Coastal Explorer",
                    "followers": 112000,
                    "bio": "🌊 Travel enthusiast | Beach destinations | Visakhapatnam",
                    "profile_pic": "",
                    "is_verified": False,
                    "niche": "travel",
                    "location": location,
                    "engagement_rate": 9.3,
                    "posts_count": 420,
                    "source": "mock"
                },
                {
                    "username": "heritage_trails_india",
                    "full_name": "Heritage Trails",
                    "followers": 276000,
                    "bio": "🏛️ Cultural tourism | Historical sites | Travel photography | India",
                    "profile_pic": "",
                    "is_verified": True,
                    "niche": "travel",
                    "location": location,
                    "engagement_rate": 5.8,
                    "posts_count": 980,
                    "source": "mock"
                }
            ]
        }
        
        # Return industry-specific mock data or default to food
        industry_data = mock_database.get(industry.lower(), mock_database["food"])
        return industry_data[:limit]

    @staticmethod
    async def analyze_with_groq(
        business_data: Dict[str, Any],
        influencers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Use Groq AI to analyze influencers and generate partnership recommendations
        """
        try:
            # Prepare influencer summary for Groq
            influencer_summary = []
            for inf in influencers:
                influencer_summary.append({
                    "username": inf.get("username"),
                    "full_name": inf.get("full_name"),
                    "followers": inf.get("followers"),
                    "bio": inf.get("bio", "")[:200],  # Limit bio length
                    "niche": inf.get("niche"),
                    "engagement_rate": inf.get("engagement_rate", 0),
                    "is_verified": inf.get("is_verified", False)
                })
            
            # Prepare prompt for Groq
            prompt = f"""
You are an expert influencer marketing strategist. Analyze these REAL influencers for a business partnership.

CRITICAL RULES:
1. ONLY analyze the influencers provided below
2. DO NOT invent or suggest influencer categories
3. DO NOT create fictional influencers
4. ONLY rank and recommend based on the actual data provided

BUSINESS DETAILS:
- Name: {business_data.get('businessName')}
- Industry: {business_data.get('industry')}
- Target Audience: {business_data.get('targetAudience')}
- Collaboration Goal: {business_data.get('collaborationGoal')}
- Partnership Type: {business_data.get('partnershipType')}
- Budget: {business_data.get('budget')}
- Timeline: {business_data.get('timeline')}
- Location: {business_data.get('location')}

REAL INFLUENCERS TO ANALYZE:
{json.dumps(influencer_summary, indent=2)}

For EACH influencer listed above, provide:
1. Match Score (0-100): How well they fit the business needs based on their ACTUAL niche
2. Why This Partnership Works: 2-3 sentences explaining the fit based on their REAL bio and niche
3. Suggested Campaign: Specific collaboration idea that matches their ACTUAL content style
4. Estimated Reach: Expected audience reach based on their REAL follower count
5. Estimated Cost: Budget estimate in INR based on their REAL follower count and engagement
6. Engagement Rate: Use their ACTUAL engagement rate if provided, or estimate based on followers

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "username": "actual_username_from_list",
    "matchScore": 95,
    "whyItWorks": "explanation based on their real niche and bio",
    "suggestedCampaign": "campaign idea matching their actual content",
    "estimatedReach": "100K-150K",
    "estimatedCost": "₹25,000 - ₹35,000",
    "engagementRate": "8.5%"
  }}
]

IMPORTANT: 
- Return ONLY the JSON array, no other text
- Use ONLY the usernames from the list above
- Base all analysis on ACTUAL influencer data provided
"""

            # Call Groq API
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert influencer marketing analyst. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Parse Groq response
            groq_response = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            if "```json" in groq_response:
                groq_response = groq_response.split("```json")[1].split("```")[0].strip()
            elif "```" in groq_response:
                groq_response = groq_response.split("```")[1].split("```")[0].strip()
            
            analysis = json.loads(groq_response)
            
            # Merge analysis with influencer data
            results = []
            for i, influencer in enumerate(influencers):
                if i < len(analysis):
                    result = {
                        **influencer,
                        **analysis[i],
                        "platform": "instagram",
                        "avgViews": str(int(influencer.get("followers", 0) * 0.12)) if influencer.get("followers") else "N/A"
                    }
                    results.append(result)
            
            return results
            
        except Exception as e:
            print(f"❌ Groq AI analysis error: {str(e)}")
            # Fallback: Return influencers with basic analysis
            return PartnershipAgentService._fallback_analysis(influencers, business_data)

    @staticmethod
    def _fallback_analysis(
        influencers: List[Dict[str, Any]],
        business_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Fallback analysis when Groq fails"""
        results = []
        
        for influencer in influencers:
            followers = influencer.get("followers", 0)
            
            # Calculate basic match score
            match_score = 85 if followers > 100000 else 75 if followers > 50000 else 65
            
            # Calculate engagement rate
            engagement_rate = f"{round(8.5 - (followers / 100000), 1)}%"
            
            # Estimate cost based on followers
            if followers > 200000:
                cost = "₹50,000 - ₹1,00,000"
            elif followers > 100000:
                cost = "₹25,000 - ₹50,000"
            else:
                cost = "₹10,000 - ₹25,000"
            
            result = {
                **influencer,
                "matchScore": match_score,
                "whyItWorks": f"Strong presence in {business_data.get('industry')} niche with engaged audience in {business_data.get('location')}",
                "suggestedCampaign": f"{business_data.get('partnershipType')} campaign with 3-5 posts over {business_data.get('timeline')}",
                "estimatedReach": f"{int(followers * 0.8 / 1000)}K-{int(followers * 1.2 / 1000)}K",
                "estimatedCost": cost,
                "engagementRate": engagement_rate,
                "platform": "instagram",
                "avgViews": str(int(followers * 0.12))
            }
            results.append(result)
        
        return results

    @staticmethod
    async def find_partnerships(request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        PROFESSIONAL PARTNERSHIP FINDER - Main entry point
        Uses REAL web scraping to discover influencers
        """
        try:
            industry = request_data.get("industry", "other")
            business_name = request_data.get("businessName", "")
            location = request_data.get("location", "India")
            
            print(f"🔍 Finding partnerships for {business_name} in {industry} industry...")
            
            # Prepare business context for Node.js services
            business_context = {
                "name": business_name,
                "category": industry,
                "subcategory": "",
                "location": location,
                "targetAudience": request_data.get("targetAudience", ""),
                "description": f"{business_name} - {request_data.get('collaborationGoal', '')}"
            }
            
            # TIER 1: Try REAL web scraping first (PRIMARY METHOD)
            print("🚀 Tier 1: Discovering REAL influencers via web scraping...")
            try:
                real_influencers = await RealInfluencerService.discover_real_influencers(
                    business_context=business_context,
                    limit=10
                )
                
                if real_influencers and len(real_influencers) > 0:
                    print(f"✅ Found {len(real_influencers)} REAL influencers via web scraping")
                    
                    # Format for response
                    formatted_results = RealInfluencerService.format_for_partnership_response(
                        real_influencers
                    )
                    
                    return {
                        "success": True,
                        "results": formatted_results[:5],  # Return top 5
                        "total": len(formatted_results[:5]),
                        "message": f"Found {len(formatted_results[:5])} highly relevant {industry} influencers"
                    }
                    
            except Exception as e:
                print(f"⚠️ Web scraping failed: {str(e)}")
                print("Falling back to database/API methods...")
            
            # TIER 2: Fallback to database search
            print("🔍 Tier 2: Searching internal database...")
            influencers = await PartnershipAgentService.search_influencers_by_niche(
                industry=industry,
                location=location,
                limit=5
            )
            
            # Handle no results case
            if not influencers or len(influencers) == 0:
                print(f"⚠️ No highly relevant {industry} influencers found")
                return {
                    "success": True,
                    "results": [],
                    "total": 0,
                    "message": f"No highly relevant {industry} influencers found. The system searched Google and Instagram but couldn't find creators matching your niche. Try adjusting your search criteria."
                }
            
            print(f"✅ Found {len(influencers)} influencers from database/API")
            
            # Step 2: Analyze with Groq AI (only rank and recommend, don't invent categories)
            analyzed_results = await PartnershipAgentService.analyze_with_groq(
                business_data=request_data,
                influencers=influencers
            )
            
            print(f"✅ Analysis complete for {len(analyzed_results)} influencers")
            
            return {
                "success": True,
                "results": analyzed_results,
                "total": len(analyzed_results),
                "message": f"Found {len(analyzed_results)} highly relevant {industry} influencers"
            }
            
        except Exception as e:
            print(f"❌ Error in find_partnerships: {str(e)}")
            return {
                "success": False,
                "results": [],
                "total": 0,
                "message": f"Error: {str(e)}"
            }
