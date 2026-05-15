"""
Competitor Search Service
Uses Tavily and Serper APIs to find REAL competitor businesses
"""

import logging
import json
import requests
from typing import List, Dict, Any, Optional
from config.settings import settings

logger = logging.getLogger(__name__)

TAVILY_API_KEY = settings.TAVILY_API_KEY
SERPER_API_KEY = settings.SERPER_API_KEY


def search_competitors_tavily(business_type: str, location: str) -> List[Dict[str, Any]]:
    """
    Search for competitors using Tavily AI Search
    
    Args:
        business_type: Type of business (e.g., "coworking space")
        location: Location (e.g., "Kakinada")
    
    Returns:
        List of competitor data
    """
    
    if not TAVILY_API_KEY or TAVILY_API_KEY == "your_tavily_api_key_here":
        logger.warning("⚠️ Tavily API key not configured")
        return []
    
    try:
        logger.info(f"[TavilySearch] Searching for {business_type} in {location}")
        
        # Tavily API endpoint
        url = "https://api.tavily.com/search"
        
        # Search query
        query = f"{business_type} businesses in {location}"
        
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query,
            "search_depth": "advanced",
            "include_answer": False,
            "include_raw_content": False,
            "max_results": 10
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        results = data.get("results", [])
        
        logger.info(f"[TavilySearch] Found {len(results)} results")
        
        # Extract competitor information
        competitors = []
        for result in results[:5]:  # Top 5 results
            title = result.get("title", "")
            content = result.get("content", "")
            url_link = result.get("url", "")
            
            # Try to extract business name from title
            business_name = title.split("-")[0].strip() if "-" in title else title.split("|")[0].strip()
            
            competitors.append({
                "name": business_name,
                "source": "tavily",
                "content": content,
                "url": url_link
            })
        
        return competitors
        
    except Exception as e:
        logger.error(f"[TavilySearch] Error: {e}")
        return []


def search_competitors_serper(business_type: str, location: str) -> List[Dict[str, Any]]:
    """
    Search for competitors using Serper API (Google Search)
    
    Args:
        business_type: Type of business (e.g., "coworking space")
        location: Location (e.g., "Kakinada")
    
    Returns:
        List of competitor data
    """
    
    if not SERPER_API_KEY or SERPER_API_KEY == "your_serper_api_key_here":
        logger.warning("⚠️ Serper API key not configured")
        return []
    
    try:
        logger.info(f"[SerperSearch] Searching for {business_type} in {location}")
        
        # Serper API endpoint
        url = "https://google.serper.dev/search"
        
        # Search query
        query = f"{business_type} in {location}"
        
        headers = {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "q": query,
            "num": 10,
            "gl": "in",  # India
            "hl": "en"
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract organic results
        organic_results = data.get("organic", [])
        
        logger.info(f"[SerperSearch] Found {len(organic_results)} results")
        
        # Extract competitor information
        competitors = []
        for result in organic_results[:5]:  # Top 5 results
            title = result.get("title", "")
            snippet = result.get("snippet", "")
            link = result.get("link", "")
            
            # Try to extract business name from title
            business_name = title.split("-")[0].strip() if "-" in title else title.split("|")[0].strip()
            
            competitors.append({
                "name": business_name,
                "source": "serper",
                "content": snippet,
                "url": link
            })
        
        return competitors
        
    except Exception as e:
        logger.error(f"[SerperSearch] Error: {e}")
        return []


def search_competitors_combined(business_type: str, location: str) -> List[Dict[str, Any]]:
    """
    Search for competitors using both Tavily and Serper, combine results
    
    Args:
        business_type: Type of business (e.g., "coworking space")
        location: Location (e.g., "Kakinada")
    
    Returns:
        Combined list of unique competitors
    """
    
    logger.info(f"[CompetitorSearch] Searching for {business_type} in {location}")
    
    # Search with both APIs
    tavily_results = search_competitors_tavily(business_type, location)
    serper_results = search_competitors_serper(business_type, location)
    
    # Combine results
    all_competitors = tavily_results + serper_results
    
    # Remove duplicates based on name similarity
    unique_competitors = []
    seen_names = set()
    
    for competitor in all_competitors:
        name_lower = competitor["name"].lower()
        
        # Skip if we've seen a similar name
        if any(name_lower in seen or seen in name_lower for seen in seen_names):
            continue
        
        seen_names.add(name_lower)
        unique_competitors.append(competitor)
    
    logger.info(f"[CompetitorSearch] Found {len(unique_competitors)} unique competitors")
    
    return unique_competitors[:5]  # Return top 5


def format_competitors_for_gemini(competitors: List[Dict[str, Any]]) -> str:
    """
    Format competitor search results for Gemini prompt
    
    Args:
        competitors: List of competitor data
    
    Returns:
        Formatted string for prompt
    """
    
    if not competitors:
        return "No competitors found in search results."
    
    formatted = "**REAL COMPETITORS FOUND FROM WEB SEARCH:**\n\n"
    
    for i, comp in enumerate(competitors, 1):
        formatted += f"{i}. **{comp['name']}**\n"
        formatted += f"   - Content: {comp['content'][:200]}...\n"
        formatted += f"   - Source: {comp['source']}\n"
        formatted += f"   - URL: {comp['url']}\n\n"
    
    formatted += "\nYou MUST use these REAL business names in the 'nearby_competitors' array.\n"
    formatted += "Analyze their strengths and weaknesses based on the content above.\n"
    
    return formatted
