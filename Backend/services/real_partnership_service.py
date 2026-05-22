"""
Real Partnership Service
Main orchestrator for REAL influencer discovery using Tavily + OpenAI + Apify
NO FAKE DATA - Only real influencers from web search with strict validation
"""

from typing import Dict, Any, List
from services.web_search_service import WebSearchService
from services.influencer_extraction_service import InfluencerExtractionService
from services.influencer_validation_service import InfluencerValidationService
from services.influencer_ranking_service import InfluencerRankingService
from services.apify_scraper_service import ApifyScraperService
from services.partnership_analysis_service import PartnershipAnalysisService


class RealPartnershipService:
    """
    Complete real influencer discovery pipeline
    Tavily Search → Extract → Rank → AI Analysis → Return
    """
    
    @staticmethod
    async def discover_real_influencers(
        request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Main entry point for real influencer discovery
        
        Args:
            request_data: Request data from frontend
            
        Returns:
            Response dict with real influencers
        """
        try:
            industry = request_data.get("industry", "other")
            city = request_data.get("location", "India")
            target_audience = request_data.get("targetAudience", "")
            collaboration_goal = request_data.get("collaborationGoal", "")
            
            print("=" * 80)
            print("🚀 REAL INFLUENCER DISCOVERY PIPELINE")
            print("=" * 80)
            print(f"📋 Industry: {industry}")
            print(f"📍 City: {city}")
            print(f"🎯 Target Audience: {target_audience}")
            print(f"💡 Goal: {collaboration_goal}")
            print("=" * 80)
            
            # STEP 1: Web Search using Tavily with Progressive Location Expansion
            print("\n🔍 STEP 1: Searching web with Tavily API (Progressive Expansion)...")
            search_results, levels_used = WebSearchService.search_with_progressive_expansion(
                industry=industry,
                city=city,
                target_audience=target_audience,
                collaboration_goal=collaboration_goal,
                min_results=3,  # Minimum results before expanding
                max_results=30  # Increased from 20 to 30 for better coverage
            )
            
            if not search_results:
                print("⚠️ No search results found even after location expansion")
                return {
                    "success": True,
                    "results": [],
                    "total": 0,
                    "message": f"No {industry} influencers found in {city} or nearby regions. Try a different industry or broader location.",
                    "search_levels_used": []
                }
            
            print(f"✅ Found {len(search_results)} search results from {len(levels_used)} location levels")
            
            # STEP 2: Extract Influencer Data
            print("\n📊 STEP 2: Extracting influencer data...")
            influencers = InfluencerExtractionService.extract_influencers_from_results(
                results=search_results,
                industry=industry,
                city=city
            )
            
            if not influencers:
                print("⚠️ No influencers extracted from search results")
                return {
                    "success": True,
                    "results": [],
                    "total": 0,
                    "message": f"Could not extract influencer data for {industry} in {city}. Try a different search."
                }
            
            print(f"✅ Extracted {len(influencers)} influencers")
            
            # STEP 3: Validate Influencer Profiles (NEW STRICT VALIDATION)
            print("\n✅ STEP 3: Validating influencer profiles with balanced quality checks...")
            influencers = InfluencerValidationService.batch_validate_influencers(
                influencers=influencers,
                target_industry=industry,
                target_city=city,
                min_quality_score=40.0  # Reduced from 50 to 40 for better coverage
            )
            
            if not influencers:
                print("⚠️ No influencers passed validation")
                return {
                    "success": True,
                    "results": [],
                    "total": 0,
                    "message": f"No validated {industry} influencers found in {city}. Try a different search or broader location."
                }
            
            print(f"✅ {len(influencers)} influencers passed validation")
            
            # STEP 4: Remove Duplicates
            print("\n🔄 STEP 4: Removing duplicates...")
            influencers = InfluencerExtractionService.remove_duplicates(influencers)
            
            # STEP 5: Rank Influencers
            print("\n🎯 STEP 5: Ranking influencers by relevance...")
            influencers = InfluencerRankingService.rank_influencers(
                influencers=influencers,
                target_city=city,
                target_industry=industry
            )
            
            # STEP 6: Filter Low Quality
            print("\n🔍 STEP 6: Filtering low-quality matches...")
            influencers = InfluencerRankingService.filter_low_quality(
                influencers=influencers,
                min_score=40.0  # Reduced from 50 to 40 for better coverage
            )
            
            if not influencers:
                print("⚠️ No high-quality matches found")
                return {
                    "success": True,
                    "results": [],
                    "total": 0,
                    "message": f"No high-quality {industry} influencers found in {city}. Try adjusting your criteria."
                }
            
            # STEP 6.5: Enrich with Apify Instagram Scraper (NEW)
            print("\n📸 STEP 6.5: Enriching Instagram profiles with Apify scraper...")
            influencers = ApifyScraperService.batch_enrich_influencers(
                influencers=influencers,
                max_enrich=5  # Enrich top 5 to avoid rate limits
            )
            
            # STEP 7: AI Analysis
            print("\n🤖 STEP 7: AI-powered partnership analysis...")
            influencers = PartnershipAnalysisService.batch_analyze_influencers(
                influencers=influencers,
                business_context=request_data,
                max_analyze=10
            )
            
            # STEP 8: Format for Frontend
            print("\n📦 STEP 8: Formatting results for frontend...")
            formatted_results = PartnershipAnalysisService.format_for_frontend(influencers)
            
            # Limit to top 10
            final_results = formatted_results[:10]
            
            print(f"✅ PIPELINE COMPLETE: {len(final_results)} real influencers discovered")
            levels_str = ', '.join([f"Level {l['level']} ({l['type']})" for l in levels_used])
            print(f"📍 Search levels used: {levels_str}")
            print("=" * 80)
            
            return {
                "success": True,
                "results": final_results,
                "total": len(final_results),
                "message": f"Found {len(final_results)} real {industry} influencers in {city} and nearby regions",
                "search_levels_used": [
                    {
                        "level": l["level"],
                        "type": l["type"],
                        "location": l["location"],
                        "confidence": l["confidence"]
                    }
                    for l in levels_used
                ]
            }
            
        except Exception as e:
            print(f"\n❌ ERROR in discovery pipeline: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "results": [],
                "total": 0,
                "message": f"Error discovering influencers: {str(e)}"
            }
