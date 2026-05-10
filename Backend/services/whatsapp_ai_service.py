"""
WhatsApp AI Service
Handles AI-powered features for WhatsApp (auto-replies, smart responses)
"""

import logging
import os
from typing import Dict, Any, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)


class WhatsAppAIService:
    """Service for AI-powered WhatsApp features"""
    
    def __init__(self):
        # Initialize Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.ai_available = True
            logger.info("✅ WhatsApp AI Service initialized with Gemini")
        else:
            self.ai_available = False
            logger.warning("⚠️  Gemini API key not found, AI features disabled")
    
    def generate_reply(
        self,
        customer_message: str,
        business_context: Optional[str] = None,
        conversation_history: Optional[list] = None,
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate an AI-powered reply to a customer message
        
        Args:
            customer_message: The customer's message
            business_context: Business information for context
            conversation_history: Previous messages in the conversation
            tone: Desired tone (professional, friendly, casual)
            
        Returns:
            Dict containing generated reply and confidence score
        """
        if not self.ai_available:
            return {
                "success": False,
                "error": "AI service not available",
                "fallback_reply": "Thank you for your message. We'll get back to you soon!"
            }
        
        try:
            # Build prompt
            prompt = self._build_reply_prompt(
                customer_message=customer_message,
                business_context=business_context,
                conversation_history=conversation_history,
                tone=tone
            )
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                reply_text = response.text.strip()
                
                # Calculate confidence score (simple heuristic)
                confidence = self._calculate_confidence(reply_text, customer_message)
                
                logger.info(f"✅ Generated AI reply with confidence: {confidence}%")
                
                return {
                    "success": True,
                    "reply": reply_text,
                    "confidence": confidence,
                    "ai_generated": True
                }
            else:
                return {
                    "success": False,
                    "error": "No response generated",
                    "fallback_reply": "Thank you for your message. We'll get back to you soon!"
                }
                
        except Exception as e:
            logger.error(f"❌ Error generating AI reply: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "fallback_reply": "Thank you for your message. We'll get back to you soon!"
            }
    
    def _build_reply_prompt(
        self,
        customer_message: str,
        business_context: Optional[str],
        conversation_history: Optional[list],
        tone: str
    ) -> str:
        """Build prompt for AI reply generation"""
        
        prompt_parts = [
            "You are a helpful customer service assistant for a business on WhatsApp.",
            f"Your tone should be {tone} and concise (max 2-3 sentences).",
        ]
        
        if business_context:
            prompt_parts.append(f"\nBusiness Context: {business_context}")
        
        if conversation_history:
            prompt_parts.append("\nConversation History:")
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = "Customer" if msg.get("direction") == "incoming" else "Business"
                prompt_parts.append(f"{role}: {msg.get('message', '')}")
        
        prompt_parts.append(f"\nCustomer's Latest Message: {customer_message}")
        prompt_parts.append("\nGenerate a helpful, professional reply:")
        
        return "\n".join(prompt_parts)
    
    def _calculate_confidence(self, reply: str, customer_message: str) -> int:
        """Calculate confidence score for generated reply (0-100)"""
        try:
            # Simple heuristic based on reply characteristics
            confidence = 70  # Base confidence
            
            # Longer replies tend to be more detailed
            if len(reply) > 50:
                confidence += 10
            
            # Check if reply addresses the message
            if len(reply) > 20 and len(reply) < 500:
                confidence += 10
            
            # Cap at 95 (never 100% confident)
            return min(confidence, 95)
            
        except:
            return 70
    
    def generate_campaign_message(
        self,
        campaign_type: str,
        business_info: Optional[str] = None,
        target_audience: Optional[str] = None,
        key_points: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Generate a campaign message using AI
        
        Args:
            campaign_type: Type of campaign (offer, reminder, announcement, etc.)
            business_info: Business information
            target_audience: Target audience description
            key_points: Key points to include
            
        Returns:
            Dict containing generated message
        """
        if not self.ai_available:
            return {
                "success": False,
                "error": "AI service not available"
            }
        
        try:
            prompt_parts = [
                f"Generate a WhatsApp campaign message for a {campaign_type} campaign.",
                "The message should be engaging, concise (max 160 characters), and include a clear call-to-action.",
            ]
            
            if business_info:
                prompt_parts.append(f"\nBusiness: {business_info}")
            
            if target_audience:
                prompt_parts.append(f"Target Audience: {target_audience}")
            
            if key_points:
                prompt_parts.append(f"Key Points to Include: {', '.join(key_points)}")
            
            prompt_parts.append("\nGenerate the campaign message:")
            
            prompt = "\n".join(prompt_parts)
            
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                message = response.text.strip()
                
                logger.info(f"✅ Generated campaign message")
                
                return {
                    "success": True,
                    "message": message,
                    "ai_generated": True
                }
            else:
                return {
                    "success": False,
                    "error": "No message generated"
                }
                
        except Exception as e:
            logger.error(f"❌ Error generating campaign message: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    def analyze_customer_intent(
        self,
        message: str
    ) -> Dict[str, Any]:
        """
        Analyze customer message to determine intent
        
        Args:
            message: Customer message
            
        Returns:
            Dict containing intent analysis
        """
        if not self.ai_available:
            return {
                "success": False,
                "error": "AI service not available"
            }
        
        try:
            prompt = f"""Analyze this customer message and determine the intent.
            
Message: {message}

Classify the intent as one of: inquiry, complaint, purchase, support, feedback, other
Also provide a confidence score (0-100) and a brief explanation.

Format your response as:
Intent: [intent]
Confidence: [score]
Explanation: [brief explanation]"""
            
            response = self.model.generate_content(prompt)
            
            if response and response.text:
                # Parse response
                lines = response.text.strip().split('\n')
                intent = "other"
                confidence = 50
                explanation = ""
                
                for line in lines:
                    if line.startswith("Intent:"):
                        intent = line.split(":", 1)[1].strip().lower()
                    elif line.startswith("Confidence:"):
                        try:
                            confidence = int(line.split(":", 1)[1].strip())
                        except:
                            pass
                    elif line.startswith("Explanation:"):
                        explanation = line.split(":", 1)[1].strip()
                
                return {
                    "success": True,
                    "intent": intent,
                    "confidence": confidence,
                    "explanation": explanation
                }
            else:
                return {
                    "success": False,
                    "error": "No analysis generated"
                }
                
        except Exception as e:
            logger.error(f"❌ Error analyzing intent: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }


# Create singleton instance
whatsapp_ai_service = WhatsAppAIService()
