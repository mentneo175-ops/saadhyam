"""
Simple Influencer Search Service
Uses SerpAPI (Google), RapidAPI (Instagram), and Tavily
Works like Google - finds influencers without being too strict
"""

import os
import re
import requests
from typing import List, Dict, Any
from serpapi import GoogleSearch

# Don't initialize Tavily at module level - do it in functions
def get_tavily_client():
    """Get Tavily client lazily"""
    from tavily import TavilyClient
    return TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# Get API keys
serpapi_key = os.getenv("SERPAPI_KEY")
rapidapi_key = os.getenv("RAPIDAPI_KEY")


class SimpleInfluencerSearch:
    """
    Simple, effective influencer search
    Priority: Find results, don't reject too much
    """
    
    @staticmethod
    def search_google_via_serpapi(
        industry: str,
        city: str,
        max_results: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search Google using SerpAPI - works exactly like Google search
        
        Args:
            industry: Industry/niche
            city: City/location
            max_results: Maximum results
            
        Returns:
            List of influencer profiles from Google
        """
        if not serpapi_key:
            print("⚠️ SerpAPI key not configured")
            return []
        
        results = []
        
        # Generate search queries like you would type in Google
        queries = [
            f"{industry} influencers in {city} instagram",
            f"{industry} bloggers {city}",
            f"{city} {industry} instagram",
            f"{industry} youtubers {city}",
            f"best {industry} influencers {city}"
        ]
        
        print(f"🔍 Searching Google via SerpAPI for {industry} in {city}...")
        
        for query in queries[:3]:  # Top 3 queries
            try:
                print(f"  🔎 Query: {query}")
                
                params = {
                    "q": query,
                    "api_key": serpapi_key,
                    "num": 10,  # Results per query
                    "engine": "google"
                }
                
                search = GoogleSearch(params)
                search_results = search.get_dict()
                
                # Extract organic results
                organic_results = search_results.get("organic_results", [])
                
                for result in organic_results:
                    link = result.get("link", "")
                    title = result.get("title", "")
                    snippet = result.get("snippet", "")
                    
                    # Check if it's a social media profile
                    if any(platform in link.lower() for platform in ["instagram.com", "youtube.com", "twitter.com", "facebook.com"]):
                        results.append({
                            "url": link,
                            "title": title,
                            "snippet": snippet,
                            "source": "google_serpapi",
                            "platform": SimpleInfluencerSearch._detect_platform(link)
                        })
                
                print(f"    ✅ Found {len(organic_results)} results")
                
            except Exception as e:
                print(f"    ❌ SerpAPI error: {str(e)}")
                continue
        
        print(f"✅ Google/SerpAPI total: {len(results)} profiles")
        return results[:max_results]
    
    @staticmethod
    def search_instagram_via_rapidapi(
        industry: str,
        city: str,
        max_results: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Search Instagram directly using RapidAPI
        
        Args:
            industry: Industry/niche
            city: City/location
            max_results: Maximum results
            
        Returns:
            List of Instagram profiles
        """
        if not rapidapi_key:
            print("⚠️ RapidAPI key not configured")
            return []
        
        results = []
        
        # Search keywords
        keywords = [
            f"{industry} {city}",
            f"{city} {industry}",
            f"{industry} influencer {city}",
            f"{industry} blogger {city}"
        ]
        
        print(f"🔍 Searching Instagram via RapidAPI for {industry} in {city}...")
        
        for keyword in keywords[:2]:  # Top 2 keywords
            try:
                print(f"  🔎 Keyword: {keyword}")
                
                url = "https://instagram-scraper-api2.p.rapidapi.com/v1/search_users"
                
                querystring = {"search_query": keyword}
                
                headers = {
                    "x-rapidapi-key": rapidapi_key,
                    "x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
                }
                
                response = requests.get(url, headers=headers, params=querystring, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    users = data.get("data", {}).get("users", [])
                    
                    for user in users[:8]:  # Top 8 per keyword
                        username = user.get("username", "")
                        if username:
                            results.append({
                                "username": username,
                                "full_name": user.get("full_name", username),
                                "bio": user.get("biography", ""),
                                "followers": user.get("follower_count", 0),
                                "following": user.get("following_count", 0),
                                "posts": user.get("media_count", 0),
                                "profile_pic": user.get("profile_pic_url", ""),
                                "is_verified": user.get("is_verified", False),
                                "is_private": user.get("is_private", False),
                                "platform": "Instagram",
                                "profile_url": f"https://instagram.com/{username}",
                                "source": "rapidapi_instagram",
                                "location": city,
                                "niche": industry
                            })
                    
                    print(f"    ✅ Found {len(users)} users")
                else:
                    print(f"    ⚠️ Status {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ Error: {str(e)}")
                continue
        
        print(f"✅ Instagram/RapidAPI total: {len(results)} profiles")
        return results[:max_results]
    
    @staticmethod
    def search_web_via_tavily(
        industry: str,
        city: str,
        max_results: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Search web using Tavily - backup source
        
        Args:
            industry: Industry/niche
            city: City/location
            max_results: Maximum results
            
        Returns:
            List of web search results
        """
        results = []
        
        try:
            tavily_client = get_tavily_client()
        except:
            print("⚠️ Tavily not available")
            return []
        
        queries = [
            f"{industry} influencers {city}",
            f"{city} {industry} creators",
            f"Instagram {industry} {city}"
        ]
        
        print(f"🔍 Searching web via Tavily for {industry} in {city}...")
        
        for query in queries[:2]:  # Top 2 queries
            try:
                print(f"  🔎 Query: {query}")
                
                response = tavily_client.search(
                    query=query,
                    search_depth="basic",
                    max_results=8
                )
                
                if "results" in response:
                    for result in response["results"]:
                        url = result.get("url", "")
                        
                        # Simple check - is it a social media URL?
                        if any(platform in url.lower() for platform in ["instagram.com", "youtube.com", "twitter.com"]):
                            results.append({
                                "url": url,
                                "title": result.get("title", ""),
                                "content": result.get("content", ""),
                                "score": result.get("score", 0),
                                "source": "tavily_web",
                                "platform": SimpleInfluencerSearch._detect_platform(url)
                            })
                
                print(f"    ✅ Found {len(response.get('results', []))} results")
                
            except Exception as e:
                print(f"    ❌ Error: {str(e)}")
                continue
        
        print(f"✅ Tavily total: {len(results)} results")
        return results[:max_results]
    
    @staticmethod
    def _detect_platform(url: str) -> str:
        """Detect social media platform from URL"""
        url_lower = url.lower()
        if "instagram.com" in url_lower:
            return "Instagram"
        elif "youtube.com" in url_lower:
            return "YouTube"
        elif "twitter.com" in url_lower or "x.com" in url_lower:
            return "Twitter"
        elif "facebook.com" in url_lower:
            return "Facebook"
        else:
            return "Website"
    
    @staticmethod
    def _extract_instagram_username(url: str) -> str:
        """Extract Instagram username from URL"""
        match = re.search(r'instagram\.com/([a-zA-Z0-9._]+)', url)
        if match:
            username = match.group(1)
            # Filter out non-profile URLs
            if username not in ['p', 'reel', 'tv', 'explore', 'stories', 'accounts', 'direct']:
                return username
        return ""
    
    @staticmethod
    def _extract_youtube_channel(url: str) -> str:
        """Extract YouTube channel from URL"""
        patterns = [
            r'youtube\.com/c/([a-zA-Z0-9_-]+)',
            r'youtube\.com/channel/([a-zA-Z0-9_-]+)',
            r'youtube\.com/@([a-zA-Z0-9_-]+)',
            r'youtube\.com/user/([a-zA-Z0-9_-]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return ""
    
    @staticmethod
    def extract_influencer_from_google_result(result: Dict[str, Any], industry: str, city: str) -> Dict[str, Any]:
        """
        Extract influencer info from Google/Tavily result
        Simple extraction - don't be too strict
        """
        url = result.get("url", "")
        title = result.get("title", "")
        snippet = result.get("snippet", result.get("content", ""))
        platform = result.get("platform", SimpleInfluencerSearch._detect_platform(url))
        
        # Extract username
        username = ""
        if platform == "Instagram":
            username = SimpleInfluencerSearch._extract_instagram_username(url)
        elif platform == "YouTube":
            username = SimpleInfluencerSearch._extract_youtube_channel(url)
        
        # Extract name from title (simple)
        name = title.split("-")[0].strip() if "-" in title else title.split("|")[0].strip() if "|" in title else title[:50]
        
        # Clean name
        name = re.sub(r'\s*\(.*?\)', '', name)  # Remove parentheses
        name = re.sub(r'\s*(Instagram|YouTube|Twitter|Facebook).*', '', name, flags=re.IGNORECASE)
        name = name.strip()
        
        if not name or len(name) < 3:
            name = username if username else "Creator"
        
        return {
            "username": username if username else name.lower().replace(" ", "_"),
            "name": name,
            "bio": snippet[:200] if snippet else "",
            "platform": platform,
            "profile_url": url,
            "location": city,
            "niche": industry,
            "source": result.get("source", "web_search"),
            "followers": 0  # Will be enriched later if needed
        }
    
    @staticmethod
    def search_all_sources(
        industry: str,
        city: str
    ) -> List[Dict[str, Any]]:
        """
        Search ALL sources and combine results
        
        Args:
            industry: Industry/niche
            city: City/location
            
        Returns:
            Combined list of influencers from all sources
        """
        print("\n" + "=" * 80)
        print(f"🚀 MULTI-SOURCE INFLUENCER SEARCH")
        print(f"📋 Industry: {industry}")
        print(f"📍 Location: {city}")
        print("=" * 80 + "\n")
        
        all_influencers = []
        
        # SOURCE 1: Instagram via RapidAPI (Direct Instagram search)
        print("📱 SOURCE 1: Instagram Direct Search (RapidAPI)")
        print("-" * 80)
        instagram_results = SimpleInfluencerSearch.search_instagram_via_rapidapi(
            industry=industry,
            city=city,
            max_results=15
        )
        all_influencers.extend(instagram_results)
        print()
        
        # SOURCE 2: Google via SerpAPI (Google search results)
        print("🔍 SOURCE 2: Google Search (SerpAPI)")
        print("-" * 80)
        google_results = SimpleInfluencerSearch.search_google_via_serpapi(
            industry=industry,
            city=city,
            max_results=20
        )
        
        # Extract influencer info from Google results
        for result in google_results:
            influencer = SimpleInfluencerSearch.extract_influencer_from_google_result(
                result, industry, city
            )
            all_influencers.append(influencer)
        print()
        
        # SOURCE 3: Web via Tavily (Backup)
        print("🌐 SOURCE 3: Web Search (Tavily)")
        print("-" * 80)
        tavily_results = SimpleInfluencerSearch.search_web_via_tavily(
            industry=industry,
            city=city,
            max_results=15
        )
        
        # Extract influencer info from Tavily results
        for result in tavily_results:
            influencer = SimpleInfluencerSearch.extract_influencer_from_google_result(
                result, industry, city
            )
            all_influencers.append(influencer)
        print()
        
        # Remove duplicates
        seen = set()
        unique_influencers = []
        
        for inf in all_influencers:
            key = (inf.get("username", "").lower(), inf.get("profile_url", "").lower())
            if key not in seen and key != ("", ""):
                seen.add(key)
                unique_influencers.append(inf)
        
        print("=" * 80)
        print(f"✅ TOTAL RESULTS: {len(unique_influencers)} unique influencers")
        print(f"   - Instagram Direct: {len(instagram_results)}")
        print(f"   - Google Search: {len(google_results)}")
        print(f"   - Web Search: {len(tavily_results)}")
        print("=" * 80 + "\n")
        
        return unique_influencers
