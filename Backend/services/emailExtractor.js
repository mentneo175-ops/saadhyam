/**
 * Email Extractor Service
 * Extracts email addresses from bio and external URLs
 */

const axios = require('axios');

/**
 * Extract email from bio text
 * @param {string} bio - Instagram bio text
 * @returns {string|null} Email address or null
 */
function extractEmailFromBio(bio) {
    if (!bio) return null;
    
    // Email regex pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    const matches = bio.match(emailRegex);
    
    if (matches && matches.length > 0) {
        // Return first valid email
        return matches[0].toLowerCase();
    }
    
    return null;
}

/**
 * Extract email from external URL
 * @param {string} url - External URL from Instagram bio
 * @returns {Promise<string|null>} Email address or null
 */
async function extractEmailFromUrl(url) {
    if (!url) return null;
    
    try {
        // Fetch the webpage
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = response.data;
        
        // Email regex pattern
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        
        const matches = html.match(emailRegex);
        
        if (matches && matches.length > 0) {
            // Filter out common false positives
            const validEmails = matches.filter(email => {
                const lower = email.toLowerCase();
                return !lower.includes('example.com') &&
                       !lower.includes('test.com') &&
                       !lower.includes('placeholder') &&
                       !lower.includes('noreply') &&
                       !lower.includes('no-reply');
            });
            
            if (validEmails.length > 0) {
                return validEmails[0].toLowerCase();
            }
        }
        
        return null;
        
    } catch (error) {
        // Silently fail for URL extraction
        return null;
    }
}

/**
 * Extract email from profile data
 * @param {Object} profile - Instagram profile data
 * @returns {Promise<string|null>} Email address or null
 */
async function extractEmail(profile) {
    try {
        // Try bio first
        const bioEmail = extractEmailFromBio(profile.bio);
        if (bioEmail) {
            console.log(`    📧 Email found in bio: ${bioEmail}`);
            return bioEmail;
        }
        
        // Try external URL
        if (profile.external_url) {
            const urlEmail = await extractEmailFromUrl(profile.external_url);
            if (urlEmail) {
                console.log(`    📧 Email found in URL: ${urlEmail}`);
                return urlEmail;
            }
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

/**
 * Extract emails for multiple profiles
 * @param {Array<Object>} profiles - Array of Instagram profiles
 * @returns {Promise<Array<Object>>} Profiles with email field added
 */
async function extractEmailsForProfiles(profiles) {
    const results = [];
    
    for (const profile of profiles) {
        const email = await extractEmail(profile);
        results.push({
            ...profile,
            email: email
        });
    }
    
    return results;
}

module.exports = {
    extractEmailFromBio,
    extractEmailFromUrl,
    extractEmail,
    extractEmailsForProfiles
};
