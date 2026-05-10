/**
 * Google Search Scraper Service
 * Searches Google for Instagram profiles using Playwright
 */

const { chromium } = require('playwright');
const UserAgent = require('user-agents');

/**
 * Search Google for Instagram profiles
 * @param {Array<string>} keywords - Search keywords
 * @param {number} maxResults - Maximum results per keyword
 * @returns {Promise<Array<string>>} Array of Instagram profile URLs
 */
async function searchGoogleForInstagramProfiles(keywords, maxResults = 5) {
    let browser = null;
    const allProfileUrls = new Set();
    
    try {
        console.log(`🔍 Starting Google search for ${keywords.length} keywords...`);
        
        // Launch browser in headless mode
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
        
        // Process each keyword
        for (const keyword of keywords) {
            try {
                // Build Google search query
                const searchQuery = `site:instagram.com "${keyword}"`;
                const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=10`;
                
                console.log(`  🔎 Searching: ${keyword}`);
                
                // Navigate to Google search
                await page.goto(googleUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 15000 
                });
                
                // Random delay to avoid detection
                await page.waitForTimeout(1000 + Math.random() * 2000);
                
                // Extract Instagram profile URLs from search results
                const profileUrls = await page.evaluate(() => {
                    const urls = [];
                    const links = document.querySelectorAll('a[href*="instagram.com"]');
                    
                    links.forEach(link => {
                        const href = link.href;
                        
                        // Extract username from URL
                        const match = href.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
                        
                        if (match && match[1]) {
                            const username = match[1];
                            
                            // Filter out non-profile URLs
                            const excludePatterns = [
                                'reel', 'p/', 'tv/', 'explore', 'stories',
                                'accounts', 'login', 'signup', 'about',
                                'privacy', 'terms', 'help', 'press'
                            ];
                            
                            const isExcluded = excludePatterns.some(pattern => 
                                href.includes(`/${pattern}`) || username === pattern
                            );
                            
                            if (!isExcluded && username.length > 0) {
                                urls.push(`https://www.instagram.com/${username}/`);
                            }
                        }
                    });
                    
                    return urls;
                });
                
                // Add to results (Set automatically deduplicates)
                profileUrls.forEach(url => allProfileUrls.add(url));
                
                console.log(`    ✅ Found ${profileUrls.length} profiles for "${keyword}"`);
                
                // Rate limiting between searches
                await page.waitForTimeout(2000 + Math.random() * 3000);
                
            } catch (error) {
                console.error(`    ❌ Error searching "${keyword}":`, error.message);
                continue;
            }
        }
        
        await browser.close();
        
        const uniqueUrls = Array.from(allProfileUrls).slice(0, maxResults * keywords.length);
        console.log(`✅ Google search complete: ${uniqueUrls.length} unique Instagram profiles found`);
        
        return uniqueUrls;
        
    } catch (error) {
        console.error('❌ Google search error:', error.message);
        
        if (browser) {
            await browser.close();
        }
        
        return [];
    }
}

/**
 * Normalize Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string} Normalized URL
 */
function normalizeInstagramUrl(url) {
    try {
        const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
        if (match && match[1]) {
            return `https://www.instagram.com/${match[1]}/`;
        }
        return url;
    } catch (error) {
        return url;
    }
}

/**
 * Extract username from Instagram URL
 * @param {string} url - Instagram URL
 * @returns {string|null} Username or null
 */
function extractUsername(url) {
    try {
        const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
        return match ? match[1] : null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    searchGoogleForInstagramProfiles,
    normalizeInstagramUrl,
    extractUsername
};
