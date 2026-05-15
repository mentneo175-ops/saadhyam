"""
Web Search Service
Provides web search functionality with multiple providers and automatic fallback
Supports: Tavily AI, Serper API, Brave Search, Google Grounding
"""

import os
import logging
import requests
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from tavily import TavilyClient

logger = logging.getLogger(__name__)

# Initialize Tavily client
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


class WebSearchService:
    """
    Real-time web search service for influencer discovery
    Uses Tavily API to find REAL influencers from the internet
    """
    
    @staticmethod
    def generate_search_queries(
        industry: str,
        city: str,
        target_audience: str = "",
        collaboration_goal: str = ""
    ) -> List[str]:
        """
        Generate highly targeted site-specific search queries for influencer discovery
        
        Args:
            industry: Business industry (food, fashion, travel, etc.)
            city: Target city/location
            target_audience: Target audience description
            collaboration_goal: Collaboration goal
            
        Returns:
            List of search query strings
        """
        queries = []
        
        # Creator keywords by industry
        creator_keywords = {
            "food": ["food blogger", "food influencer", "food vlogger", "foodie", "chef", "food creator"],
            "fashion": ["fashion blogger", "fashion influencer", "style creator", "fashion vlogger", "stylist"],
            "travel": ["travel blogger", "travel influencer", "travel vlogger", "wanderlust", "travel creator"],
            "tech": ["tech reviewer", "tech influencer", "tech blogger", "gadget reviewer", "tech creator"],
            "fitness": ["fitness influencer", "fitness trainer", "gym influencer", "fitness blogger", "workout creator"],
            "beauty": ["beauty blogger", "beauty influencer", "makeup artist", "beauty vlogger", "beauty creator"],
            "lifestyle": ["lifestyle blogger", "lifestyle influencer", "lifestyle creator", "lifestyle vlogger"],
            "real-estate": ["real estate influencer", "property blogger", "real estate creator"],
            "education": ["education influencer", "educator", "education creator", "teacher influencer"],
        }
        
        keywords = creator_keywords.get(industry.lower(), [f"{industry} influencer", f"{industry} creator", f"{industry} blogger"])
        
        # INSTAGRAM SITE-SPECIFIC QUERIES (Highest Priority)
        for keyword in keywords[:3]:  # Top 3 keywords
            queries.append(f'site:instagram.com "{keyword}" "{city}"')
            queries.append(f'site:instagram.com {keyword} {city}')
        
        # YOUTUBE SITE-SPECIFIC QUERIES
        for keyword in keywords[:2]:  # Top 2 keywords
            queries.append(f'site:youtube.com "{keyword}" "{city}"')
            queries.append(f'site:youtube.com {keyword} channel {city}')
        
        # TWITTER/X SITE-SPECIFIC QUERIES
        queries.append(f'site:twitter.com "{keywords[0]}" "{city}"')
        queries.append(f'site:x.com {keywords[0]} {city}')
        
        # Regional variations for Indian cities
        if city.lower() in ["kakinada", "vizag", "visakhapatnam", "vijayawada", "guntur", "rajahmundry"]:
            queries.append(f'site:instagram.com "{keywords[0]}" "Andhra Pradesh"')
            queries.append(f'site:youtube.com {keywords[0]} "coastal Andhra"')
        elif city.lower() in ["hyderabad", "secunderabad"]:
            queries.append(f'site:instagram.com "{keywords[0]}" "Telangana"')
            queries.append(f'site:youtube.com {keywords[0]} Hyderabad')
        elif city.lower() in ["bangalore", "bengaluru"]:
            queries.append(f'site:instagram.com "{keywords[0]}" "Bangalore"')
            queries.append(f'site:youtube.com {keywords[0]} Bengaluru')
        
        # Niche-specific targeted queries
        if industry.lower() == "food":
            queries.append(f'site:instagram.com "food vlogger" "{city}"')
            queries.append(f'site:youtube.com restaurant reviewer {city}')
        elif industry.lower() == "fashion":
            queries.append(f'site:instagram.com "fashion stylist" "{city}"')
            queries.append(f'site:youtube.com fashion haul {city}')
        elif industry.lower() == "travel":
            queries.append(f'site:instagram.com "travel diaries" "{city}"')
            queries.append(f'site:youtube.com travel guide {city}')
        
        print(f"📝 Generated {len(queries)} targeted site-specific queries for {industry} in {city}")
        return queries
    
    @staticmethod
    def is_valid_creator_url(url: str, title: str, content: str) -> bool:
        """
        Validate if URL is a real creator profile (not generic pages)
        
        Args:
            url: URL to validate
            title: Page title
            content: Page content
            
        Returns:
            True if valid creator profile, False otherwise
        """
        url_lower = url.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        
        # REJECT: Generic Instagram pages
        reject_patterns = [
            "instagram.com/explore",
            "instagram.com/p/",  # Single posts
            "instagram.com/reel/",  # Single reels
            "instagram.com/tv/",  # IGTV
            "instagram.com/stories/",
            "instagram.com/accounts/",
            "instagram.com/direct/",
            "instagram.com/about/",
            "instagram.com/legal/",
            "instagram.com/press/",
            "instagram.com/blog/",
            "youtube.com/watch",  # Single videos
            "youtube.com/shorts",  # Shorts
            "youtube.com/results",  # Search results
            "youtube.com/feed",
            "youtube.com/trending",
            "twitter.com/search",
            "twitter.com/explore",
            "facebook.com/watch",
            "facebook.com/groups",
        ]
        
        for pattern in reject_patterns:
            if pattern in url_lower:
                print(f"    ❌ Rejected (generic page): {url}")
                return False
        
        # REJECT: Generic titles
        reject_titles = [
            "instagram",
            "instagram photos and videos",
            "instagram photo",
            "youtube",
            "twitter",
            "facebook",
            "login",
            "sign up",
            "explore",
            "trending",
        ]
        
        for reject_title in reject_titles:
            if title_lower == reject_title or title_lower.startswith(reject_title + " "):
                print(f"    ❌ Rejected (generic title): {title}")
                return False
        
        # ACCEPT: Valid Instagram profile patterns
        instagram_profile_patterns = [
            r'instagram\.com/[a-zA-Z0-9._]+/?$',  # Profile URL
            r'instagram\.com/[a-zA-Z0-9._]+/\?',  # Profile with params
        ]
        
        if "instagram.com" in url_lower:
            import re
            for pattern in instagram_profile_patterns:
                if re.search(pattern, url_lower):
                    # Additional validation: must have creator indicators
                    creator_indicators = ["influencer", "blogger", "creator", "vlogger", "artist", "photographer", "traveler", "foodie"]
                    if any(indicator in content_lower or indicator in title_lower for indicator in creator_indicators):
                        return True
                    # Or has follower/following mentions
                    if "followers" in content_lower or "following" in content_lower:
                        return True
        
        # ACCEPT: Valid YouTube channel patterns
        youtube_channel_patterns = [
            r'youtube\.com/c/[a-zA-Z0-9_-]+',
            r'youtube\.com/channel/[a-zA-Z0-9_-]+',
            r'youtube\.com/@[a-zA-Z0-9_-]+',
            r'youtube\.com/user/[a-zA-Z0-9_-]+',
        ]
        
        if "youtube.com" in url_lower:
            import re
            for pattern in youtube_channel_patterns:
                if re.search(pattern, url_lower):
                    return True
        
        # ACCEPT: Valid Twitter/X profile patterns
        if ("twitter.com" in url_lower or "x.com" in url_lower):
            import re
            if re.search(r'(twitter|x)\.com/[a-zA-Z0-9_]+/?$', url_lower):
                # Must have creator indicators
                creator_indicators = ["influencer", "blogger", "creator", "vlogger"]
                if any(indicator in content_lower or indicator in title_lower for indicator in creator_indicators):
                    return True
        
        print(f"    ❌ Rejected (no creator indicators): {url}")
        return False
    
    @staticmethod
    def search_influencers(
        queries: List[str],
        max_results_per_query: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for influencers using Tavily API with strict filtering
        
        Args:
            queries: List of search queries
            max_results_per_query: Maximum results per query
            
        Returns:
            List of validated search results with URLs, titles, and content
        """
        all_results = []
        seen_urls = set()
        rejected_count = 0
        
        print(f"🔍 Starting Tavily search for {len(queries)} queries...")
        
        for query in queries[:8]:  # Increased to 8 queries for better coverage
            try:
                print(f"  🔎 Searching: {query}")
                
                # Perform Tavily search
                response = tavily_client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=max_results_per_query,
                    include_domains=["instagram.com", "youtube.com", "twitter.com", "x.com"],
                    exclude_domains=["pinterest.com", "reddit.com", "facebook.com"]  # Exclude FB for better quality
                )
                
                # Extract and validate results
                if "results" in response:
                    for result in response["results"]:
                        url = result.get("url", "")
                        title = result.get("title", "")
                        content = result.get("content", "")
                        
                        # Skip duplicates
                        if url in seen_urls:
                            continue
                        
                        seen_urls.add(url)
                        
                        # STRICT VALIDATION: Only accept real creator profiles
                        if not WebSearchService.is_valid_creator_url(url, title, content):
                            rejected_count += 1
                            continue
                        
                        all_results.append({
                            "url": url,
                            "title": title,
                            "content": content,
                            "score": result.get("score", 0),
                            "query": query
                        })
                        print(f"    ✅ Accepted: {title[:50]}...")
                
                print(f"    📊 Found {len(response.get('results', []))} results")
                
            except Exception as e:
                print(f"    ❌ Error searching '{query}': {str(e)}")
                continue
        
        print(f"✅ Total validated results: {len(all_results)} (rejected: {rejected_count})")
        return all_results
    
    @staticmethod
    def search_with_progressive_expansion(
        industry: str,
        city: str,
        target_audience: str = "",
        collaboration_goal: str = "",
        min_results: int = 3,
        max_results: int = 20
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Progressive search with location expansion fallback
        
        Args:
            industry: Business industry
            city: Target city
            target_audience: Target audience
            collaboration_goal: Collaboration goal
            min_results: Minimum results before expanding
            max_results: Maximum total results
            
        Returns:
            Tuple of (search_results, search_levels_used)
        """
        from services.location_intelligence_service import LocationIntelligenceService
        
        # Get location search levels
        search_levels = LocationIntelligenceService.generate_location_search_levels(city)
        
        all_results = []
        levels_used = []
        
        print(f"🌍 Progressive location search for {city}")
        print(f"📊 Generated {len(search_levels)} search levels")
        
        # Try each level until we have enough results
        for search_level in search_levels:
            level_location = search_level["location"]
            
            print(f"\n🔍 LEVEL {search_level['level']}: {search_level['type'].upper()} - {level_location}")
            print(f"   Confidence: {search_level['confidence']} ({search_level['confidence_score']}%)")
            
            # Generate queries for this location
            queries = WebSearchService.generate_search_queries(
                industry=industry,
                city=level_location,
                target_audience=target_audience,
                collaboration_goal=collaboration_goal
            )
            
            # Search
            level_results = WebSearchService.search_influencers(
                queries=queries,
                max_results_per_query=5
            )
            
            # Tag results with search level info
            for result in level_results:
                result["search_level"] = search_level["level"]
                result["search_type"] = search_level["type"]
                result["location_confidence"] = search_level["confidence"]
                result["location_confidence_score"] = search_level["confidence_score"]
            
            all_results.extend(level_results)
            levels_used.append(search_level)
            
            print(f"   ✅ Found {len(level_results)} results (total: {len(all_results)})")
            
            # Check if we have enough results
            if len(all_results) >= min_results:
                print(f"\n✅ Sufficient results found ({len(all_results)} >= {min_results})")
                break
            else:
                print(f"   ⚠️ Need more results ({len(all_results)} < {min_results}), expanding to next level...")
        
        # Limit total results
        final_results = all_results[:max_results]
        
        print(f"\n📊 Search complete: {len(final_results)} results from {len(levels_used)} levels")
        
        return final_results, levels_used
    
    @staticmethod
    def search_with_context(
        industry: str,
        city: str,
        target_audience: str = "",
        collaboration_goal: str = "",
        max_results: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Complete search workflow with context (legacy method)
        Now uses progressive expansion
        
        Args:
            industry: Business industry
            city: Target city
            target_audience: Target audience
            collaboration_goal: Collaboration goal
            max_results: Maximum total results
            
        Returns:
            List of search results
        """
        results, _ = WebSearchService.search_with_progressive_expansion(
            industry=industry,
            city=city,
            target_audience=target_audience,
            collaboration_goal=collaboration_goal,
            min_results=3,
            max_results=max_results
        )
        
        return results


class WebSearchService:
class WebSearchServiceMultiProvider:
    """
    Web search service with multiple providers and automatic fallback
    
    Priority order:
    1. Tavily AI (1,000 free searches/month)
    2. Serper API (2,500 free searches total)
    3. Brave Search (2,000 free searches/month)
    4. Google Grounding (fallback, built into Gemini)
    """
    
    def __init__(self):
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.serper_api_key = os.getenv("SERPER_API_KEY")
        self.brave_api_key = os.getenv("BRAVE_SEARCH_API_KEY")
        
        # Log which APIs are available
        available_apis = []
        if self.tavily_api_key:
            available_apis.append("Tavily")
        if self.serper_api_key:
            available_apis.append("Serper")
        if self.brave_api_key:
            available_apis.append("Brave")
        
        if available_apis:
            logger.info(f"[WebSearch] Available APIs: {', '.join(available_apis)}")
        else:
            logger.warning("[WebSearch] No web search API keys found, will use Google Grounding only")
    
    async def search(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """
        Search the web using available providers with automatic fallback
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
        
        Returns:
            Dict with search results and metadata
        """
        
        logger.info(f"[WebSearch] Searching for: {query}")
        
        # Try Tavily first
        if self.tavily_api_key:
            try:
                results = await self._search_tavily(query, max_results)
                if results:
                    logger.info(f"[WebSearch] ✅ Tavily returned {len(results)} results")
                    return {
                        "provider": "tavily",
                        "results": results,
                        "query": query,
                        "timestamp": datetime.utcnow().isoformat()
                    }
            except Exception as e:
                logger.warning(f"[WebSearch] Tavily failed: {str(e)[:100]}")
        
        # Try Serper if Tavily failed
        if self.serper_api_key:
            try:
                results = await self._search_serper(query, max_results)
                if results:
                    logger.info(f"[WebSearch] ✅ Serper returned {len(results)} results")
                    return {
                        "provider": "serper",
                        "results": results,
                        "query": query,
                        "timestamp": datetime.utcnow().isoformat()
                    }
            except Exception as e:
                logger.warning(f"[WebSearch] Serper failed: {str(e)[:100]}")
        
        # Try Brave if both failed
        if self.brave_api_key:
            try:
                results = await self._search_brave(query, max_results)
                if results:
                    logger.info(f"[WebSearch] ✅ Brave returned {len(results)} results")
                    return {
                        "provider": "brave",
                        "results": results,
                        "query": query,
                        "timestamp": datetime.utcnow().isoformat()
                    }
            except Exception as e:
                logger.warning(f"[WebSearch] Brave failed: {str(e)[:100]}")
        
        # All APIs failed, return empty results (will use Google Grounding)
        logger.warning("[WebSearch] All search APIs failed, will use Google Grounding")
        return {
            "provider": "none",
            "results": [],
            "query": query,
            "timestamp": datetime.utcnow().isoformat(),
            "fallback_to_grounding": True
        }
    
    async def _search_tavily(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Search using Tavily AI"""
        
        try:
            # Try to import tavily
            try:
                from tavily import TavilyClient
            except ImportError:
                logger.warning("[WebSearch] Tavily package not installed, skipping")
                return []
            
            client = TavilyClient(api_key=self.tavily_api_key)
            response = client.search(
                query=query,
                search_depth="advanced",
                max_results=max_results
            )
            
            results = []
            for item in response.get('results', []):
                results.append({
                    "title": item.get('title', ''),
                    "content": item.get('content', ''),
                    "url": item.get('url', ''),
                    "score": item.get('score', 0)
                })
            
            return results
            
        except Exception as e:
            logger.error(f"[WebSearch] Tavily error: {e}")
            return []
    
    async def _search_serper(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Search using Serper API (Google)"""
        
        try:
            url = "https://google.serper.dev/search"
            payload = {
                "q": query,
                "num": max_results
            }
            headers = {
                "X-API-KEY": self.serper_api_key,
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for item in data.get('organic', []):
                results.append({
                    "title": item.get('title', ''),
                    "content": item.get('snippet', ''),
                    "url": item.get('link', ''),
                    "score": 1.0
                })
            
            return results
            
        except Exception as e:
            logger.error(f"[WebSearch] Serper error: {e}")
            return []
    
    async def _search_brave(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Search using Brave Search API"""
        
        try:
            url = "https://api.search.brave.com/res/v1/web/search"
            headers = {
                "Accept": "application/json",
                "X-Subscription-Token": self.brave_api_key
            }
            params = {
                "q": query,
                "count": max_results
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for item in data.get('web', {}).get('results', []):
                results.append({
                    "title": item.get('title', ''),
                    "content": item.get('description', ''),
                    "url": item.get('url', ''),
                    "score": 1.0
                })
            
            return results
            
        except Exception as e:
            logger.error(f"[WebSearch] Brave error: {e}")
            return []
    
    def format_search_results_for_prompt(self, search_data: Dict[str, Any]) -> str:
        """
        Format search results for inclusion in LLM prompt
        
        Args:
            search_data: Search results from search() method
        
        Returns:
            Formatted string for prompt
        """
        
        if not search_data.get('results'):
            return "No web search results available."
        
        formatted = f"Web Search Results (via {search_data['provider'].title()}):\n\n"
        
        for i, result in enumerate(search_data['results'], 1):
            formatted += f"{i}. {result['title']}\n"
            formatted += f"   {result['content'][:200]}...\n"
            formatted += f"   Source: {result['url']}\n\n"
        
        return formatted


# Global instance
web_search_service = WebSearchServiceMultiProvider()
