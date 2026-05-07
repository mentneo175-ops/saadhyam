"""
Demo Companies Data for Voice Assistant
Pre-defined company information for testing without authentication
"""

DEMO_COMPANIES = {
    "amazon": {
        "name": "Amazon",
        "type": "E-commerce Giant",
        "industry": "Technology & Retail",
        "description": "World's largest online marketplace and cloud computing platform",
        "founded": "1994",
        "founder": "Jeff Bezos",
        "headquarters": "Seattle, Washington, USA",
        "revenue": "$514 billion (2022)",
        "employees": "1.5 million+",
        "strengths": [
            "Massive global distribution network",
            "AWS cloud services dominance",
            "Prime membership loyalty program",
            "Advanced logistics and delivery",
            "Strong brand recognition"
        ],
        "weaknesses": [
            "Labor relations challenges",
            "Regulatory scrutiny",
            "High operational costs",
            "Dependence on third-party sellers"
        ],
        "opportunities": [
            "Expansion in emerging markets",
            "Healthcare and pharmacy services",
            "Advertising business growth",
            "AI and machine learning integration"
        ],
        "threats": [
            "Intense competition from Walmart, Alibaba",
            "Regulatory challenges globally",
            "Cybersecurity risks",
            "Economic downturns affecting consumer spending"
        ],
        "products": [
            "Amazon.com marketplace",
            "Amazon Web Services (AWS)",
            "Prime Video",
            "Alexa and Echo devices",
            "Kindle e-readers",
            "Amazon Fresh grocery"
        ]
    },
    "flipkart": {
        "name": "Flipkart",
        "type": "E-commerce Platform",
        "industry": "Technology & Retail",
        "description": "India's leading e-commerce marketplace",
        "founded": "2007",
        "founder": "Sachin Bansal and Binny Bansal",
        "headquarters": "Bangalore, Karnataka, India",
        "revenue": "$6.2 billion (2022)",
        "employees": "50,000+",
        "parent_company": "Walmart (acquired in 2018)",
        "strengths": [
            "Strong presence in Indian market",
            "Wide product range",
            "Efficient supply chain",
            "Flipkart Plus loyalty program",
            "Strong mobile app presence"
        ],
        "weaknesses": [
            "Limited international presence",
            "Heavy losses despite high revenue",
            "Dependence on Indian market",
            "Competition from Amazon India"
        ],
        "opportunities": [
            "Growing Indian e-commerce market",
            "Tier 2 and Tier 3 city expansion",
            "Grocery and fashion segments",
            "Digital payments integration"
        ],
        "threats": [
            "Intense competition from Amazon",
            "Regulatory changes in India",
            "Rising customer acquisition costs",
            "Local retail resistance"
        ],
        "products": [
            "Flipkart marketplace",
            "Myntra (fashion)",
            "PhonePe (payments)",
            "Flipkart Grocery",
            "Flipkart Health+"
        ]
    },
    "google": {
        "name": "Google",
        "type": "Technology Giant",
        "industry": "Technology & Internet Services",
        "description": "World's leading search engine and digital advertising platform",
        "founded": "1998",
        "founder": "Larry Page and Sergey Brin",
        "headquarters": "Mountain View, California, USA",
        "parent_company": "Alphabet Inc.",
        "revenue": "$283 billion (2022)",
        "employees": "190,000+",
        "strengths": [
            "Dominant search engine market share (92%)",
            "Strong advertising platform (Google Ads)",
            "Android operating system",
            "YouTube video platform",
            "Google Cloud services",
            "Innovation in AI and machine learning"
        ],
        "weaknesses": [
            "Heavy dependence on advertising revenue",
            "Privacy concerns",
            "Regulatory scrutiny worldwide",
            "Failed social media attempts"
        ],
        "opportunities": [
            "Cloud computing expansion",
            "AI and machine learning products",
            "Healthcare technology",
            "Autonomous vehicles (Waymo)",
            "Emerging markets growth"
        ],
        "threats": [
            "Antitrust regulations",
            "Competition from Microsoft, Amazon",
            "Privacy legislation",
            "Ad-blocking technology",
            "Changing user behavior"
        ],
        "products": [
            "Google Search",
            "Google Ads",
            "YouTube",
            "Android",
            "Google Cloud Platform",
            "Gmail",
            "Google Maps",
            "Chrome browser"
        ]
    },
    "microsoft": {
        "name": "Microsoft",
        "type": "Technology Corporation",
        "industry": "Software & Cloud Services",
        "description": "Leading software, cloud computing, and AI company",
        "founded": "1975",
        "founder": "Bill Gates and Paul Allen",
        "headquarters": "Redmond, Washington, USA",
        "revenue": "$211 billion (2023)",
        "employees": "220,000+",
        "strengths": [
            "Azure cloud platform growth",
            "Office 365 subscription model",
            "Windows operating system dominance",
            "LinkedIn acquisition success",
            "Strong enterprise relationships",
            "AI integration (OpenAI partnership)"
        ],
        "weaknesses": [
            "Mobile platform failure",
            "Dependence on legacy products",
            "Competition in cloud services",
            "Slow innovation in some areas"
        ],
        "opportunities": [
            "AI and ChatGPT integration",
            "Gaming and Xbox expansion",
            "Cloud computing growth",
            "Cybersecurity services",
            "Metaverse and mixed reality"
        ],
        "threats": [
            "Intense cloud competition (AWS, Google)",
            "Open-source software alternatives",
            "Cybersecurity threats",
            "Regulatory challenges",
            "Economic downturns"
        ],
        "products": [
            "Windows OS",
            "Microsoft 365 (Office)",
            "Azure Cloud",
            "LinkedIn",
            "Xbox",
            "Teams",
            "Bing",
            "GitHub"
        ]
    }
}


def get_company_info(company_name: str) -> dict:
    """Get company information by name (case-insensitive)"""
    company_key = company_name.lower().strip()
    return DEMO_COMPANIES.get(company_key)


def get_all_companies() -> list:
    """Get list of all available companies"""
    return list(DEMO_COMPANIES.keys())


def search_company(query: str) -> dict:
    """Search for company by name in query"""
    query_lower = query.lower()
    for company_key, company_data in DEMO_COMPANIES.items():
        if company_key in query_lower or company_data["name"].lower() in query_lower:
            return company_data
    return None


def get_company_context(company_name: str) -> str:
    """Format company information as context string"""
    company = get_company_info(company_name)
    if not company:
        return None
    
    context_parts = [
        f"Company: {company['name']}",
        f"Type: {company['type']}",
        f"Industry: {company['industry']}",
        f"Description: {company['description']}",
        f"Founded: {company['founded']}",
        f"Founder: {company['founder']}",
        f"Headquarters: {company['headquarters']}",
        f"Revenue: {company.get('revenue', 'N/A')}",
        f"Employees: {company.get('employees', 'N/A')}",
    ]
    
    if company.get('parent_company'):
        context_parts.append(f"Parent Company: {company['parent_company']}")
    
    context_parts.append("\nStrengths:")
    for strength in company['strengths']:
        context_parts.append(f"  • {strength}")
    
    context_parts.append("\nWeaknesses:")
    for weakness in company['weaknesses']:
        context_parts.append(f"  • {weakness}")
    
    context_parts.append("\nOpportunities:")
    for opportunity in company['opportunities']:
        context_parts.append(f"  • {opportunity}")
    
    context_parts.append("\nThreats:")
    for threat in company['threats']:
        context_parts.append(f"  • {threat}")
    
    context_parts.append("\nKey Products/Services:")
    for product in company['products']:
        context_parts.append(f"  • {product}")
    
    return "\n".join(context_parts)
