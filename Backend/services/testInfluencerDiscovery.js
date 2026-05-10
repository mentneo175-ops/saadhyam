/**
 * Test script for influencer discovery pipeline
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { discoverRealInfluencers, formatInfluencersForResponse } = require('./realInfluencerDiscovery');

async function test() {
    try {
        console.log('🧪 Testing influencer discovery pipeline...\n');
        
        // Test business context
        const businessContext = {
            name: 'Test Restaurant',
            category: 'food',
            subcategory: 'Korean Food',
            location: 'Hyderabad, India',
            targetAudience: 'Food lovers, young professionals',
            description: 'Korean restaurant specializing in authentic Korean cuisine'
        };
        
        console.log('Business Context:', businessContext);
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Run discovery
        const influencers = await discoverRealInfluencers(businessContext, 5);
        
        console.log('\n' + '='.repeat(80) + '\n');
        console.log('📊 RESULTS:\n');
        
        if (influencers.length === 0) {
            console.log('⚠️ No influencers found');
        } else {
            influencers.forEach((inf, index) => {
                console.log(`${index + 1}. @${inf.username}`);
                console.log(`   Name: ${inf.full_name}`);
                console.log(`   Followers: ${inf.followers_display || inf.followers_count}`);
                console.log(`   Match Score: ${inf.match_score}/100`);
                console.log(`   Bio: ${(inf.bio || '').substring(0, 100)}...`);
                console.log('');
            });
        }
        
        console.log('✅ Test complete!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

test();
