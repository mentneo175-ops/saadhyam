"""
Geocoding Service
Converts location text to coordinates using Nominatim (OpenStreetMap)
"""

import httpx
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class GeocodingService:
    """
    Free geocoding service using Nominatim (OpenStreetMap)
    No API key required!
    """
    
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
    
    async def geocode(self, location: str) -> Optional[Tuple[float, float]]:
        """
        Convert location text to coordinates
        
        Args:
            location: Location string (e.g., "Kakinada, Andhra Pradesh")
        
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        try:
            logger.info(f"🌍 Geocoding location: {location}")
            
            params = {
                "q": location,
                "format": "json",
                "limit": 1,
                "countrycodes": "in",  # Limit to India for better results
            }
            
            headers = {
                "User-Agent": "Saadhyam-B2B-Network/1.0"  # Required by Nominatim
            }
            
            response = await self.client.get(
                self.NOMINATIM_URL,
                params=params,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Geocoding failed: {response.status_code}")
                return None
            
            data = response.json()
            
            if not data or len(data) == 0:
                logger.warning(f"⚠️  No results found for: {location}")
                return None
            
            result = data[0]
            lat = float(result["lat"])
            lng = float(result["lon"])
            
            logger.info(f"✅ Geocoded: {location} → ({lat}, {lng})")
            return (lat, lng)
            
        except Exception as e:
            logger.error(f"❌ Geocoding error: {e}")
            return None
    
    async def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        Convert coordinates to location text
        
        Args:
            lat: Latitude
            lng: Longitude
        
        Returns:
            Location string or None if not found
        """
        try:
            logger.info(f"🌍 Reverse geocoding: ({lat}, {lng})")
            
            params = {
                "lat": lat,
                "lon": lng,
                "format": "json",
            }
            
            headers = {
                "User-Agent": "Saadhyam-B2B-Network/1.0"
            }
            
            response = await self.client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params=params,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Reverse geocoding failed: {response.status_code}")
                return None
            
            data = response.json()
            location = data.get("display_name")
            
            logger.info(f"✅ Reverse geocoded: ({lat}, {lng}) → {location}")
            return location
            
        except Exception as e:
            logger.error(f"❌ Reverse geocoding error: {e}")
            return None
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Predefined coordinates for common Indian cities (fallback)
CITY_COORDINATES = {
    "hyderabad": (17.3850, 78.4867),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.7041, 77.1025),
    "bangalore": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "kakinada": (16.9891, 82.2475),
    "visakhapatnam": (17.6868, 83.2185),
    "vijayawada": (16.5062, 80.6480),
}

def get_city_coordinates(location: str) -> Optional[Tuple[float, float]]:
    """
    Get coordinates from predefined city list (instant, no API call)
    
    Args:
        location: Location string
    
    Returns:
        Tuple of (latitude, longitude) or None
    """
    location_lower = location.lower()
    
    for city, coords in CITY_COORDINATES.items():
        if city in location_lower:
            logger.info(f"✅ Found coordinates for {city}: {coords}")
            return coords
    
    return None
