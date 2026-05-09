"""
Web Search Service
Provides web search functionality with multiple providers and automatic fallback
Supports: Tavily AI, Serper API, Brave Search, Google Grounding
"""

import logging
import os
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class WebSearchService:
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
web_search_service = WebSearchService()
