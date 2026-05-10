/**
 * Real Influencer Discovery Service
 * Main orchestrator for the complete influencer discovery pipeline
 */

const { generateSearchKeywords } = require('./keywordGenerator');
const { searchGoogleForInstagramProfiles } = require('./googleSearchScraper');
const { scrapeInstagramProfiles } = require('./instagramProfileScraper');
const { extractEmailsForProfiles } = require('./emailExtractor');
const { addEngagementMetricsToProfiles } = require('./engagementEstimator');
const { scoreInfluencers, addCostEstimates } = require('./influencerScoring');

/**
 * Strict niche filtering - Remove irrelevant influencers
 * @param {Array<Object>} influencers - Array of influencer profiles
 * @param {string} category - Business category
 * @returns {Array<Object>} Filtered influencers
 */
function strictNicheFilter(influencers, category) {
    const filterKeywords = {
        'food': ['food', 'chef', 'cook', 'recipe', 'restaurant', 'cuisine', 'meal', 'dish', 'culinary', 'foodie', 'cooking'],
        'fashion': ['fashion', 'style', 'outfit', 'clothing', 'designer', 'model', 'trend', 'wear', 'wardrobe'],
        'tech': ['tech', 'technology', 'gadget', 'software', 'code', 'developer', 'digital', 'app', 'programming'],
        'beauty': ['beauty', 'makeup', 'skincare', 'cosmetic', 'glow', 'skin', 'hair', 'nail'],
        'fitness': ['fitness', 'gym', 'workout', 'health', 'yoga', 'training', 'exercise', 'muscle'],
        'travel': ['travel', 'trip', 'tour', 'explore', 'wander', 'adventure', 'destination', 'journey'],
        'education': ['education', 'learn', 'teach', 'study', 'student', 'knowledge', 'course'],
        'real-estate': ['realestate', 'property', 'home', 'house', 'architecture', 'interior', 'design', 'luxury', 'villa']
    };
    
    const negativeKeywords = {
        'real-estate': ['food', 'recipe', 'cooking', 'restaurant', 'chef', 'meal'],
        'travel': ['food blogger', 'recipe', 'cooking', 'restaurant review'],
        'fitness': ['food blogger', 'recipe creator', 'restaurant'],
        'food': ['real estate', 'property', 'architecture'],
        'fashion': ['food blogger', 'recipe', 'cooking'],
        'tech': ['food blogger', 'recipe', 'cooking', 'restaurant'],
        'beauty': ['food blogger', 'recipe', 'cooking']
    };
    
    const keywords = filterKeywords[category.toLowerCase()] || [];
    const negative = negativeKeywords[category.toLowerCase()] || [];
    
    const filtered = influencers.filter(influencer => {
        const bio = (influencer.bio || '').toLowerCase();
        const username = (influencer.username || '').toLowerCase();
        const fullName = (influencer.full_name || '').toLowerCase();
        
        const combinedText = `${bio} ${username} ${fullName}`;
        
        // Check for negative keywords (EXCLUDE if found)
        const hasNegative = negative.some(neg => combinedText.includes(neg));
        if (hasNegative) {
            console.log(`    ❌ Excluded @${influencer.username}: Contains negative keywords`);
            return false;
        }
        
        // Check for positive keywords (MUST have at least 2 matches)
        const keywordMatches = keywords.filter(kw => combinedText.includes(kw)).length;
        
        if (keywordMatches >= 2) {
            console.log(`    ✅ Kept @${influencer.username}: ${keywordMatches} keyword matches`);
            return true;
        } else {
            console.log(`    ❌ Excluded @${influencer.username}: Only ${keywordMatches} keyword match(es)`);
            return false;
        }
    });
    
    return filtered;
}

/**
 * Main influencer discovery pipeline
 * @param {Object} businessContext - Business profile data
 * @param {number} limit - Maximum number of influencers to return
 * @returns {Promise<Array<Object>>} Array of discovered influencers
 */
async function discoverRealInfluencers(businessContext, limit = 10) {
    try {
        console.log('🚀 Starting REAL influencer discovery pipeline...');
        console.log(`📋 Business: ${businessContext.name} (${businessContext.category})`);
        
        // STEP 1: Generate search keywords using Groq
        console.log('\n📝 STEP 1: Generating search keywords...');
        const keywords = await generateSearchKeywords(businessContext);
        
        if (!keywords || keywords.length === 0) {
            throw new Error('Failed to generate search keywords');
        }
        
        console.log(`✅ Generated ${keywords.length} keywords`);
        
        // STEP 2: Search Google for Instagram profiles
        console.log('\n🔍 STEP 2: Searching Google for Instagram profiles...');
        const profileUrls = await searchGoogleForInstagramProfiles(keywords, 5);
        
        if (!profileUrls || profileUrls.length === 0) {
            console.log('⚠️ No Instagram profiles found on Google');
            return [];
        }
        
        console.log(`✅ Found ${profileUrls.length} Instagram profile URLs`);
        
        // STEP 3: Scrape Instagram profiles
        console.log('\n📸 STEP 3: Scraping Instagram profiles...');
        let profiles = await scrapeInstagramProfiles(profileUrls);
        
        if (!profiles || profiles.length === 0) {
            console.log('⚠️ No profiles successfully scraped');
            return [];
        }
        
        console.log(`✅ Scraped ${profiles.length} profiles`);
        
        // STEP 4: Strict niche filtering
        console.log('\n🔍 STEP 4: Applying strict niche filtering...');
        profiles = strictNicheFilter(profiles, businessContext.category);
        
        if (profiles.length === 0) {
            console.log('⚠️ No relevant influencers found after filtering');
            return [];
        }
        
        console.log(`✅ ${profiles.length} relevant influencers after filtering`);
        
        // STEP 5: Extract emails
        console.log('\n📧 STEP 5: Extracting contact emails...');
        profiles = await extractEmailsForProfiles(profiles);
        console.log(`✅ Email extraction complete`);
        
        // STEP 6: Add engagement metrics
        console.log('\n📊 STEP 6: Calculating engagement metrics...');
        profiles = addEngagementMetricsToProfiles(profiles);
        console.log(`✅ Engagement metrics added`);
        
        // STEP 7: Score and rank using Groq AI
        console.log('\n🎯 STEP 7: Scoring and ranking influencers...');
        profiles = await scoreInfluencers(profiles, businessContext);
        console.log(`✅ Scoring complete`);
        
        // STEP 8: Add cost estimates
        console.log('\n💰 STEP 8: Adding cost estimates...');
        profiles = addCostEstimates(profiles);
        console.log(`✅ Cost estimates added`);
        
        // Return top results
        const results = profiles.slice(0, limit);
        
        console.log(`\n✅ PIPELINE COMPLETE: ${results.length} influencers discovered`);
        console.log('📊 Top influencer:', results[0]?.username, `(Score: ${results[0]?.match_score})`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Influencer discovery pipeline error:', error.message);
        throw error;
    }
}

/**
 * Format influencer data for API response
 * @param {Array<Object>} influencers - Array of influencer profiles
 * @returns {Array<Object>} Formatted influencer data
 */
function formatInfluencersForResponse(influencers) {
    return influencers.map(inf => ({
        // Basic info
        username: inf.username,
        full_name: inf.full_name || inf.username,
        bio: inf.bio || '',
        profile_pic: inf.profile_image || '',
        
        // Stats
        followers: inf.followers_count,
        followers_display: inf.followers_display,
        following: inf.following || 0,
        posts: inf.posts || 0,
        
        // Engagement
        engagement_rate: `${inf.engagement_rate?.toFixed(1) || '0.0'}%`,
        engagementRate: `${inf.engagement_rate?.toFixed(1) || '0.0'}%`,
        avg_views: inf.avg_views || 0,
        avgViews: inf.avg_views?.toString() || '0',
        
        // Verification
        is_verified: inf.is_verified || false,
        
        // Contact
        email: inf.email || null,
        external_url: inf.external_url || '',
        
        // Scoring
        match_score: inf.match_score || 0,
        matchScore: inf.match_score || 0,
        why_it_works: inf.why_it_works || '',
        whyItWorks: inf.why_it_works || '',
        suggested_campaign: inf.suggested_campaign || '',
        suggestedCampaign: inf.suggested_campaign || '',
        estimated_impact: inf.estimated_impact || 'Medium',
        partnership_strategy: inf.partnership_strategy || '',
        
        // Cost
        estimated_cost: inf.estimated_cost || '',
        estimatedCost: inf.estimated_cost || '',
        estimatedReach: `${Math.round(inf.followers_count * 0.8 / 1000)}K-${Math.round(inf.followers_count * 1.2 / 1000)}K`,
        
        // Platform
        platform: 'instagram',
        source: 'real_scraping',
        niche: inf.niche || '',
        location: inf.location || ''
    }));
}

module.exports = {
    discoverRealInfluencers,
    strictNicheFilter,
    formatInfluencersForResponse
};
