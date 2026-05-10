"""
Influencer Extraction Service
Extracts REAL influencer information from web search results
"""

import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse


class InfluencerExtractionService:
    """
    Extracts real influencer data from search results
    NO fake data generation - only real extracted information
    """
    
    @staticmethod
    def extract_instagram_handle(url: str, content: str) -> Optional[str]:
        """Extract Instagram handle from URL or content"""
        # From URL
        if "instagram.com" in url:
            match = re.search(r'instagram\.com/([a-zA-Z0-9._]+)', url)
            if match:
                handle = match.group(1)
                # Filter out non-profile URLs
                if handle not in ['p', 'reel', 'tv', 'explore', 'stories', 'accounts']:
                    return handle
        
        # From content
        match = re.search(r'@([a-zA-Z0-9._]+)', content)
        if match:
            return match.group(1)
        
        return None
    
    @staticmethod
    def extract_youtube_channel(url: str, content: str) -> Optional[str]:
        """Extract YouTube channel from URL or content"""
        if "youtube.com" in url:
            # Channel URL
            match = re.search(r'youtube\.com/(?:c/|channel/|@)?([a-zA-Z0-9_-]+)', url)
            if match:
                return match.group(1)
        
        return None
    
    @staticmethod
    def extract_follower_count(content: str) -> Optional[int]:
        """Extract follower count from content"""
        # Patterns: "100K followers", "1.2M followers", "50k subscribers"
        patterns = [
            r'(\d+\.?\d*)\s*[KkMm]?\s*(?:followers|subscribers)',
            r'(\d+,?\d*)\s*(?:followers|subscribers)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                count_str = match.group(1).replace(',', '')
                try:
                    count = float(count_str)
                    # Convert K/M to actual numbers
                    if 'K' in content[match.start():match.end()] or 'k' in content[match.start():match.end()]:
                        count *= 1000
                    elif 'M' in content[match.start():match.end()] or 'm' in content[match.start():match.end()]:
                        count *= 1000000
                    return int(count)
                except:
                    pass
        
        return None
    
    @staticmethod
    def extract_platform(url: str) -> str:
        """Determine platform from URL"""
        if "instagram.com" in url:
            return "Instagram"
        elif "youtube.com" in url:
            return "YouTube"
        elif "twitter.com" in url or "x.com" in url:
            return "Twitter"
        elif "facebook.com" in url:
            return "Facebook"
        else:
            return "Website"
    
    @staticmethod
    def extract_name_from_content(content: str, title: str) -> str:
        """Extract influencer name from content or title"""
        # Clean title first
        if title:
            # Remove platform names
            name = re.sub(r'\s*[-|]\s*(Instagram|YouTube|Twitter|Facebook|TikTok).*', '', title, flags=re.IGNORECASE)
            # Remove handle mentions
            name = re.sub(r'\s*\(@[a-zA-Z0-9._]+\)', '', name)
            # Remove "photos and videos"
            name = re.sub(r'\s*[-|]\s*photos and videos.*', '', name, flags=re.IGNORECASE)
            # Remove generic suffixes
            name = re.sub(r'\s*[-|]\s*(profile|page|account|channel).*', '', name, flags=re.IGNORECASE)
            name = name.strip()
            
            # Reject generic names
            generic_names = ["instagram", "youtube", "twitter", "facebook", "tiktok", "photos", "videos"]
            if name.lower() not in generic_names and len(name) > 2 and len(name) < 50:
                # Must contain at least one letter
                if re.search(r'[a-zA-Z]', name):
                    return name
        
        # Try to extract from content
        # Look for patterns like "Name is a food blogger"
        match = re.search(r'^([A-Z][a-zA-Z\s]+)\s+is\s+(?:a|an)', content)
        if match:
            name = match.group(1).strip()
            if len(name) > 2 and len(name) < 50:
                return name
        
        # Look for "by Name" pattern
        match = re.search(r'by\s+([A-Z][a-zA-Z\s]+)', content)
        if match:
            name = match.group(1).strip()
            if len(name) > 2 and len(name) < 50:
                return name
        
        # Fallback: Use first few words of title if they look like a name
        if title:
            words = title.split()[:3]
            name = ' '.join(words)
            # Must start with capital letter and not be generic
            if name and name[0].isupper() and name.lower() not in ["instagram", "youtube", "twitter"]:
                return name
        
        return "Unknown Creator"
    
    @staticmethod
    def extract_location(content: str, city: str) -> str:
        """Extract location from content"""
        # Look for city mentions
        if city.lower() in content.lower():
            return city
        
        # Look for location patterns
        location_patterns = [
            r'(?:based in|from|located in)\s+([A-Z][a-zA-Z\s]+)',
            r'([A-Z][a-zA-Z\s]+)(?:-based|,\s*India)',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, content)
            if match:
                location = match.group(1).strip()
                if len(location) > 2 and len(location) < 30:
                    return location
        
        return city
    
    @staticmethod
    def extract_bio(content: str, max_length: int = 200) -> str:
        """Extract bio/description from content"""
        # Clean content
        bio = content.strip()
        
        # Take first paragraph or sentence
        sentences = bio.split('.')
        if sentences:
            bio = sentences[0] + '.'
        
        # Limit length
        if len(bio) > max_length:
            bio = bio[:max_length] + '...'
        
        return bio
    
    @staticmethod
    def extract_influencer_from_result(
        result: Dict[str, Any],
        industry: str,
        city: str
    ) -> Optional[Dict[str, Any]]:
        """
        Extract influencer information from a single search result
        
        Args:
            result: Search result dict with url, title, content
            industry: Industry/niche
            city: Target city
            
        Returns:
            Influencer dict or None if extraction fails
        """
        try:
            url = result.get("url", "")
            title = result.get("title", "")
            content = result.get("content", "")
            
            # Extract platform
            platform = InfluencerExtractionService.extract_platform(url)
            
            # Extract handle/username
            username = None
            if platform == "Instagram":
                username = InfluencerExtractionService.extract_instagram_handle(url, content)
            elif platform == "YouTube":
                username = InfluencerExtractionService.extract_youtube_channel(url, content)
            
            # Extract name
            name = InfluencerExtractionService.extract_name_from_content(content, title)
            
            # Extract follower count
            followers = InfluencerExtractionService.extract_follower_count(content)
            
            # Extract location
            location = InfluencerExtractionService.extract_location(content, city)
            
            # Extract bio
            bio = InfluencerExtractionService.extract_bio(content)
            
            # Build influencer dict
            influencer = {
                "name": name,
                "username": username or name.replace(" ", "").lower(),
                "platform": platform,
                "profile_url": url,
                "bio": bio,
                "location": location,
                "niche": industry,
                "followers": followers,
                "source": "tavily_search",
                "search_score": result.get("score", 0)
            }
            
            return influencer
            
        except Exception as e:
            print(f"❌ Error extracting influencer from result: {str(e)}")
            return None
    
    @staticmethod
    def extract_influencers_from_results(
        results: List[Dict[str, Any]],
        industry: str,
        city: str
    ) -> List[Dict[str, Any]]:
        """
        Extract influencers from multiple search results
        
        Args:
            results: List of search results
            industry: Industry/niche
            city: Target city
            
        Returns:
            List of extracted influencer dicts
        """
        influencers = []
        seen_urls = set()
        
        print(f"📊 Extracting influencers from {len(results)} search results...")
        
        for result in results:
            url = result.get("url", "")
            
            # Skip duplicates
            if url in seen_urls:
                continue
            
            seen_urls.add(url)
            
            # Extract influencer
            influencer = InfluencerExtractionService.extract_influencer_from_result(
                result=result,
                industry=industry,
                city=city
            )
            
            if influencer:
                influencers.append(influencer)
                print(f"  ✅ Extracted: {influencer['name']} ({influencer['platform']})")
        
        print(f"✅ Extracted {len(influencers)} influencers")
        return influencers
    
    @staticmethod
    def remove_duplicates(influencers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate influencers based on username and URL"""
        seen = set()
        unique = []
        
        for inf in influencers:
            key = (inf.get("username", "").lower(), inf.get("profile_url", ""))
            if key not in seen:
                seen.add(key)
                unique.append(inf)
        
        print(f"🔄 Removed {len(influencers) - len(unique)} duplicates")
        return unique
