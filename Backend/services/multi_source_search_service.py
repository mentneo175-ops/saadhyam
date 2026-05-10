"""
Multi-Source Search Service
Combines multiple APIs to find influencers - works like Google search
Simple, effective, and returns results
"""

import os
import requests
from typing import List, Dict, Any
from tavily import TavilyClient

# Initialize clients
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
rapidapi_key = os.getenv("RAPIDAPI_KEY")


class MultiSourceSearchService:
    """
    Multi-source influencer search - combines multiple APIs
    Priority: Find influencers, don't be too strict
    """
    
    @staticmethod
    def search_with_rapidapi_instagram(
        industry: str,
        city: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search Instagram using RapidAPI
        
        Args:
            industry: Industry/niche
            city: City/location
            max_results: Maximum results
            
        Returns:
            List of influencer profiles
        """
        if not rapidapi_key:
            print("⚠️ RapidAPI key not configured")
            return []
        
        results = []
        
        # Generate search keywords
        keywords = [
            f"{industry} {city}",
            f"{industry} influencer {city}",
            f"{industry} blogger {city}",
            f"{city} {industry}"
        ]
        
        print(f"🔍 Searching Instagram via RapidAPI for {industry} in {city}...")
        
        for keyword in keywords[:2]:  # Try top 2 keywords
            try:
                url = "https://instagram-scraper-api2.p.rapidapi.com/v1/search_users"
                
                querystring = {"search_query": keyword}
                
                headers = {
                    "x-rapidapi-key": rapidapi_key,
                    "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
                }
                
                response = requests.get(url, headers=headers, params=querystring, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    users = data.get("data", {}).get("users", [])
                    
                    for user in users[:5]:  # Top 5 per keyword
                        results.append({
                            "username": user.get("username", ""),
                            "full_name": user.get("full_name", ""),
                            "bio": user.get("biography", ""),
                            "followers": user.get("follower_count", 0),
                            "profile_pic": user.get("profile_pic_url", ""),
                            "is_verified": user.get("is_verified", False),
                            "platform": "Instagram",
                            "profile_url": f"https://instagram.com/{user.get('username', '')}",
                            "source": "rapidapi_instagram",
                            "location": city,
                            "niche": industry
                        })
                    
                    print(f"  ✅ Found {len(users)} users for '{keyword}'")
                else:
                    print(f"  ⚠️ RapidAPI returned status {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ RapidAPI error: {str(e)}")
                continue
        
        print(f"✅ RapidAPI total: {len(results)} profiles")
        return results[:max_results]
    
    @staticmethod
    def search_with_tavily_simple(
        industry: str,
        city: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Simple Tavily search - less strict
        
        Args:
            industry: Industry/niche
            city: City/location
            max_results: Maximum results
            
        Returns:
            List of search results
        """
        results = []
        
        # Simple, broad queries
        queries = [
            f"{industry} influencers {city} Instagram",
            f"{industry} bloggers {city}",
            f"{city} {industry} creators",
            f"Instagram {industry} {city}",
            f"YouTube {industry} {city}"
        ]
        
        print(f"🔍 Searching web via Tavily for {industry} in {city}...")
        
        for query in queries[:3]:  # Top 3 queries
            try:
                response = tavily_client.search(
                    query=query,
                    search_depth="basic",  # Changed from "advanced" to "basic" for speed
                    max_results=5
                )
                
                if "results" in response:
                    for result in response["results"]:
                        url = result.get("url", "")
                        
                        # Very simple filtering - just check if it's a social media URL
                        if any(platform in url.lower() for platform in ["instagram.com", "youtube.com", "twitter.com"]):
                            results.append({
                                "url": url,
                                "title": result.get("title", ""),
                                "content": result.get("content", ""),
                                "score": result.get("score", 0),
                                "source": "tavily_search"
                            })
                
                print(f"  ✅ Found {len(response.get('results', []))} results for '{query}'")
                
            except Exception as e:
                print(f"  ❌ Tavily error: {str(e)}")
                continue
        
        print(f"✅ Tavily total: {len(results)} results")
        return results[:max_results]
    
    @staticmethod
    def search_all_sources(
        industry: str,
        city: str,
        max_results: int = 20
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Search all available sources
        
        Args:
            industry: Industry/niche
            city: City/location
            max_results: Maximum results per source
            
        Returns:
            Dict with results from each source
        """
        print("=" * 80)
        print(f"🚀 MULTI-SOURCE SEARCH: {industry} in {city}")
        print("=" * 80)
        
        all_results = {}
        
        # Source 1: RapidAPI Instagram (Priority)
        rapidapi_results = MultiSourceSearchService.search_with_rapidapi_instagram(
            industry=industry,
            city=city,
            max_results=max_results
        )
        all_results["rapidapi"] = rapidapi_results
        
        # Source 2: Tavily Web Search (Backup)
        tavily_results = MultiSourceSearchService.search_with_tavily_simple(
            industry=industry,
            city=city,
            max_results=max_results
        )
        all_results["tavily"] = tavily_results
        
        total = len(rapidapi_results) + len(tavily_results)
        print(f"\n✅ Total results from all sources: {total}")
        print("=" * 80)
        
        return all_results
