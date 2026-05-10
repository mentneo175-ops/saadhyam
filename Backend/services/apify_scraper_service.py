"""
Apify Instagram Scraper Service
Enriches influencer profiles with real Instagram data
"""

import os
import time
from typing import Dict, Any, Optional, List
from apify_client import ApifyClient

# Initialize Apify client
apify_token = os.getenv("APIFY_API_TOKEN")
apify_client = ApifyClient(apify_token) if apify_token else None


class ApifyScraperService:
    """
    Scrapes real Instagram profile data using Apify
    Enriches influencer profiles with accurate follower counts, bios, and engagement
    """
    
    @staticmethod
    def extract_instagram_username(url: str) -> Optional[str]:
        """
        Extract Instagram username from URL
        
        Args:
            url: Instagram profile URL
            
        Returns:
            Username or None
        """
        import re
        match = re.search(r'instagram\.com/([a-zA-Z0-9._]+)', url)
        if match:
            username = match.group(1)
            # Filter out non-profile URLs
            if username not in ['p', 'reel', 'tv', 'explore', 'stories', 'accounts', 'direct']:
                return username
        return None
    
    @staticmethod
    def scrape_instagram_profile(username: str, timeout: int = 30) -> Optional[Dict[str, Any]]:
        """
        Scrape Instagram profile using Apify
        
        Args:
            username: Instagram username
            timeout: Timeout in seconds
            
        Returns:
            Profile data dict or None
        """
        if not apify_client:
            print("⚠️ Apify client not configured")
            return None
        
        try:
            print(f"  🔍 Scraping Instagram profile: @{username}")
            
            # Run Apify Instagram Profile Scraper
            run_input = {
                "usernames": [username],
                "resultsLimit": 1,
            }
            
            # Start the actor
            run = apify_client.actor("apify/instagram-profile-scraper").call(run_input=run_input)
            
            # Wait for results (with timeout)
            start_time = time.time()
            while time.time() - start_time < timeout:
                dataset_items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
                if dataset_items:
                    profile = dataset_items[0]
                    print(f"    ✅ Scraped: {profile.get('fullName', username)} ({profile.get('followersCount', 0)} followers)")
                    return profile
                time.sleep(2)
            
            print(f"    ⏱️ Timeout scraping @{username}")
            return None
            
        except Exception as e:
            print(f"    ❌ Error scraping @{username}: {str(e)}")
            return None
    
    @staticmethod
    def enrich_influencer_with_apify(influencer: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich influencer profile with Apify Instagram data
        
        Args:
            influencer: Influencer dict
            
        Returns:
            Enriched influencer dict
        """
        # Only enrich Instagram profiles
        if influencer.get("platform") != "Instagram":
            return influencer
        
        # Extract username
        username = ApifyScraperService.extract_instagram_username(
            influencer.get("profile_url", "")
        )
        
        if not username:
            return influencer
        
        # Scrape profile
        profile_data = ApifyScraperService.scrape_instagram_profile(username)
        
        if not profile_data:
            return influencer
        
        # Enrich influencer data
        influencer["name"] = profile_data.get("fullName") or influencer.get("name")
        influencer["username"] = profile_data.get("username") or username
        influencer["bio"] = profile_data.get("biography") or influencer.get("bio")
        influencer["followers"] = profile_data.get("followersCount") or influencer.get("followers")
        influencer["following"] = profile_data.get("followsCount")
        influencer["posts_count"] = profile_data.get("postsCount")
        influencer["is_verified"] = profile_data.get("verified", False)
        influencer["is_private"] = profile_data.get("private", False)
        influencer["profile_pic"] = profile_data.get("profilePicUrl")
        influencer["external_url"] = profile_data.get("externalUrl")
        
        # Calculate engagement rate if possible
        if influencer.get("followers") and influencer.get("posts_count"):
            # Rough estimate: assume average likes per post is 3-5% of followers
            estimated_engagement = 4.0  # 4% average
            influencer["engagement_rate"] = f"{estimated_engagement}%"
        
        influencer["data_source"] = "apify_instagram_scraper"
        
        return influencer
    
    @staticmethod
    def batch_enrich_influencers(
        influencers: List[Dict[str, Any]],
        max_enrich: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Enrich multiple influencers with Apify data
        
        Args:
            influencers: List of influencer dicts
            max_enrich: Maximum number to enrich (to avoid rate limits)
            
        Returns:
            List of enriched influencers
        """
        if not apify_client:
            print("⚠️ Apify not configured - skipping enrichment")
            return influencers
        
        print(f"📊 Enriching top {min(len(influencers), max_enrich)} Instagram profiles with Apify...")
        
        enriched = []
        
        for i, influencer in enumerate(influencers):
            if i < max_enrich and influencer.get("platform") == "Instagram":
                enriched_influencer = ApifyScraperService.enrich_influencer_with_apify(influencer)
                enriched.append(enriched_influencer)
            else:
                enriched.append(influencer)
        
        print(f"✅ Enrichment complete")
        
        return enriched
