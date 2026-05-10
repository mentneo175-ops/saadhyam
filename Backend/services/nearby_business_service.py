import httpx
from typing import List, Optional, Dict
from datetime import datetime
import math

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
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_nearby_businesses(
        self,
        lat: float,
        lng: float,
        radius: int = 5000,
        category: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict]:
        """
        Get businesses in the user's city from both Saadhyam network and external sources
        Uses city-wide search - searches entire city area, not just radius
        """
        businesses = []
        
        # Get Saadhyam partner businesses (from database)
        saadhyam_businesses = await self._get_saadhyam_businesses(lat, lng, radius, category)
        businesses.extend(saadhyam_businesses)
        
        # Get external businesses from Overpass API (city-wide search)
        # Use large radius to cover entire city (50km = 50000m)
        city_radius = 50000  # 50km covers most cities
        external_businesses = await self._get_external_businesses(lat, lng, city_radius, category)
        businesses.extend(external_businesses)
        
        # Sort by distance
        businesses.sort(key=lambda b: self._calculate_distance(
            lat, lng, b["location"]["lat"], b["location"]["lng"]
        ))
        
        return businesses
    
    async def _get_saadhyam_businesses(
        self,
        lat: float,
        lng: float,
        radius: int,
        category: Optional[str] = None
    ) -> List[Dict]:
        """
        Get businesses from Saadhyam database
        TODO: Implement actual database query
        """
        # For now, return empty list - will be populated from actual database later
        # This allows real Overpass API data to show
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
                        headers={"Content-Type": "text/plain"},  # MUST be text/plain
                        timeout=60.0
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
        query = f"""[out:json][timeout:60];
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
