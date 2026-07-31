"""
AI Email Assistant Plugin
AI assistant for email composition, response, and management
"""
import logging
import os
import json
import re
from typing import Dict, Any, List
from plugins.base import AIPlugin

logger = logging.getLogger(__name__)

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

class PluginMain(AIPlugin):
    """
    AI Email Assistant Plugin Implementation
    """
    
    # Plugin metadata
    __plugin__ = True
    plugin_key = "ai_productivity_email_assistant"
    plugin_name = "📧 AI Email Assistant"
    plugin_description = "AI assistant for email composition, response, and management"
    plugin_icon = "📧"
    plugin_category = "ai_productivity"
    plugin_version = "1.0.0"
    
    def get_info(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Return plugin information"""
        try:
            return {
                "key": self.plugin_key,
                "name": self.plugin_name,
                "description": self.plugin_description,
                "icon": self.plugin_icon,
                "category": self.plugin_category,
                "version": self.plugin_version
            }
        except Exception as e:
            logger.error(f"Failed to get plugin info: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_actions(self) -> List[Dict[str, Any]]:
        """Return list of available actions"""
        return [
            {
                "action": "compose_email",
                "name": "Compose Email",
                "description": "AI-assisted email composition",
                "parameters": {
                    "subject": {"type": "string", "required": True},
                    "recipient_context": {"type": "string", "required": False},
                    "tone": {"type": "string", "enum": ["professional", "friendly", "formal", "casual"], "default": "professional"},
                    "purpose": {"type": "string", "enum": ["inquiry", "follow_up", "proposal", "meeting_request", "general"], "default": "general"},
                    "key_points": {"type": "array", "required": False}
                }
            },
            {
                "action": "suggest_response",
                "name": "Suggest Email Response",
                "description": "Generate response suggestions for incoming emails",
                "parameters": {
                    "original_email": {"type": "string", "required": True},
                    "response_type": {"type": "string", "enum": ["quick", "detailed", "decline", "accept"], "default": "detailed"},
                    "tone": {"type": "string", "enum": ["professional", "friendly", "formal", "casual"], "default": "professional"}
                }
            },
            {
                "action": "analyze_email",
                "name": "Analyze Email",
                "description": "Analyze email content for sentiment, priority, and action items",
                "parameters": {
                    "email_content": {"type": "string", "required": True},
                    "analysis_type": {"type": "string", "enum": ["sentiment", "priority", "action_items", "full"], "default": "full"}
                }
            },
            {
                "action": "improve_draft",
                "name": "Improve Email Draft",
                "description": "Improve existing email draft with AI suggestions",
                "parameters": {
                    "draft_content": {"type": "string", "required": True},
                    "improvement_focus": {"type": "string", "enum": ["clarity", "tone", "conciseness", "persuasiveness"], "default": "clarity"}
                }
            },
            {
                "action": "generate_template",
                "name": "Generate Email Template",
                "description": "Create reusable email templates",
                "parameters": {
                    "template_type": {"type": "string", "required": True},
                    "industry": {"type": "string", "required": False},
                    "customization": {"type": "object", "required": False}
                }
            }
        ]
    
    def get_config_schema(self) -> Dict[str, Any]:
        """Return configuration schema"""
        return {
            "type": "object",
            "properties": {
                "default_tone": {
                    "type": "string",
                    "enum": ["professional", "friendly", "formal", "casual"],
                    "default": "professional",
                    "description": "Default tone for email composition"
                },
                "template_suggestions": {
                    "type": "boolean",
                    "default": True,
                    "description": "Show template suggestions during composition"
                },
                "priority_detection": {
                    "type": "boolean",
                    "default": True,
                    "description": "Automatically detect email priority"
                },
                "grammar_check": {
                    "type": "boolean",
                    "default": True,
                    "description": "Enable grammar and spell checking"
                },
                "signature_integration": {
                    "type": "boolean",
                    "default": True,
                    "description": "Automatically add email signature"
                }
            },
            "required": []
        }
    def initialize(self, context: Any, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Initialize plugin"""
        try:
            config = {}
            if isinstance(context, dict):
                if "user_config" in context or "plugin_config" in context:
                    user_config = context.get("user_config") or {}
                    plugin_config = context.get("plugin_config") or {}
                    config = {**plugin_config, **user_config}
                else:
                    config = context
            elif isinstance(params, dict) and params:
                config = params

            self.config = config
            self._initialized = True
            logger.info("AI Productivity Email Assistant initialized successfully")
            return {
                "success": True,
                "message": "Initialized successfully"
            }
        except Exception as e:
            logger.error(f"Failed to initialize plugin: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def cleanup(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Cleanup plugin resources"""
        try:
            self._initialized = False
            logger.info("AI Productivity Email Assistant cleaned up")
            return {
                "success": True,
                "message": "Cleaned up successfully"
            }
        except Exception as e:
            logger.error(f"Failed to cleanup plugin: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_status(self, context: Any = None, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get plugin status"""
        try:
            ai_enabled = bool(os.getenv("OPENAI_API_KEY")) and (AsyncOpenAI is not None)
            initialized = getattr(self, "_initialized", False)
            return {
                "success": True,
                "plugin": "AI Productivity Email Assistant",
                "initialized": initialized,
                "ai_enabled": ai_enabled
            }
        except Exception as e:
            logger.error(f"Failed to get status: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def validate_config(self, context: Any, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Validate configuration"""
        try:
            config = {}
            if isinstance(context, dict):
                if "user_config" in context or "plugin_config" in context:
                    user_config = context.get("user_config") or {}
                    plugin_config = context.get("plugin_config") or {}
                    config = {**plugin_config, **user_config}
                else:
                    config = context

            if isinstance(params, dict) and params:
                config = {**config, **params}

            errors = []

            # Validate recipient
            recipient = config.get("recipient")
            if not recipient:
                errors.append("recipient is required")
            elif not isinstance(recipient, str):
                errors.append("recipient must be a string")

            # Validate purpose
            purpose = config.get("purpose")
            if not purpose:
                errors.append("purpose is required")
            elif not isinstance(purpose, str):
                errors.append("purpose must be a string")

            # Validate tone
            allowed_tones = ["Professional", "Friendly", "Formal", "Casual"]
            tone = config.get("tone")
            if not tone:
                errors.append("tone is required")
            elif not isinstance(tone, str) or tone.title() not in allowed_tones:
                errors.append(f"Invalid tone. Allowed values: {', '.join(allowed_tones)}")

            # Validate length
            allowed_lengths = ["Short", "Medium", "Long"]
            length = config.get("length")
            if not length:
                errors.append("length is required")
            elif not isinstance(length, str) or length.title() not in allowed_lengths:
                errors.append(f"Invalid length. Allowed values: {', '.join(allowed_lengths)}")

            return {
                "valid": len(errors) == 0,
                "errors": errors
            }
        except Exception as e:
            logger.error(f"Failed to validate config: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def compose_email(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """AI-assisted email composition"""
        try:
            subject = params.get("subject") or self.config.get("subject") or "No Subject"
            recipient = params.get("recipient") or params.get("recipient_context") or self.config.get("recipient") or ""
            tone = params.get("tone") or self.config.get("default_tone") or self.config.get("tone") or "Professional"
            purpose = params.get("purpose") or self.config.get("purpose") or "general"
            key_points = params.get("key_points") or self.config.get("key_points") or []
            length = params.get("length") or self.config.get("length") or "Medium"

            logger.info(f"Composing email with subject: {subject}, tone: {tone}, purpose: {purpose}")

            api_key = os.getenv("OPENAI_API_KEY")
            if api_key and AsyncOpenAI:
                client = AsyncOpenAI(api_key=api_key)

                prompt = f"""
Compose an email based on the following details:
Subject: {subject}
Recipient: {recipient}
Tone: {tone}
Purpose: {purpose}
Key Points: {', '.join(key_points) if key_points else 'None'}
Length: {length}

Please respond with ONLY the email body. Do not include subject line, placeholders, or any additional text.
"""
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful AI assistant that writes emails."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                body = response.choices[0].message.content.strip()
                word_count = len(body.split())

                return {
                    "success": True,
                    "subject": subject,
                    "body": body,
                    "word_count": word_count
                }
            else:
                # Deterministic mock content
                email_content = ""
                key_points_str = ""
                if key_points:
                    if len(key_points) == 1:
                        key_points_str = key_points[0]
                    else:
                        formatted = "\n".join([f"• {point}" for point in key_points])
                        key_points_str = f"Key points to discuss:\n\n{formatted}"

                if purpose == "meeting_request":
                    email_content = f"""Dear {recipient or '[Recipient Name]'},

I hope this email finds you well. I would like to schedule a meeting with you to discuss {subject.lower()}.

Based on your availability, I suggest the following time slots:
- [Date] at [Time]
- [Date] at [Time]
- [Date] at [Time]

Please let me know which option works best for you, or suggest alternative times that might be more convenient.

Looking forward to our discussion.

Best regards,
[Your Name]"""

                elif purpose == "follow_up":
                    email_content = f"""Dear {recipient or '[Recipient Name]'},

I wanted to follow up on our previous conversation regarding {subject.lower()}.

{key_points_str}

Please let me know if you have any questions or if there's anything else I can provide to move this forward.

Thank you for your time and consideration.

Best regards,
[Your Name]"""

                elif purpose == "proposal":
                    email_content = f"""Dear {recipient or '[Recipient Name]'},

I am pleased to present this proposal for {subject.lower()}.

{key_points_str}

I believe this solution will provide significant value to your organization. I would welcome the opportunity to discuss this proposal in more detail at your convenience.

Best regards,
[Your Name]"""

                else:  # general purpose
                    email_content = f"""Dear {recipient or '[Recipient Name]'},

I hope this email finds you well.

{key_points_str if key_points_str else "I wanted to reach out regarding " + subject.lower() + "."}

Please let me know if you have any questions or if there's anything else I can help with.

Best regards,
[Your Name]"""

                # Apply tone adjustments
                t = tone.lower()
                if t == "friendly":
                    email_content = email_content.replace(f"Dear {recipient or '[Recipient Name]'},", f"Hi {recipient or '[Recipient Name]'}!")
                    email_content = email_content.replace("Best regards,", "Thanks!")
                elif t == "formal":
                    email_content = email_content.replace("I hope this email finds you well.", "I trust this communication reaches you in good health.")
                    email_content = email_content.replace("Best regards,", "Yours sincerely,")
                elif t == "casual":
                    email_content = email_content.replace(f"Dear {recipient or '[Recipient Name]'},", f"Hey {recipient or '[Recipient Name]'},")
                    email_content = email_content.replace("Best regards,", "Cheers,")

                # Apply length adjustment
                l = length.lower()
                lines = email_content.split("\n")
                if l == "short":
                    short_lines = []
                    if lines:
                        short_lines.append(lines[0])
                    for line in lines[1:]:
                        if line.strip():
                            short_lines.append("")
                            short_lines.append(line.strip())
                            break
                    short_lines.extend(["", "Best regards,", "[Your Name]"])
                    email_content = "\n".join(short_lines)
                elif l == "long":
                    email_content = email_content.replace("Best regards,", "I appreciate your prompt attention to this matter and look forward to hearing from you. Please do not hesitate to contact me if you need any additional information.\n\nBest regards,")

                return {
                    "success": True,
                    "subject": subject,
                    "body": email_content,
                    "word_count": len(email_content.split())
                }

        except Exception as e:
            logger.error(f"Failed to compose email: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _format_key_points(self, key_points: List[str]) -> str:
        """Format key points into email content"""
        if not key_points:
            return ""

        if len(key_points) == 1:
            return key_points[0]

        formatted_points = "\n".join([f"• {point}" for point in key_points])
        return f"Key points I wanted to discuss:\n\n{formatted_points}"

    async def suggest_response(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate response suggestions for incoming emails"""
        try:
            original_email = params.get("original_email") or ""
            response_type = params.get("response_type") or "detailed"
            tone = params.get("tone") or "professional"

            logger.info(f"Generating {response_type} response suggestion with {tone} tone")

            api_key = os.getenv("OPENAI_API_KEY")
            if api_key and AsyncOpenAI:
                client = AsyncOpenAI(api_key=api_key)

                prompt = f"""
Analyze this incoming email:
"{original_email}"

Generate exactly 3 distinct response suggestions.
Response Type: {response_type}
Tone: {tone}

Return the response as a JSON object with a key "responses" containing a list of 3 strings. Example:
{
  "responses": [
    "Response 1",
    "Response 2",
    "Response 3"
  ]
}
Ensure it is valid JSON.
"""
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful AI assistant that writes email responses."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content.strip()

                try:
                    data = json.loads(content)
                    responses = data.get("responses", [])
                    if not isinstance(responses, list):
                        responses = []
                except Exception:
                    responses = []

                if not responses:
                    responses = re.findall(r'"([^"]*)"', content)
                    responses = [r for r in responses if len(r) > 10]

                if len(responses) < 3:
                    responses = list(responses) + [f"Alternative response {i}" for i in range(len(responses)+1, 4)]

                return {
                    "success": True,
                    "responses": responses[:3]
                }
            else:
                is_question = "?" in original_email
                is_meeting_request = any(word in original_email.lower() for word in ["meeting", "call", "schedule", "discuss"])

                responses = []
                if is_question:
                    responses.append("Thank you for your email. I'll look into this and get back to you shortly.")
                elif is_meeting_request:
                    responses.append("Thank you for reaching out. I'll check my calendar and get back to you with my availability.")
                else:
                    responses.append("Thank you for your email. I've received it and will respond in detail soon.")

                if response_type == "accept":
                    if is_meeting_request:
                        responses.append("Thank you for the meeting invitation. I accept and look forward to our discussion. Please let me know if you need anything from me in preparation.")
                    else:
                        responses.append("Thank you for your email. I accept your proposal/request and look forward to the next steps.")
                elif response_type == "decline":
                    responses.append("Thank you for reaching out. Unfortunately, I won't be able to proceed at this time due to current commitments. I appreciate your understanding and hope we can connect in the future.")
                else:
                    responses.append("Thank you for your email. I've reviewed your message and would be happy to discuss this further. Let me know if you have any specific questions.")

                responses.append("I have received your email and will review the details. I appreciate you bringing this to my attention and will follow up as needed. Best regards.")

                return {
                    "success": True,
                    "responses": responses[:3]
                }

        except Exception as e:
            logger.error(f"Failed to suggest response: {e}")
            return {
                "success": False,
                "error": str(e)
            }