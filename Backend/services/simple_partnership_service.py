"""
Simple Partnership Service
No strict validation - just find influencers and return them
Works like Google - shows results
"""

from typing import Dict, Any, List
from services.simple_influencer_search import SimpleInfluencerSearch
from services.partnership_analysis_service import PartnershipAnalysisService


class SimplePartnershipService:
    """
    Simple partnership service - priority is finding results
    No overly strict validation
    """
    
    @staticmethod
    async def discover_influencers(request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simple influencer discovery - just search and return
        
        Args:
            request_data: Request data from frontend
            
        Returns:
            Response dict with influencers
        """
        try:
            industry = request_data.get("industry", "other")
            city = request_data.get("location", "India")
            target_audience = request_data.get("targetAudience", "")
            collaboration_goal = request_data.get("collaborationGoal", "")
            
            print("=" * 80)
            print("🚀 SIMPLE INFLUENCER DISCOVERY")
            print("=" * 80)
            print(f"📋 Industry: {industry}")
            print(f"📍 City: {city}")
            print(f"🎯 Target Audience: {target_audience}")
            print(f"💡 Goal: {collaboration_goal}")
            print("=" * 80 + "\n")
            
            # STEP 1: Search all sources
            influencers = SimpleInfluencerSearch.search_all_sources(
                industry=industry,
                city=city
            )
            
            if not influencers:
                print("⚠️ No influencers found")
                return {
                    "success": True,
                    "results": [],
                    "total": 0,
                    "message": f"No {industry} influencers found. Try a different search."
                }
            
            print(f"✅ Found {len(influencers)} influencers\n")
            
            # STEP 2: Simple scoring (just based on source and platform)
            print("🎯 STEP 2: Scoring influencers...")
            for influencer in influencers:
                score = 50  # Base score
                
                # Bonus for Instagram direct results
                if influencer.get("source") == "rapidapi_instagram":
                    score += 30
                
                # Bonus for having followers
                if influencer.get("followers", 0) > 0:
                    score += 10
                
                # Bonus for verified
                if influencer.get("is_verified"):
                    score += 10
                
                # Platform bonus
                if influencer.get("platform") == "Instagram":
                    score += 5
                elif influencer.get("platform") == "YouTube":
                    score += 3
                
                influencer["matchScore"] = min(score, 100)
            
            # Sort by score
            influencers.sort(key=lambda x: x.get("matchScore", 0), reverse=True)
            
            print(f"✅ Scoring complete\n")
            
            # STEP 3: AI Analysis (top 10 only)
            print("🤖 STEP 3: AI analysis for top influencers...")
            top_influencers = influencers[:10]
            
            analyzed = PartnershipAnalysisService.batch_analyze_influencers(
                influencers=top_influencers,
                business_context=request_data,
                max_analyze=10
            )
            
            # Add remaining without detailed analysis
            for inf in influencers[10:]:
                inf["whyItWorks"] = f"Relevant {inf.get('niche', industry)} creator"
                inf["suggestedCampaign"] = "Sponsored content collaboration"
                inf["estimatedCost"] = "₹10,000 - ₹30,000"
                analyzed.append(inf)
            
            print(f"✅ Analysis complete\n")
            
            # STEP 4: Format for frontend
            print("📦 STEP 4: Formatting for frontend...")
            formatted = PartnershipAnalysisService.format_for_frontend(analyzed)
            
            # Limit to top 15
            final_results = formatted[:15]
            
            print("=" * 80)
            print(f"✅ DISCOVERY COMPLETE: {len(final_results)} influencers")
            print("=" * 80 + "\n")
            
            return {
                "success": True,
                "results": final_results,
                "total": len(final_results),
                "message": f"Found {len(final_results)} {industry} influencers in {city}"
            }
            
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "results": [],
                "total": 0,
                "message": f"Error: {str(e)}"
            }
