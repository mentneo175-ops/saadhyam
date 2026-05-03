"""
Prompt Builder for Review Reply AI
Creates structured prompts for generating replies
"""

from typing import Optional


def build_prompt(
    review: str,
    rating: int,
    business_type: str,
    tone: str = "professional"
) -> str:
    """
    Build a structured prompt for generating review replies
    
    Args:
        review: Customer review text
        rating: Rating (1-5 stars)
        business_type: Type of business (e.g., "Restaurant", "Hotel", "E-commerce")
        tone: Tone of reply (professional, friendly, calm, grateful, apologetic)
    
    Returns:
        Formatted prompt for the model
    """
    
    # Tone descriptions
    tone_descriptions = {
        "professional": "professional and courteous",
        "friendly": "warm and friendly",
        "calm": "calm and understanding",
        "grateful": "grateful and appreciative",
        "apologetic": "apologetic and solution-focused"
    }
    
    tone_desc = tone_descriptions.get(tone, "professional and courteous")
    
    # Rating context
    rating_context = {
        1: "This is a 1-star review indicating a very negative experience.",
        2: "This is a 2-star review indicating a poor experience.",
        3: "This is a 3-star review indicating a mixed experience.",
        4: "This is a 4-star review indicating a good experience.",
        5: "This is a 5-star review indicating an excellent experience."
    }
    
    rating_desc = rating_context.get(rating, "This is a customer review.")
    
    prompt = f"""You are a professional customer service representative for a {business_type} business.

{rating_desc}

Your task is to generate a {tone_desc} reply to the following customer review.

Guidelines:
- Keep the reply concise (2-3 sentences maximum)
- Address the customer's concerns or compliments
- Offer solutions if there are issues
- Thank the customer for their feedback
- Maintain a professional tone
- Do not make promises you cannot keep
- Be genuine and empathetic

Customer Review:
"{review}"

Generate a professional reply:"""
    
    return prompt


def build_system_prompt() -> str:
    """
    Build system prompt for chat template
    """
    return """You are an expert customer service representative. 
Your role is to craft thoughtful, professional, and empathetic responses to customer reviews.
Always prioritize customer satisfaction and business reputation."""


def build_chat_prompt(
    review: str,
    rating: int,
    business_type: str,
    tone: str = "professional"
) -> list:
    """
    Build chat-formatted prompt for models with chat templates
    
    Args:
        review: Customer review text
        rating: Rating (1-5 stars)
        business_type: Type of business
        tone: Tone of reply
    
    Returns:
        List of message dicts for chat template
    """
    
    system_prompt = build_system_prompt()
    user_prompt = build_prompt(review, rating, business_type, tone)
    
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
