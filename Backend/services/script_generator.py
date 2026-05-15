"""
AI Script Generator for Voice Sales Campaigns
Generates complete sales scripts with objection handling
"""

import logging
import os
from typing import Dict, Any, Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class ScriptGenerator:
    """AI-powered sales script generator"""
    
    def __init__(self):
        self.groq_client = None
        self._initialize_groq()
    
    def _initialize_groq(self):
        """Initialize Groq API client"""
        try:
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                self.groq_client = Groq(api_key=api_key)
                logger.info("✅ Groq API initialized for script generator")
            else:
                logger.warning("⚠️ GROQ_API_KEY not found")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Groq: {e}")
    
    def generate_complete_script(
        self,
        campaign_details: Dict[str, Any],
        language: str = "english"
    ) -> Dict[str, Any]:
        """
        Generate complete sales script
        
        Args:
            campaign_details: Campaign information
            language: Script language
        
        Returns:
            Dictionary with complete script sections
        """
        try:
            prompt = self._build_script_prompt(campaign_details, language)
            
            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000
                )
                
                script_text = response.choices[0].message.content.strip()
                script = self._parse_script(script_text)
            else:
                script = self._generate_fallback_script(campaign_details, language)
            
            return script
            
        except Exception as e:
            logger.error(f"❌ Failed to generate script: {e}")
            return self._generate_fallback_script(campaign_details, language)
    
    def generate_opening_line(
        self,
        campaign_details: Dict[str, Any],
        language: str = "english"
    ) -> str:
        """Generate compelling opening line"""
        try:
            prompt = f"""Generate a compelling opening line for a sales call in {language}.

Campaign: {campaign_details.get('campaign_name', '')}
Business: {campaign_details.get('business_context', '')}
Offer: {campaign_details.get('offer_details', '')}
Target: {campaign_details.get('target_audience', '')}

Requirements:
- Grab attention immediately
- State purpose clearly
- Sound natural and friendly
- Create curiosity
- Under 30 words

Opening line:"""

            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.8,
                    max_tokens=100
                )
                return response.choices[0].message.content.strip()
            else:
                return self._generate_fallback_opening(campaign_details, language)
                
        except Exception as e:
            logger.error(f"❌ Failed to generate opening line: {e}")
            return self._generate_fallback_opening(campaign_details, language)
    
    def generate_objection_responses(
        self,
        campaign_details: Dict[str, Any],
        language: str = "english"
    ) -> Dict[str, str]:
        """Generate responses to common objections"""
        try:
            common_objections = [
                "Too expensive",
                "Not interested",
                "Already have a solution",
                "Need to think about it",
                "Call me later"
            ]
            
            responses = {}
            
            for objection in common_objections:
                prompt = f"""Generate a professional response to this objection in {language}:

Objection: "{objection}"

Campaign context:
- Business: {campaign_details.get('business_context', '')}
- Offer: {campaign_details.get('offer_details', '')}

Requirements:
- Acknowledge the concern
- Provide value-focused counter
- Keep it conversational
- Under 50 words

Response:"""

                if self.groq_client:
                    response = self.groq_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=150
                    )
                    responses[objection] = response.choices[0].message.content.strip()
                else:
                    responses[objection] = self._generate_fallback_objection_response(objection, language)
            
            return responses
            
        except Exception as e:
            logger.error(f"❌ Failed to generate objection responses: {e}")
            return self._generate_fallback_objections(language)
    
    def generate_closing_line(
        self,
        campaign_details: Dict[str, Any],
        language: str = "english"
    ) -> str:
        """Generate strong closing line"""
        try:
            prompt = f"""Generate a strong closing line for a sales call in {language}.

Campaign goal: {campaign_details.get('campaign_goal', '')}
Offer: {campaign_details.get('offer_details', '')}

Requirements:
- Clear call-to-action
- Create urgency
- Make it easy to say yes
- Sound confident but not pushy
- Under 30 words

Closing line:"""

            if self.groq_client:
                response = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=100
                )
                return response.choices[0].message.content.strip()
            else:
                return self._generate_fallback_closing(campaign_details, language)
                
        except Exception as e:
            logger.error(f"❌ Failed to generate closing line: {e}")
            return self._generate_fallback_closing(campaign_details, language)
    
    def _build_script_prompt(self, campaign_details: Dict[str, Any], language: str) -> str:
        """Build prompt for complete script generation"""
        return f"""Generate a complete sales call script in {language}.

Campaign Details:
- Name: {campaign_details.get('campaign_name', '')}
- Goal: {campaign_details.get('campaign_goal', '')}
- Business: {campaign_details.get('business_context', '')}
- Offer: {campaign_details.get('offer_details', '')}
- Target Audience: {campaign_details.get('target_audience', '')}
- Call Purpose: {campaign_details.get('call_purpose', '')}

Generate a structured script with these sections:

1. OPENING LINE
- Grab attention
- Introduce yourself and company
- State purpose

2. QUALIFICATION QUESTIONS
- 3-4 questions to understand customer needs
- Open-ended questions

3. VALUE PROPOSITION
- Explain the offer
- Highlight key benefits
- Address pain points

4. OBJECTION HANDLING
- Responses to 3 common objections

5. CLOSING
- Strong call-to-action
- Next steps
- Create urgency

6. FOLLOW-UP LINE
- If customer needs time

Requirements:
- Natural and conversational
- Not robotic or scripted-sounding
- Appropriate for {language} speakers
- Professional but friendly
- Focus on benefits, not features

Generate the complete script:"""
    
    def _parse_script(self, script_text: str) -> Dict[str, Any]:
        """Parse generated script into sections"""
        sections = {
            "opening_line": "",
            "qualification_questions": [],
            "value_proposition": "",
            "objection_handling": {},
            "closing_line": "",
            "follow_up_line": "",
            "full_script": script_text
        }
        
        # Simple parsing - extract sections
        lines = script_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect sections
            if "OPENING" in line.upper():
                current_section = "opening_line"
            elif "QUALIFICATION" in line.upper() or "QUESTIONS" in line.upper():
                current_section = "qualification_questions"
            elif "VALUE" in line.upper() or "PROPOSITION" in line.upper():
                current_section = "value_proposition"
            elif "OBJECTION" in line.upper():
                current_section = "objection_handling"
            elif "CLOSING" in line.upper():
                current_section = "closing_line"
            elif "FOLLOW" in line.upper():
                current_section = "follow_up_line"
            elif current_section:
                # Add content to current section
                if current_section == "qualification_questions":
                    if line.startswith(('-', '•', '*', '1', '2', '3', '4')):
                        sections[current_section].append(line.lstrip('-•*123456789. '))
                elif current_section == "objection_handling":
                    # Parse objection: response pairs
                    if ':' in line:
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            sections[current_section][parts[0].strip()] = parts[1].strip()
                else:
                    if sections[current_section]:
                        sections[current_section] += " " + line
                    else:
                        sections[current_section] = line
        
        return sections
    
    def _generate_fallback_script(self, campaign_details: Dict[str, Any], language: str) -> Dict[str, Any]:
        """Generate fallback script when API unavailable"""
        business = campaign_details.get('business_context', 'our company')
        offer = campaign_details.get('offer_details', 'special offer')
        
        scripts = {
            "english": {
                "opening_line": f"Hello! I'm calling from {business}. We have an exclusive {offer} that could benefit you. Do you have a moment?",
                "qualification_questions": [
                    "What challenges are you currently facing in this area?",
                    "Have you tried similar solutions before?",
                    "What would be most valuable to you right now?"
                ],
                "value_proposition": f"Our {offer} helps you save time and money while improving results. We've helped hundreds of customers achieve their goals.",
                "objection_handling": {
                    "Too expensive": "I understand budget is important. Let me show you how this pays for itself quickly.",
                    "Not interested": "I appreciate your honesty. May I ask what would make this more relevant to you?",
                    "Need to think": "Absolutely! What specific information would help you decide?"
                },
                "closing_line": "Can we schedule a quick 15-minute demo to show you exactly how this works?",
                "follow_up_line": "No problem! When would be a better time for me to call you back?",
                "full_script": "Complete sales script generated."
            },
            "hinglish": {
                "opening_line": f"Namaste! Main {business} se bol raha hoon. Hamare paas ek special {offer} hai. Kya aap 2 minute de sakte hain?",
                "qualification_questions": [
                    "Aapko is area mein kya challenges face ho rahe hain?",
                    "Kya aapne pehle koi similar solution try kiya hai?",
                    "Aapke liye abhi sabse important kya hoga?"
                ],
                "value_proposition": f"Hamara {offer} aapka time aur paisa dono bachata hai. Bahut customers ko help kar chuka hai.",
                "objection_handling": {
                    "Too expensive": "Main samajhta hoon. Lekin yeh investment jaldi return deta hai.",
                    "Not interested": "Koi baat nahi. Kya main puch sakta hoon ki aapko kya chahiye?",
                    "Need to think": "Bilkul! Aapko decide karne ke liye kya information chahiye?"
                },
                "closing_line": "Kya hum ek 15 minute ka demo schedule kar sakte hain?",
                "follow_up_line": "Koi problem nahi! Aapko kab call karun?",
                "full_script": "Complete sales script generated."
            },
            "telugu": {
                "opening_line": f"Namaskaram! Nenu {business} nundi matladutunnanu. Maku oka special {offer} undi. Meeku 2 nimishalu undha?",
                "qualification_questions": [
                    "Meeku ee area lo emi challenges face avutunnai?",
                    "Meeru eppudu ilanti solution try chesara?",
                    "Meeku ippudu emiti important?"
                ],
                "value_proposition": f"Maa {offer} meeku time mariyu dabbu rendu save chestundi. Chala customers ki help chesindi.",
                "objection_handling": {
                    "Too expensive": "Nenu ardham chesukunnanu. Kani idi tondarga return istundi.",
                    "Not interested": "Parledu. Meeku emiti kavali ani adagavacha?",
                    "Need to think": "Avunu! Meeku decide cheyadaniki emi information kavali?"
                },
                "closing_line": "Memu oka 15 nimishala demo schedule cheyavacha?",
                "follow_up_line": "Problem ledu! Nenu eppudu call cheyali?",
                "full_script": "Complete sales script generated."
            }
        }
        
        return scripts.get(language, scripts["english"])
    
    def _generate_fallback_opening(self, campaign_details: Dict[str, Any], language: str) -> str:
        """Generate fallback opening line"""
        business = campaign_details.get('business_context', 'our company')
        
        openings = {
            "english": f"Hello! I'm calling from {business} with an exclusive offer for you.",
            "hinglish": f"Namaste! Main {business} se bol raha hoon aapke liye ek special offer ke saath.",
            "telugu": f"Namaskaram! Nenu {business} nundi matladutunnanu meeku oka special offer tho."
        }
        return openings.get(language, openings["english"])
    
    def _generate_fallback_closing(self, campaign_details: Dict[str, Any], language: str) -> str:
        """Generate fallback closing line"""
        closings = {
            "english": "Can we schedule a quick call to discuss this further?",
            "hinglish": "Kya hum iske baare mein aur baat karne ke liye ek call schedule kar sakte hain?",
            "telugu": "Memu deeniki gurinchi inka matladataniki oka call schedule cheyavacha?"
        }
        return closings.get(language, closings["english"])
    
    def _generate_fallback_objection_response(self, objection: str, language: str) -> str:
        """Generate fallback objection response"""
        responses = {
            "english": "I understand your concern. Let me explain how we can address that.",
            "hinglish": "Main samajhta hoon. Chaliye main batata hoon ki hum isko kaise solve kar sakte hain.",
            "telugu": "Nenu ardham chesukunnanu. Memu idini ela solve cheyagalamo chepputa."
        }
        return responses.get(language, responses["english"])
    
    def _generate_fallback_objections(self, language: str) -> Dict[str, str]:
        """Generate fallback objection responses"""
        objections = {
            "english": {
                "Too expensive": "I understand budget is important. Let me show you the value.",
                "Not interested": "I appreciate your honesty. What would make this relevant?",
                "Already have a solution": "That's great! How is it working for you?",
                "Need to think about it": "Absolutely! What information would help you decide?",
                "Call me later": "Of course! When would be a good time?"
            },
            "hinglish": {
                "Too expensive": "Main samajhta hoon. Lekin value dekh lijiye.",
                "Not interested": "Koi baat nahi. Kya relevant hoga aapke liye?",
                "Already have a solution": "Achha! Kaisa chal raha hai?",
                "Need to think about it": "Bilkul! Kya information chahiye?",
                "Call me later": "Zaroor! Kab call karun?"
            },
            "telugu": {
                "Too expensive": "Nenu ardham chesukunnanu. Kani value chudandi.",
                "Not interested": "Parledu. Meeku emiti relevant?",
                "Already have a solution": "Bagundi! Ela work avutundi?",
                "Need to think about it": "Avunu! Emi information kavali?",
                "Call me later": "Tappakunda! Eppudu call cheyali?"
            }
        }
        return objections.get(language, objections["english"])


# Singleton instance
script_generator = ScriptGenerator()
