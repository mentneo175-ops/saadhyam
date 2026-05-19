"""
One-time script to geocode existing users' business locations
Run this to fix the B2B Network location issue for existing users
"""

import sys
import asyncio
import httpx
from sqlalchemy.orm import Session
from config.database import SyncSessionLocal
from models.user import User
from services.geocoding_service import get_city_coordinates
from typing import Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def geocode_location_full(location: str) -> Optional[Tuple[float, float]]:
    """
    Geocode location using Nominatim API (supports worldwide addresses)
    
    Args:
        location: Location string
    
    Returns:
        Tuple of (latitude, longitude) or None
    """
    try:
        logger.info(f"🌍 Geocoding location: {location}")
        
        params = {
            "q": location,
            "format": "json",
            "limit": 1,
            # Removed countrycodes to support worldwide addresses
        }
        
        headers = {
            "User-Agent": "Saadhyam-B2B-Network/1.0"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
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

async def geocode_with_fallback(location: str) -> Optional[Tuple[float, float]]:
    """
    Try predefined cities first, then fall back to API
    """
    # Try predefined cities first (instant)
    coords = get_city_coordinates(location)
    if coords:
        return coords
    
    # Fall back to full geocoding API (supports worldwide)
    return await geocode_location_full(location)

async def migrate_user_locations_async():
    """Geocode all users who have business_location but no coordinates"""
    db: Session = SyncSessionLocal()
    
    try:
        # Find users with location text but no coordinates
        users = db.query(User).filter(
            User.business_location.isnot(None),
            User.business_location != ""
        ).all()
        
        print(f"Found {len(users)} users with business locations")
        
        updated_count = 0
        for user in users:
            # Skip if already has coordinates
            if user.latitude and user.longitude:
                print(f"✓ {user.email}: Already has coordinates ({user.latitude}, {user.longitude})")
                continue
            
            print(f"\n📍 Processing: {user.email}")
            print(f"   Location: {user.business_location}")
            
            # Geocode the location (with API fallback)
            coords = await geocode_with_fallback(user.business_location)
            
            if coords:
                user.latitude, user.longitude = coords
                print(f"   ✅ Geocoded to: {user.latitude}, {user.longitude}")
                updated_count += 1
            else:
                print(f"   ❌ Failed to geocode location")
            
            # Rate limiting: wait 1 second between API calls (Nominatim requirement)
            await asyncio.sleep(1)
        
        # Commit all changes
        db.commit()
        print(f"\n✅ Migration complete! Updated {updated_count} users")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

def migrate_user_locations():
    """Wrapper to run async migration"""
    asyncio.run(migrate_user_locations_async())

if __name__ == "__main__":
    print("🚀 Starting location migration...")
    migrate_user_locations()
