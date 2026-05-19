from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from services.nearby_business_service import NearbyBusinessService
from utils.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/b2b-network", tags=["B2B Network"])

# Request/Response Models
class Location(BaseModel):
    lat: float
    lng: float

class BusinessResponse(BaseModel):
    id: str
    name: str
    category: str
    logo: Optional[str] = None
    description: Optional[str] = None
    location: Location
    services: List[str]
    employees: Optional[int] = None
    ai_score: Optional[int] = None
    is_partner: bool
    is_verified: bool
    is_satellite: bool
    source: str
    website: Optional[str] = None
    connections: List[str] = []

class NearbyBusinessesResponse(BaseModel):
    businesses: List[BusinessResponse]
    total: int
    radius: int

@router.get("/nearby", response_model=NearbyBusinessesResponse)
async def get_nearby_businesses(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: int = Query(10000, description="Radius in meters"),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """
    Get businesses near a specific location
    
    Note: Use /nearby/me endpoint to automatically use your business location
    """
    try:
        service = NearbyBusinessService()
        businesses = await service.get_nearby_businesses(
            lat=lat,
            lng=lng,
            radius=radius,
            category=category,
            user_id=None
        )
        
        return NearbyBusinessesResponse(
            businesses=businesses,
            total=len(businesses),
            radius=radius
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nearby/me", response_model=NearbyBusinessesResponse)
async def get_nearby_businesses_for_user(
    radius: int = Query(50000, description="Radius in meters (default: 50km for city-wide search)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    saadhyam_only: bool = Query(False, description="Show only Sadhyam users"),
    current_user: User = Depends(get_current_user)
):
    """
    Get businesses in YOUR city (city-wide search) - SIMPLIFIED VERSION
    """
    try:
        print(f"🚀 B2B Network API called by user: {current_user.email}")
        
        # Use the real service to fetch businesses
        service = NearbyBusinessService()
        
        # Get user's business location from their profile
        lat, lng = None, None
        
        # Try to get location from business_location JSON field first
        if current_user.business_location:
            import json
            try:
                if isinstance(current_user.business_location, str):
                    location_data = json.loads(current_user.business_location)
                else:
                    location_data = current_user.business_location
                
                lat = location_data.get("lat")
                lng = location_data.get("lng")
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"⚠️ Error parsing business_location: {e}")
        
        # Fallback to separate latitude/longitude columns
        if lat is None and current_user.latitude is not None:
            lat = current_user.latitude
            lng = current_user.longitude
        
        # If no location set, return error immediately (don't use default)
        if lat is None:
            print("⚠️ User has no business location set")
            raise HTTPException(
                status_code=400, 
                detail="Please set your business location in Settings to discover nearby businesses"
            )
        
        print(f"📍 Searching near: {lat}, {lng} with radius {radius}m")
        
        # Fetch real businesses from the service with timeout protection
        import asyncio
        try:
            # Add timeout to prevent hanging
            businesses = await asyncio.wait_for(
                service.get_nearby_businesses(
                    lat=lat,
                    lng=lng,
                    radius=radius,
                    category=category,
                    user_id=current_user.id,
                    saadhyam_only=saadhyam_only
                ),
                timeout=25.0  # 25 second timeout
            )
        except asyncio.TimeoutError:
            print("⏱️ Request timed out after 25 seconds")
            # Return at least Sadhyam users even if external API times out
            businesses = await service._get_saadhyam_businesses(lat, lng, radius, category)
            print(f"✅ Fallback: Returning {len(businesses)} Sadhyam users only")
        
        print(f"✅ Found {len(businesses)} businesses")
        
        return NearbyBusinessesResponse(
            businesses=businesses,
            total=len(businesses),
            radius=radius
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to load businesses. Please try again.")

@router.get("/connections/{business_id}")
async def get_business_connections(
    business_id: str,
):
    """
    Get all connections for a specific business
    """
    try:
        service = NearbyBusinessService()
        connections = await service.get_business_connections(business_id)
        return {"connections": connections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_businesses(
    query: str = Query(..., description="Search query"),
    lat: Optional[float] = Query(None, description="Latitude for nearby search"),
    lng: Optional[float] = Query(None, description="Longitude for nearby search"),
    radius: int = Query(10000, description="Radius in meters"),  # 10km default
):
    """
    Search businesses by name, category, or services
    """
    try:
        service = NearbyBusinessService()
        businesses = await service.search_businesses(
            query=query,
            lat=lat,
            lng=lng,
            radius=radius
        )
        return {"businesses": businesses, "total": len(businesses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_categories():
    """
    Get all available business categories
    """
    categories = [
        "Technology",
        "Marketing",
        "Consulting",
        "Healthcare",
        "Education",
        "Retail",
        "Finance",
        "Real Estate",
        "Manufacturing",
        "Hospitality",
        "Transportation",
        "Entertainment",
    ]
    return {"categories": categories}
