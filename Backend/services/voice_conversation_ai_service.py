"""
Voice Conversation AI Service
Generates AI-powered conversations for voice campaigns
"""

import logging
import random
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class VoiceConversationAI:
    """Service to generate AI conversations for voice calls"""
    
    def generate_mock_conversation(
        self,
        campaign_script: str,
        contact_name: str,
        language: str = "english"
    ) -> Dict[str, Any]:
        """
        Generate a mock conversation for testing
        
        In production, this would use real-time AI (GROQ/OpenAI) to generate
        responses based on customer input during the actual call.
        
        Returns:
            dict with transcript, summary, and interest_level
        """
        
        # Extract business context from script
        business_context = self._extract_business_context(campaign_script)
        
        # Generate conversation based on language
        if language == "telugu":
            conversation = self._generate_telugu_conversation(contact_name, business_context)
        elif language == "hinglish":
            conversation = self._generate_hinglish_conversation(contact_name, business_context)
        else:
            conversation = self._generate_english_conversation(contact_name, business_context)
        
        return conversation
    
    def _extract_business_context(self, script: str) -> Dict[str, str]:
        """Extract business information from campaign script"""
        # Simple extraction - in production, use NLP
        context = {
            "product": "our product",
            "company": "our company",
            "benefit": "great value"
        }
        
        if script:
            script_lower = script.lower()
            if "coworking" in script_lower or "workspace" in script_lower:
                context["product"] = "coworking space"
                context["benefit"] = "flexible workspace solutions"
            elif "software" in script_lower or "app" in script_lower:
                context["product"] = "software solution"
                context["benefit"] = "increased productivity"
            elif "service" in script_lower:
                context["product"] = "service"
                context["benefit"] = "professional assistance"
        
        return context
    
    def _generate_english_conversation(
        self,
        contact_name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate English conversation"""
        
        # Randomly select conversation type
        conversation_types = [
            self._interested_conversation_en,
            self._not_interested_conversation_en,
            self._callback_conversation_en,
            self._busy_conversation_en
        ]
        
        conversation_func = random.choice(conversation_types)
        return conversation_func(contact_name, context)
    
    def _interested_conversation_en(
        self,
        name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate interested customer conversation"""
        transcript = f"""AI: Hello, is this {name}?
Customer: Yes, speaking.
AI: Hi {name}, I'm calling from {context['company']} regarding {context['product']}. We offer {context['benefit']}. Do you have a moment?
Customer: Yes, I'm interested. Tell me more.
AI: Great! We provide flexible plans starting from just ₹999 per month. Would you like to schedule a demo?
Customer: Yes, that sounds good. When can we do it?
AI: Perfect! I can schedule it for tomorrow at 11 AM. Does that work for you?
Customer: Yes, that works. Please send me the details.
AI: Absolutely! I'll send you an email with all the details. Thank you for your time, {name}!
Customer: Thank you!"""
        
        summary = f"{name} showed strong interest in {context['product']}. Agreed to schedule a demo for tomorrow at 11 AM. Follow-up email to be sent with details."
        
        return {
            "transcript": transcript,
            "summary": summary,
            "interest_level": "high"
        }
    
    def _not_interested_conversation_en(
        self,
        name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate not interested customer conversation"""
        transcript = f"""AI: Hello, is this {name}?
Customer: Yes, who is this?
AI: Hi {name}, I'm calling from {context['company']} regarding {context['product']}.
Customer: I'm not interested, thank you.
AI: I understand. May I ask if there's a specific reason?
Customer: I already have a solution. Please don't call again.
AI: Understood. Thank you for your time, {name}. Have a great day!"""
        
        summary = f"{name} is not interested. Already has an existing solution. Requested not to be contacted again."
        
        return {
            "transcript": transcript,
            "summary": summary,
            "interest_level": "none"
        }
    
    def _callback_conversation_en(
        self,
        name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate callback request conversation"""
        transcript = f"""AI: Hello, is this {name}?
Customer: Yes, but I'm in a meeting right now.
AI: I apologize for the interruption. I'm calling from {context['company']} about {context['product']}.
Customer: Can you call me back later? Maybe in the evening?
AI: Of course! What time would be convenient for you?
Customer: Around 6 PM would be good.
AI: Perfect! I'll call you back at 6 PM today. Thank you, {name}!
Customer: Thank you!"""
        
        summary = f"{name} was busy during the call. Requested callback at 6 PM today. Showed potential interest."
        
        return {
            "transcript": transcript,
            "summary": summary,
            "interest_level": "medium"
        }
    
    def _busy_conversation_en(
        self,
        name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate busy customer conversation"""
        transcript = f"""AI: Hello, is this {name}?
Customer: Yes, but I'm really busy right now.
AI: I understand. I'm calling from {context['company']}. Would you prefer if I send you information via email?
Customer: Yes, that would be better.
AI: Great! I'll send you all the details. May I have your email address?
Customer: It's {name.lower().replace(' ', '.')}@email.com
AI: Perfect! You'll receive the information shortly. Thank you, {name}!"""
        
        summary = f"{name} was busy but agreed to receive information via email. Email address collected for follow-up."
        
        return {
            "transcript": transcript,
            "summary": summary,
            "interest_level": "low"
        }
    
    def _generate_telugu_conversation(
        self,
        contact_name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate Telugu conversation"""
        transcript = f"""AI: నమస్కారం, ఇది {contact_name} గారా?
Customer: అవును, చెప్పండి.
AI: నమస్తే {contact_name} గారు, నేను {context['company']} నుండి మాట్లాడుతున్నాను. మేము {context['product']} గురించి మీతో మాట్లాడాలనుకుంటున్నాము.
Customer: సరే, చెప్పండి.
AI: మేము చాలా మంచి ఆఫర్లు అందిస్తున్నాము. మీకు ఆసక్తి ఉందా?
Customer: ఆసక్తి ఉంది. మరిన్ని వివరాలు పంపండి.
AI: తప్పకుండా! నేను మీకు అన్ని వివరాలు పంపుతాను. ధన్యవాదాలు!"""
        
        summary = f"{contact_name} showed interest. Requested more details to be sent."
        
        return {
            "transcript": transcript,
            "summary": summary,
            "interest_level": "medium"
        }
    
    def _generate_hinglish_conversation(
        self,
        contact_name: str,
        context: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate Hinglish conversation"""
        transcript = f"""AI: Hello, kya ye {contact_name} hai?
Customer: Haan, boliye.
AI: Namaste {contact_name} ji, main {context['company']} se bol raha hoon. Hum {context['product']} ke baare mein aapse baat karna chahte hain.
Customer: Haan, batao kya hai?
AI: Ji, humara ek bahut accha offer hai aapke liye. Kya aap interested hain?
Customer: Haan, interest hai. Details bhejo.
AI: Zaroor! Main aapko saari details email kar dunga. Thank you!"""
        
        summary = f"{contact_name} showed interest. Requested details to be emailed."
        
        return {
            "transcript": transcript,
            "summary": summary,
            "interest_level": "medium"
        }
    
    def generate_real_time_response(
        self,
        customer_message: str,
        conversation_history: List[Dict[str, str]],
        campaign_script: str,
        language: str = "english"
    ) -> str:
        """
        Generate real-time AI response during live call
        
        This would be used in production with actual voice calls.
        Uses GROQ/OpenAI to generate contextual responses.
        
        Args:
            customer_message: What the customer just said
            conversation_history: Previous messages in the conversation
            campaign_script: Campaign script template
            language: Conversation language
        
        Returns:
            AI response text
        """
        # TODO: Implement real-time AI response using GROQ API
        # For now, return a placeholder
        return "Thank you for your response. Let me help you with that."
    
    def analyze_conversation_intent(
        self,
        transcript: str
    ) -> Dict[str, Any]:
        """
        Analyze conversation to detect customer intent
        
        Returns:
            dict with intent, sentiment, and key points
        """
        transcript_lower = transcript.lower()
        
        # Detect intent
        if any(word in transcript_lower for word in ["interested", "yes", "sure", "okay", "demo", "schedule"]):
            intent = "interested"
            sentiment = "positive"
        elif any(word in transcript_lower for word in ["not interested", "no", "don't call", "busy", "not now"]):
            intent = "not_interested"
            sentiment = "negative"
        elif any(word in transcript_lower for word in ["call back", "later", "evening", "tomorrow"]):
            intent = "callback_requested"
            sentiment = "neutral"
        else:
            intent = "unclear"
            sentiment = "neutral"
        
        return {
            "intent": intent,
            "sentiment": sentiment,
            "requires_follow_up": intent in ["callback_requested", "unclear"]
        }


# Global instance
voice_conversation_ai = VoiceConversationAI()
