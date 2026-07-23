"""
Plugin Initialization Service
Registers all available plugins in the system
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from models.plugins import PluginCategory
from services.plugin_service import plugin_manager

logger = logging.getLogger(__name__)

async def initialize_all_plugins(db: AsyncSession):
    """
    Initialize and register all enterprise plugins
    """
    logger.info("🔌 Initializing comprehensive plugin system...")
    
    try:
        # Sales & CRM Plugins
        await register_sales_crm_plugins(db)
        
        # Marketing Plugins  
        await register_marketing_plugins(db)
        
        # Finance Plugins
        await register_finance_plugins(db)
        
        # HR Plugins
        await register_hr_plugins(db)
        
        # Inventory Plugins
        await register_inventory_plugins(db)
        
        logger.info("✅ Phase 1 plugins registered successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize plugins: {e}")
        raise

async def register_sales_crm_plugins(db: AsyncSession):
    """Register Sales & CRM category plugins"""
    logger.info("📞 Registering Sales & CRM plugins...")
    
    # Call Recording & AI Analysis
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_call_recording",
        name="📞 Call Recording & AI Analysis",
        category=PluginCategory.SALES_CRM,
        description="Record sales calls and analyze conversations with AI to extract insights, sentiment, and action items",
        icon="📞",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "recording_quality": {"type": "string", "enum": ["high", "medium", "low"], "default": "high"},
                "auto_transcription": {"type": "boolean", "default": True},
                "sentiment_analysis": {"type": "boolean", "default": True},
                "action_item_extraction": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Lead Scoring AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_lead_scoring", 
        name="🎯 Lead Scoring AI",
        category=PluginCategory.SALES_CRM,
        description="Automatically score and prioritize leads using machine learning algorithms",
        icon="🎯",
        is_ai_powered=True,
        config_schema={
            "type": "object", 
            "properties": {
                "scoring_model": {"type": "string", "enum": ["behavioral", "demographic", "hybrid"], "default": "hybrid"},
                "auto_update_scores": {"type": "boolean", "default": True},
                "integration_crm": {"type": "string"}
            }
        }
    )
    
    # Email Marketing
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_email_marketing",
        name="📧 Email Marketing", 
        category=PluginCategory.SALES_CRM,
        description="Create, send and track email marketing campaigns with advanced analytics",
        icon="📧",
        config_schema={
            "type": "object",
            "properties": {
                "email_provider": {"type": "string", "enum": ["sendgrid", "mailchimp", "aws_ses"], "required": True},
                "tracking_enabled": {"type": "boolean", "default": True},
                "auto_follow_up": {"type": "boolean", "default": False}
            }
        }
    )
    
    # SMS Campaigns
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_sms_campaigns",
        name="📱 SMS Campaigns",
        category=PluginCategory.SALES_CRM,
        description="Send targeted SMS campaigns and automate text message marketing",
        icon="📱",
        config_schema={
            "type": "object",
            "properties": {
                "sms_provider": {"type": "string", "enum": ["twilio", "nexmo", "aws_sns"], "required": True},
                "opt_in_required": {"type": "boolean", "default": True},
                "message_templates": {"type": "array"}
            }
        }
    )
    
    # Live Chat
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_live_chat",
        name="💬 Live Chat",
        category=PluginCategory.SALES_CRM,
        description="Engage website visitors with real-time chat support and lead capture",
        icon="💬",
        config_schema={
            "type": "object",
            "properties": {
                "auto_responses": {"type": "boolean", "default": True},
                "business_hours": {"type": "object"},
                "chat_widget_customization": {"type": "object"}
            }
        }
    )
    
    # AI Sales Coach
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_ai_coach",
        name="🤖 AI Sales Coach",
        category=PluginCategory.SALES_CRM,
        description="AI-powered sales coaching with personalized recommendations and performance insights",
        icon="🤖",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "coaching_frequency": {"type": "string", "enum": ["daily", "weekly", "monthly"], "default": "weekly"},
                "performance_metrics": {"type": "array"},
                "goal_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Proposal Generator  
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_proposal_generator",
        name="📋 Proposal Generator",
        category=PluginCategory.SALES_CRM,
        description="Generate professional proposals and contracts with customizable templates",
        icon="📋",
        config_schema={
            "type": "object",
            "properties": {
                "template_library": {"type": "array"},
                "auto_pricing": {"type": "boolean", "default": False},
                "e_signature_integration": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Quotation Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_quotation_generator",
        name="📄 Quotation Generator", 
        category=PluginCategory.SALES_CRM,
        description="Create detailed quotations with pricing, terms, and professional formatting",
        icon="📄",
        config_schema={
            "type": "object",
            "properties": {
                "currency_support": {"type": "array"},
                "tax_calculation": {"type": "boolean", "default": True},
                "discount_rules": {"type": "object"}
            }
        }
    )
    
    # Affiliate Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_affiliate_management",
        name="🤝 Affiliate Management",
        category=PluginCategory.SALES_CRM,
        description="Manage affiliate partners, track referrals, and automate commission payouts",
        icon="🤝",
        config_schema={
            "type": "object", 
            "properties": {
                "commission_structure": {"type": "object"},
                "tracking_method": {"type": "string", "enum": ["cookies", "referral_codes", "both"]},
                "payout_schedule": {"type": "string", "enum": ["weekly", "monthly", "quarterly"]}
            }
        }
    )
    
    # Payment Reminder AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="sales_payment_reminder",
        name="💳 Payment Reminder AI",
        category=PluginCategory.SALES_CRM,
        description="Automate payment reminders and follow-ups with intelligent scheduling",
        icon="💳",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "reminder_schedule": {"type": "array"},
                "escalation_rules": {"type": "object"},
                "payment_methods": {"type": "array"}
            }
        }
    )
    
    logger.info("✅ Sales & CRM plugins registered")

async def register_marketing_plugins(db: AsyncSession):
    """Register Marketing category plugins"""  
    logger.info("📢 Registering Marketing plugins...")
    
    # Meta Ads Manager
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_meta_ads",
        name="📘 Meta Ads Manager",
        category=PluginCategory.MARKETING,
        description="Create, manage and optimize Facebook and Instagram advertising campaigns",
        icon="📘",
        config_schema={
            "type": "object",
            "properties": {
                "facebook_access_token": {"type": "string", "required": True},
                "ad_account_id": {"type": "string", "required": True},
                "auto_optimization": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Google Ads AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_google_ads",
        name="🔍 Google Ads AI",
        category=PluginCategory.MARKETING,
        description="Automated Google Ads campaign management with AI optimization",
        icon="🔍",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "google_ads_customer_id": {"type": "string", "required": True},
                "campaign_types": {"type": "array"},
                "bid_strategy": {"type": "string", "enum": ["manual", "auto", "target_cpa"]}
            }
        }
    )
    
    # LinkedIn Marketing
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_linkedin",
        name="💼 LinkedIn Marketing",
        category=PluginCategory.MARKETING,
        description="B2B marketing campaigns and lead generation on LinkedIn",
        icon="💼",
        config_schema={
            "type": "object",
            "properties": {
                "linkedin_access_token": {"type": "string", "required": True},
                "target_audience": {"type": "object"},
                "campaign_objectives": {"type": "array"}
            }
        }
    )
    
    # SEO Optimizer
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_seo_optimizer",
        name="🎯 SEO Optimizer",
        category=PluginCategory.MARKETING,
        description="Comprehensive SEO analysis and optimization recommendations",
        icon="🎯",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "target_keywords": {"type": "array"},
                "competitor_analysis": {"type": "boolean", "default": True},
                "content_optimization": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Blog Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_blog_generator",
        name="📝 Blog Generator",
        category=PluginCategory.MARKETING,
        description="AI-powered blog content creation with SEO optimization",
        icon="📝",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "content_style": {"type": "string", "enum": ["professional", "casual", "technical"]},
                "seo_integration": {"type": "boolean", "default": True},
                "publishing_schedule": {"type": "object"}
            }
        }
    )
    
    # Landing Page Builder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_landing_page_builder",
        name="🏗️ Landing Page Builder",
        category=PluginCategory.MARKETING,
        description="Create high-converting landing pages with drag-and-drop interface",
        icon="🏗️",
        config_schema={
            "type": "object",
            "properties": {
                "template_categories": {"type": "array"},
                "a_b_testing": {"type": "boolean", "default": True},
                "conversion_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # AI Video Generator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_ai_video_generator",
        name="🎥 AI Video Generator",
        category=PluginCategory.MARKETING,
        description="Create marketing videos with AI-generated content and voiceovers",
        icon="🎥",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "video_style": {"type": "string", "enum": ["animated", "live_action", "mixed"]},
                "voice_selection": {"type": "object"},
                "brand_customization": {"type": "object"}
            }
        }
    )
    
    # AI Image Studio
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_ai_image_studio",
        name="🎨 AI Image Studio",
        category=PluginCategory.MARKETING,
        description="Generate marketing images, graphics, and visual content with AI",
        icon="🎨",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "image_styles": {"type": "array"},
                "brand_colors": {"type": "array"},
                "output_formats": {"type": "array"}
            }
        }
    )
    
    # Influencer Finder
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_influencer_finder",
        name="👑 Influencer Finder",
        category=PluginCategory.MARKETING,
        description="Discover and connect with relevant influencers for brand partnerships",
        icon="👑",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "industry_focus": {"type": "array"},
                "follower_range": {"type": "object"},
                "engagement_threshold": {"type": "number"}
            }
        }
    )
    
    # Campaign Analytics
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="marketing_campaign_analytics",
        name="📊 Campaign Analytics",
        category=PluginCategory.MARKETING,
        description="Track and analyze marketing campaign performance across all channels",
        icon="📊",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "tracking_platforms": {"type": "array"},
                "attribution_model": {"type": "string"},
                "reporting_frequency": {"type": "string"}
            }
        }
    )
    
    logger.info("✅ Marketing plugins registered")

async def register_finance_plugins(db: AsyncSession):
    """Register Finance category plugins"""
    logger.info("💰 Registering Finance plugins...")
    
    # GST Filing  
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_gst_filing",
        name="📋 GST Filing",
        category=PluginCategory.FINANCE,
        description="Automated GST return filing and compliance management for Indian businesses",
        icon="📋",
        config_schema={
            "type": "object",
            "properties": {
                "gstin": {"type": "string", "required": True},
                "filing_frequency": {"type": "string", "enum": ["monthly", "quarterly"]},
                "auto_filing": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Payroll
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_payroll",
        name="💼 Payroll", 
        category=PluginCategory.FINANCE,
        description="Complete payroll management with tax calculations and direct deposits",
        icon="💼",
        config_schema={
            "type": "object",
            "properties": {
                "pay_frequency": {"type": "string", "enum": ["weekly", "biweekly", "monthly"]},
                "tax_jurisdiction": {"type": "string"},
                "direct_deposit": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Employee Salary
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_employee_salary",
        name="💰 Employee Salary",
        category=PluginCategory.FINANCE,
        description="Manage employee salary structures, increments, and compensation planning",
        icon="💰",
        config_schema={
            "type": "object",
            "properties": {
                "salary_bands": {"type": "array"},
                "increment_rules": {"type": "object"},
                "bonus_structure": {"type": "object"}
            }
        }
    )
    
    # Expense Tracker
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_expense_tracker",
        name="📊 Expense Tracker",
        category=PluginCategory.FINANCE,
        description="Track business expenses with receipt scanning and categorization",
        icon="📊",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "expense_categories": {"type": "array"},
                "receipt_scanning": {"type": "boolean", "default": True},
                "approval_workflow": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Budget Planner
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_budget_planner",
        name="📈 Budget Planner",
        category=PluginCategory.FINANCE,
        description="Create and monitor budgets with variance analysis and forecasting",
        icon="📈",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "budget_period": {"type": "string", "enum": ["monthly", "quarterly", "yearly"]},
                "variance_alerts": {"type": "boolean", "default": True},
                "forecasting_model": {"type": "string"}
            }
        }
    )
    
    # Cash Flow Dashboard  
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_cash_flow_dashboard",
        name="💸 Cash Flow Dashboard",
        category=PluginCategory.FINANCE,
        description="Real-time cash flow monitoring and projections with visual analytics",
        icon="💸",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "projection_period": {"type": "number", "default": 90},
                "alert_thresholds": {"type": "object"},
                "integration_accounts": {"type": "array"}
            }
        }
    )
    
    # Subscription Billing
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_subscription_billing",
        name="🔄 Subscription Billing",
        category=PluginCategory.FINANCE,
        description="Manage recurring subscriptions and automated billing cycles",
        icon="🔄",
        config_schema={
            "type": "object",
            "properties": {
                "billing_cycles": {"type": "array"},
                "payment_gateways": {"type": "array"},
                "dunning_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Payment Gateway Manager
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_payment_gateway",
        name="💳 Payment Gateway Manager",
        category=PluginCategory.FINANCE,
        description="Integrate and manage multiple payment gateways with unified interface",
        icon="💳",
        config_schema={
            "type": "object",
            "properties": {
                "supported_gateways": {"type": "array"},
                "currency_support": {"type": "array"},
                "fraud_detection": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Tax Calculator
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_tax_calculator",
        name="🧮 Tax Calculator",
        category=PluginCategory.FINANCE,
        description="Calculate various taxes including income tax, sales tax, and VAT",
        icon="🧮",
        config_schema={
            "type": "object",
            "properties": {
                "tax_jurisdictions": {"type": "array"},
                "tax_types": {"type": "array"},
                "compliance_rules": {"type": "object"}
            }
        }
    )
    
    # Financial Forecast AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="finance_forecast_ai",
        name="🔮 Financial Forecast AI",
        category=PluginCategory.FINANCE,
        description="AI-powered financial forecasting and predictive analytics",
        icon="🔮",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "forecast_horizon": {"type": "number", "default": 12},
                "confidence_intervals": {"type": "boolean", "default": True},
                "scenario_analysis": {"type": "boolean", "default": True}
            }
        }
    )
    
    logger.info("✅ Finance plugins registered")

async def register_hr_plugins(db: AsyncSession):
    """Register HR category plugins"""
    logger.info("👨‍💼 Registering HR plugins...")
    
    # Recruitment ATS
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_recruitment_ats",
        name="🎯 Recruitment ATS",
        category=PluginCategory.HR,
        description="Applicant Tracking System for end-to-end recruitment management",
        icon="🎯",
        config_schema={
            "type": "object",
            "properties": {
                "job_boards": {"type": "array"},
                "interview_scheduling": {"type": "boolean", "default": True},
                "candidate_scoring": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Resume Screening AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_resume_screening",
        name="📄 Resume Screening AI",
        category=PluginCategory.HR,
        description="AI-powered resume analysis and candidate matching for job requirements",
        icon="📄",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "screening_criteria": {"type": "object"},
                "skill_matching": {"type": "boolean", "default": True},
                "bias_detection": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Employee Attendance
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_employee_attendance",
        name="⏰ Employee Attendance",
        category=PluginCategory.HR,
        description="Track employee attendance with biometric integration and reporting",
        icon="⏰",
        config_schema={
            "type": "object",
            "properties": {
                "tracking_methods": {"type": "array"},
                "overtime_calculation": {"type": "boolean", "default": True},
                "shift_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Leave Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_leave_management",
        name="🏖️ Leave Management",
        category=PluginCategory.HR,
        description="Manage employee leave requests with approval workflows and balances",
        icon="🏖️",
        config_schema={
            "type": "object",
            "properties": {
                "leave_types": {"type": "array"},
                "approval_hierarchy": {"type": "object"},
                "carry_forward_rules": {"type": "object"}
            }
        }
    )
    
    # Performance Reviews
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_performance_reviews",
        name="⭐ Performance Reviews",
        category=PluginCategory.HR,
        description="Conduct structured performance evaluations with 360-degree feedback",
        icon="⭐",
        config_schema={
            "type": "object",
            "properties": {
                "review_cycles": {"type": "array"},
                "feedback_types": {"type": "array"},
                "goal_tracking": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Employee Onboarding
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_employee_onboarding",
        name="🚀 Employee Onboarding",
        category=PluginCategory.HR,
        description="Streamline new employee onboarding with checklists and digital forms",
        icon="🚀",
        config_schema={
            "type": "object",
            "properties": {
                "onboarding_templates": {"type": "array"},
                "document_collection": {"type": "boolean", "default": True},
                "training_assignments": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Training Portal
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_training_portal",
        name="🎓 Training Portal",
        category=PluginCategory.HR,
        description="Employee training and development platform with progress tracking",
        icon="🎓",
        config_schema={
            "type": "object",
            "properties": {
                "content_types": {"type": "array"},
                "certification_tracking": {"type": "boolean", "default": True},
                "skill_assessments": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Interview Scheduler
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_interview_scheduler",
        name="📅 Interview Scheduler",
        category=PluginCategory.HR,
        description="Automate interview scheduling with calendar integration and reminders",
        icon="📅",
        config_schema={
            "type": "object",
            "properties": {
                "calendar_integrations": {"type": "array"},
                "buffer_time": {"type": "number", "default": 15},
                "reminder_settings": {"type": "object"}
            }
        }
    )
    
    # Payroll Integration  
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_payroll_integration",
        name="💰 Payroll Integration",
        category=PluginCategory.HR,
        description="Seamlessly integrate HR data with payroll processing systems",
        icon="💰",
        config_schema={
            "type": "object",
            "properties": {
                "payroll_systems": {"type": "array"},
                "data_sync_frequency": {"type": "string"},
                "approval_workflow": {"type": "boolean", "default": True}
            }
        }
    )
    
    # HR Chatbot
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="hr_chatbot",
        name="🤖 HR Chatbot",
        category=PluginCategory.HR,
        description="AI-powered chatbot for employee HR queries and self-service",
        icon="🤖",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "knowledge_base": {"type": "object"},
                "escalation_rules": {"type": "object"},
                "multilingual_support": {"type": "boolean", "default": False}
            }
        }
    )
    
    logger.info("✅ HR plugins registered")

async def register_inventory_plugins(db: AsyncSession):
    """Register Inventory category plugins"""
    logger.info("📦 Registering Inventory plugins...")
    
    # Inventory Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_management",
        name="📦 Inventory Management",
        category=PluginCategory.INVENTORY,
        description="Complete inventory tracking with real-time stock levels and alerts",
        icon="📦",
        config_schema={
            "type": "object",
            "properties": {
                "tracking_methods": {"type": "array"},
                "reorder_alerts": {"type": "boolean", "default": True},
                "multi_location": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Barcode Scanner
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_barcode_scanner",
        name="📱 Barcode Scanner",
        category=PluginCategory.INVENTORY,
        description="Mobile barcode scanning for inventory updates and product lookup",
        icon="📱",
        config_schema={
            "type": "object",
            "properties": {
                "scanner_types": {"type": "array"},
                "batch_scanning": {"type": "boolean", "default": True},
                "offline_capability": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Warehouse Manager
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_warehouse_manager",
        name="🏭 Warehouse Manager",
        category=PluginCategory.INVENTORY,
        description="Manage warehouse operations, locations, and picking optimization",
        icon="🏭",
        is_ai_powered=True,
        config_schema={
            "type": "object",
            "properties": {
                "warehouse_layout": {"type": "object"},
                "picking_optimization": {"type": "boolean", "default": True},
                "zone_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Purchase Orders
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_purchase_orders",
        name="📋 Purchase Orders",
        category=PluginCategory.INVENTORY,
        description="Create and manage purchase orders with supplier integration",
        icon="📋",
        config_schema={
            "type": "object",
            "properties": {
                "approval_workflow": {"type": "boolean", "default": True},
                "supplier_portal": {"type": "boolean", "default": False},
                "auto_reorder": {"type": "boolean", "default": False}
            }
        }
    )
    
    # Vendor Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_vendor_management",
        name="🤝 Vendor Management",
        category=PluginCategory.INVENTORY,
        description="Manage supplier relationships, contracts, and performance tracking",
        icon="🤝",
        config_schema={
            "type": "object",
            "properties": {
                "vendor_categories": {"type": "array"},
                "performance_metrics": {"type": "array"},
                "contract_management": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Delivery Tracking
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_delivery_tracking",
        name="🚚 Delivery Tracking",
        category=PluginCategory.INVENTORY,
        description="Track shipments and deliveries with real-time status updates",
        icon="🚚",
        config_schema={
            "type": "object",
            "properties": {
                "shipping_carriers": {"type": "array"},
                "tracking_automation": {"type": "boolean", "default": True},
                "customer_notifications": {"type": "boolean", "default": True}
            }
        }
    )
    
    # Stock Forecast AI
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_stock_forecast",
        name="🔮 Stock Forecast AI",
        category=PluginCategory.INVENTORY,
        description="AI-powered demand forecasting and inventory optimization",
        icon="🔮",
        is_ai_powered=True,
        is_premium=True,
        config_schema={
            "type": "object",
            "properties": {
                "forecast_period": {"type": "number", "default": 90},
                "seasonality_analysis": {"type": "boolean", "default": True},
                "demand_patterns": {"type": "object"}
            }
        }
    )
    
    # Returns Management
    await plugin_manager.register_plugin(
        db=db,
        plugin_key="inventory_returns_management",
        name="↩️ Returns Management",
        category=PluginCategory.INVENTORY,
        description="Handle product returns, exchanges, and refund processing",
        icon="↩️",
        config_schema={
            "type": "object",
            "properties": {
                "return_policies": {"type": "object"},
                "quality_inspection": {"type": "boolean", "default": True},
                "restocking_rules": {"type": "object"}
            }
        }
    )
    
    logger.info("✅ Inventory plugins registered")

# Continue with phase 2 plugins
async def initialize_phase_2_plugins(db: AsyncSession):
    """Initialize remaining plugin categories"""
    logger.info("🔌 Initializing Phase 2 plugins...")
    
    try:
        # E-Commerce Plugins
        await register_ecommerce_plugins(db)
        
        # Document Plugins
        await register_document_plugins(db)
        
        # Legal Plugins
        await register_legal_plugins(db)
        
        # Analytics Plugins
        await register_analytics_plugins(db)
        
        # AI Agent Plugins
        await register_ai_agent_plugins(db)
        
        logger.info("✅ Phase 2 plugins registered successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Phase 2 plugins: {e}")
        raise

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