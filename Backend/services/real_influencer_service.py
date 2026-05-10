"""
Real Influencer Service
Python wrapper for Node.js influencer discovery pipeline
"""

import os
import json
import subprocess
import asyncio
from typing import List, Dict, Any, Optional

class RealInfluencerService:
    """
    Service to discover REAL influencers using web scraping
    Calls Node.js services for Playwright-based scraping
    """
    
    @staticmethod
    async def discover_real_influencers(
        business_context: Dict[str, Any],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Discover real influencers using the Node.js pipeline
        
        Args:
            business_context: Business profile data
            limit: Maximum number of influencers to return
            
        Returns:
            List of discovered influencer profiles
        """
        try:
            print(f"🚀 Discovering REAL influencers for {business_context.get('name')}...")
            
            # Prepare Node.js script
            script_path = os.path.join(
                os.path.dirname(__file__),
                'runInfluencerDiscovery.js'
            )
            
            # Prepare input data
            input_data = {
                'businessContext': business_context,
                'limit': limit
            }
            
            # Run Node.js script
            result = await asyncio.create_subprocess_exec(
                'node',
                script_path,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.path.dirname(__file__)
            )
            
            # Send input data
            input_json = json.dumps(input_data)
            stdout, stderr = await result.communicate(input=input_json.encode())
            
            # Check for errors
            if result.returncode != 0:
                error_msg = stderr.decode() if stderr else 'Unknown error'
                print(f"❌ Node.js script error: {error_msg}")
                raise Exception(f"Influencer discovery failed: {error_msg}")
            
            # Parse output
            output = stdout.decode()
            
            # Extract JSON from output (in case there are console logs)
            json_start = output.find('[')
            json_end = output.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = output[json_start:json_end]
                influencers = json.loads(json_str)
                
                print(f"✅ Discovered {len(influencers)} REAL influencers")
                return influencers
            else:
                print("⚠️ No valid JSON output from Node.js script")
                return []
            
        except Exception as e:
            print(f"❌ Error in discover_real_influencers: {str(e)}")
            raise
    
    @staticmethod
    def format_for_partnership_response(
        influencers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Format influencer data for partnership agent response
        
        Args:
            influencers: List of influencer profiles
            
        Returns:
            Formatted influencer data
        """
        formatted = []
        
        for inf in influencers:
            formatted.append({
                # Basic info
                "username": inf.get("username", ""),
                "full_name": inf.get("full_name", ""),
                "bio": inf.get("bio", ""),
                "profile_pic": inf.get("profile_pic", ""),
                
                # Stats
                "followers": inf.get("followers", 0),
                "followers_display": inf.get("followers_display", ""),
                "following": inf.get("following", 0),
                "posts": inf.get("posts", 0),
                
                # Engagement
                "engagementRate": inf.get("engagement_rate", "0.0%"),
                "avgViews": str(inf.get("avg_views", 0)),
                
                # Verification
                "is_verified": inf.get("is_verified", False),
                
                # Contact
                "email": inf.get("email"),
                "external_url": inf.get("external_url", ""),
                
                # Scoring
                "matchScore": inf.get("match_score", 0),
                "whyItWorks": inf.get("why_it_works", ""),
                "suggestedCampaign": inf.get("suggested_campaign", ""),
                "estimatedImpact": inf.get("estimated_impact", "Medium"),
                "partnershipStrategy": inf.get("partnership_strategy", ""),
                
                # Cost
                "estimatedCost": inf.get("estimated_cost", ""),
                "estimatedReach": inf.get("estimatedReach", ""),
                
                # Platform
                "platform": "instagram",
                "source": "real_scraping",
                "niche": inf.get("niche", ""),
                "location": inf.get("location", "")
            })
        
        return formatted
