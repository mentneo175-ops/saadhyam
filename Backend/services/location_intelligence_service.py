"""
Location Intelligence Service
Smart location expansion and fallback for influencer discovery
"""

from typing import List, Dict, Any, Tuple


class LocationIntelligenceService:
    """
    Intelligent location expansion and fallback system
    Progressively broadens search scope to ensure results
    """
    
    # Location hierarchy mapping for Indian cities/regions
    LOCATION_HIERARCHY = {
        # Andhra Pradesh
        "kakinada": {
            "city": "Kakinada",
            "nearby_cities": ["Rajahmundry", "Visakhapatnam", "Vijayawada"],
            "district": "East Godavari",
            "state": "Andhra Pradesh",
            "region": "Coastal Andhra",
            "language": "Telugu"
        },
        "rajahmundry": {
            "city": "Rajahmundry",
            "nearby_cities": ["Kakinada", "Visakhapatnam", "Vijayawada"],
            "district": "East Godavari",
            "state": "Andhra Pradesh",
            "region": "Coastal Andhra",
            "language": "Telugu"
        },
        "visakhapatnam": {
            "city": "Visakhapatnam",
            "nearby_cities": ["Vizag", "Kakinada", "Vijayawada"],
            "district": "Visakhapatnam",
            "state": "Andhra Pradesh",
            "region": "Coastal Andhra",
            "language": "Telugu"
        },
        "vizag": {
            "city": "Visakhapatnam",
            "nearby_cities": ["Visakhapatnam", "Kakinada", "Vijayawada"],
            "district": "Visakhapatnam",
            "state": "Andhra Pradesh",
            "region": "Coastal Andhra",
            "language": "Telugu"
        },
        "vijayawada": {
            "city": "Vijayawada",
            "nearby_cities": ["Guntur", "Visakhapatnam", "Kakinada"],
            "district": "Krishna",
            "state": "Andhra Pradesh",
            "region": "Coastal Andhra",
            "language": "Telugu"
        },
        "guntur": {
            "city": "Guntur",
            "nearby_cities": ["Vijayawada", "Visakhapatnam"],
            "district": "Guntur",
            "state": "Andhra Pradesh",
            "region": "Coastal Andhra",
            "language": "Telugu"
        },
        "tirupati": {
            "city": "Tirupati",
            "nearby_cities": ["Nellore", "Chittoor"],
            "district": "Tirupati",
            "state": "Andhra Pradesh",
            "region": "Rayalaseema",
            "language": "Telugu"
        },
        
        # Telangana
        "hyderabad": {
            "city": "Hyderabad",
            "nearby_cities": ["Secunderabad", "Warangal", "Nizamabad"],
            "district": "Hyderabad",
            "state": "Telangana",
            "region": "Telangana",
            "language": "Telugu"
        },
        "secunderabad": {
            "city": "Secunderabad",
            "nearby_cities": ["Hyderabad", "Warangal"],
            "district": "Hyderabad",
            "state": "Telangana",
            "region": "Telangana",
            "language": "Telugu"
        },
        "warangal": {
            "city": "Warangal",
            "nearby_cities": ["Hyderabad", "Karimnagar"],
            "district": "Warangal",
            "state": "Telangana",
            "region": "Telangana",
            "language": "Telugu"
        },
        
        # Karnataka
        "bangalore": {
            "city": "Bangalore",
            "nearby_cities": ["Bengaluru", "Mysore", "Mangalore"],
            "district": "Bangalore Urban",
            "state": "Karnataka",
            "region": "South Karnataka",
            "language": "Kannada"
        },
        "bengaluru": {
            "city": "Bengaluru",
            "nearby_cities": ["Bangalore", "Mysore", "Mangalore"],
            "district": "Bangalore Urban",
            "state": "Karnataka",
            "region": "South Karnataka",
            "language": "Kannada"
        },
        "mysore": {
            "city": "Mysore",
            "nearby_cities": ["Bangalore", "Mangalore"],
            "district": "Mysore",
            "state": "Karnataka",
            "region": "South Karnataka",
            "language": "Kannada"
        },
        
        # Tamil Nadu
        "chennai": {
            "city": "Chennai",
            "nearby_cities": ["Madras", "Coimbatore", "Madurai"],
            "district": "Chennai",
            "state": "Tamil Nadu",
            "region": "Tamil Nadu",
            "language": "Tamil"
        },
        "coimbatore": {
            "city": "Coimbatore",
            "nearby_cities": ["Chennai", "Madurai"],
            "district": "Coimbatore",
            "state": "Tamil Nadu",
            "region": "Tamil Nadu",
            "language": "Tamil"
        },
        
        # Maharashtra
        "mumbai": {
            "city": "Mumbai",
            "nearby_cities": ["Pune", "Thane", "Navi Mumbai"],
            "district": "Mumbai",
            "state": "Maharashtra",
            "region": "Western India",
            "language": "Marathi"
        },
        "pune": {
            "city": "Pune",
            "nearby_cities": ["Mumbai", "Nashik"],
            "district": "Pune",
            "state": "Maharashtra",
            "region": "Western India",
            "language": "Marathi"
        },
        
        # Delhi NCR
        "delhi": {
            "city": "Delhi",
            "nearby_cities": ["New Delhi", "Gurgaon", "Noida", "Ghaziabad"],
            "district": "Delhi",
            "state": "Delhi",
            "region": "NCR",
            "language": "Hindi"
        },
        "gurgaon": {
            "city": "Gurgaon",
            "nearby_cities": ["Delhi", "Noida"],
            "district": "Gurgaon",
            "state": "Haryana",
            "region": "NCR",
            "language": "Hindi"
        },
        
        # West Bengal
        "kolkata": {
            "city": "Kolkata",
            "nearby_cities": ["Calcutta", "Howrah"],
            "district": "Kolkata",
            "state": "West Bengal",
            "region": "Eastern India",
            "language": "Bengali"
        },
    }
    
    @staticmethod
    def get_location_info(location: str) -> Dict[str, Any]:
        """
        Get location hierarchy information
        
        Args:
            location: City/location name
            
        Returns:
            Location info dict with hierarchy
        """
        location_lower = location.lower().strip()
        
        # Check if location exists in hierarchy
        if location_lower in LocationIntelligenceService.LOCATION_HIERARCHY:
            return LocationIntelligenceService.LOCATION_HIERARCHY[location_lower]
        
        # Check if location is mentioned in any nearby cities
        for loc_key, loc_info in LocationIntelligenceService.LOCATION_HIERARCHY.items():
            if location_lower in loc_info.get("city", "").lower():
                return loc_info
            if location_lower in [city.lower() for city in loc_info.get("nearby_cities", [])]:
                return loc_info
        
        # Default fallback for unknown locations
        return {
            "city": location,
            "nearby_cities": [],
            "district": location,
            "state": "India",
            "region": "India",
            "language": "English"
        }
    
    @staticmethod
    def generate_location_search_levels(location: str) -> List[Dict[str, Any]]:
        """
        Generate progressive search levels for location
        
        Args:
            location: Original location
            
        Returns:
            List of search levels with locations and confidence scores
        """
        loc_info = LocationIntelligenceService.get_location_info(location)
        
        search_levels = []
        
        # LEVEL 1: Exact city match (100% confidence)
        search_levels.append({
            "level": 1,
            "type": "exact",
            "location": loc_info["city"],
            "confidence": "Exact Match",
            "confidence_score": 100,
            "description": f"Creators from {loc_info['city']}"
        })
        
        # LEVEL 2: Nearby cities (80% confidence)
        if loc_info.get("nearby_cities"):
            for nearby_city in loc_info["nearby_cities"][:2]:  # Top 2 nearby cities
                search_levels.append({
                    "level": 2,
                    "type": "nearby",
                    "location": nearby_city,
                    "confidence": "Nearby Match",
                    "confidence_score": 80,
                    "description": f"Creators from nearby {nearby_city}"
                })
        
        # LEVEL 3: District/Region (60% confidence)
        if loc_info.get("district") and loc_info["district"] != loc_info["city"]:
            search_levels.append({
                "level": 3,
                "type": "district",
                "location": loc_info["district"],
                "confidence": "Regional Match",
                "confidence_score": 60,
                "description": f"Creators from {loc_info['district']} region"
            })
        
        # LEVEL 4: State (50% confidence)
        if loc_info.get("state"):
            search_levels.append({
                "level": 4,
                "type": "state",
                "location": loc_info["state"],
                "confidence": "State Match",
                "confidence_score": 50,
                "description": f"Creators from {loc_info['state']}"
            })
        
        # LEVEL 5: Regional/Language (40% confidence)
        if loc_info.get("region") and loc_info["region"] != loc_info["state"]:
            search_levels.append({
                "level": 5,
                "type": "regional",
                "location": loc_info["region"],
                "confidence": "Regional Match",
                "confidence_score": 40,
                "description": f"Creators from {loc_info['region']} region"
            })
        
        # LEVEL 6: Language-based (30% confidence)
        if loc_info.get("language") and loc_info["language"] != "English":
            search_levels.append({
                "level": 6,
                "type": "language",
                "location": f"{loc_info['language']} creators",
                "confidence": "Language Match",
                "confidence_score": 30,
                "description": f"{loc_info['language']}-speaking creators"
            })
        
        return search_levels
    
    @staticmethod
    def calculate_location_relevance(
        influencer_location: str,
        target_location: str,
        search_level: Dict[str, Any]
    ) -> float:
        """
        Calculate location relevance score with fuzzy matching
        
        Args:
            influencer_location: Influencer's location
            target_location: Target location
            search_level: Search level info
            
        Returns:
            Relevance score (0-100)
        """
        if not influencer_location:
            return search_level["confidence_score"] * 0.5
        
        inf_loc_lower = influencer_location.lower()
        target_loc_lower = target_location.lower()
        search_loc_lower = search_level["location"].lower()
        
        # Exact match with target
        if target_loc_lower in inf_loc_lower:
            return 100.0
        
        # Match with search level location
        if search_loc_lower in inf_loc_lower:
            return search_level["confidence_score"]
        
        # Get location info for fuzzy matching
        target_info = LocationIntelligenceService.get_location_info(target_location)
        
        # Check state match
        if target_info.get("state", "").lower() in inf_loc_lower:
            return 50.0
        
        # Check region match
        if target_info.get("region", "").lower() in inf_loc_lower:
            return 40.0
        
        # Check nearby cities
        for nearby in target_info.get("nearby_cities", []):
            if nearby.lower() in inf_loc_lower:
                return 70.0
        
        # India match (weak)
        if "india" in inf_loc_lower:
            return 30.0
        
        # No match
        return search_level["confidence_score"] * 0.3
    
    @staticmethod
    def should_expand_search(results_count: int, min_threshold: int = 3) -> bool:
        """
        Determine if search should be expanded to next level
        
        Args:
            results_count: Current results count
            min_threshold: Minimum acceptable results
            
        Returns:
            True if should expand search
        """
        return results_count < min_threshold
    
    @staticmethod
    def merge_and_deduplicate_results(
        results_by_level: Dict[int, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Merge results from multiple search levels and remove duplicates
        
        Args:
            results_by_level: Dict mapping level to results
            
        Returns:
            Merged and deduplicated results
        """
        seen_urls = set()
        merged = []
        
        # Process levels in order (exact matches first)
        for level in sorted(results_by_level.keys()):
            for result in results_by_level[level]:
                url = result.get("profile_url", "")
                username = result.get("username", "")
                
                # Create unique key
                key = f"{url}_{username}".lower()
                
                if key not in seen_urls:
                    seen_urls.add(key)
                    merged.append(result)
        
        return merged
