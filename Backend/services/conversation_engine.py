"""
AI Conversation Engine for Voice Sales Agent
Handles natural, context-aware sales conversations in multiple languages
"""

import logging
import os
from typing import Dict, List, Optional, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class ConversationEngine:
    """AI-powered conversation engine for sales calls"""
    
    def __init__(self):
        self.groq_client = None
        self.conversation_memory = {}  # session_id -> conversation history
        self._initialize_groq()
    
    def _initialize_groq(self):
        """Initialize Groq API client"""
        try:
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                self.groq_client = Groq(api_key=api_key)
                logger.info("✅ Groq API initialized for conversation engine")
            else:
                logger.warning("⚠️ GROQ_API_KEY not found")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Groq: {e}")
    
    def generate_ai_response(
        self,
        customer_message: str,
        conversation_history: List[Dict[str, str]],
        campaign_context: Dict[str, Any],
        language: str = "english"
    ) -> Dict[str, Any]:
        """
        Generate AI response to customer message
        
        Args:
            customer_message: What the customer said
            conversation_history: Previous messages
            campaign_context: Campaign details (script, offer, etc.)
            language: Conversation language
        
        Returns:
            Dictionary with AI response and metadata
        """
        try:
            # Build system prompt
            system_prompt = self._build_system_prompt(campaign_context, language)
            
            # Build conversation messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Add current customer message
            messages.append({
                "role": "user",
                "content": customer_message
            })
            
            # Generate response
            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500
                )
                
                ai_response = response.choices[0].message.content.strip()
            else:
                # Fallback response
                ai_response = self._generate_fallback_response(customer_message, language)
            
            # Analyze customer intent
            intent = self._analyze_intent(customer_message)
            sentiment = self._analyze_sentiment(customer_message)
            
            return {
                "response": ai_response,
                "intent": intent,
                "sentiment": sentiment,
                "should_continue": intent not in ["end_call", "not_interested"],
                "next_action": self._suggest_next_action(intent, sentiment)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to generate AI response: {e}")
            return {
                "response": self._generate_fallback_response(customer_message, language),
                "intent": "unknown",
                "sentiment": "neutral",
                "should_continue": True,
                "next_action": "continue_conversation"
            }
    
    def generate_sales_pitch(
        self,
        campaign_context: Dict[str, Any],
        customer_profile: Optional[Dict[str, Any]] = None,
        language: str = "english"
    ) -> str:
        """
        Generate personalized sales pitch
        
        Args:
            campaign_context: Campaign details
            customer_profile: Customer information
            language: Language for pitch
        
        Returns:
            Generated sales pitch
        """
        try:
            prompt = f"""Generate a compelling sales pitch in {language} for:

Business: {campaign_context.get('business_name', 'our company')}
Offer: {campaign_context.get('offer_details', 'special offer')}
Target Audience: {campaign_context.get('target_audience', 'customers')}
Goal: {campaign_context.get('campaign_goal', 'increase sales')}

Customer Profile: {customer_profile if customer_profile else 'General customer'}

Requirements:
- Natural and conversational
- Highlight key benefits
- Create urgency
- Include clear call-to-action
- Keep it under 100 words
- Sound human, not robotic

Generate the pitch:"""

            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.8,
                    max_tokens=300
                )
                return response.choices[0].message.content.strip()
            else:
                return self._generate_fallback_pitch(campaign_context, language)
                
        except Exception as e:
            logger.error(f"❌ Failed to generate sales pitch: {e}")
            return self._generate_fallback_pitch(campaign_context, language)
    
    def generate_followup_response(
        self,
        customer_objection: str,
        conversation_history: List[Dict[str, str]],
        campaign_context: Dict[str, Any],
        language: str = "english"
    ) -> str:
        """
        Generate response to customer objection
        
        Args:
            customer_objection: Customer's objection or concern
            conversation_history: Previous conversation
            campaign_context: Campaign details
            language: Language
        
        Returns:
            Response to objection
        """
        try:
            prompt = f"""Customer objection: "{customer_objection}"

Campaign context: {campaign_context.get('offer_details', '')}

Generate a professional, empathetic response that:
- Acknowledges their concern
- Provides value-focused counter-argument
- Offers alternative solution if needed
- Maintains positive tone
- Keeps conversation going

Language: {language}
Response:"""

            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=200
                )
                return response.choices[0].message.content.strip()
            else:
                return self._generate_fallback_objection_response(language)
                
        except Exception as e:
            logger.error(f"❌ Failed to generate followup response: {e}")
            return self._generate_fallback_objection_response(language)
    
    def analyze_customer_intent(
        self,
        customer_message: str,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Analyze customer's intent from their message
        
        Returns:
            Dictionary with intent analysis
        """
        intent = self._analyze_intent(customer_message)
        sentiment = self._analyze_sentiment(customer_message)
        
        return {
            "intent": intent,
            "sentiment": sentiment,
            "interest_level": self._calculate_interest_level(intent, sentiment),
            "should_followup": intent in ["interested", "needs_info", "callback"],
            "recommended_action": self._suggest_next_action(intent, sentiment)
        }
    
    def _build_system_prompt(self, campaign_context: Dict[str, Any], language: str) -> str:
        """Build system prompt for AI"""
        return f"""You are an AI sales assistant making a voice call in {language}.

Campaign Details:
- Business: {campaign_context.get('business_name', 'our company')}
- Offer: {campaign_context.get('offer_details', 'special offer')}
- Goal: {campaign_context.get('campaign_goal', 'increase sales')}
- Target: {campaign_context.get('target_audience', 'customers')}

Script Guidelines:
{campaign_context.get('script_template', 'Be professional and helpful')}

Your Role:
- Be natural, friendly, and professional
- Listen to customer needs
- Highlight benefits, not just features
- Handle objections gracefully
- Create urgency without being pushy
- Ask open-ended questions
- Guide towards conversion

Language: {language}
Tone: Conversational, helpful, confident

Remember: You're having a real conversation, not reading a script."""
    
    def _analyze_intent(self, message: str) -> str:
        """Analyze customer intent from message"""
        message_lower = message.lower()
        
        # Interested signals
        if any(word in message_lower for word in ["interested", "yes", "sure", "okay", "tell me more", "sounds good"]):
            return "interested"
        
        # Not interested signals
        if any(word in message_lower for word in ["not interested", "no thanks", "not now", "busy", "don't want"]):
            return "not_interested"
        
        # Needs more info
        if any(word in message_lower for word in ["how", "what", "when", "where", "price", "cost", "details"]):
            return "needs_info"
        
        # Callback request
        if any(word in message_lower for word in ["call back", "later", "tomorrow", "next week"]):
            return "callback"
        
        # Objection
        if any(word in message_lower for word in ["but", "however", "expensive", "already have", "not sure"]):
            return "objection"
        
        # End call
        if any(word in message_lower for word in ["bye", "goodbye", "hang up", "end call"]):
            return "end_call"
        
        return "neutral"
    
    def _analyze_sentiment(self, message: str) -> str:
        """Analyze sentiment of message"""
        message_lower = message.lower()
        
        # Positive sentiment
        positive_words = ["great", "good", "excellent", "perfect", "love", "interested", "yes"]
        positive_count = sum(1 for word in positive_words if word in message_lower)
        
        # Negative sentiment
        negative_words = ["no", "not", "don't", "can't", "won't", "bad", "expensive", "waste"]
        negative_count = sum(1 for word in negative_words if word in message_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _calculate_interest_level(self, intent: str, sentiment: str) -> str:
        """Calculate customer interest level"""
        if intent == "interested" and sentiment == "positive":
            return "high"
        elif intent in ["needs_info", "callback"] or sentiment == "positive":
            return "medium"
        elif intent == "not_interested" or sentiment == "negative":
            return "low"
        else:
            return "medium"
    
    def _suggest_next_action(self, intent: str, sentiment: str) -> str:
        """Suggest next action based on intent and sentiment"""
        if intent == "interested":
            return "schedule_demo"
        elif intent == "needs_info":
            return "provide_details"
        elif intent == "callback":
            return "schedule_callback"
        elif intent == "objection":
            return "handle_objection"
        elif intent == "not_interested":
            return "polite_end"
        elif intent == "end_call":
            return "end_call"
        else:
            return "continue_conversation"
    
    def _generate_fallback_response(self, customer_message: str, language: str) -> str:
        """Generate fallback response when API is unavailable"""
        responses = {
            "english": "Thank you for sharing that. Let me provide you with more information about our offer.",
            "hinglish": "Thank you. Main aapko hamare offer ke baare mein aur batata hoon.",
            "telugu": "Dhanyavadalu. Maa offer gurinchi inka chepputa."
        }
        return responses.get(language, responses["english"])
    
    def _generate_fallback_pitch(self, campaign_context: Dict[str, Any], language: str) -> str:
        """Generate fallback sales pitch"""
        business = campaign_context.get('business_name', 'our company')
        offer = campaign_context.get('offer_details', 'special offer')
        
        pitches = {
            "english": f"Hello! I'm calling from {business}. We have an exclusive {offer} that I think you'll find valuable. Would you like to hear more?",
            "hinglish": f"Namaste! Main {business} se bol raha hoon. Hamare paas ek special {offer} hai jo aapke liye bahut useful hoga. Kya aap sunna chahenge?",
            "telugu": f"Namaskaram! Nenu {business} nundi matladutunnanu. Maku oka special {offer} undi. Meeku vinali anipisthunda?"
        }
        return pitches.get(language, pitches["english"])
    
    def _generate_fallback_objection_response(self, language: str) -> str:
        """Generate fallback objection response"""
        responses = {
            "english": "I understand your concern. Let me explain how this can benefit you specifically.",
            "hinglish": "Main samajhta hoon. Chaliye main aapko batata hoon ki yeh aapke liye kaise helpful hoga.",
            "telugu": "Nenu ardham chesukunnanu. Idi meeku ela upayogapaduthundo chepputa."
        }
        return responses.get(language, responses["english"])


# Singleton instance
conversation_engine = ConversationEngine()
