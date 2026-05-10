/**
 * Engagement Estimator Service
 * Estimates engagement rates based on follower count and other factors
 */

/**
 * Estimate engagement rate based on follower count
 * @param {number} followers - Follower count
 * @returns {number} Estimated engagement rate (percentage)
 */
function estimateEngagementRate(followers) {
    // Industry standard: Engagement rate decreases as follower count increases
    
    if (followers < 1000) {
        return 8.0; // Nano influencers: 8%
    } else if (followers < 10000) {
        return 5.5; // Micro influencers: 5.5%
    } else if (followers < 50000) {
        return 4.0; // Mid-tier influencers: 4%
    } else if (followers < 100000) {
        return 3.0; // Macro influencers: 3%
    } else if (followers < 500000) {
        return 2.0; // Large influencers: 2%
    } else if (followers < 1000000) {
        return 1.5; // Major influencers: 1.5%
    } else {
        return 1.0; // Mega influencers: 1%
    }
}

/**
 * Calculate engagement score (0-100)
 * @param {number} engagementRate - Engagement rate percentage
 * @param {number} followers - Follower count
 * @returns {number} Engagement score
 */
function calculateEngagementScore(engagementRate, followers) {
    let score = 0;
    
    // Factor 1: Engagement rate (60 points)
    if (engagementRate >= 8) {
        score += 60;
    } else if (engagementRate >= 5) {
        score += 50;
    } else if (engagementRate >= 3) {
        score += 40;
    } else if (engagementRate >= 2) {
        score += 30;
    } else if (engagementRate >= 1) {
        score += 20;
    } else {
        score += 10;
    }
    
    // Factor 2: Follower count sweet spot (40 points)
    if (followers >= 50000 && followers <= 500000) {
        score += 40; // Sweet spot for engagement
    } else if (followers >= 10000 && followers < 50000) {
        score += 35; // Micro influencers
    } else if (followers >= 500000 && followers <= 1000000) {
        score += 30; // Large following
    } else if (followers > 1000000) {
        score += 25; // Mega influencers
    } else {
        score += 15; // Small following
    }
    
    return Math.min(100, score);
}

/**
 * Estimate average views per post
 * @param {number} followers - Follower count
 * @param {number} engagementRate - Engagement rate percentage
 * @returns {number} Estimated views
 */
function estimateAverageViews(followers, engagementRate) {
    // Views are typically 20-30% of followers for active accounts
    const viewRate = 0.25; // 25% average
    const baseViews = followers * viewRate;
    
    // Adjust based on engagement rate
    const engagementMultiplier = engagementRate / 3.0; // Normalize around 3% baseline
    
    return Math.round(baseViews * engagementMultiplier);
}

/**
 * Estimate posting frequency
 * @param {number} posts - Total posts count
 * @returns {string} Posting frequency description
 */
function estimatePostingFrequency(posts) {
    if (posts > 1000) {
        return 'Very Active (5-7 posts/week)';
    } else if (posts > 500) {
        return 'Active (3-5 posts/week)';
    } else if (posts > 200) {
        return 'Regular (2-3 posts/week)';
    } else if (posts > 50) {
        return 'Moderate (1-2 posts/week)';
    } else {
        return 'Occasional (< 1 post/week)';
    }
}

/**
 * Add engagement metrics to profile
 * @param {Object} profile - Instagram profile data
 * @returns {Object} Profile with engagement metrics
 */
function addEngagementMetrics(profile) {
    const followers = profile.followers_count || 0;
    const posts = profile.posts || 0;
    
    // Estimate engagement rate if not provided
    let engagementRate = profile.engagement_rate;
    if (!engagementRate || engagementRate === 0) {
        engagementRate = estimateEngagementRate(followers);
    }
    
    // Calculate engagement score
    const engagementScore = calculateEngagementScore(engagementRate, followers);
    
    // Estimate average views
    const avgViews = estimateAverageViews(followers, engagementRate);
    
    // Estimate posting frequency
    const postingFrequency = estimatePostingFrequency(posts);
    
    return {
        ...profile,
        engagement_rate: engagementRate,
        engagement_score: engagementScore,
        avg_views: avgViews,
        posting_frequency: postingFrequency
    };
}

/**
 * Add engagement metrics to multiple profiles
 * @param {Array<Object>} profiles - Array of Instagram profiles
 * @returns {Array<Object>} Profiles with engagement metrics
 */
function addEngagementMetricsToProfiles(profiles) {
    return profiles.map(profile => addEngagementMetrics(profile));
}

module.exports = {
    estimateEngagementRate,
    calculateEngagementScore,
    estimateAverageViews,
    estimatePostingFrequency,
    addEngagementMetrics,
    addEngagementMetricsToProfiles
};
