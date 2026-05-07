"""
Demo Assistant Service - Works without authentication
Uses pre-defined company data for testing
"""

import logging
import re
from services.demo_companies import (
    get_all_companies, 
    search_company, 
    get_company_context,
    DEMO_COMPANIES
)

logger = logging.getLogger(__name__)


def detect_company_in_query(query: str) -> str:
    """Detect which company the user is asking about"""
    query_lower = query.lower()
    
    # Check for each company name
    for company_key in get_all_companies():
        if company_key in query_lower:
            return company_key
    
    # Check for full company names
    for company_key, company_data in DEMO_COMPANIES.items():
        if company_data["name"].lower() in query_lower:
            return company_key
    
    return None


def generate_demo_response(query: str) -> str:
    """
    Generate response for demo mode using pre-defined company data.
    No API calls, instant responses.
    """
    query_lower = query.lower()
    
    # List available companies
    if any(word in query_lower for word in ["what companies", "which companies", "list companies", "available companies", "companies you have"]):
        companies = get_all_companies()
        company_names = [DEMO_COMPANIES[c]["name"] for c in companies]
        return f"I have information about {len(companies)} companies: {', '.join(company_names)}. Ask me anything about these companies!"
    
    # Detect which company user is asking about
    company_key = detect_company_in_query(query)
    
    if not company_key:
        # No specific company detected
        return "I have information about Amazon, Flipkart, Google, and Microsoft. Please ask me about one of these companies!"
    
    company = DEMO_COMPANIES[company_key]
    
    # Company name query
    if any(word in query_lower for word in ["name", "called", "company name"]):
        return f"The company is {company['name']}, {company['description']}."
    
    # Company type/industry
    if any(word in query_lower for word in ["type", "industry", "sector", "what is", "tell me about"]):
        return f"{company['name']} is a {company['type']} in the {company['industry']} industry. {company['description']}. Founded in {company['founded']} by {company['founder']}."
    
    # Founder query
    if any(word in query_lower for word in ["founder", "founded by", "who started", "who created"]):
        return f"{company['name']} was founded in {company['founded']} by {company['founder']}. It's headquartered in {company['headquarters']}."
    
    # Revenue/financial query
    if any(word in query_lower for word in ["revenue", "earnings", "money", "financial", "sales"]):
        revenue = company.get('revenue', 'Not available')
        return f"{company['name']} has a revenue of {revenue} with {company.get('employees', 'many')} employees worldwide."
    
    # Strengths query
    if any(word in query_lower for word in ["strength", "strong", "advantage", "good at", "best"]):
        strengths = company['strengths'][:3]  # Top 3
        strengths_text = ", ".join(strengths)
        return f"{company['name']}'s main strengths are: {strengths_text}. These give them a competitive advantage in the market."
    
    # Weaknesses query
    if any(word in query_lower for word in ["weakness", "weak", "challenge", "problem", "issue"]):
        weaknesses = company['weaknesses'][:3]  # Top 3
        weaknesses_text = ", ".join(weaknesses)
        return f"{company['name']} faces challenges including: {weaknesses_text}. These are areas they need to address."
    
    # Opportunities query
    if any(word in query_lower for word in ["opportunit", "growth", "expand", "future", "potential"]):
        opportunities = company['opportunities'][:3]  # Top 3
        opportunities_text = ", ".join(opportunities)
        return f"{company['name']} has opportunities in: {opportunities_text}. These could drive future growth."
    
    # Threats query
    if any(word in query_lower for word in ["threat", "risk", "competition", "competitor", "danger"]):
        threats = company['threats'][:3]  # Top 3
        threats_text = ", ".join(threats)
        return f"{company['name']} faces threats from: {threats_text}. These require strategic attention."
    
    # Products/services query
    if any(word in query_lower for word in ["product", "service", "offer", "sell", "provide"]):
        products = company['products'][:4]  # Top 4
        products_text = ", ".join(products)
        return f"{company['name']}'s key products and services include: {products_text}, among others."
    
    # SWOT analysis
    if "swot" in query_lower or "analysis" in query_lower:
        return f"{company['name']} SWOT: Strengths include {company['strengths'][0]}. Main weakness is {company['weaknesses'][0]}. Key opportunity is {company['opportunities'][0]}. Primary threat is {company['threats'][0]}."
    
    # Headquarters/location
    if any(word in query_lower for word in ["where", "location", "headquarter", "based"]):
        return f"{company['name']} is headquartered in {company['headquarters']}. It was founded in {company['founded']}."
    
    # Employees
    if any(word in query_lower for word in ["employee", "staff", "people", "workforce", "team"]):
        return f"{company['name']} has approximately {company.get('employees', 'many')} employees worldwide, making it one of the largest employers in the {company['industry']} sector."
    
    # Comparison query
    if "compare" in query_lower or "vs" in query_lower or "versus" in query_lower:
        # Try to find another company in the query
        other_companies = [c for c in get_all_companies() if c != company_key and c in query_lower]
        if other_companies:
            other_company = DEMO_COMPANIES[other_companies[0]]
            return f"{company['name']} and {other_company['name']} are both leaders in {company['industry']}. {company['name']}'s strength is {company['strengths'][0]}, while {other_company['name']} excels at {other_company['strengths'][0]}."
        else:
            return f"{company['name']} is a major player in {company['industry']}. Its main competitive advantage is {company['strengths'][0]}."
    
    # Default: General company info
    return f"{company['name']} is a {company['type']} founded in {company['founded']} by {company['founder']}. {company['description']}. Key strength: {company['strengths'][0]}."


# Quick response mapping for common queries
QUICK_RESPONSES = {
    "hello": "Hello! I can tell you about Amazon, Flipkart, Google, and Microsoft. What would you like to know?",
    "hi": "Hi there! Ask me about Amazon, Flipkart, Google, or Microsoft!",
    "help": "I have information about 4 major companies: Amazon, Flipkart, Google, and Microsoft. You can ask about their strengths, weaknesses, products, revenue, founders, and more!",
    "thank": "You're welcome! Feel free to ask about any of the companies!",
    "thanks": "You're welcome! Happy to help!",
}


def get_demo_response(query: str) -> str:
    """
    Main function to get demo response.
    Fast, no API calls, works offline.
    """
    query_lower = query.lower().strip()
    
    # Check for quick responses
    for keyword, response in QUICK_RESPONSES.items():
        if keyword in query_lower:
            return response
    
    # Generate detailed response
    try:
        response = generate_demo_response(query)
        return response
    except Exception as e:
        logger.error(f"Error generating demo response: {e}")
        return "I have information about Amazon, Flipkart, Google, and Microsoft. Please ask me about one of these companies!"
