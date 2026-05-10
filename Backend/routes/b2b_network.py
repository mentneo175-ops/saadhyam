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

class ClaimBusinessRequest(BaseModel):
    external_business_id: str
    business_name: str
    category: str
    location: Location
    proof_url: Optional[str] = None

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
    current_user: User = Depends(get_current_user)
):
    """
    Get businesses in YOUR city (city-wide search)
    
    This endpoint:
    - Gets your exact business location from the database
    - Searches entire city area (50km radius by default)
    - Returns all businesses in your city, not just nearby
    - Returns error if location not set
    """
    try:
        # Get user's business location from database
        from services.geocoding_service import get_city_coordinates
        
        # Try to get coordinates from database columns (now stored as Float)
        lat = getattr(current_user, 'latitude', None)
        lng = getattr(current_user, 'longitude', None)
        
        # If not in DB, geocode from location text
        if (not lat or not lng) and current_user.business_location:
            coords = get_city_coordinates(current_user.business_location)
            if coords:
                lat, lng = coords
        
        # Require valid coordinates - no defaults!
        if not lat or not lng:
            raise HTTPException(
                status_code=400,
                detail="Business location not set. Please update your business profile with a valid location."
            )
        
        print(f"📍 User business location: {current_user.business_location}")
        print(f"📍 Coordinates: {lat}, {lng}")
        print(f"📏 Search radius: {radius}m ({radius/1000}km) - City-wide search")
        
        # Search businesses near user's location
        service = NearbyBusinessService()
        businesses = await service.get_nearby_businesses(
            lat=lat,
            lng=lng,
            radius=radius,
            category=category,
            user_id=str(current_user.id)
        )
        
        return NearbyBusinessesResponse(
            businesses=businesses,
            total=len(businesses),
            radius=radius
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@router.post("/claim")
async def claim_business(
    request: ClaimBusinessRequest,
):
    """
    Claim an external business and convert it to Saadhyam partner
    """
    try:
        service = NearbyBusinessService()
        result = await service.claim_business(
            user_id=None,  # TODO: Add auth later
            external_business_id=request.external_business_id,
            business_name=request.business_name,
            category=request.category,
            location=request.location.dict(),
            proof_url=request.proof_url
        )
        return result
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
