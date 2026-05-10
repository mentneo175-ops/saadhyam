/**
 * Keyword Generator Service
 * Generates highly targeted influencer search keywords using Groq AI
 */

const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate search keywords for influencer discovery
 * @param {Object} businessContext - Business profile data
 * @returns {Promise<Array<string>>} Array of search keywords
 */
async function generateSearchKeywords(businessContext) {
    try {
        const { category, subcategory, location, targetAudience, description, name } = businessContext;
        
        const prompt = `You are an expert influencer marketing strategist. Generate highly targeted Instagram influencer search keywords.

BUSINESS CONTEXT:
- Name: ${name}
- Category: ${category}
- Subcategory: ${subcategory}
- Location: ${location}
- Target Audience: ${targetAudience}
- Description: ${description}

TASK: Generate 8-12 highly specific search keywords to find relevant Instagram influencers.

RULES:
1. Keywords must be HIGHLY SPECIFIC to the business category
2. Include location-based keywords (e.g., "food blogger hyderabad")
3. Include niche-specific keywords (e.g., "korean food influencer india")
4. Include role-based keywords (e.g., "restaurant reviewer", "fashion stylist")
5. Keywords should be 2-4 words each
6. Focus on QUALITY over quantity
7. Return ONLY keywords, one per line, no numbering or bullets

EXAMPLES:
For Restaurant (Korean Food, Hyderabad):
food blogger hyderabad
korean food influencer india
restaurant reviewer hyderabad
food vlogger andhra pradesh
asian cuisine creator
foodie hyderabad
culinary influencer india

For Fashion Boutique (Ethnic Wear, Mumbai):
fashion influencer mumbai
ethnic wear creator
saree styling influencer
traditional fashion blogger india
outfit influencer mumbai
indian fashion creator

For Real Estate (Luxury Properties, Bangalore):
luxury lifestyle creator india
architecture influencer bangalore
interior design creator
property influencer india
real estate blogger bangalore
home decor influencer

Now generate keywords for the business above:`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert influencer marketing strategist. Generate only search keywords, nothing else.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 300
        });
        
        const content = response.choices[0].message.content.trim();
        
        // Parse keywords from response
        const keywords = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter(line => !line.match(/^\d+[\.\)]/)) // Remove numbered lines
            .filter(line => !line.startsWith('-')) // Remove bullet points
            .map(line => line.replace(/^[-•*]\s*/, '')) // Clean up any remaining markers
            .slice(0, 12); // Limit to 12 keywords
        
        console.log(`✅ Generated ${keywords.length} search keywords:`, keywords);
        
        return keywords;
        
    } catch (error) {
        console.error('❌ Error generating keywords:', error.message);
        
        // Fallback: Generate basic keywords based on category
        return getFallbackKeywords(businessContext.category, businessContext.location);
    }
}

/**
 * Fallback keyword generation (if Groq fails)
 * @param {string} category - Business category
 * @param {string} location - Business location
 * @returns {Array<string>} Fallback keywords
 */
function getFallbackKeywords(category, location) {
    const locationPart = location.split(',')[0].trim().toLowerCase();
    
    const categoryKeywords = {
        'food': [
            `food blogger ${locationPart}`,
            'food influencer india',
            `restaurant reviewer ${locationPart}`,
            'food vlogger india',
            'culinary creator',
            'foodie influencer'
        ],
        'fashion': [
            `fashion influencer ${locationPart}`,
            'fashion blogger india',
            `style creator ${locationPart}`,
            'outfit influencer india',
            'fashion vlogger',
            'styling expert'
        ],
        'tech': [
            `tech reviewer ${locationPart}`,
            'technology influencer india',
            'gadget reviewer india',
            'tech vlogger',
            'tech content creator'
        ],
        'beauty': [
            `beauty influencer ${locationPart}`,
            'makeup creator india',
            'skincare influencer',
            'beauty vlogger india',
            'makeup artist'
        ],
        'fitness': [
            `fitness influencer ${locationPart}`,
            'gym creator india',
            'workout coach',
            'fitness vlogger india',
            'yoga instructor'
        ],
        'travel': [
            `travel influencer ${locationPart}`,
            'travel blogger india',
            'travel vlogger',
            'tourism creator india',
            'adventure blogger'
        ],
        'education': [
            `education influencer ${locationPart}`,
            'learning creator india',
            'teacher influencer',
            'educational content creator'
        ],
        'real-estate': [
            `luxury lifestyle creator ${locationPart}`,
            'architecture influencer india',
            'interior design creator',
            'property influencer india',
            'real estate blogger',
            'home decor influencer'
        ],
        'other': [
            `lifestyle influencer ${locationPart}`,
            'entrepreneur india',
            'business creator',
            'content creator india'
        ]
    };
    
    return categoryKeywords[category] || categoryKeywords['other'];
}

module.exports = {
    generateSearchKeywords,
    getFallbackKeywords
};
