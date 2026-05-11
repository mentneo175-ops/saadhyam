"""
Instagram AI Analysis Service
AI-powered recommendations, predictions, and insights generation
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
import statistics
from collections import Counter

logger = logging.getLogger(__name__)


class InstagramAIService:
    """AI service for generating Instagram analytics insights and recommendations"""
    
    def __init__(self):
        self.min_data_points = 5  # Minimum data points for reliable predictions
    
    # ======================== Content Analysis ========================
    
    def analyze_content_performance(
        self,
        posts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze content performance and identify patterns
        
        Args:
            posts: List of post analytics data
        
        Returns:
            Content performance analysis
        """
        try:
            if not posts:
                return {"success": False, "error": "No posts to analyze"}
            
            logger.info(f"🤖 Analyzing {len(posts)} posts for content performance")
            
            # Calculate engagement metrics
            engagement_rates = []
            likes_list = []
            comments_list = []
            saves_list = []
            
            for post in posts:
                engagement_rate = post.get("engagement_rate", 0)
                if engagement_rate > 0:
                    engagement_rates.append(engagement_rate)
                
                likes_list.append(post.get("like_count", 0))
                comments_list.append(post.get("comment_count", 0))
                saves_list.append(post.get("save_count", 0))
            
            # Calculate statistics
            avg_engagement = statistics.mean(engagement_rates) if engagement_rates else 0
            avg_likes = statistics.mean(likes_list) if likes_list else 0
            avg_comments = statistics.mean(comments_list) if comments_list else 0
            avg_saves = statistics.mean(saves_list) if saves_list else 0
            
            # Identify top performers
            top_posts = sorted(posts, key=lambda x: x.get("engagement_rate", 0), reverse=True)[:5]
            
            # Identify viral posts (engagement > 2x average)
            viral_threshold = avg_engagement * 2
            viral_posts = [p for p in posts if p.get("engagement_rate", 0) > viral_threshold]
            
            # Analyze media types
            media_types = [p.get("media_type", "IMAGE") for p in posts]
            media_type_counts = Counter(media_types)
            
            analysis = {
                "success": True,
                "total_posts": len(posts),
                "avg_engagement_rate": round(avg_engagement, 2),
                "avg_likes": round(avg_likes, 2),
                "avg_comments": round(avg_comments, 2),
                "avg_saves": round(avg_saves, 2),
                "top_posts": [
                    {
                        "media_id": p.get("media_id"),
                        "engagement_rate": p.get("engagement_rate"),
                        "likes": p.get("like_count"),
                        "comments": p.get("comment_count")
                    }
                    for p in top_posts
                ],
                "viral_posts_count": len(viral_posts),
                "media_type_distribution": dict(media_type_counts),
                "best_performing_type": media_type_counts.most_common(1)[0][0] if media_type_counts else "IMAGE"
            }
            
            logger.info(f"✅ Content analysis complete: avg engagement {avg_engagement:.2f}%")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error analyzing content performance: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Growth Analysis ========================
    
    def analyze_growth_trends(
        self,
        snapshots: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze follower growth trends
        
        Args:
            snapshots: List of analytics snapshots over time
        
        Returns:
            Growth trend analysis
        """
        try:
            if len(snapshots) < 2:
                return {"success": False, "error": "Insufficient data for trend analysis"}
            
            logger.info(f"📈 Analyzing growth trends from {len(snapshots)} snapshots")
            
            # Sort by date
            sorted_snapshots = sorted(snapshots, key=lambda x: x.get("snapshot_date", datetime.now()))
            
            # Calculate growth metrics
            first_snapshot = sorted_snapshots[0]
            last_snapshot = sorted_snapshots[-1]
            
            initial_followers = first_snapshot.get("followers_count", 0)
            current_followers = last_snapshot.get("followers_count", 0)
            
            total_growth = current_followers - initial_followers
            growth_rate = (total_growth / initial_followers * 100) if initial_followers > 0 else 0
            
            # Calculate daily growth rates
            daily_growth_rates = []
            for i in range(1, len(sorted_snapshots)):
                prev = sorted_snapshots[i-1]
                curr = sorted_snapshots[i]
                
                prev_followers = prev.get("followers_count", 0)
                curr_followers = curr.get("followers_count", 0)
                
                if prev_followers > 0:
                    daily_rate = ((curr_followers - prev_followers) / prev_followers) * 100
                    daily_growth_rates.append(daily_rate)
            
            avg_daily_growth = statistics.mean(daily_growth_rates) if daily_growth_rates else 0
            
            # Detect growth spikes
            if daily_growth_rates:
                growth_threshold = avg_daily_growth * 2
                spike_days = [rate for rate in daily_growth_rates if rate > growth_threshold]
            else:
                spike_days = []
            
            # Trend direction
            if avg_daily_growth > 0.5:
                trend = "strong_growth"
            elif avg_daily_growth > 0:
                trend = "steady_growth"
            elif avg_daily_growth < -0.5:
                trend = "declining"
            else:
                trend = "stable"
            
            analysis = {
                "success": True,
                "initial_followers": initial_followers,
                "current_followers": current_followers,
                "total_growth": total_growth,
                "growth_rate": round(growth_rate, 2),
                "avg_daily_growth_rate": round(avg_daily_growth, 2),
                "trend": trend,
                "spike_days_count": len(spike_days),
                "days_analyzed": len(sorted_snapshots)
            }
            
            logger.info(f"✅ Growth analysis complete: {trend}, {total_growth:+d} followers")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error analyzing growth trends: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Audience Analysis ========================
    
    def analyze_audience_behavior(
        self,
        audience_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze audience demographics and behavior patterns
        
        Args:
            audience_data: Audience insights data
        
        Returns:
            Audience behavior analysis
        """
        try:
            logger.info("👥 Analyzing audience behavior")
            
            # Parse age/gender breakdown
            age_gender = audience_data.get("audience_gender_age", {})
            top_cities = audience_data.get("audience_city", {})
            top_countries = audience_data.get("audience_country", {})
            online_followers = audience_data.get("online_followers", {})
            
            # Identify primary demographics
            if age_gender:
                sorted_demographics = sorted(age_gender.items(), key=lambda x: x[1], reverse=True)
                primary_demographic = sorted_demographics[0][0] if sorted_demographics else "Unknown"
            else:
                primary_demographic = "Unknown"
            
            # Identify peak activity times
            if online_followers:
                sorted_hours = sorted(online_followers.items(), key=lambda x: x[1], reverse=True)
                peak_hours = [int(hour) for hour, _ in sorted_hours[:3]]
            else:
                peak_hours = []
            
            # Identify top locations
            if top_cities:
                sorted_cities = sorted(top_cities.items(), key=lambda x: x[1], reverse=True)
                top_3_cities = [city for city, _ in sorted_cities[:3]]
            else:
                top_3_cities = []
            
            if top_countries:
                sorted_countries = sorted(top_countries.items(), key=lambda x: x[1], reverse=True)
                top_3_countries = [country for country, _ in sorted_countries[:3]]
            else:
                top_3_countries = []
            
            analysis = {
                "success": True,
                "primary_demographic": primary_demographic,
                "peak_activity_hours": peak_hours,
                "top_cities": top_3_cities,
                "top_countries": top_3_countries,
                "has_sufficient_data": bool(age_gender and online_followers)
            }
            
            logger.info(f"✅ Audience analysis complete: primary demo {primary_demographic}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error analyzing audience behavior: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Recommendations Generation ========================
    
    def generate_recommendations(
        self,
        content_analysis: Dict[str, Any],
        growth_analysis: Dict[str, Any],
        audience_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered recommendations based on analytics
        
        Args:
            content_analysis: Content performance analysis
            growth_analysis: Growth trend analysis
            audience_analysis: Audience behavior analysis
        
        Returns:
            List of recommendations
        """
        try:
            logger.info("🤖 Generating AI recommendations")
            
            recommendations = []
            
            # Posting time recommendations
            if audience_analysis.get("peak_activity_hours"):
                peak_hours = audience_analysis["peak_activity_hours"]
                recommendations.append({
                    "title": "Optimize Posting Times",
                    "recommendation": f"Your audience is most active at {', '.join([f'{h}:00' for h in peak_hours])}. Schedule posts during these hours for maximum engagement.",
                    "category": "posting_time",
                    "priority": "high",
                    "confidence_score": 0.85,
                    "data_points": {"peak_hours": peak_hours}
                })
            
            # Content type recommendations
            if content_analysis.get("best_performing_type"):
                best_type = content_analysis["best_performing_type"]
                avg_engagement = content_analysis.get("avg_engagement_rate", 0)
                
                if best_type == "VIDEO" or best_type == "REELS":
                    recommendations.append({
                        "title": "Increase Video Content",
                        "recommendation": f"Your {best_type} content performs best with {avg_engagement:.1f}% average engagement. Consider posting more video content to boost engagement.",
                        "category": "content",
                        "priority": "high",
                        "confidence_score": 0.80,
                        "data_points": {"best_type": best_type, "avg_engagement": avg_engagement}
                    })
            
            # Engagement recommendations
            avg_engagement = content_analysis.get("avg_engagement_rate", 0)
            if avg_engagement < 2.0:
                recommendations.append({
                    "title": "Boost Engagement Rate",
                    "recommendation": f"Your current engagement rate is {avg_engagement:.1f}%. Try using more interactive content like polls, questions, and calls-to-action to increase engagement.",
                    "category": "engagement",
                    "priority": "medium",
                    "confidence_score": 0.75,
                    "data_points": {"current_engagement": avg_engagement, "target": 3.0}
                })
            
            # Growth recommendations
            if growth_analysis.get("trend") == "declining":
                recommendations.append({
                    "title": "Address Follower Decline",
                    "recommendation": "Your follower growth is declining. Focus on creating more engaging content, using trending hashtags, and posting consistently to reverse this trend.",
                    "category": "growth",
                    "priority": "critical",
                    "confidence_score": 0.90,
                    "data_points": {"trend": "declining", "growth_rate": growth_analysis.get("growth_rate", 0)}
                })
            elif growth_analysis.get("trend") == "stable":
                recommendations.append({
                    "title": "Accelerate Growth",
                    "recommendation": "Your follower count is stable. Try collaborating with other accounts, running contests, or creating viral-worthy content to accelerate growth.",
                    "category": "growth",
                    "priority": "medium",
                    "confidence_score": 0.70,
                    "data_points": {"trend": "stable"}
                })
            
            # Consistency recommendations
            total_posts = content_analysis.get("total_posts", 0)
            if total_posts < 10:
                recommendations.append({
                    "title": "Increase Posting Frequency",
                    "recommendation": f"You've posted {total_posts} times recently. Aim for at least 3-4 posts per week to maintain audience engagement and algorithm visibility.",
                    "category": "consistency",
                    "priority": "high",
                    "confidence_score": 0.85,
                    "data_points": {"current_posts": total_posts, "recommended": 12}
                })
            
            # Viral content recommendations
            viral_count = content_analysis.get("viral_posts_count", 0)
            if viral_count > 0:
                recommendations.append({
                    "title": "Replicate Viral Success",
                    "recommendation": f"You have {viral_count} viral posts! Analyze what made them successful (timing, content type, caption style) and create similar content.",
                    "category": "content",
                    "priority": "high",
                    "confidence_score": 0.88,
                    "data_points": {"viral_count": viral_count}
                })
            
            logger.info(f"✅ Generated {len(recommendations)} recommendations")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ Error generating recommendations: {e}")
            return []
    
    # ======================== Growth Predictions ========================
    
    def predict_growth(
        self,
        snapshots: List[Dict[str, Any]],
        prediction_period: str = "month"
    ) -> Dict[str, Any]:
        """
        Predict future follower growth using trend analysis
        
        Args:
            snapshots: Historical analytics snapshots
            prediction_period: Period to predict (week, month, quarter)
        
        Returns:
            Growth prediction
        """
        try:
            if len(snapshots) < self.min_data_points:
                return {
                    "success": False,
                    "error": f"Need at least {self.min_data_points} data points for prediction"
                }
            
            logger.info(f"🔮 Predicting {prediction_period} growth from {len(snapshots)} snapshots")
            
            # Sort by date
            sorted_snapshots = sorted(snapshots, key=lambda x: x.get("snapshot_date", datetime.now()))
            
            # Calculate average daily growth
            daily_growth_values = []
            for i in range(1, len(sorted_snapshots)):
                prev = sorted_snapshots[i-1]
                curr = sorted_snapshots[i]
                
                growth = curr.get("followers_count", 0) - prev.get("followers_count", 0)
                daily_growth_values.append(growth)
            
            avg_daily_growth = statistics.mean(daily_growth_values) if daily_growth_values else 0
            
            # Determine prediction days
            period_days = {
                "week": 7,
                "month": 30,
                "quarter": 90
            }
            days = period_days.get(prediction_period, 30)
            
            # Calculate prediction
            current_followers = sorted_snapshots[-1].get("followers_count", 0)
            predicted_growth = int(avg_daily_growth * days)
            predicted_followers = current_followers + predicted_growth
            
            # Calculate confidence based on data consistency
            if daily_growth_values:
                std_dev = statistics.stdev(daily_growth_values) if len(daily_growth_values) > 1 else 0
                # Lower std dev = higher confidence
                confidence = max(0.5, min(0.95, 1 - (std_dev / (abs(avg_daily_growth) + 1))))
            else:
                confidence = 0.5
            
            # Calculate growth rate
            growth_rate = (predicted_growth / current_followers * 100) if current_followers > 0 else 0
            
            prediction = {
                "success": True,
                "prediction_period": prediction_period,
                "prediction_days": days,
                "current_followers": current_followers,
                "predicted_followers": predicted_followers,
                "predicted_growth": predicted_growth,
                "predicted_growth_rate": round(growth_rate, 2),
                "confidence_score": round(confidence, 2),
                "avg_daily_growth": round(avg_daily_growth, 2),
                "data_points_used": len(snapshots)
            }
            
            logger.info(f"✅ Growth prediction: {predicted_followers} followers ({predicted_growth:+d})")
            
            return prediction
            
        except Exception as e:
            logger.error(f"❌ Error predicting growth: {e}")
            return {"success": False, "error": str(e)}
    
    # ======================== Engagement Scoring ========================
    
    def calculate_engagement_score(
        self,
        likes: int,
        comments: int,
        shares: int,
        saves: int,
        reach: int
    ) -> float:
        """
        Calculate AI-powered engagement quality score
        
        Args:
            likes: Number of likes
            comments: Number of comments
            shares: Number of shares
            saves: Number of saves
            reach: Post reach
        
        Returns:
            Engagement score (0-100)
        """
        try:
            if reach == 0:
                return 0.0
            
            # Weighted engagement calculation
            # Comments and saves are more valuable than likes
            weighted_engagement = (
                likes * 1.0 +
                comments * 3.0 +
                shares * 2.5 +
                saves * 4.0
            )
            
            # Calculate engagement rate
            engagement_rate = (weighted_engagement / reach) * 100
            
            # Normalize to 0-100 scale
            # Typical good engagement is 3-5%, excellent is 10%+
            score = min(100, engagement_rate * 10)
            
            return round(score, 2)
            
        except Exception as e:
            logger.error(f"❌ Error calculating engagement score: {e}")
            return 0.0
    
    # ======================== Trend Detection ========================
    
    def detect_trends(
        self,
        posts: List[Dict[str, Any]],
        snapshots: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Detect trends and anomalies in analytics data
        
        Args:
            posts: List of post analytics
            snapshots: List of analytics snapshots
        
        Returns:
            Detected trends and anomalies
        """
        try:
            logger.info("🔍 Detecting trends and anomalies")
            
            trends = {
                "success": True,
                "viral_posts": [],
                "engagement_spikes": [],
                "growth_spikes": [],
                "declining_engagement": False,
                "best_posting_days": [],
                "trending_content_types": []
            }
            
            # Detect viral posts
            if posts:
                engagement_rates = [p.get("engagement_rate", 0) for p in posts if p.get("engagement_rate", 0) > 0]
                if engagement_rates:
                    avg_engagement = statistics.mean(engagement_rates)
                    viral_threshold = avg_engagement * 2
                    
                    viral_posts = [
                        {
                            "media_id": p.get("media_id"),
                            "engagement_rate": p.get("engagement_rate"),
                            "published_at": p.get("published_at")
                        }
                        for p in posts
                        if p.get("engagement_rate", 0) > viral_threshold
                    ]
                    trends["viral_posts"] = viral_posts
            
            # Detect growth spikes
            if len(snapshots) >= 2:
                sorted_snapshots = sorted(snapshots, key=lambda x: x.get("snapshot_date", datetime.now()))
                
                growth_rates = []
                for i in range(1, len(sorted_snapshots)):
                    prev = sorted_snapshots[i-1]
                    curr = sorted_snapshots[i]
                    
                    prev_followers = prev.get("followers_count", 0)
                    curr_followers = curr.get("followers_count", 0)
                    
                    if prev_followers > 0:
                        growth_rate = ((curr_followers - prev_followers) / prev_followers) * 100
                        growth_rates.append({
                            "date": curr.get("snapshot_date"),
                            "growth_rate": growth_rate,
                            "followers_gained": curr_followers - prev_followers
                        })
                
                if growth_rates:
                    avg_growth = statistics.mean([g["growth_rate"] for g in growth_rates])
                    spike_threshold = avg_growth * 2
                    
                    growth_spikes = [g for g in growth_rates if g["growth_rate"] > spike_threshold]
                    trends["growth_spikes"] = growth_spikes
            
            logger.info(f"✅ Trend detection complete: {len(trends['viral_posts'])} viral posts found")
            
            return trends
            
        except Exception as e:
            logger.error(f"❌ Error detecting trends: {e}")
            return {"success": False, "error": str(e)}


# Create singleton instance
instagram_ai_service = InstagramAIService()
