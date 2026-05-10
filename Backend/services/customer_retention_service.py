"""
Customer Retention Service
AI-powered customer behavior analysis and churn prediction
"""

import os
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta
from groq import Groq
import json

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class CustomerRetentionService:
    """
    Analyze customer data to identify retention opportunities
    """

    @staticmethod
    def analyze_csv(file_path: str) -> Dict[str, Any]:
        """
        Analyze customer CSV and generate retention insights
        """
        try:
            # Read CSV
            df = pd.read_csv(file_path)
            
            # Validate required columns
            required_columns = [
                "customer_name", "email", "last_purchase_date",
                "total_spent", "visit_count", "inactive_days"
            ]
            
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
            
            # Clean data
            df = CustomerRetentionService._clean_data(df)
            
            # Segment customers
            segments = CustomerRetentionService._segment_customers(df)
            
            # Calculate metrics
            metrics = CustomerRetentionService._calculate_metrics(df, segments)
            
            # Generate AI recommendations
            recommendations = CustomerRetentionService._generate_ai_recommendations(
                df, segments, metrics
            )
            
            # Generate insights
            insights = CustomerRetentionService._generate_insights(df, segments, metrics)
            
            return {
                "success": True,
                "retention_score": metrics["retention_score"],
                "total_customers": metrics["total_customers"],
                "loyal_customers": metrics["loyal_customers"],
                "inactive_customers": metrics["inactive_customers"],
                "churn_risk_customers": metrics["churn_risk_customers"],
                "high_value_customers": metrics["high_value_customers"],
                "churn_risk_percentage": metrics["churn_risk_percentage"],
                "segments": {
                    "loyal": segments["loyal"],
                    "inactive": segments["inactive"],
                    "churn_risk": segments["churn_risk"],
                    "high_value": segments["high_value"]
                },
                "recommendations": recommendations,
                "insights": insights
            }
            
        except Exception as e:
            print(f"❌ Error analyzing customer data: {str(e)}")
            raise

    @staticmethod
    def _clean_data(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare customer data"""
        # Remove duplicates
        df = df.drop_duplicates(subset=["email"])
        
        # Convert date column
        df["last_purchase_date"] = pd.to_datetime(df["last_purchase_date"])
        
        # Ensure numeric columns
        df["total_spent"] = pd.to_numeric(df["total_spent"], errors="coerce")
        df["visit_count"] = pd.to_numeric(df["visit_count"], errors="coerce")
        df["inactive_days"] = pd.to_numeric(df["inactive_days"], errors="coerce")
        
        # Remove rows with missing critical data
        df = df.dropna(subset=["customer_name", "email", "total_spent"])
        
        return df

    @staticmethod
    def _segment_customers(df: pd.DataFrame) -> Dict[str, List[Dict[str, Any]]]:
        """Segment customers into categories"""
        segments = {
            "loyal": [],
            "inactive": [],
            "churn_risk": [],
            "high_value": []
        }
        
        for _, row in df.iterrows():
            customer = {
                "name": row["customer_name"],
                "email": row["email"],
                "phone": row.get("phone", ""),
                "last_purchase_date": row["last_purchase_date"].strftime("%Y-%m-%d"),
                "total_spent": float(row["total_spent"]),
                "visit_count": int(row["visit_count"]),
                "inactive_days": int(row["inactive_days"]),
                "segment": ""
            }
            
            # Loyal customers: high visits, low inactive days
            if row["visit_count"] >= 10 and row["inactive_days"] < 30:
                customer["segment"] = "loyal"
                segments["loyal"].append(customer)
            
            # Inactive customers: high inactive days
            elif row["inactive_days"] >= 90:
                customer["segment"] = "inactive"
                segments["inactive"].append(customer)
            
            # Churn risk: moderate inactive days, declining engagement
            elif 30 <= row["inactive_days"] < 90:
                customer["segment"] = "churn_risk"
                customer["risk_score"] = min(100, int((row["inactive_days"] / 90) * 100))
                segments["churn_risk"].append(customer)
            
            # High value: high spending
            if row["total_spent"] >= df["total_spent"].quantile(0.75):
                customer["segment"] = "high_value"
                if customer not in segments["high_value"]:
                    segments["high_value"].append(customer)
        
        return segments

    @staticmethod
    def _calculate_metrics(df: pd.DataFrame, segments: Dict[str, List]) -> Dict[str, Any]:
        """Calculate retention metrics"""
        total_customers = len(df)
        loyal_customers = len(segments["loyal"])
        inactive_customers = len(segments["inactive"])
        churn_risk_customers = len(segments["churn_risk"])
        high_value_customers = len(segments["high_value"])
        
        # Calculate retention score (0-100)
        retention_score = 0
        if total_customers > 0:
            loyal_ratio = loyal_customers / total_customers
            churn_ratio = churn_risk_customers / total_customers
            inactive_ratio = inactive_customers / total_customers
            
            retention_score = int(
                (loyal_ratio * 50) +
                ((1 - churn_ratio) * 30) +
                ((1 - inactive_ratio) * 20)
            )
        
        churn_risk_percentage = round(
            (churn_risk_customers / total_customers * 100) if total_customers > 0 else 0,
            1
        )
        
        return {
            "retention_score": retention_score,
            "total_customers": total_customers,
            "loyal_customers": loyal_customers,
            "inactive_customers": inactive_customers,
            "churn_risk_customers": churn_risk_customers,
            "high_value_customers": high_value_customers,
            "churn_risk_percentage": churn_risk_percentage
        }

    @staticmethod
    def _generate_ai_recommendations(
        df: pd.DataFrame,
        segments: Dict[str, List],
        metrics: Dict[str, Any]
    ) -> List[str]:
        """Generate AI-powered retention recommendations using Groq"""
        try:
            # Prepare data summary for Groq
            summary = {
                "total_customers": metrics["total_customers"],
                "retention_score": metrics["retention_score"],
                "loyal_customers": metrics["loyal_customers"],
                "inactive_customers": metrics["inactive_customers"],
                "churn_risk_customers": metrics["churn_risk_customers"],
                "churn_risk_percentage": metrics["churn_risk_percentage"],
                "avg_spent": float(df["total_spent"].mean()),
                "avg_visits": float(df["visit_count"].mean()),
                "avg_inactive_days": float(df["inactive_days"].mean())
            }
            
            prompt = f"""
You are a customer retention expert. Analyze this customer data and provide 5 specific, actionable retention strategies.

CUSTOMER DATA SUMMARY:
{json.dumps(summary, indent=2)}

Provide 5 retention recommendations that are:
1. Specific and actionable
2. Focused on reducing churn
3. Aimed at re-engaging inactive customers
4. Designed to reward loyal customers
5. Data-driven based on the metrics above

Return ONLY a JSON array of 5 recommendation strings:
["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"]

IMPORTANT: Return ONLY the JSON array, no other text.
"""

            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a customer retention expert. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse response
            groq_response = response.choices[0].message.content.strip()
            
            # Extract JSON
            if "```json" in groq_response:
                groq_response = groq_response.split("```json")[1].split("```")[0].strip()
            elif "```" in groq_response:
                groq_response = groq_response.split("```")[1].split("```")[0].strip()
            
            recommendations = json.loads(groq_response)
            return recommendations
            
        except Exception as e:
            print(f"❌ AI recommendation error: {str(e)}")
            # Fallback recommendations
            return CustomerRetentionService._fallback_recommendations(metrics)

    @staticmethod
    def _fallback_recommendations(metrics: Dict[str, Any]) -> List[str]:
        """Fallback recommendations if AI fails"""
        recommendations = []
        
        if metrics["churn_risk_percentage"] > 20:
            recommendations.append(
                f"🎯 Launch a win-back campaign for {metrics['churn_risk_customers']} at-risk customers with exclusive 20% discount offers"
            )
        
        if metrics["inactive_customers"] > 0:
            recommendations.append(
                f"📧 Create a re-engagement email series for {metrics['inactive_customers']} inactive customers highlighting new products/services"
            )
        
        if metrics["loyal_customers"] > 0:
            recommendations.append(
                f"💎 Implement a VIP loyalty program for {metrics['loyal_customers']} loyal customers with early access and special perks"
            )
        
        recommendations.append(
            "🎁 Offer personalized incentives based on past purchase behavior to encourage repeat visits"
        )
        
        recommendations.append(
            "📊 Set up automated alerts to identify customers showing early churn signals (30+ days inactive)"
        )
        
        return recommendations[:5]

    @staticmethod
    def _generate_insights(
        df: pd.DataFrame,
        segments: Dict[str, List],
        metrics: Dict[str, Any]
    ) -> List[str]:
        """Generate key insights from customer data"""
        insights = []
        
        # Average spending insight
        avg_spent = df["total_spent"].mean()
        insights.append(
            f"Average customer lifetime value is ₹{avg_spent:,.0f}"
        )
        
        # Visit frequency insight
        avg_visits = df["visit_count"].mean()
        insights.append(
            f"Customers visit an average of {avg_visits:.1f} times"
        )
        
        # Inactive days insight
        avg_inactive = df["inactive_days"].mean()
        insights.append(
            f"Average customer inactivity period is {avg_inactive:.0f} days"
        )
        
        # Loyal customer value
        if segments["loyal"]:
            loyal_avg_spent = sum(c["total_spent"] for c in segments["loyal"]) / len(segments["loyal"])
            insights.append(
                f"Loyal customers spend {(loyal_avg_spent / avg_spent):.1f}x more than average"
            )
        
        # Churn risk insight
        if metrics["churn_risk_percentage"] > 15:
            insights.append(
                f"⚠️ {metrics['churn_risk_percentage']}% of customers are at risk of churning - immediate action needed"
            )
        else:
            insights.append(
                f"✅ Churn risk is manageable at {metrics['churn_risk_percentage']}%"
            )
        
        # High value customers
        if segments["high_value"]:
            high_value_pct = (len(segments["high_value"]) / metrics["total_customers"]) * 100
            insights.append(
                f"Top {high_value_pct:.0f}% of customers generate significant revenue - focus retention efforts here"
            )
        
        return insights[:6]
