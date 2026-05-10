#!/usr/bin/env node

/**
 * Influencer Discovery Runner
 * Standalone script to run the influencer discovery pipeline
 * Called by Python backend
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { discoverRealInfluencers, formatInfluencersForResponse } = require('./realInfluencerDiscovery');

/**
 * Main function
 */
async function main() {
    try {
        // Read input from stdin
        let inputData = '';
        
        process.stdin.on('data', (chunk) => {
            inputData += chunk;
        });
        
        process.stdin.on('end', async () => {
            try {
                // Parse input
                const input = JSON.parse(inputData);
                const businessContext = input.businessContext;
                const limit = input.limit || 10;
                
                // Validate input
                if (!businessContext || !businessContext.name) {
                    throw new Error('Invalid business context');
                }
                
                // Run discovery pipeline
                const influencers = await discoverRealInfluencers(businessContext, limit);
                
                // Format results
                const formatted = formatInfluencersForResponse(influencers);
                
                // Output JSON
                console.log(JSON.stringify(formatted, null, 2));
                
                process.exit(0);
                
            } catch (error) {
                console.error('❌ Error:', error.message);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run main function
main();
