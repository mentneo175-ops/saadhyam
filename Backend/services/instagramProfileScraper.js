/**
 * Instagram Profile Scraper Service
 * Scrapes public Instagram profile data using Playwright
 */

const { chromium } = require('playwright');
const UserAgent = require('user-agents');

/**
 * Scrape Instagram profile data
 * @param {Array<string>} profileUrls - Array of Instagram profile URLs
 * @returns {Promise<Array<Object>>} Array of profile data
 */
async function scrapeInstagramProfiles(profileUrls) {
    let browser = null;
    const profiles = [];
    
    try {
        console.log(`📸 Starting Instagram profile scraping for ${profileUrls.length} profiles...`);
        
        // Launch browser
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        
        const context = await browser.newContext({
            userAgent: new UserAgent().toString(),
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US'
        });
        
        const page = await context.newPage();
        
        // Process each profile URL
        for (const url of profileUrls) {
            try {
                const username = extractUsernameFromUrl(url);
                console.log(`  📸 Scraping: @${username}`);
                
                // Navigate to profile
                await page.goto(url, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 15000 
                });
                
                // Wait for content to load
                await page.waitForTimeout(2000 + Math.random() * 2000);
                
                // Extract profile data
                const profileData = await page.evaluate(() => {
                    const data = {
                        username: '',
                        full_name: '',
                        bio: '',
                        followers_display: '',
                        followers_count: 0,
                        following: 0,
                        posts: 0,
                        profile_image: '',
                        external_url: '',
                        is_verified: false
                    };
                    
                    try {
                        // Try to extract from meta tags
                        const metaDescription = document.querySelector('meta[property="og:description"]');
                        if (metaDescription) {
                            const content = metaDescription.getAttribute('content');
                            const match = content.match(/(\d+[KMB]?)\s+Followers/i);
                            if (match) {
                                data.followers_display = match[1];
                            }
                        }
                        
                        // Try to extract from JSON-LD
                        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                        scripts.forEach(script => {
                            try {
                                const json = JSON.parse(script.textContent);
                                if (json['@type'] === 'ProfilePage') {
                                    data.full_name = json.name || '';
                                    data.bio = json.description || '';
                                }
                            } catch (e) {}
                        });
                        
                        // Try to extract from embedded JSON
                        const bodyScripts = document.querySelectorAll('script');
                        bodyScripts.forEach(script => {
                            const text = script.textContent;
                            if (text.includes('window._sharedData')) {
                                try {
                                    const match = text.match(/window\._sharedData\s*=\s*({.+?});/);
                                    if (match) {
                                        const sharedData = JSON.parse(match[1]);
                                        const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
                                        
                                        if (user) {
                                            data.username = user.username || '';
                                            data.full_name = user.full_name || '';
                                            data.bio = user.biography || '';
                                            data.followers_count = user.edge_followed_by?.count || 0;
                                            data.following = user.edge_follow?.count || 0;
                                            data.posts = user.edge_owner_to_timeline_media?.count || 0;
                                            data.profile_image = user.profile_pic_url_hd || user.profile_pic_url || '';
                                            data.external_url = user.external_url || '';
                                            data.is_verified = user.is_verified || false;
                                        }
                                    }
                                } catch (e) {}
                            }
                        });
                        
                        // Try to extract from HTML (fallback)
                        const h1 = document.querySelector('h1');
                        if (h1 && !data.full_name) {
                            data.full_name = h1.textContent.trim();
                        }
                        
                        const bioElement = document.querySelector('div[class*="bio"]');
                        if (bioElement && !data.bio) {
                            data.bio = bioElement.textContent.trim();
                        }
                        
                        // Extract follower count from visible text
                        const statsElements = document.querySelectorAll('span, div');
                        statsElements.forEach(el => {
                            const text = el.textContent;
                            if (text.includes('followers') && !data.followers_display) {
                                const match = text.match(/(\d+[KMB]?)\s+followers/i);
                                if (match) {
                                    data.followers_display = match[1];
                                }
                            }
                        });
                        
                        // Extract profile image
                        const img = document.querySelector('img[alt*="profile picture"]');
                        if (img && !data.profile_image) {
                            data.profile_image = img.src;
                        }
                        
                    } catch (error) {
                        console.error('Error extracting profile data:', error);
                    }
                    
                    return data;
                });
                
                // Set username from URL if not extracted
                if (!profileData.username) {
                    profileData.username = username;
                }
                
                // Normalize follower count
                if (profileData.followers_display && !profileData.followers_count) {
                    profileData.followers_count = normalizeFollowerCount(profileData.followers_display);
                } else if (profileData.followers_count && !profileData.followers_display) {
                    profileData.followers_display = formatFollowerCount(profileData.followers_count);
                }
                
                // Only add if we got meaningful data
                if (profileData.username && (profileData.followers_count > 0 || profileData.followers_display)) {
                    profiles.push(profileData);
                    console.log(`    ✅ Scraped @${profileData.username}: ${profileData.followers_display} followers`);
                } else {
                    console.log(`    ⚠️ Insufficient data for @${username}`);
                }
                
                // Rate limiting
                await page.waitForTimeout(2000 + Math.random() * 3000);
                
            } catch (error) {
                console.error(`    ❌ Error scraping ${url}:`, error.message);
                continue;
            }
        }
        
        await browser.close();
        
        console.log(`✅ Instagram scraping complete: ${profiles.length} profiles scraped`);
        
        return profiles;
        
    } catch (error) {
        console.error('❌ Instagram scraping error:', error.message);
        
        if (browser) {
            await browser.close();
        }
        
        return [];
    }
}

/**
 * Extract username from Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string} Username
 */
function extractUsernameFromUrl(url) {
    const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
    return match ? match[1] : '';
}

/**
 * Normalize follower count from display format
 * @param {string} display - Display format (e.g., "65.4K", "1.2M")
 * @returns {number} Normalized count
 */
function normalizeFollowerCount(display) {
    if (!display) return 0;
    
    const str = display.toString().toUpperCase().trim();
    
    // Remove commas
    let cleaned = str.replace(/,/g, '');
    
    // Handle K (thousands)
    if (cleaned.includes('K')) {
        const num = parseFloat(cleaned.replace('K', ''));
        return Math.round(num * 1000);
    }
    
    // Handle M (millions)
    if (cleaned.includes('M')) {
        const num = parseFloat(cleaned.replace('M', ''));
        return Math.round(num * 1000000);
    }
    
    // Handle B (billions)
    if (cleaned.includes('B')) {
        const num = parseFloat(cleaned.replace('B', ''));
        return Math.round(num * 1000000000);
    }
    
    // Plain number
    return parseInt(cleaned) || 0;
}

/**
 * Format follower count for display
 * @param {number} count - Follower count
 * @returns {string} Formatted display
 */
function formatFollowerCount(count) {
    if (count >= 1000000000) {
        return (count / 1000000000).toFixed(1) + 'B';
    }
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

module.exports = {
    scrapeInstagramProfiles,
    normalizeFollowerCount,
    formatFollowerCount,
    extractUsernameFromUrl
};
