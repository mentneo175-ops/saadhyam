"""
Plugin Initialization Service - Phase 2
Continues registration of enterprise plugins (E-Commerce through AI Productivity)
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from models.plugins import PluginCategory
from services.plugin_service import plugin_manager

logger = logging.getLogger(__name__)

async def register_ecommerce_plugins(db: AsyncSession):
    """Register E-Commerce category plugins"""
    logger.info("🛒 Registering E-Commerce plugins...")
    
    # Shopify Connector
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_shopify_connector",
        name="🛍️ Shopify Connector",
        category=PluginCategory.ECOMMERCE,
        description="Sync products, orders, and inventory with Shopify stores",
        icon="🛍️",
        config_schema={
            "type": "object",
            "properties": {
                "shopify_store_url": {"type": "string", "required": True},
                "api_key": {"type": "string", "required": True},
                "sync_frequency": {"type": "string", "default": "hourly"}
            }
        }
    )
    
    # WooCommerce Connector
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_woocommerce_connector",
        name="🔧 WooCommerce Connector",
        category=PluginCategory.ECOMMERCE,
        description="Integrate with WooCommerce for order and product management",
        icon="🔧",
        config_schema={
            "type": "object",
            "properties": {
                "site_url": {"type": "string", "required": True},
                "consumer_key": {"type": "string", "required": True},
                "consumer_secret": {"type": "string", "required": True}
            }
        }
    )
    
    # Amazon Seller Hub
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_amazon_seller",
        name="📦 Amazon Seller Hub",
        category=PluginCategory.ECOMMERCE,
        description="Manage Amazon seller account with inventory and order sync",
        icon="📦",
        config_schema={
            "type": "object",
            "properties": {
                "seller_id": {"type": "string", "required": True},
                "marketplace": {"type": "string", "required": True},
                "fba_integration": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Flipkart Seller Hub
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_flipkart_seller",
        name="🏪 Flipkart Seller Hub",
        category=PluginCategory.ECOMMERCE,
        description="Manage Flipkart marketplace operations and listings",
        icon="🏪",
        config_schema={
            "type": "object",
            "properties": {
                "seller_id": {"type": "string", "required": True},
                "api_credentials": {"type": "object", "required": True},
                "listing_sync": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Order Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_order_management",
        name="📋 Order Management",
        category=PluginCategory.ECOMMERCE,
        description="Centralized order processing across all sales channels",
        icon="📋",
        config_schema={
            "type": "object",
            "properties": {
                "order_statuses": {"type": "array"},
                "fulfillment_rules": {"type": "object"},
                "inventory_integration": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Shipping Automation
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_shipping_automation",
        name="🚚 Shipping Automation",
        category=PluginCategory.ECOMMERCE,
        description="Automate shipping label generation and carrier selection",
        icon="🚚",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "carriers": {"type": "array"},
                "rate_shopping": {"type": "boolean", "default": True},
                "packaging_rules": {"type": "object"}
            }
        }
    )
    
    # Coupon Manager
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_coupon_manager",
        name="🎟️ Coupon Manager",
        category=PluginCategory.ECOMMERCE,
        description="Create and manage promotional coupons and discount codes",
        icon="🎟️",
        config_schema={
            "type": "object",
            "properties": {
                "coupon_types": {"type": "array"},
                "usage_limits": {"type": "object"},
                "expiration_rules": {"type": "object"}
            }
        }
    )
    
    # Customer Loyalty
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ecommerce_customer_loyalty",
        name="⭐ Customer Loyalty",
        category=PluginCategory.ECOMMERCE,
        description="Build customer loyalty programs with points and rewards",
        icon="⭐",
        config_schema={
            "type": "object",
            "properties": {
                "point_system": {"type": "object"},
                "reward_tiers": {"type": "array"},
                "redemption_rules": {"type": "object"}
            }
        }
    )
    
    logger.info("✅ E-Commerce plugins registered")

async def register_document_plugins(db: AsyncSession):
    """Register Document category plugins"""
    logger.info("📄 Registering Document plugins...")
    
    # AI Contract Writer
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_ai_contract_writer",
        name="📝 AI Contract Writer",
        category=PluginCategory.DOCUMENTS,
        description="Generate legal contracts and agreements with AI assistance",
        icon="📝",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "contract_types": {"type": "array"},
                "legal_jurisdiction": {"type": "string"},
                "template_customization": {"type": "boolean", "default": True}
            }
        }
    )
    
    # OCR Scanner
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_ocr_scanner",
        name="🔍 OCR Scanner",
        category=PluginCategory.DOCUMENTS,
        description="Extract text from images and documents using OCR technology",
        icon="🔍",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "supported_formats": {"type": "array"},
                "language_detection": {"type": "boolean", "default": True},
                "accuracy_threshold": {"type": "number", "default": 0.85}
            }
        }
    )
    
    # PDF Editor
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_pdf_editor",
        name="📑 PDF Editor",
        category=PluginCategory.DOCUMENTS,
        description="Edit, merge, split, and annotate PDF documents",
        icon="📑",
        config_schema={
            "type": "object",
            "properties": {
                "editing_features": {"type": "array"},
                "annotation_tools": {"type": "array"},
                "password_protection": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Digital Signature
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_digital_signature",
        name="✍️ Digital Signature",
        category=PluginCategory.DOCUMENTS,
        description="Add legally binding digital signatures to documents",
        icon="✍️",
        config_schema={
            "type": "object",
            "properties": {
                "signature_types": {"type": "array"},
                "authentication_methods": {"type": "array"},
                "audit_trail": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Invoice OCR
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_invoice_ocr",
        name="📋 Invoice OCR",
        category=PluginCategory.DOCUMENTS,
        description="Extract invoice data automatically using AI-powered OCR",
        icon="📋",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "data_fields": {"type": "array"},
                "validation_rules": {"type": "object"},
                "integration_accounting": {"type": "string"}
            }
        }
    )
    
    # NDA Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_nda_generator",
        name="🤐 NDA Generator",
        category=PluginCategory.DOCUMENTS,
        description="Generate Non-Disclosure Agreements with customizable terms",
        icon="🤐",
        config_schema={
            "type": "object",
            "properties": {
                "nda_types": {"type": "array"},
                "term_customization": {"type": "boolean", "default": True},
                "legal_templates": {"type": "array"}
            }
        }
    )
    
    # Proposal Templates
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_proposal_templates",
        name="📊 Proposal Templates",
        category=PluginCategory.DOCUMENTS,
        description="Professional proposal templates for different industries",
        icon="📊",
        config_schema={
            "type": "object",
            "properties": {
                "industry_templates": {"type": "array"},
                "custom_branding": {"type": "boolean", "default": True},
                "collaboration_tools": {"type": "boolean", "default": False}
            }
        }
    )
    
    # AI Document Review
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="documents_ai_review",
        name="🔎 AI Document Review",
        category=PluginCategory.DOCUMENTS,
        description="AI-powered document analysis for errors, compliance, and optimization",
        icon="🔎",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "review_types": {"type": "array"},
                "compliance_standards": {"type": "array"},
                "suggestion_level": {"type": "string", "enum": ["basic", "advanced", "comprehensive"]}
            }
        }
    )
    
    logger.info("✅ Document plugins registered")

async def register_legal_plugins(db: AsyncSession):
    """Register Legal category plugins"""
    logger.info("⚖️ Registering Legal plugins...")
    
    # Company Registration
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_company_registration",
        name="🏢 Company Registration",
        category=PluginCategory.LEGAL,
        description="Assist with company registration process and documentation",
        icon="🏢",
        config_schema={
            "type": "object",
            "properties": {
                "business_types": {"type": "array"},
                "jurisdiction": {"type": "string", "required": True},
                "document_preparation": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Trademark Assistant
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_trademark_assistant",
        name="™️ Trademark Assistant",
        category=PluginCategory.LEGAL,
        description="Search trademarks and assist with registration process",
        icon="™️",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "search_databases": {"type": "array"},
                "classification_help": {"type": "boolean", "default": True},
                "filing_assistance": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Compliance Tracker
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_compliance_tracker",
        name="📋 Compliance Tracker",
        category=PluginCategory.LEGAL,
        description="Track legal compliance requirements and deadlines",
        icon="📋",
        config_schema={
            "type": "object",
            "properties": {
                "compliance_areas": {"type": "array"},
                "deadline_alerts": {"type": "boolean", "default": True},
                "document_storage": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Legal Notice Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_notice_generator",
        name="📨 Legal Notice Generator",
        category=PluginCategory.LEGAL,
        description="Generate various types of legal notices and formal letters",
        icon="📨",
        config_schema={
            "type": "object",
            "properties": {
                "notice_types": {"type": "array"},
                "template_customization": {"type": "boolean", "default": True},
                "delivery_tracking": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Contract Review AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_contract_review_ai",
        name="🔍 Contract Review AI",
        category=PluginCategory.LEGAL,
        description="AI-powered contract analysis for risks and opportunities",
        icon="🔍",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "review_depth": {"type": "string", "enum": ["basic", "comprehensive", "expert"]},
                "risk_assessment": {"type": "boolean", "default": True},
                "clause_suggestions": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Privacy Policy Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_privacy_policy_generator",
        name="🔒 Privacy Policy Generator",
        category=PluginCategory.LEGAL,
        description="Generate GDPR and region-compliant privacy policies",
        icon="🔒",
        config_schema={
            "type": "object",
            "properties": {
                "regulations": {"type": "array"},
                "business_type": {"type": "string"},
                "data_processing": {"type": "object"}
            }
        }
    )
    
    # Terms & Conditions Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="legal_terms_conditions_generator",
        name="📋 Terms & Conditions Generator",
        category=PluginCategory.LEGAL,
        description="Create comprehensive terms and conditions for websites and services",
        icon="📋",
        config_schema={
            "type": "object",
            "properties": {
                "service_type": {"type": "string"},
                "jurisdiction": {"type": "string"},
                "customizable_clauses": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ Legal plugins registered")

async def register_analytics_plugins(db: AsyncSession):
    """Register Analytics category plugins"""
    logger.info("📊 Registering Analytics plugins...")
    
    # Executive Dashboard
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_executive_dashboard",
        name="📈 Executive Dashboard",
        category=PluginCategory.ANALYTICS,
        description="High-level business metrics and KPIs for executives",
        icon="📈",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "kpi_selection": {"type": "array"},
                "time_periods": {"type": "array"},
                "visualization_types": {"type": "array"}
            }
        }
    )
    
    # Sales Dashboard
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_sales_dashboard",
        name="💰 Sales Dashboard",
        category=PluginCategory.ANALYTICS,
        description="Comprehensive sales analytics and performance tracking",
        icon="💰",
        config_schema={
            "type": "object",
            "properties": {
                "sales_metrics": {"type": "array"},
                "pipeline_analysis": {"type": "boolean", "default": True},
                "forecast_modeling": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Marketing Dashboard
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_marketing_dashboard",
        name="📊 Marketing Dashboard",
        category=PluginCategory.ANALYTICS,
        description="Marketing campaign performance and ROI analysis",
        icon="📊",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "channel_attribution": {"type": "object"},
                "campaign_tracking": {"type": "boolean", "default": True},
                "roi_calculation": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Customer Analytics
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_customer_analytics",
        name="👥 Customer Analytics",
        category=PluginCategory.ANALYTICS,
        description="Deep customer behavior analysis and segmentation",
        icon="👥",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "segmentation_criteria": {"type": "array"},
                "behavior_tracking": {"type": "boolean", "default": True},
                "churn_prediction": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Employee Analytics
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_employee_analytics",
        name="👨‍💼 Employee Analytics",
        category=PluginCategory.ANALYTICS,
        description="HR analytics including performance, engagement, and retention",
        icon="👨‍💼",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "performance_metrics": {"type": "array"},
                "engagement_tracking": {"type": "boolean", "default": True},
                "retention_analysis": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Profit Prediction AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_profit_prediction",
        name="🔮 Profit Prediction AI",
        category=PluginCategory.ANALYTICS,
        description="AI-powered profit forecasting and scenario analysis",
        icon="🔮",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "prediction_horizon": {"type": "number", "default": 12},
                "scenario_modeling": {"type": "boolean", "default": True},
                "risk_analysis": {"type": "boolean", "default": True}
            }
        }
    )
    
    # KPI Monitor
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_kpi_monitor",
        name="📊 KPI Monitor",
        category=PluginCategory.ANALYTICS,
        description="Monitor and alert on key performance indicators",
        icon="📊",
        config_schema={
            "type": "object",
            "properties": {
                "kpi_definitions": {"type": "array"},
                "alert_thresholds": {"type": "object"},
                "reporting_frequency": {"type": "string"}
            }
        }
    )
    
    # AI Insights
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="analytics_ai_insights",
        name="🧠 AI Insights",
        category=PluginCategory.ANALYTICS,
        description="AI-generated business insights and recommendations",
        icon="🧠",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "insight_categories": {"type": "array"},
                "analysis_depth": {"type": "string", "enum": ["basic", "advanced", "comprehensive"]},
                "recommendation_priority": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ Analytics plugins registered")

async def register_ai_agent_plugins(db: AsyncSession):
    """Register AI Agents category plugins"""
    logger.info("🤖 Registering AI Agent plugins...")
    
    # CEO Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_ceo_agent",
        name="👔 CEO Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI assistant for strategic decisions and executive insights",
        icon="👔",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "decision_areas": {"type": "array"},
                "data_sources": {"type": "array"},
                "reporting_style": {"type": "string", "enum": ["executive", "detailed", "visual"]}
            }
        }
    )
    
    # Sales Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_sales_agent",
        name="💼 Sales Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI sales assistant for lead qualification and deal management",
        icon="💼",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "lead_scoring": {"type": "boolean", "default": True},
                "conversation_style": {"type": "string", "enum": ["professional", "friendly", "consultative"]},
                "integration_crm": {"type": "string"}
            }
        }
    )
    
    # HR Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_hr_agent",
        name="👥 HR Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI HR assistant for recruitment, onboarding, and employee queries",
        icon="👥",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "hr_functions": {"type": "array"},
                "policy_knowledge": {"type": "boolean", "default": True},
                "multilingual": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Finance Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_finance_agent",
        name="💰 Finance Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI finance assistant for budgeting, forecasting, and financial analysis",
        icon="💰",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "analysis_types": {"type": "array"},
                "reporting_formats": {"type": "array"},
                "risk_assessment": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Marketing Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_marketing_agent",
        name="📢 Marketing Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI marketing assistant for campaign optimization and content creation",
        icon="📢",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "campaign_types": {"type": "array"},
                "content_generation": {"type": "boolean", "default": True},
                "audience_analysis": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Research Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_research_agent",
        name="🔍 Research Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI research assistant for market research and competitive analysis",
        icon="🔍",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "research_sources": {"type": "array"},
                "analysis_depth": {"type": "string", "enum": ["surface", "moderate", "deep"]},
                "report_formats": {"type": "array"}
            }
        }
    )
    
    # Coding Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_coding_agent",
        name="💻 Coding Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI coding assistant for development, debugging, and code reviews",
        icon="💻",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "programming_languages": {"type": "array"},
                "code_review": {"type": "boolean", "default": True},
                "testing_assistance": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Data Analyst Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_data_analyst_agent",
        name="📊 Data Analyst Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI data analysis assistant for insights and visualizations",
        icon="📊",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "data_sources": {"type": "array"},
                "visualization_tools": {"type": "array"},
                "statistical_analysis": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Meeting Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_meeting_agent",
        name="📅 Meeting Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI meeting assistant for scheduling, notes, and action items",
        icon="📅",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "calendar_integration": {"type": "array"},
                "transcription": {"type": "boolean", "default": True},
                "action_item_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Customer Support Agent
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_agents_customer_support_agent",
        name="🎧 Customer Support Agent",
        category=PluginCategory.AI_AGENTS,
        description="AI customer support assistant for inquiries and issue resolution",
        icon="🎧",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "knowledge_base": {"type": "object"},
                "escalation_rules": {"type": "object"},
                "sentiment_analysis": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ AI Agents plugins registered")

async def register_website_plugins(db: AsyncSession):
    """Register Website category plugins"""
    logger.info("🌐 Registering Website plugins...")
    
    # Website Builder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_builder",
        name="🏗️ Website Builder",
        category=PluginCategory.WEBSITE,
        description="Drag-and-drop website builder with responsive templates",
        icon="🏗️",
        config_schema={
            "type": "object",
            "properties": {
                "template_categories": {"type": "array"},
                "responsive_design": {"type": "boolean", "default": True},
                "seo_optimization": {"type": "boolean", "default": True}
            }
        }
    )
    
    # AI Landing Page Builder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_ai_landing_page_builder",
        name="🤖 AI Landing Page Builder",
        category=PluginCategory.WEBSITE,
        description="AI-powered landing page creation with conversion optimization",
        icon="🤖",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "industry_focus": {"type": "string"},
                "conversion_goals": {"type": "array"},
                "a_b_testing": {"type": "boolean", "default": True}
            }
        }
    )
    
    # SEO Scanner
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_seo_scanner",
        name="🔍 SEO Scanner",
        category=PluginCategory.WEBSITE,
        description="Comprehensive SEO analysis and optimization recommendations",
        icon="🔍",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "scan_depth": {"type": "string", "enum": ["basic", "comprehensive", "technical"]},
                "competitor_analysis": {"type": "boolean", "default": True},
                "keyword_research": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Website Chatbot
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_chatbot",
        name="💬 Website Chatbot",
        category=PluginCategory.WEBSITE,
        description="AI-powered chatbot for website visitor engagement",
        icon="💬",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "conversation_flows": {"type": "array"},
                "lead_capture": {"type": "boolean", "default": True},
                "integration_crm": {"type": "string"}
            }
        }
    )
    
    # Forms Builder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_forms_builder",
        name="📝 Forms Builder",
        category=PluginCategory.WEBSITE,
        description="Create custom forms with advanced validation and integrations",
        icon="📝",
        config_schema={
            "type": "object",
            "properties": {
                "form_types": {"type": "array"},
                "validation_rules": {"type": "object"},
                "integration_options": {"type": "array"}
            }
        }
    )
    
    # Analytics Integration
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_analytics_integration",
        name="📊 Analytics Integration",
        category=PluginCategory.WEBSITE,
        description="Integrate Google Analytics, Facebook Pixel, and other tracking codes",
        icon="📊",
        config_schema={
            "type": "object",
            "properties": {
                "tracking_platforms": {"type": "array"},
                "event_tracking": {"type": "boolean", "default": True},
                "conversion_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Booking System
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="website_booking_system",
        name="📅 Booking System",
        category=PluginCategory.WEBSITE,
        description="Online appointment and booking system with calendar integration",
        icon="📅",
        config_schema={
            "type": "object",
            "properties": {
                "service_types": {"type": "array"},
                "calendar_sync": {"type": "boolean", "default": True},
                "payment_integration": {"type": "boolean", "default": False}
            }
        }
    )
    
    logger.info("✅ Website plugins registered")

async def register_communication_plugins(db: AsyncSession):
    """Register Communication category plugins"""
    logger.info("📱 Registering Communication plugins...")
    
    # WhatsApp API
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_whatsapp_api",
        name="📱 WhatsApp API",
        category=PluginCategory.COMMUNICATION,
        description="Send WhatsApp messages and manage business communications",
        icon="📱",
        config_schema={
            "type": "object",
            "properties": {
                "whatsapp_business_api": {"type": "string", "required": True},
                "message_templates": {"type": "array"},
                "automation_rules": {"type": "object"}
            }
        }
    )
    
    # Telegram Bot
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_telegram_bot",
        name="🤖 Telegram Bot",
        category=PluginCategory.COMMUNICATION,
        description="Create and manage Telegram bots for customer engagement",
        icon="🤖",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "bot_token": {"type": "string", "required": True},
                "command_handlers": {"type": "array"},
                "auto_responses": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Slack Integration
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_slack",
        name="💼 Slack",
        category=PluginCategory.COMMUNICATION,
        description="Slack workspace integration for team communication and notifications",
        icon="💼",
        config_schema={
            "type": "object",
            "properties": {
                "workspace_token": {"type": "string", "required": True},
                "channel_notifications": {"type": "array"},
                "bot_integration": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Discord Integration
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_discord",
        name="🎮 Discord",
        category=PluginCategory.COMMUNICATION,
        description="Discord server integration for community management",
        icon="🎮",
        config_schema={
            "type": "object",
            "properties": {
                "server_id": {"type": "string", "required": True},
                "bot_permissions": {"type": "array"},
                "moderation_tools": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Zoom Integration
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_zoom",
        name="📹 Zoom",
        category=PluginCategory.COMMUNICATION,
        description="Zoom meeting integration for scheduling and management",
        icon="📹",
        config_schema={
            "type": "object",
            "properties": {
                "zoom_api_key": {"type": "string", "required": True},
                "meeting_defaults": {"type": "object"},
                "recording_options": {"type": "object"}
            }
        }
    )
    
    # Google Meet
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_google_meet",
        name="📱 Google Meet",
        category=PluginCategory.COMMUNICATION,
        description="Google Meet integration for video conferencing",
        icon="📱",
        config_schema={
            "type": "object",
            "properties": {
                "google_calendar_sync": {"type": "boolean", "default": True},
                "meeting_defaults": {"type": "object"},
                "participant_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Microsoft Teams
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_microsoft_teams",
        name="🏢 Microsoft Teams",
        category=PluginCategory.COMMUNICATION,
        description="Microsoft Teams integration for enterprise communication",
        icon="🏢",
        config_schema={
            "type": "object",
            "properties": {
                "teams_tenant_id": {"type": "string", "required": True},
                "channel_management": {"type": "boolean", "default": True},
                "file_sharing": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Bulk SMS
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="communication_bulk_sms",
        name="📲 Bulk SMS",
        category=PluginCategory.COMMUNICATION,
        description="Send bulk SMS campaigns with delivery tracking",
        icon="📲",
        config_schema={
            "type": "object",
            "properties": {
                "sms_provider": {"type": "string", "enum": ["twilio", "nexmo", "aws_sns"], "required": True},
                "contact_lists": {"type": "array"},
                "delivery_reports": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ Communication plugins registered")

async def register_education_plugins(db: AsyncSession):
    """Register Education category plugins"""
    logger.info("🎓 Registering Education plugins...")
    
    # LMS (Learning Management System)
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_lms",
        name="📚 LMS",
        category=PluginCategory.EDUCATION,
        description="Complete Learning Management System for online education",
        icon="📚",
        config_schema={
            "type": "object",
            "properties": {
                "course_formats": {"type": "array"},
                "assessment_types": {"type": "array"},
                "progress_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Student Portal
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_student_portal",
        name="👨‍🎓 Student Portal",
        category=PluginCategory.EDUCATION,
        description="Student portal for course access, grades, and communication",
        icon="👨‍🎓",
        config_schema={
            "type": "object",
            "properties": {
                "grade_access": {"type": "boolean", "default": True},
                "assignment_submission": {"type": "boolean", "default": True},
                "discussion_forums": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Faculty Portal
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_faculty_portal",
        name="👨‍🏫 Faculty Portal",
        category=PluginCategory.EDUCATION,
        description="Faculty portal for course management and student interaction",
        icon="👨‍🏫",
        config_schema={
            "type": "object",
            "properties": {
                "gradebook": {"type": "boolean", "default": True},
                "attendance_tracking": {"type": "boolean", "default": True},
                "content_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Attendance System
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_attendance",
        name="📊 Attendance",
        category=PluginCategory.EDUCATION,
        description="Digital attendance tracking with multiple verification methods",
        icon="📊",
        config_schema={
            "type": "object",
            "properties": {
                "tracking_methods": {"type": "array"},
                "geofencing": {"type": "boolean", "default": False},
                "reports": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Online Exams
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_online_exams",
        name="📝 Online Exams",
        category=PluginCategory.EDUCATION,
        description="Secure online examination system with proctoring",
        icon="📝",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "question_types": {"type": "array"},
                "proctoring_level": {"type": "string", "enum": ["basic", "advanced", "ai_powered"]},
                "auto_grading": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Parent Communication
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_parent_communication",
        name="👨‍👩‍👧‍👦 Parent Communication",
        category=PluginCategory.EDUCATION,
        description="Communication platform for parents, teachers, and students",
        icon="👨‍👩‍👧‍👦",
        config_schema={
            "type": "object",
            "properties": {
                "communication_channels": {"type": "array"},
                "progress_reports": {"type": "boolean", "default": True},
                "event_notifications": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Certificates
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_certificates",
        name="🏆 Certificates",
        category=PluginCategory.EDUCATION,
        description="Generate and manage digital certificates and credentials",
        icon="🏆",
        config_schema={
            "type": "object",
            "properties": {
                "certificate_templates": {"type": "array"},
                "digital_signatures": {"type": "boolean", "default": True},
                "verification_system": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Course Builder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="education_course_builder",
        name="🏗️ Course Builder",
        category=PluginCategory.EDUCATION,
        description="Create interactive online courses with multimedia content",
        icon="🏗️",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "content_types": {"type": "array"},
                "interactive_elements": {"type": "array"},
                "assessment_integration": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ Education plugins registered")

async def register_industry_plugins(db: AsyncSession):
    """Register Industry-Specific category plugins"""
    logger.info("🏥 Registering Industry-Specific plugins...")
    
    # Hospital Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_hospital_management",
        name="🏥 Hospital Management",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Complete hospital management system with patient records",
        icon="🏥",
        config_schema={
            "type": "object",
            "properties": {
                "patient_records": {"type": "boolean", "default": True},
                "appointment_scheduling": {"type": "boolean", "default": True},
                "inventory_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Pharmacy Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_pharmacy",
        name="💊 Pharmacy",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Pharmacy management with prescription tracking and inventory",
        icon="💊",
        config_schema={
            "type": "object",
            "properties": {
                "prescription_management": {"type": "boolean", "default": True},
                "drug_inventory": {"type": "boolean", "default": True},
                "insurance_processing": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Restaurant POS
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_restaurant_pos",
        name="🍽️ Restaurant POS",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Point of sale system designed for restaurants and food service",
        icon="🍽️",
        config_schema={
            "type": "object",
            "properties": {
                "menu_management": {"type": "boolean", "default": True},
                "table_management": {"type": "boolean", "default": True},
                "kitchen_display": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Hotel Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_hotel_management",
        name="🏨 Hotel Management",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Hotel property management system with booking and guest services",
        icon="🏨",
        config_schema={
            "type": "object",
            "properties": {
                "reservation_system": {"type": "boolean", "default": True},
                "guest_services": {"type": "boolean", "default": True},
                "housekeeping": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Real Estate CRM
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_real_estate_crm",
        name="🏠 Real Estate CRM",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="CRM system tailored for real estate agents and agencies",
        icon="🏠",
        config_schema={
            "type": "object",
            "properties": {
                "property_listings": {"type": "boolean", "default": True},
                "client_management": {"type": "boolean", "default": True},
                "lead_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Construction ERP
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_construction_erp",
        name="🏗️ Construction ERP",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Enterprise resource planning for construction companies",
        icon="🏗️",
        config_schema={
            "type": "object",
            "properties": {
                "project_management": {"type": "boolean", "default": True},
                "resource_allocation": {"type": "boolean", "default": True},
                "cost_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Manufacturing ERP
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_manufacturing_erp",
        name="🏭 Manufacturing ERP",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Manufacturing enterprise resource planning system",
        icon="🏭",
        config_schema={
            "type": "object",
            "properties": {
                "production_planning": {"type": "boolean", "default": True},
                "quality_control": {"type": "boolean", "default": True},
                "supply_chain": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Automobile CRM
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_automobile_crm",
        name="🚗 Automobile CRM",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="CRM system for automobile dealerships and service centers",
        icon="🚗",
        config_schema={
            "type": "object",
            "properties": {
                "inventory_management": {"type": "boolean", "default": True},
                "service_scheduling": {"type": "boolean", "default": True},
                "customer_history": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Gym Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_gym_management",
        name="💪 Gym Management",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Fitness center and gym management system",
        icon="💪",
        config_schema={
            "type": "object",
            "properties": {
                "membership_management": {"type": "boolean", "default": True},
                "class_scheduling": {"type": "boolean", "default": True},
                "equipment_tracking": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Salon Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="industry_salon_management",
        name="💇‍♀️ Salon Management",
        category=PluginCategory.INDUSTRY_SPECIFIC,
        description="Beauty salon and spa management system",
        icon="💇‍♀️",
        config_schema={
            "type": "object",
            "properties": {
                "appointment_booking": {"type": "boolean", "default": True},
                "staff_scheduling": {"type": "boolean", "default": True},
                "service_packages": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ Industry-Specific plugins registered")

async def register_ai_productivity_plugins(db: AsyncSession):
    """Register AI Productivity category plugins"""
    logger.info("🧠 Registering AI Productivity plugins...")
    
    # Meeting Notes AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_meeting_notes",
        name="📝 Meeting Notes AI",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="AI-powered meeting transcription and note generation",
        icon="📝",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "transcription_accuracy": {"type": "string", "enum": ["standard", "high", "premium"]},
                "speaker_identification": {"type": "boolean", "default": True},
                "action_item_extraction": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Voice to CRM AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_voice_to_crm",
        name="🎤 Voice to CRM AI",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="Convert voice notes directly into CRM entries and updates",
        icon="🎤",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "crm_integration": {"type": "string", "required": True},
                "field_mapping": {"type": "object"},
                "confidence_threshold": {"type": "number", "default": 0.8}
            }
        }
    )
    
    # AI Email Assistant
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_email_assistant",
        name="📧 AI Email Assistant",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="AI assistant for email composition, response, and management",
        icon="📧",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "tone_settings": {"type": "array"},
                "template_suggestions": {"type": "boolean", "default": True},
                "priority_detection": {"type": "boolean", "default": True}
            }
        }
    )
    
    # AI Presentation Maker
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_presentation_maker",
        name="🎯 AI Presentation Maker",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="Create professional presentations with AI-generated content and design",
        icon="🎯",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "presentation_types": {"type": "array"},
                "design_themes": {"type": "array"},
                "content_generation": {"type": "boolean", "default": True}
            }
        }
    )
    
    # AI Spreadsheet Assistant
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_spreadsheet_assistant",
        name="📊 AI Spreadsheet Assistant",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="AI assistant for spreadsheet analysis, formulas, and data insights",
        icon="📊",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "formula_suggestions": {"type": "boolean", "default": True},
                "data_analysis": {"type": "boolean", "default": True},
                "chart_generation": {"type": "boolean", "default": True}
            }
        }
    )
    
    # AI Knowledge Base
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_knowledge_base",
        name="🧠 AI Knowledge Base",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="AI-powered knowledge management and intelligent search",
        icon="🧠",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "content_sources": {"type": "array"},
                "search_intelligence": {"type": "boolean", "default": True},
                "auto_categorization": {"type": "boolean", "default": True}
            }
        }
    )
    
    # AI Workflow Builder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_workflow_builder",
        name="⚙️ AI Workflow Builder",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="Create intelligent workflows with AI-powered decision making",
        icon="⚙️",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "workflow_templates": {"type": "array"},
                "ai_decision_nodes": {"type": "boolean", "default": True},
                "integration_apis": {"type": "array"}
            }
        }
    )
    
    # AI Automation Studio
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="ai_productivity_automation_studio",
        name="🤖 AI Automation Studio",
        category=PluginCategory.AI_PRODUCTIVITY,
        description="Advanced automation platform with AI-driven optimizations",
        icon="🤖",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "automation_types": {"type": "array"},
                "learning_optimization": {"type": "boolean", "default": True},
                "performance_analytics": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ AI Productivity plugins registered")

# Master initialization function
async def initialize_all_phase2_plugins(db: AsyncSession):
    """
    Initialize all Phase 2 plugins
    """
    logger.info("🔌 Starting Phase 2 plugin registration...")
    
    try:
        await register_ecommerce_plugins(db)
        await register_document_plugins(db)
        await register_legal_plugins(db)
        await register_analytics_plugins(db)
        await register_ai_agent_plugins(db)
        await register_website_plugins(db)
        await register_communication_plugins(db)
        await register_education_plugins(db)
        await register_industry_plugins(db)
        await register_ai_productivity_plugins(db)
        
        logger.info("✅ All Phase 2 plugins registered successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to register Phase 2 plugins: {e}")
        raise