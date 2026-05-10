/**
 * Influencer Scoring Service
 * Scores and ranks influencers using Groq AI
 */

const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Score influencers using Groq AI
 * @param {Array<Object>} influencers - Array of influencer profiles
 * @param {Object} businessContext - Business context
 * @returns {Promise<Array<Object>>} Scored and ranked influencers
 */
async function scoreInfluencers(influencers, businessContext) {
    try {
        console.log(`🎯 Scoring ${influencers.length} influencers using Groq AI...`);
        
        // Prepare influencer summary for Groq
        const influencerSummary = influencers.map(inf => ({
            username: inf.username,
            full_name: inf.full_name,
            bio: (inf.bio || '').substring(0, 200),
            followers: inf.followers_count,
            engagement_rate: inf.engagement_rate,
            is_verified: inf.is_verified,
            posts: inf.posts
        }));
        
        const prompt = `You are an expert influencer marketing analyst. Score and rank these REAL Instagram influencers for a business partnership.

CRITICAL RULES:
1. ONLY analyze the influencers provided below
2. DO NOT invent or suggest new influencers
3. Score based on ACTUAL profile data provided
4. Focus on niche relevance, engagement, and audience fit

BUSINESS CONTEXT:
- Name: ${businessContext.name}
- Category: ${businessContext.category}
- Location: ${businessContext.location}
- Target Audience: ${businessContext.targetAudience}
- Description: ${businessContext.description}

REAL INFLUENCERS TO SCORE:
${JSON.stringify(influencerSummary, null, 2)}

For EACH influencer, provide:
1. Match Score (0-100): How well they fit the business based on their ACTUAL niche and bio
2. Why This Partnership Works: 2-3 sentences explaining the fit
3. Suggested Campaign: Specific collaboration idea matching their content
4. Estimated Impact: Expected partnership impact
5. Partnership Strategy: Brief strategy recommendation

Return ONLY a valid JSON array:
[
  {
    "username": "actual_username_from_list",
    "match_score": 95,
    "why_it_works": "explanation based on real data",
    "suggested_campaign": "campaign idea",
    "estimated_impact": "High/Medium/Low",
    "partnership_strategy": "strategy recommendation"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text.`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert influencer marketing analyst. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        const content = response.choices[0].message.content.trim();
        
        // Extract JSON from response
        let jsonContent = content;
        if (content.includes('```json')) {
            jsonContent = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            jsonContent = content.split('```')[1].split('```')[0].trim();
        }
        
        const scores = JSON.parse(jsonContent);
        
        // Merge scores with influencer data
        const scoredInfluencers = influencers.map(influencer => {
            const score = scores.find(s => s.username === influencer.username);
            
            if (score) {
                return {
                    ...influencer,
                    match_score: score.match_score || 75,
                    why_it_works: score.why_it_works || '',
                    suggested_campaign: score.suggested_campaign || '',
                    estimated_impact: score.estimated_impact || 'Medium',
                    partnership_strategy: score.partnership_strategy || ''
                };
            }
            
            // Fallback scoring if not found
            return {
                ...influencer,
                match_score: calculateFallbackScore(influencer, businessContext),
                why_it_works: 'Relevant profile in target niche',
                suggested_campaign: 'Sponsored content campaign',
                estimated_impact: 'Medium',
                partnership_strategy: 'Engage with authentic content'
            };
        });
        
        // Sort by match score (highest first)
        scoredInfluencers.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        
        console.log(`✅ Scoring complete: Top score = ${scoredInfluencers[0]?.match_score || 0}`);
        
        return scoredInfluencers;
        
    } catch (error) {
        console.error('❌ Groq scoring error:', error.message);
        
        // Fallback: Use basic scoring
        return influencers.map(inf => ({
            ...inf,
            match_score: calculateFallbackScore(inf, businessContext),
            why_it_works: 'Relevant profile in target niche',
            suggested_campaign: 'Sponsored content campaign',
            estimated_impact: 'Medium',
            partnership_strategy: 'Engage with authentic content'
        }));
    }
}

/**
 * Calculate fallback score (if Groq fails)
 * @param {Object} influencer - Influencer profile
 * @param {Object} businessContext - Business context
 * @returns {number} Match score (0-100)
 */
function calculateFallbackScore(influencer, businessContext) {
    let score = 0;
    
    const bio = (influencer.bio || '').toLowerCase();
    const username = (influencer.username || '').toLowerCase();
    const category = businessContext.category.toLowerCase();
    
    // Factor 1: Niche relevance (40 points)
    const categoryKeywords = {
        'food': ['food', 'chef', 'cook', 'recipe', 'restaurant', 'cuisine'],
        'fashion': ['fashion', 'style', 'outfit', 'clothing', 'designer'],
        'tech': ['tech', 'technology', 'gadget', 'software', 'code'],
        'beauty': ['beauty', 'makeup', 'skincare', 'cosmetic'],
        'fitness': ['fitness', 'gym', 'workout', 'health', 'yoga'],
        'travel': ['travel', 'trip', 'tour', 'explore', 'wander'],
        'education': ['education', 'learn', 'teach', 'study'],
        'real-estate': ['realestate', 'property', 'home', 'architecture', 'interior']
    };
    
    const keywords = categoryKeywords[category] || [];
    const matches = keywords.filter(kw => bio.includes(kw) || username.includes(kw)).length;
    
    score += Math.min(40, matches * 10);
    
    // Factor 2: Engagement rate (30 points)
    const engagement = influencer.engagement_rate || 0;
    if (engagement >= 8) score += 30;
    else if (engagement >= 5) score += 25;
    else if (engagement >= 3) score += 20;
    else if (engagement >= 1) score += 15;
    else score += 10;
    
    // Factor 3: Follower count (20 points)
    const followers = influencer.followers_count || 0;
    if (followers >= 50000 && followers <= 500000) score += 20;
    else if (followers >= 10000 && followers < 50000) score += 18;
    else if (followers >= 500000) score += 15;
    else score += 10;
    
    // Factor 4: Verification (10 points)
    if (influencer.is_verified) score += 10;
    
    return Math.min(100, score);
}

/**
 * Add cost estimates to influencers
 * @param {Array<Object>} influencers - Scored influencers
 * @returns {Array<Object>} Influencers with cost estimates
 */
function addCostEstimates(influencers) {
    return influencers.map(inf => {
        const followers = inf.followers_count || 0;
        
        let estimatedCost = '';
        if (followers > 1000000) {
            estimatedCost = '₹1,00,000 - ₹2,50,000';
        } else if (followers > 500000) {
            estimatedCost = '₹50,000 - ₹1,00,000';
        } else if (followers > 100000) {
            estimatedCost = '₹25,000 - ₹50,000';
        } else if (followers > 50000) {
            estimatedCost = '₹15,000 - ₹30,000';
        } else {
            estimatedCost = '₹5,000 - ₹15,000';
        }
        
        return {
            ...inf,
            estimated_cost: estimatedCost
        };
    });
}

module.exports = {
    scoreInfluencers,
    calculateFallbackScore,
    addCostEstimates
};
