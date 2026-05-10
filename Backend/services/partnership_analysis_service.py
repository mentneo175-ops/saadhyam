"""
Partnership Analysis Service using OpenAI
Analyzes influencer-business compatibility and generates partnership recommendations
"""

import os
import json
from typing import List, Dict, Any
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("GROQ_API_KEY"))  # Using Groq as OpenAI-compatible API


class PartnershipAnalysisService:
    """
    AI-powered partnership analysis
    OpenAI ONLY analyzes and ranks - NEVER generates fake influencer data
    """
    
    @staticmethod
    def analyze_influencer_compatibility(
        influencer: Dict[str, Any],
        business_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze single influencer compatibility with business
        
        Args:
            influencer: Influencer data dict
            business_context: Business information
            
        Returns:
            Analysis dict with partnership insights
        """
        try:
            prompt = f"""You are an influencer marketing expert. Analyze this REAL influencer for partnership compatibility.

BUSINESS CONTEXT:
- Name: {business_context.get('businessName')}
- Industry: {business_context.get('industry')}
- Location: {business_context.get('location')}
- Target Audience: {business_context.get('targetAudience')}
- Collaboration Goal: {business_context.get('collaborationGoal')}
- Partnership Type: {business_context.get('partnershipType')}
- Budget: {business_context.get('budget')}

REAL INFLUENCER DATA:
- Name: {influencer.get('name')}
- Platform: {influencer.get('platform')}
- Location: {influencer.get('location')}
- Bio: {influencer.get('bio')}
- Niche: {influencer.get('niche')}
- Followers: {influencer.get('followers') or 'Unknown'}
- Profile URL: {influencer.get('profile_url')}

TASK: Analyze this REAL influencer and provide:
1. Partnership fit explanation (2-3 sentences)
2. Suggested campaign idea (specific to this influencer)
3. Expected impact (High/Medium/Low)
4. Estimated cost range in INR
5. Key benefits (3 bullet points)

Return ONLY valid JSON:
{{
    "partnership_fit": "explanation here",
    "campaign_idea": "specific campaign suggestion",
    "expected_impact": "High/Medium/Low",
    "estimated_cost": "₹X - ₹Y",
    "key_benefits": ["benefit 1", "benefit 2", "benefit 3"]
}}

IMPORTANT: Base analysis ONLY on the real data provided. Do NOT invent additional information."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an influencer marketing analyst. Respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            analysis = json.loads(content)
            
            return analysis
            
        except Exception as e:
            print(f"❌ Error analyzing influencer: {str(e)}")
            # Fallback analysis
            return {
                "partnership_fit": f"Relevant {influencer.get('niche')} influencer in {influencer.get('location')}",
                "campaign_idea": f"Sponsored content campaign featuring {business_context.get('businessName')}",
                "expected_impact": "Medium",
                "estimated_cost": "₹10,000 - ₹30,000",
                "key_benefits": [
                    "Local audience reach",
                    "Niche-specific targeting",
                    "Authentic content creation"
                ]
            }
    
    @staticmethod
    def batch_analyze_influencers(
        influencers: List[Dict[str, Any]],
        business_context: Dict[str, Any],
        max_analyze: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Analyze multiple influencers in batch
        
        Args:
            influencers: List of influencer dicts
            business_context: Business information
            max_analyze: Maximum number to analyze with AI
            
        Returns:
            List of influencers with analysis added
        """
        print(f"🤖 Analyzing {min(len(influencers), max_analyze)} influencers with AI...")
        
        analyzed = []
        
        for i, influencer in enumerate(influencers[:max_analyze]):
            print(f"  🔍 Analyzing {i+1}/{min(len(influencers), max_analyze)}: {influencer.get('name')}")
            
            # Get AI analysis
            analysis = PartnershipAnalysisService.analyze_influencer_compatibility(
                influencer=influencer,
                business_context=business_context
            )
            
            # Merge analysis into influencer dict
            influencer_with_analysis = {
                **influencer,
                "whyItWorks": analysis.get("partnership_fit", ""),
                "suggestedCampaign": analysis.get("campaign_idea", ""),
                "estimatedImpact": analysis.get("expected_impact", "Medium"),
                "estimatedCost": analysis.get("estimated_cost", ""),
                "keyBenefits": analysis.get("key_benefits", []),
                "matchScore": influencer.get("match_score", 50)
            }
            
            analyzed.append(influencer_with_analysis)
        
        # Add remaining influencers without detailed AI analysis
        for influencer in influencers[max_analyze:]:
            influencer_with_basic = {
                **influencer,
                "whyItWorks": f"Relevant {influencer.get('niche')} creator in {influencer.get('location')}",
                "suggestedCampaign": "Sponsored content collaboration",
                "estimatedImpact": "Medium",
                "estimatedCost": "₹10,000 - ₹30,000",
                "keyBenefits": ["Local reach", "Niche targeting", "Authentic content"],
                "matchScore": influencer.get("match_score", 50)
            }
            analyzed.append(influencer_with_basic)
        
        print(f"✅ Analysis complete for {len(analyzed)} influencers")
        
        return analyzed
    
    @staticmethod
    def format_for_frontend(influencers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Format influencer data for frontend display
        
        Args:
            influencers: List of analyzed influencer dicts
            
        Returns:
            Formatted list for frontend
        """
        formatted = []
        
        for inf in influencers:
            formatted.append({
                # Basic info
                "username": inf.get("username", ""),
                "full_name": inf.get("name", ""),
                "bio": inf.get("bio", ""),
                "profile_pic": "",  # Not available from search
                
                # Stats
                "followers": inf.get("followers", 0),
                "followers_display": PartnershipAnalysisService._format_followers(inf.get("followers", 0)),
                "platform": inf.get("platform", ""),
                "profile_url": inf.get("profile_url", ""),
                
                # Location
                "location": inf.get("location", ""),
                "niche": inf.get("niche", ""),
                
                # Analysis
                "matchScore": inf.get("matchScore", 0),
                "whyItWorks": inf.get("whyItWorks", ""),
                "suggestedCampaign": inf.get("suggestedCampaign", ""),
                "estimatedImpact": inf.get("estimatedImpact", "Medium"),
                "estimatedCost": inf.get("estimatedCost", ""),
                "estimatedReach": PartnershipAnalysisService._estimate_reach(inf.get("followers", 0)),
                "engagementRate": PartnershipAnalysisService._estimate_engagement(inf.get("followers", 0)),
                
                # Source
                "source": "tavily_real_search",
                "is_verified": False,
            })
        
        return formatted
    
    @staticmethod
    def _format_followers(count: int) -> str:
        """Format follower count for display"""
        if not count or count == 0:
            return "Unknown"
        
        if count >= 1000000:
            return f"{count / 1000000:.1f}M"
        elif count >= 1000:
            return f"{count / 1000:.1f}K"
        else:
            return str(count)
    
    @staticmethod
    def _estimate_reach(followers: int) -> str:
        """Estimate reach range"""
        if not followers or followers == 0:
            return "Unknown"
        
        min_reach = int(followers * 0.6 / 1000)
        max_reach = int(followers * 1.2 / 1000)
        return f"{min_reach}K-{max_reach}K"
    
    @staticmethod
    def _estimate_engagement(followers: int) -> str:
        """Estimate engagement rate"""
        if not followers or followers == 0:
            return "Unknown"
        
        # Industry standard: engagement decreases with follower count
        if followers < 10000:
            return "5-8%"
        elif followers < 50000:
            return "3-5%"
        elif followers < 100000:
            return "2-4%"
        elif followers < 500000:
            return "1.5-3%"
        else:
            return "1-2%"
