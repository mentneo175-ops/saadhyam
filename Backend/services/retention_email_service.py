"""
Retention Email Service
AI-powered personalized retention emails using Gemini and Resend
Enhanced with bulk campaigns, smart offers, and analytics
"""

import os
import sys
import json
import httpx
from typing import Dict, Any, List
from datetime import datetime
import google.generativeai as genai
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import settings
from config.database import SyncSessionLocal


class RetentionEmailService:
    """
    Generate and send personalized retention emails to inactive customers
    Enhanced with bulk campaigns and smart AI offers
    """

    def __init__(self):
        """Initialize Gemini API"""
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.resend_api_key = settings.RESEND_API_KEY
        
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        
        if not self.resend_api_key:
            raise ValueError("RESEND_API_KEY not configured")
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    def segment_customers(self, customers: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Segment customers based on behavior
        
        Returns:
            Dict with segments: high_value, loyal, at_risk, new
        """
        segments = {
            "high_value": [],
            "loyal": [],
            "at_risk": [],
            "new": []
        }
        
        for customer in customers:
            # High value: spent > 5000
            if customer.get("total_spent", 0) > 5000:
                segments["high_value"].append(customer)
            
            # Loyal: visit_count > 10
            if customer.get("visit_count", 0) > 10:
                segments["loyal"].append(customer)
            
            # At risk: inactive_days > 90
            if customer.get("inactive_days", 0) > 90:
                segments["at_risk"].append(customer)
            
            # New: visit_count < 3
            if customer.get("visit_count", 0) < 3:
                segments["new"].append(customer)
        
        return segments

    async def generate_smart_offer(
        self,
        customer_name: str,
        inactive_days: int,
        visit_count: int,
        total_spent: float
    ) -> Dict[str, str]:
        """
        Generate smart AI offer based on customer behavior
        
        Returns:
            Dict with offer_type, offer_value, tone
        """
        try:
            # Determine customer segment
            segment = "standard"
            if total_spent > 5000:
                segment = "high_value"
            elif visit_count > 10:
                segment = "loyal"
            elif inactive_days > 90:
                segment = "at_risk"
            elif visit_count < 3:
                segment = "new"
            
            prompt = f"""
You are a retention marketing expert. Generate a smart, personalized offer for this customer.

CUSTOMER DATA:
- Name: {customer_name}
- Inactive for: {inactive_days} days
- Previous visits: {visit_count}
- Total spent: ₹{total_spent:,.0f}
- Segment: {segment}

REQUIREMENTS:
Generate an offer that matches their behavior:
- High value customers (₹5000+): Premium rewards, VIP treatment
- Loyal customers (10+ visits): Loyalty rewards, exclusive access
- At risk customers (90+ days): Urgent comeback offers
- New customers (<3 visits): Welcome back incentives
- Standard: General retention offers

OUTPUT FORMAT (JSON):
{{
  "offer_type": "type of offer (e.g., VIP Discount, Loyalty Reward, Comeback Offer)",
  "offer_value": "specific value (e.g., 25% OFF, ₹500 Credit, Free Shipping)",
  "tone": "email tone (e.g., premium, friendly, urgent, welcoming)",
  "cta": "call to action text (e.g., Claim Your Reward, Shop Now, Welcome Back)"
}}

IMPORTANT: Return ONLY valid JSON, no other text.
"""

            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            offer_data = json.loads(response_text)
            return offer_data
            
        except Exception as e:
            print(f"❌ Smart offer generation error: {str(e)}")
            # Fallback offer
            return self._fallback_offer(total_spent, visit_count, inactive_days)

    def _fallback_offer(self, total_spent: float, visit_count: int, inactive_days: int) -> Dict[str, str]:
        """Fallback offer if AI fails"""
        if total_spent > 5000:
            return {
                "offer_type": "VIP Exclusive Discount",
                "offer_value": "25% OFF",
                "tone": "premium",
                "cta": "Claim Your VIP Reward"
            }
        elif visit_count > 10:
            return {
                "offer_type": "Loyalty Reward",
                "offer_value": "20% OFF",
                "tone": "friendly",
                "cta": "Redeem Your Reward"
            }
        elif inactive_days > 90:
            return {
                "offer_type": "Urgent Comeback Offer",
                "offer_value": "15% OFF",
                "tone": "urgent",
                "cta": "Come Back Now"
            }
        else:
            return {
                "offer_type": "Welcome Back Offer",
                "offer_value": "10% OFF",
                "tone": "welcoming",
                "cta": "Shop Now"
            }

    async def send_retention_email(
        self,
        customer_name: str,
        customer_email: str,
        inactive_days: int,
        visit_count: int,
        total_spent: float,
        campaign_type: str = "single"
    ) -> Dict[str, Any]:
        """
        Generate AI email and send to customer
        Enhanced with smart offers and campaign tracking
        """
        try:
            # Validate inputs
            if not customer_email or "@" not in customer_email:
                return {
                    "success": False,
                    "error": "Invalid email address"
                }
            
            if inactive_days < 30:
                return {
                    "success": False,
                    "error": "Customer is not inactive (less than 30 days)"
                }
            
            # Check for duplicate sends (within last 7 days)
            if self._check_duplicate_send(customer_email):
                return {
                    "success": False,
                    "error": "Email already sent to this customer recently"
                }
            
            # Generate smart offer
            print(f"🎯 Generating smart offer for {customer_name}...")
            offer = await self.generate_smart_offer(
                customer_name=customer_name,
                inactive_days=inactive_days,
                visit_count=visit_count,
                total_spent=total_spent
            )
            
            # Generate personalized email using Gemini
            print(f"🤖 Generating AI email for {customer_name}...")
            email_content = await self._generate_email_with_gemini(
                customer_name=customer_name,
                inactive_days=inactive_days,
                visit_count=visit_count,
                total_spent=total_spent,
                offer=offer
            )
            
            if not email_content:
                return {
                    "success": False,
                    "error": "Failed to generate email content"
                }
            
            # Send email using Resend
            print(f"📧 Sending email to {customer_email}...")
            send_result = await self._send_email_with_resend(
                to_email=customer_email,
                subject=email_content["subject"],
                html_content=email_content["html"]
            )
            
            # Log campaign
            self._log_campaign(
                customer_name=customer_name,
                customer_email=customer_email,
                inactive_days=inactive_days,
                visit_count=visit_count,
                total_spent=total_spent,
                campaign_type=campaign_type,
                offer=offer,
                email_subject=email_content["subject"],
                email_body=email_content["html"],
                status="sent" if send_result["success"] else "failed",
                error_message=send_result.get("error"),
                email_id=send_result.get("email_id")
            )
            
            if send_result["success"]:
                print(f"✅ Email sent successfully to {customer_email}")
                return {
                    "success": True,
                    "message": "Retention email sent successfully",
                    "email_id": send_result.get("email_id"),
                    "offer": offer
                }
            else:
                print(f"❌ Failed to send email: {send_result.get('error')}")
                return {
                    "success": False,
                    "error": send_result.get("error", "Failed to send email")
                }
            
        except Exception as e:
            print(f"❌ Error in send_retention_email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def send_bulk_campaign(
        self,
        customers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Send retention emails to multiple customers
        Process asynchronously with progress tracking
        """
        results = {
            "total": len(customers),
            "sent": 0,
            "failed": 0,
            "errors": [],
            "details": []
        }
        
        for customer in customers:
            try:
                result = await self.send_retention_email(
                    customer_name=customer["name"],
                    customer_email=customer["email"],
                    inactive_days=customer["inactive_days"],
                    visit_count=customer["visit_count"],
                    total_spent=customer["total_spent"],
                    campaign_type="bulk"
                )
                
                if result["success"]:
                    results["sent"] += 1
                    results["details"].append({
                        "email": customer["email"],
                        "status": "sent",
                        "offer": result.get("offer")
                    })
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "email": customer["email"],
                        "error": result.get("error")
                    })
                    results["details"].append({
                        "email": customer["email"],
                        "status": "failed",
                        "error": result.get("error")
                    })
                    
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "email": customer.get("email", "unknown"),
                    "error": str(e)
                })
        
        # Update analytics
        self._update_analytics(results["sent"], results["failed"])
        
        return results

    def _check_duplicate_send(self, customer_email: str) -> bool:
        """Check if email was sent to this customer in last 7 days"""
        db = SyncSessionLocal()
        try:
            result = db.execute(text("""
                SELECT COUNT(*) as count FROM retention_campaigns
                WHERE customer_email = :email
                AND status = 'sent'
                AND created_at > datetime('now', '-7 days')
            """), {"email": customer_email})
            
            count = result.fetchone()[0]
            return count > 0
            
        except Exception as e:
            print(f"❌ Error checking duplicate: {str(e)}")
            return False
        finally:
            db.close()

    def _log_campaign(
        self,
        customer_name: str,
        customer_email: str,
        inactive_days: int,
        visit_count: int,
        total_spent: float,
        campaign_type: str,
        offer: Dict[str, str],
        email_subject: str,
        email_body: str,
        status: str,
        error_message: str = None,
        email_id: str = None
    ):
        """Log campaign to database"""
        db = SyncSessionLocal()
        try:
            db.execute(text("""
                INSERT INTO retention_campaigns (
                    customer_name, customer_email, inactive_days, visit_count, total_spent,
                    campaign_type, offer_type, offer_value, email_subject, email_body,
                    status, error_message, email_id, sent_at
                ) VALUES (
                    :customer_name, :customer_email, :inactive_days, :visit_count, :total_spent,
                    :campaign_type, :offer_type, :offer_value, :email_subject, :email_body,
                    :status, :error_message, :email_id, :sent_at
                )
            """), {
                "customer_name": customer_name,
                "customer_email": customer_email,
                "inactive_days": inactive_days,
                "visit_count": visit_count,
                "total_spent": total_spent,
                "campaign_type": campaign_type,
                "offer_type": offer.get("offer_type", "Standard Offer"),
                "offer_value": offer.get("offer_value", "10% OFF"),
                "email_subject": email_subject,
                "email_body": email_body,
                "status": status,
                "error_message": error_message,
                "email_id": email_id,
                "sent_at": datetime.now() if status == "sent" else None
            })
            db.commit()
        except Exception as e:
            print(f"❌ Error logging campaign: {str(e)}")
            db.rollback()
        finally:
            db.close()

    def _update_analytics(self, sent_count: int, failed_count: int):
        """Update campaign analytics"""
        db = SyncSessionLocal()
        try:
            db.execute(text("""
                UPDATE campaign_analytics SET
                    total_campaigns = total_campaigns + 1,
                    total_emails_sent = total_emails_sent + :sent,
                    total_emails_failed = total_emails_failed + :failed,
                    total_customers_reached = total_customers_reached + :sent,
                    success_rate = CAST(total_emails_sent AS FLOAT) / 
                                  NULLIF(total_emails_sent + total_emails_failed, 0) * 100,
                    last_campaign_date = :now,
                    updated_at = :now
                WHERE id = 1
            """), {
                "sent": sent_count,
                "failed": failed_count,
                "now": datetime.now()
            })
            db.commit()
        except Exception as e:
            print(f"❌ Error updating analytics: {str(e)}")
            db.rollback()
        finally:
            db.close()

    async def _generate_email_with_gemini(
        self,
        customer_name: str,
        inactive_days: int,
        visit_count: int,
        total_spent: float,
        offer: Dict[str, str]
    ) -> Dict[str, str]:
        """Generate personalized retention email using Gemini AI with smart offers"""
        try:
            prompt = f"""
You are a professional email marketing expert. Generate a personalized retention email.

CUSTOMER DATA:
- Name: {customer_name}
- Inactive for: {inactive_days} days
- Previous visits: {visit_count}
- Total spent: ₹{total_spent:,.0f}

SMART OFFER:
- Type: {offer.get('offer_type')}
- Value: {offer.get('offer_value')}
- Tone: {offer.get('tone')}
- CTA: {offer.get('cta')}

REQUIREMENTS:
1. Generate compelling email subject (max 60 characters)
2. Generate professional HTML email with:
   - Personalized greeting
   - Appreciation message
   - Highlight the smart offer prominently
   - Clear CTA button with offer CTA text
   - Professional closing
   - Modern, responsive HTML design
   - Branded header and footer

TONE: {offer.get('tone', 'professional')}

OUTPUT FORMAT (JSON):
{{
  "subject": "email subject here",
  "html": "complete HTML email here"
}}

IMPORTANT: Return ONLY valid JSON with proper HTML escaping.
"""

            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            email_data = json.loads(response_text)
            
            if "subject" not in email_data or "html" not in email_data:
                raise ValueError("Invalid email data structure")
            
            return email_data
            
        except Exception as e:
            print(f"❌ Gemini generation error: {str(e)}")
            return self._fallback_email_template(
                customer_name=customer_name,
                inactive_days=inactive_days,
                offer=offer
            )

    def _fallback_email_template(
        self,
        customer_name: str,
        inactive_days: int,
        offer: Dict[str, str]
    ) -> Dict[str, str]:
        """Fallback email template with smart offers"""
        offer_type = offer.get("offer_type", "Special Offer")
        offer_value = offer.get("offer_value", "10% OFF")
        cta_text = offer.get("cta", "Shop Now")
        
        subject = f"We Miss You, {customer_name}! {offer_value} Inside"
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .content {{
            padding: 30px;
        }}
        .offer-box {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }}
        .offer-box h2 {{
            margin: 0 0 10px 0;
            font-size: 36px;
        }}
        .offer-box p {{
            margin: 0;
            font-size: 18px;
        }}
        .cta-button {{
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 We Miss You!</h1>
        </div>
        <div class="content">
            <p>Hi {customer_name},</p>
            
            <p>We noticed it's been <strong>{inactive_days} days</strong> since we last saw you, and we truly miss having you with us!</p>
            
            <p>Your support has always meant the world to us, and we'd love to welcome you back with something special.</p>
            
            <div class="offer-box">
                <h2>{offer_value}</h2>
                <p>{offer_type}</p>
            </div>
            
            <p>This is our way of saying thank you for being a valued customer. Use this exclusive offer on your next purchase!</p>
            
            <center>
                <a href="#" class="cta-button">{cta_text}</a>
            </center>
            
            <p>We're excited to serve you again and show you what's new!</p>
            
            <p>Warm regards,<br>
            <strong>The Saadhyam Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2026 Saadhyam AI. All rights reserved.</p>
            <p>This is an automated retention email.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return {
            "subject": subject,
            "html": html
        }

    async def _send_email_with_resend(
        self,
        to_email: str,
        subject: str,
        html_content: str
    ) -> Dict[str, Any]:
        """Send email using Resend API"""
        try:
            url = "https://api.resend.com/emails"
            
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": "Saadhyam AI <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "email_id": result.get("id")
                    }
                else:
                    error_msg = response.text
                    print(f"❌ Resend API error: {error_msg}")
                    return {
                        "success": False,
                        "error": f"Resend API error: {error_msg}"
                    }
                    
        except Exception as e:
            print(f"❌ Error sending email with Resend: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_campaign_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get campaign history"""
        db = SyncSessionLocal()
        try:
            result = db.execute(text("""
                SELECT 
                    customer_name, customer_email, campaign_type,
                    offer_type, offer_value, status, created_at, sent_at
                FROM retention_campaigns
                ORDER BY created_at DESC
                LIMIT :limit
            """), {"limit": limit})
            
            campaigns = []
            for row in result:
                campaigns.append({
                    "customer_name": row[0],
                    "customer_email": row[1],
                    "campaign_type": row[2],
                    "offer_type": row[3],
                    "offer_value": row[4],
                    "status": row[5],
                    "created_at": row[6],
                    "sent_at": row[7]
                })
            
            return campaigns
            
        except Exception as e:
            print(f"❌ Error getting campaign history: {str(e)}")
            return []
        finally:
            db.close()

    def get_analytics(self) -> Dict[str, Any]:
        """Get campaign analytics"""
        db = SyncSessionLocal()
        try:
            result = db.execute(text("""
                SELECT 
                    total_campaigns, total_emails_sent, total_emails_failed,
                    total_customers_reached, success_rate, last_campaign_date
                FROM campaign_analytics
                WHERE id = 1
            """))
            
            row = result.fetchone()
            if row:
                return {
                    "total_campaigns": row[0],
                    "total_emails_sent": row[1],
                    "total_emails_failed": row[2],
                    "total_customers_reached": row[3],
                    "success_rate": round(row[4], 2) if row[4] else 0.0,
                    "last_campaign_date": row[5]
                }
            else:
                return {
                    "total_campaigns": 0,
                    "total_emails_sent": 0,
                    "total_emails_failed": 0,
                    "total_customers_reached": 0,
                    "success_rate": 0.0,
                    "last_campaign_date": None
                }
                
        except Exception as e:
            print(f"❌ Error getting analytics: {str(e)}")
            return {
                "total_campaigns": 0,
                "total_emails_sent": 0,
                "total_emails_failed": 0,
                "total_customers_reached": 0,
                "success_rate": 0.0,
                "last_campaign_date": None
            }
        finally:
            db.close()

    """
    Generate and send personalized retention emails to inactive customers
    """

    def __init__(self):
        """Initialize Gemini API"""
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.resend_api_key = settings.RESEND_API_KEY
        
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        
        if not self.resend_api_key:
            raise ValueError("RESEND_API_KEY not configured")
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')

    async def send_retention_email(
        self,
        customer_name: str,
        customer_email: str,
        inactive_days: int,
        visit_count: int,
        total_spent: float
    ) -> Dict[str, Any]:
        """
        Generate AI email and send to customer
        
        Args:
            customer_name: Customer's name
            customer_email: Customer's email address
            inactive_days: Days since last purchase
            visit_count: Total number of visits
            total_spent: Total amount spent
            
        Returns:
            Dict with success status and message
        """
        try:
            # Step 1: Validate inputs
            if not customer_email or "@" not in customer_email:
                return {
                    "success": False,
                    "error": "Invalid email address"
                }
            
            if inactive_days < 30:
                return {
                    "success": False,
                    "error": "Customer is not inactive (less than 30 days)"
                }
            
            # Step 2: Generate personalized email using Gemini
            print(f"🤖 Generating AI email for {customer_name}...")
            email_content = await self._generate_email_with_gemini(
                customer_name=customer_name,
                inactive_days=inactive_days,
                visit_count=visit_count,
                total_spent=total_spent
            )
            
            if not email_content:
                return {
                    "success": False,
                    "error": "Failed to generate email content"
                }
            
            # Step 3: Send email using Resend
            print(f"📧 Sending email to {customer_email}...")
            send_result = await self._send_email_with_resend(
                to_email=customer_email,
                subject=email_content["subject"],
                html_content=email_content["html"]
            )
            
            if send_result["success"]:
                print(f"✅ Email sent successfully to {customer_email}")
                return {
                    "success": True,
                    "message": "Retention email sent successfully",
                    "email_id": send_result.get("email_id")
                }
            else:
                print(f"❌ Failed to send email: {send_result.get('error')}")
                return {
                    "success": False,
                    "error": send_result.get("error", "Failed to send email")
                }
            
        except Exception as e:
            print(f"❌ Error in send_retention_email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _generate_email_with_gemini(
        self,
        customer_name: str,
        inactive_days: int,
        visit_count: int,
        total_spent: float
    ) -> Dict[str, str]:
        """
        Generate personalized retention email using Gemini AI
        
        Returns:
            Dict with 'subject' and 'html' keys
        """
        try:
            # Calculate discount based on customer value
            if total_spent >= 20000:
                discount = 20
            elif total_spent >= 10000:
                discount = 15
            else:
                discount = 10
            
            prompt = f"""
You are a professional email marketing expert. Generate a personalized retention email for an inactive customer.

CUSTOMER DATA:
- Name: {customer_name}
- Inactive for: {inactive_days} days
- Previous visits: {visit_count}
- Total spent: ₹{total_spent:,.0f}
- Recommended discount: {discount}%

REQUIREMENTS:
1. Generate a compelling email subject line (max 60 characters)
2. Generate professional HTML email content with:
   - Personalized greeting using customer name
   - Appreciation for past business
   - Mention they've been missed for {inactive_days} days
   - Exclusive {discount}% discount offer
   - Clear call-to-action
   - Professional closing
   - Clean, modern HTML formatting

TONE:
- Professional yet friendly
- Warm and welcoming
- Concise and clear
- Business quality

OUTPUT FORMAT (JSON):
{{
  "subject": "email subject here",
  "html": "complete HTML email here"
}}

IMPORTANT:
- Return ONLY valid JSON
- HTML should be complete and properly formatted
- Include inline CSS for styling
- Make it mobile-responsive
- Use professional colors (blue/purple theme)
- Keep it concise (not too long)
"""

            # Generate content with Gemini
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            # Parse JSON
            email_data = json.loads(response_text)
            
            # Validate response
            if "subject" not in email_data or "html" not in email_data:
                raise ValueError("Invalid email data structure")
            
            return email_data
            
        except Exception as e:
            print(f"❌ Gemini generation error: {str(e)}")
            # Fallback email template
            return self._fallback_email_template(
                customer_name=customer_name,
                inactive_days=inactive_days,
                discount=discount
            )

    def _fallback_email_template(
        self,
        customer_name: str,
        inactive_days: int,
        discount: int
    ) -> Dict[str, str]:
        """
        Fallback email template if Gemini fails
        """
        subject = f"We Miss You, {customer_name}! Exclusive {discount}% Offer Inside"
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .content {{
            padding: 30px;
        }}
        .offer-box {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }}
        .offer-box h2 {{
            margin: 0;
            font-size: 32px;
        }}
        .cta-button {{
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>We Miss You!</h1>
        </div>
        <div class="content">
            <p>Hi {customer_name},</p>
            
            <p>We noticed it's been <strong>{inactive_days} days</strong> since we last saw you, and we truly miss having you with us!</p>
            
            <p>Your support has always meant the world to us, and we'd love to welcome you back with something special.</p>
            
            <div class="offer-box">
                <h2>{discount}% OFF</h2>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Exclusive Comeback Offer</p>
            </div>
            
            <p>This is our way of saying thank you for being a valued customer. Use this exclusive discount on your next purchase!</p>
            
            <center>
                <a href="#" class="cta-button">Shop Now</a>
            </center>
            
            <p>We're excited to serve you again and show you what's new!</p>
            
            <p>Warm regards,<br>
            <strong>The Saadhyam Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated retention email. If you wish to unsubscribe, please contact us.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return {
            "subject": subject,
            "html": html
        }

    async def _send_email_with_resend(
        self,
        to_email: str,
        subject: str,
        html_content: str
    ) -> Dict[str, Any]:
        """
        Send email using Resend API
        
        Returns:
            Dict with success status and email_id
        """
        try:
            url = "https://api.resend.com/emails"
            
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": "Saadhyam AI <onboarding@resend.dev>",  # Resend test domain
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "email_id": result.get("id")
                    }
                else:
                    error_msg = response.text
                    print(f"❌ Resend API error: {error_msg}")
                    return {
                        "success": False,
                        "error": f"Resend API error: {error_msg}"
                    }
                    
        except Exception as e:
            print(f"❌ Error sending email with Resend: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

