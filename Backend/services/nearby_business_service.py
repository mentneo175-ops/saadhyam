import httpx
from typing import List, Optional, Dict
from datetime import datetime
import math
import json

class NearbyBusinessService:
    """
    Service for discovering and managing nearby businesses
    Integrates with Overpass API for external business discovery
    """
    
    # Multiple Overpass API mirrors for reliability
    OVERPASS_URLS = [
        "https://overpass.kumi.systems/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass-api.de/api/interpreter"
    ]
    
    def __init__(self):
        # Use connection pooling and keep-alive for better performance
        self.client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            http2=True  # Enable HTTP/2 for better performance
        )
    
    # Synergy matrix defining complementary B2B categories for matchmaking
    SYNERGY_MATRIX = {
        "Technology": ["Technology", "Consulting", "Marketing", "Finance", "Education"],
        "Marketing": ["Marketing", "Retail", "Technology", "Consulting", "Entertainment", "Hospitality"],
        "Consulting": ["Consulting", "Technology", "Finance", "Marketing", "Manufacturing"],
        "Healthcare": ["Healthcare", "Consulting", "Technology", "Education"],
        "Education": ["Education", "Consulting", "Technology", "Healthcare"],
        "Retail": ["Retail", "Transportation", "Marketing", "Technology", "Finance", "Hospitality"],
        "Finance": ["Finance", "Consulting", "Real Estate", "Technology"],
        "Real Estate": ["Real Estate", "Finance", "Consulting", "Marketing"],
        "Manufacturing": ["Manufacturing", "Transportation", "Consulting", "Retail", "Technology"],
        "Hospitality": ["Hospitality", "Retail", "Marketing", "Entertainment", "Transportation"],
        "Transportation": ["Transportation", "Manufacturing", "Retail", "Technology", "Hospitality"],
        "Entertainment": ["Entertainment", "Marketing", "Hospitality", "Retail"],
        "E-commerce": ["Technology", "Marketing", "Consulting", "Retail", "Transportation", "Other"],
        "Health": ["Healthcare", "Consulting", "Technology", "Education", "Retail"],
        "Other": ["Technology", "Marketing", "Consulting", "Retail", "Finance", "Hospitality"]
    }

    def _calculate_compatibility(
        self,
        user_category: Optional[str],
        user_services: List[str],
        candidate_category: str,
        candidate_services: List[str]
    ) -> int:
        """
        Calculate dynamic B2B synergy compatibility score (10-99)
        """
        if not user_category or user_category == "Other":
            return 82  # Decent default baseline for unknown categories
            
        user_cat = user_category.strip()
        cand_cat = candidate_category.strip()
        
        # 1. Base Score from Synergy Matrix
        if user_cat == cand_cat:
            base_score = 90  # Same industry partner
        elif cand_cat in self.SYNERGY_MATRIX.get(user_cat, []):
            base_score = 78  # Standard synergistic category
        else:
            base_score = 45  # Unrelated category
            
        # 2. Service overlap boost
        overlap_count = 0
        user_svcs_lower = [s.lower().strip() for s in user_services if s]
        cand_svcs_lower = [s.lower().strip() for s in candidate_services if s]
        
        for u_svc in user_svcs_lower:
            for c_svc in cand_svcs_lower:
                if u_svc in c_svc or c_svc in u_svc:
                    overlap_count += 1
                    
        boost = min(overlap_count * 5, 12)  # Max 12 points boost
        
        # 3. Deterministic variance to look authentic
        import hashlib
        hash_val = int(hashlib.md5(f"{user_cat}-{cand_cat}-{candidate_services}".encode()).hexdigest(), 16)
        variance = (hash_val % 7) - 3  # -3 to +3
        
        final_score = base_score + boost + variance
        return max(10, min(99, final_score))

    async def get_nearby_businesses(
        self,
        lat: float,
        lng: float,
        radius: int = 5000,
        category: Optional[str] = None,
        user_id: Optional[str] = None,
        saadhyam_only: bool = False,
        relevant_only: bool = False  # Filter for synergistic categories
    ) -> List[Dict]:
        """
        Get businesses from Saadhyam network and external sources with synergy filtering and matchmaking
        """
        # 1. Try to fetch from Redis cache first
        lat_r = round(lat, 3)
        lng_r = round(lng, 3)
        cache_key = f"b2b_network:{lat_r}:{lng_r}:{radius}:{category}:{saadhyam_only}:{relevant_only}:{user_id}"
        
        redis_client = None
        try:
            from services.redis_service import get_redis_client
            redis_client = await get_redis_client()
            if redis_client:
                cached_val = await redis_client.get(cache_key)
                if cached_val:
                    print("🚀 B2B Network Cache HIT!")
                    return json.loads(cached_val)
        except Exception as cache_err:
            print(f"⚠️ Cache read error: {cache_err}")

        user_category = None
        user_services = []
        
        # STEP 0: Fetch current user profile to determine business type for matching
        if user_id:
            try:
                from config.database import SyncSessionLocal
                from models.user import User
                from sqlalchemy import select
                
                db = SyncSessionLocal()
                try:
                    stmt = select(User).where(User.id == int(user_id))
                    res = db.execute(stmt)
                    user = res.scalar_one_or_none()
                    if user:
                        user_category = user.business_type
                        if user.business_services:
                            user_services = [s.strip() for s in user.business_services.split(",") if s.strip()]
                        print(f"💼 Loaded user business type: {user_category} for compatibility calculations")
                finally:
                    db.close()
            except Exception as e:
                print(f"⚠️ Error loading current user details for synergy matching: {e}")

        # STEP 1: Always get Sadhyam users (this always works)
        print(f"📊 Fetching Sadhyam users...")
        saadhyam_businesses = await self._get_saadhyam_businesses(lat, lng, radius, category)
        print(f"✅ Got {len(saadhyam_businesses)} Sadhyam users")
        
        # STEP 2: Try to get external businesses (if not filtered out)
        external_businesses = []
        if not saadhyam_only:
            print(f"🌍 Attempting to fetch external businesses from Overpass API...")
            try:
                search_radius = min(radius, 8000)  # Cap at 8km to ensure fast response times
                external_businesses = await self._get_external_businesses(lat, lng, search_radius, category)
                print(f"✅ Got {len(external_businesses)} external businesses")
            except Exception as e:
                print(f"⚠️  Overpass API failed: {e}")
                
        # Apply B2B Synergy Matrix Filter if relevant_only is enabled and user business type is known
        if relevant_only and user_category:
            synergistic_cats = self.SYNERGY_MATRIX.get(user_category, [])
            # Always allow user's own category
            allowed_cats = set(synergistic_cats + [user_category])
            
            print(f"⚡ Filtering for relevant categories for {user_category}: {allowed_cats}")
            saadhyam_businesses = [b for b in saadhyam_businesses if b["category"] in allowed_cats]
            external_businesses = [b for b in external_businesses if b["category"] in allowed_cats]
            print(f"✅ Filtered to {len(saadhyam_businesses)} Sadhyam & {len(external_businesses)} external businesses")

        # Combine all businesses
        businesses = []
        businesses.extend(saadhyam_businesses)
        businesses.extend(external_businesses)
        
        # STEP 3: Calculate distances and B2B compatibility scores
        for business in businesses:
            distance = self._calculate_distance(
                lat, lng, 
                business["location"]["lat"], 
                business["location"]["lng"]
            )
            business["distance"] = round(distance)  # Distance in meters
            business["distance_km"] = round(distance / 1000, 1)  # Distance in km
            
            # Calculate dynamic compatibility matching score
            business["ai_score"] = self._calculate_compatibility(
                user_category=user_category,
                user_services=user_services,
                candidate_category=business["category"],
                candidate_services=business.get("services", [])
            )
        
        # STEP 4: Sort by distance
        businesses.sort(key=lambda b: b["distance"])
        
        # STEP 5: Cap the results to prevent huge payloads and frontend lag
        if len(businesses) > 100:
            partners = [b for b in businesses if b.get("is_partner")]
            externals = [b for b in businesses if not b.get("is_partner")]
            # Keep all partners, and fill the rest with closest externals up to 100 total
            allowed_externals = max(0, 100 - len(partners))
            businesses = partners + externals[:allowed_externals]
            # Re-sort by distance
            businesses.sort(key=lambda b: b["distance"])
        
        # Save to cache for 5 minutes (300 seconds)
        try:
            if redis_client:
                await redis_client.setex(cache_key, 300, json.dumps(businesses))
                print("✅ B2B Network Cache SET")
        except Exception as cache_err:
            print(f"⚠️ Cache write error: {cache_err}")

        print(f"📍 Final result: {len(businesses)} total businesses")
        return businesses
    
    async def _get_saadhyam_businesses(
        self,
        lat: float,
        lng: float,
        radius: int,
        category: Optional[str] = None
    ) -> List[Dict]:
        """
        Get businesses from Saadhyam database (registered partners)
        Shows ALL users regardless of location or profile completeness
        """
        try:
            from config.database import SyncSessionLocal
            from models.user import User
            from sqlalchemy import select
            
            # Get sync database session
            db = SyncSessionLocal()
            try:
                # Query all users - NO FILTERS, show everyone!
                query = select(User).filter(
                    User.email.isnot(None)  # Just need to be a valid user
                )
                
                # Filter by category if provided
                if category:
                    query = query.filter(User.business_type == category)
                
                result = db.execute(query)
                users = result.scalars().all()
                
                businesses = []
                for user in users:
                    # Use default values if data is missing
                    business_name = user.business_name or user.email.split('@')[0]
                    business_type = user.business_type or "Other"
                    
                    # Use user's coordinates if available, otherwise use search center
                    user_lat = user.latitude if user.latitude else lat
                    user_lng = user.longitude if user.longitude else lng
                    
                    # Calculate distance
                    distance = self._calculate_distance(lat, lng, user_lat, user_lng)
                    
                    # NO RADIUS FILTER - Show all users regardless of distance
                    
                    # Build business object
                    business = {
                        "id": f"saadhyam-{user.id}",
                        "name": business_name,
                        "category": business_type,
                        "logo": None,
                        "description": user.business_description if hasattr(user, 'business_description') else f"Sadhyam user: {user.email}",
                        "location": {
                            "lat": user_lat,
                            "lng": user_lng
                        },
                        "services": user.business_services.split(",") if hasattr(user, 'business_services') and user.business_services else ["General Services"],
                        "employees": None,
                        "ai_score": 95,
                        "is_partner": True,
                        "is_verified": True,
                        "is_satellite": False,
                        "source": "saadhyam",
                        "website": user.business_website if hasattr(user, 'business_website') else None,
                        "connections": []
                    }
                    
                    businesses.append(business)
                
                print(f"✅ Found {len(businesses)} Saadhyam partner businesses (showing ALL users)")
                return businesses
            finally:
                db.close()
            
        except Exception as e:
            print(f"❌ Error fetching Saadhyam businesses: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def _get_external_businesses(
        self,
        lat: float,
        lng: float,
        radius: int,
        category: Optional[str] = None
    ) -> List[Dict]:
        """
        Get businesses from Overpass API (OpenStreetMap)
        """
        try:
            print(f"🌍 Fetching real businesses from Overpass API...")
            print(f"   Location: {lat}, {lng}")
            print(f"   Radius: {radius}m")
            
            # Build Overpass query
            query = self._build_overpass_query(lat, lng, radius, category)
            
            # Try multiple Overpass mirrors for reliability
            for url in self.OVERPASS_URLS:
                try:
                    print(f"   Trying: {url}")
                    
                    # CRITICAL: Send as raw text with Content-Type: text/plain
                    response = await self.client.post(
                        url,
                        data=query,  # Raw query string, NOT json or params
                        headers={
                            "Content-Type": "text/plain",
                            "User-Agent": "SaadhyamBusinessDiscoveryApp/1.0 (saikiranmain1708@gmail.com)"
                        },  # MUST be text/plain and have a descriptive User-Agent
                        timeout=5.0  # Reduced from 15s to 5s to prevent frontend timeouts
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        businesses = self._parse_overpass_response(data)
                        print(f"✅ Found {len(businesses)} real businesses from OpenStreetMap")
                        return businesses
                    else:
                        print(f"   ❌ Error {response.status_code}, trying next mirror...")
                        continue
                        
                except httpx.TimeoutException:
                    print(f"   ⏱️  Timeout, trying next mirror...")
                    continue
                except Exception as e:
                    print(f"   ❌ Error: {e}, trying next mirror...")
                    continue
            
            # All mirrors failed
            print(f"❌ All Overpass API mirrors failed")
            return []
            
        except Exception as e:
            print(f"❌ Error fetching external businesses: {e}")
            return []
    
    def _build_overpass_query(
        self,
        lat: float,
        lng: float,
        radius: int,
        category: Optional[str] = None
    ) -> str:
        """
        Build Overpass API query for businesses
        Simplified query for better reliability
        """
        # Simplified query - fewer types for better performance
        query = f"""[out:json][timeout:15];
(
  node["shop"]["name"](around:{radius},{lat},{lng});
  way["shop"]["name"](around:{radius},{lat},{lng});
  node["amenity"~"restaurant|cafe|bank|pharmacy|hospital|clinic|school|university"]["name"](around:{radius},{lat},{lng});
  way["amenity"~"restaurant|cafe|bank|pharmacy|hospital|clinic|school|university"]["name"](around:{radius},{lat},{lng});
);
out center;"""
        
        return query
    
    def _parse_overpass_response(self, data: Dict) -> List[Dict]:
        """
        Parse Overpass API response into business objects
        """
        businesses = []
        
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            name = tags.get("name")
            
            if not name:
                continue
            
            # Get location
            if element["type"] == "node":
                location = {
                    "lat": element["lat"],
                    "lng": element["lon"]
                }
            elif element["type"] == "way" and "center" in element:
                location = {
                    "lat": element["center"]["lat"],
                    "lng": element["center"]["lon"]
                }
            else:
                continue
            
            # Determine category
            category = self._determine_category(tags)
            
            # Extract services
            services = []
            if "cuisine" in tags:
                services.append(tags["cuisine"])
            if "amenity" in tags:
                services.append(tags["amenity"].replace("_", " ").title())
            
            business = {
                "id": f"external-{element['id']}",
                "name": name,
                "category": category,
                "location": location,
                "services": services if services else ["General Services"],
                "is_partner": False,
                "is_verified": False,
                "is_satellite": False,
                "source": "external",
                "connections": []
            }
            
            if "website" in tags:
                business["website"] = tags["website"]
            
            businesses.append(business)
        
        return businesses
    
    def _determine_category(self, tags: Dict) -> str:
        """
        Determine business category from OSM tags
        """
        # Check shop types
        if "shop" in tags:
            shop_type = tags["shop"]
            if shop_type in ["computer", "electronics", "mobile_phone"]:
                return "Technology"
            elif shop_type in ["clothes", "shoes", "jewelry", "department_store", "mall", "supermarket"]:
                return "Retail"
            elif shop_type in ["books", "stationery"]:
                return "Education"
            else:
                return "Retail"
        
        # Check office types
        if "office" in tags:
            office_type = tags.get("office", "")
            if office_type in ["it", "software", "telecommunication"]:
                return "Technology"
            elif office_type in ["advertising", "marketing"]:
                return "Marketing"
            elif office_type in ["consulting", "accountant", "lawyer", "financial"]:
                return "Consulting"
            else:
                return "Consulting"
        
        # Check amenity types
        amenity = tags.get("amenity", "")
        if amenity in ["hospital", "clinic", "dentist", "pharmacy", "veterinary", "doctors"]:
            return "Healthcare"
        elif amenity in ["school", "college", "university", "library", "language_school"]:
            return "Education"
        elif amenity in ["restaurant", "cafe", "bar", "fast_food", "food_court"]:
            return "Retail"
        elif amenity in ["bank", "atm"]:
            return "Finance"
        elif amenity in ["gym", "fitness_centre", "sports_centre"]:
            return "Health"
        
        # Check tourism types
        tourism = tags.get("tourism", "")
        if tourism in ["hotel", "motel", "guest_house", "hostel"]:
            return "Hospitality"
        
        # Default
        return "Other"
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two coordinates in meters (Haversine formula)
        """
        R = 6371000  # Earth radius in meters
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)
        
        a = math.sin(delta_phi / 2) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    async def get_business_connections(self, business_id: str) -> List[str]:
        """
        Get all connections for a business
        TODO: Implement actual database query
        """
        return []
    
    async def claim_business(
        self,
        user_id: str,
        external_business_id: str,
        business_name: str,
        category: str,
        location: Dict,
        proof_url: Optional[str] = None
    ) -> Dict:
        """
        Claim an external business
        TODO: Implement actual claim process with verification
        """
        return {
            "success": True,
            "message": "Business claim request submitted. We'll verify and get back to you.",
            "claim_id": f"claim-{datetime.now().timestamp()}"
        }
    
    async def search_businesses(
        self,
        query: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: int = 5000
    ) -> List[Dict]:
        """
        Search businesses by name, category, or services
        """
        if lat and lng:
            businesses = await self.get_nearby_businesses(lat, lng, radius)
        else:
            businesses = await self._get_saadhyam_businesses(0, 0, 999999)
        
        # Filter by search query
        query_lower = query.lower()
        filtered = [
            b for b in businesses
            if query_lower in b["name"].lower() or
               query_lower in b["category"].lower() or
               any(query_lower in s.lower() for s in b.get("services", []))
        ]
        
        return filtered
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
