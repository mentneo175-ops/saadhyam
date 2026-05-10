/**
 * Business Context Service
 * Fetches logged-in business profile from database
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

/**
 * Fetch business profile by ID
 * @param {number} businessId - Business ID
 * @returns {Promise<Object>} Business profile data
 */
async function getBusinessProfile(businessId) {
    try {
        const query = `
            SELECT 
                id,
                business_name,
                business_category,
                business_subcategory,
                location,
                target_audience,
                business_description,
                industry,
                created_at
            FROM businesses
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [businessId]);
        
        if (result.rows.length === 0) {
            throw new Error(`Business with ID ${businessId} not found`);
        }
        
        const business = result.rows[0];
        
        // Normalize business data
        return {
            id: business.id,
            name: business.business_name || '',
            category: business.business_category || business.industry || 'other',
            subcategory: business.business_subcategory || '',
            location: business.location || 'India',
            targetAudience: business.target_audience || '',
            description: business.business_description || '',
            industry: business.industry || business.business_category || 'other'
        };
        
    } catch (error) {
        console.error('❌ Error fetching business profile:', error.message);
        throw error;
    }
}

/**
 * Infer category from business name/description if missing
 * @param {Object} business - Business data
 * @returns {string} Inferred category
 */
function inferCategory(business) {
    const text = `${business.name} ${business.description}`.toLowerCase();
    
    const categoryKeywords = {
        'food': ['restaurant', 'cafe', 'food', 'cuisine', 'dining', 'chef', 'bakery', 'catering'],
        'fashion': ['fashion', 'clothing', 'apparel', 'boutique', 'style', 'wear', 'designer'],
        'tech': ['technology', 'software', 'tech', 'digital', 'app', 'saas', 'it', 'computer'],
        'beauty': ['beauty', 'salon', 'spa', 'cosmetics', 'makeup', 'skincare', 'hair'],
        'fitness': ['fitness', 'gym', 'yoga', 'health', 'wellness', 'training', 'workout'],
        'travel': ['travel', 'tourism', 'hotel', 'resort', 'tour', 'vacation', 'hospitality'],
        'education': ['education', 'school', 'learning', 'training', 'course', 'academy', 'institute'],
        'real-estate': ['real estate', 'property', 'realty', 'housing', 'construction', 'builder']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return category;
        }
    }
    
    return 'other';
}

/**
 * Get business context with fallback
 * @param {number} businessId - Business ID
 * @returns {Promise<Object>} Complete business context
 */
async function getBusinessContext(businessId) {
    try {
        const business = await getBusinessProfile(businessId);
        
        // Infer category if missing
        if (!business.category || business.category === 'other') {
            business.category = inferCategory(business);
        }
        
        console.log(`✅ Business context loaded: ${business.name} (${business.category})`);
        
        return business;
        
    } catch (error) {
        console.error('❌ Error getting business context:', error.message);
        throw error;
    }
}

module.exports = {
    getBusinessProfile,
    getBusinessContext,
    inferCategory
};
