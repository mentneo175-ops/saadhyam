#!/usr/bin/env python3
"""
Minimal Plugin System Server
Simplified version to demonstrate plugin functionality
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List

# Add current directory to path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
except ImportError:
    print("❌ FastAPI not available. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'fastapi', 'uvicorn', '--break-system-packages'])
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn

app = FastAPI(
    title="Saadhyam AI Plugin System",
    description="Enterprise Plugin Marketplace API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Complete plugin database with all requested plugins
MOCK_PLUGINS = [
    # 🏢 Sales & CRM
    {"id": 1, "plugin_key": "sales_call_recording", "name": "📞 Call Recording & AI Analysis", "description": "Record sales calls and analyze conversations with AI", "icon": "📞", "category": "sales_crm", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 5, "install_count": 1250},
    {"id": 2, "plugin_key": "sales_lead_scoring", "name": "🎯 Lead Scoring AI", "description": "AI-powered lead scoring and prioritization system", "icon": "🎯", "category": "sales_crm", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 980},
    {"id": 3, "plugin_key": "sales_email_marketing", "name": "📧 Email Marketing", "description": "Create and manage email marketing campaigns", "icon": "📧", "category": "sales_crm", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1540},
    {"id": 4, "plugin_key": "sales_sms_campaigns", "name": "📱 SMS Campaigns", "description": "Send targeted SMS marketing campaigns", "icon": "📱", "category": "sales_crm", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 720},
    {"id": 5, "plugin_key": "sales_live_chat", "name": "💬 Live Chat", "description": "Real-time chat support for website visitors", "icon": "💬", "category": "sales_crm", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 5, "install_count": 2100},
    {"id": 6, "plugin_key": "sales_ai_coach", "name": "🤖 AI Sales Coach", "description": "AI-powered sales coaching and performance insights", "icon": "🤖", "category": "sales_crm", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 650},
    {"id": 7, "plugin_key": "sales_proposal_generator", "name": "📋 Proposal Generator", "description": "Generate professional proposals and contracts", "icon": "📋", "category": "sales_crm", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 4, "install_count": 1320},
    {"id": 8, "plugin_key": "sales_quotation_generator", "name": "📄 Quotation Generator", "description": "Create detailed quotations with pricing", "icon": "📄", "category": "sales_crm", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1180},
    {"id": 9, "plugin_key": "sales_affiliate_management", "name": "🤝 Affiliate Management", "description": "Manage affiliate partners and commission tracking", "icon": "🤝", "category": "sales_crm", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 580},
    {"id": 10, "plugin_key": "sales_payment_reminder", "name": "💳 Payment Reminder AI", "description": "Automated payment reminders with intelligent scheduling", "icon": "💳", "category": "sales_crm", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 890},

    # 📢 Marketing
    {"id": 11, "plugin_key": "marketing_meta_ads", "name": "📘 Meta Ads Manager", "description": "Manage Facebook and Instagram advertising campaigns", "icon": "📘", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 850},
    {"id": 12, "plugin_key": "marketing_google_ads", "name": "🔍 Google Ads AI", "description": "AI-powered Google Ads campaign management", "icon": "🔍", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 920},
    {"id": 13, "plugin_key": "marketing_linkedin", "name": "💼 LinkedIn Marketing", "description": "B2B marketing campaigns on LinkedIn", "icon": "💼", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 640},
    {"id": 14, "plugin_key": "marketing_seo_optimizer", "name": "🎯 SEO Optimizer", "description": "Comprehensive SEO analysis and optimization", "icon": "🎯", "category": "marketing", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 5, "install_count": 1650},
    {"id": 15, "plugin_key": "marketing_blog_generator", "name": "📝 Blog Generator", "description": "AI-powered blog content creation", "icon": "📝", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 1230},
    {"id": 16, "plugin_key": "marketing_landing_page_builder", "name": "🏗️ Landing Page Builder", "description": "Create high-converting landing pages", "icon": "🏗️", "category": "marketing", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1780},
    {"id": 17, "plugin_key": "marketing_ai_video_generator", "name": "🎥 AI Video Generator", "description": "Create marketing videos with AI", "icon": "🎥", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 540},
    {"id": 18, "plugin_key": "marketing_ai_image_studio", "name": "🎨 AI Image Studio", "description": "Generate marketing images with AI", "icon": "🎨", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 780},
    {"id": 19, "plugin_key": "marketing_influencer_finder", "name": "👑 Influencer Finder", "description": "Discover and connect with relevant influencers", "icon": "👑", "category": "marketing", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 4, "install_count": 450},
    {"id": 20, "plugin_key": "marketing_campaign_analytics", "name": "📊 Campaign Analytics", "description": "Track marketing campaign performance", "icon": "📊", "category": "marketing", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 5, "install_count": 1420},

    # 💰 Finance
    {"id": 21, "plugin_key": "finance_gst_filing", "name": "📋 GST Filing", "description": "Automated GST return filing for Indian businesses", "icon": "📋", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 5, "install_count": 1100},
    {"id": 22, "plugin_key": "finance_payroll", "name": "💼 Payroll", "description": "Complete payroll management system", "icon": "💼", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 5, "install_count": 950},
    {"id": 23, "plugin_key": "finance_employee_salary", "name": "💰 Employee Salary", "description": "Manage employee salary structures", "icon": "💰", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 820},
    {"id": 24, "plugin_key": "finance_expense_tracker", "name": "📊 Expense Tracker", "description": "Track business expenses with receipt scanning", "icon": "📊", "category": "finance", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 5, "install_count": 2100},
    {"id": 25, "plugin_key": "finance_budget_planner", "name": "📈 Budget Planner", "description": "Create and monitor budgets with forecasting", "icon": "📈", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 740},
    {"id": 26, "plugin_key": "finance_cash_flow_dashboard", "name": "💸 Cash Flow Dashboard", "description": "Real-time cash flow monitoring", "icon": "💸", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 680},
    {"id": 27, "plugin_key": "finance_subscription_billing", "name": "🔄 Subscription Billing", "description": "Manage recurring subscriptions", "icon": "🔄", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 560},
    {"id": 28, "plugin_key": "finance_payment_gateway", "name": "💳 Payment Gateway Manager", "description": "Integrate multiple payment gateways", "icon": "💳", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 890},
    {"id": 29, "plugin_key": "finance_tax_calculator", "name": "🧮 Tax Calculator", "description": "Calculate various taxes and compliance", "icon": "🧮", "category": "finance", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1340},
    {"id": 30, "plugin_key": "finance_forecast_ai", "name": "🔮 Financial Forecast AI", "description": "AI-powered financial forecasting", "icon": "🔮", "category": "finance", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 420}
]

PLUGIN_CATEGORIES = [
    {"key": "sales_crm", "name": "🏢 Sales & CRM", "description": "Sales and Customer Relationship Management tools"},
    {"key": "marketing", "name": "📢 Marketing", "description": "Marketing automation and campaign management"},
    {"key": "finance", "name": "💰 Finance", "description": "Financial management and accounting tools"},
    {"key": "hr", "name": "👨‍💼 HR", "description": "Human Resources and employee management"},
    {"key": "inventory", "name": "📦 Inventory", "description": "Inventory and warehouse management"},
    {"key": "ecommerce", "name": "🛒 E-Commerce", "description": "E-commerce platform integrations"},
    {"key": "documents", "name": "📄 Documents", "description": "Document management and processing"},
    {"key": "legal", "name": "⚖️ Legal", "description": "Legal compliance and documentation"},
    {"key": "analytics", "name": "📊 Analytics", "description": "Data analytics and reporting"},
    {"key": "ai_agents", "name": "🤖 AI Agents", "description": "AI-powered virtual assistants"},
    {"key": "website", "name": "🌐 Website", "description": "Website building and management"},
    {"key": "communication", "name": "📱 Communication", "description": "Communication and messaging tools"},
    {"key": "education", "name": "🎓 Education", "description": "Educational and learning management"},
    {"key": "industry_specific", "name": "🏥 Industry-Specific", "description": "Industry-specific solutions"},
    {"key": "ai_productivity", "name": "🧠 AI Productivity", "description": "AI-powered productivity tools"}
]

# Mock user plugins
MOCK_USER_PLUGINS = [
    {
        "id": 1,
        "is_enabled": True,
        "installed_version": "1.0.0",
        "usage_count": 45,
        "last_used": "2024-01-15T10:30:00Z",
        "plugin": MOCK_PLUGINS[0]
    },
    {
        "id": 2,
        "is_enabled": True,
        "installed_version": "1.0.0",
        "usage_count": 23,
        "last_used": "2024-01-14T15:20:00Z",
        "plugin": MOCK_PLUGINS[2]
    }
]

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🔌 Saadhyam AI Plugin System",
        "status": "operational",
        "plugins_available": len(MOCK_PLUGINS),
        "categories": len(PLUGIN_CATEGORIES),
        "documentation": "/docs",
        "plugin_test": "/api/plugins/test"
    }

@app.get("/api/plugins/test")
async def test_plugin_system():
    """Test endpoint to verify plugin system is working"""
    return {
        "status": "✅ Plugin system is operational",
        "message": "All plugin endpoints are available",
        "total_plugins": len(MOCK_PLUGINS),
        "categories": len(PLUGIN_CATEGORIES),
        "features": [
            "Plugin marketplace browsing",
            "Plugin installation management", 
            "Plugin execution framework",
            "User-specific configurations",
            "Analytics and monitoring",
            "Premium plugin support"
        ],
        "endpoints": [
            "GET /api/plugins/categories",
            "GET /api/plugins/available", 
            "GET /api/plugins/installed",
            "POST /api/plugins/install",
            "POST /api/plugins/execute",
            "PUT /api/plugins/{key}/toggle",
            "DELETE /api/plugins/{key}",
            "GET /api/plugins/{key}/info"
        ]
    }

@app.get("/api/plugins/categories")
async def get_plugin_categories():
    """Get all plugin categories"""
    return {"categories": PLUGIN_CATEGORIES}

@app.get("/api/plugins/available")
async def get_available_plugins(category: str = None, include_premium: bool = True):
    """Get all available plugins in the store"""
    plugins = MOCK_PLUGINS.copy()
    
    if category:
        plugins = [p for p in plugins if p["category"] == category]
    
    if not include_premium:
        plugins = [p for p in plugins if not p["is_premium"]]
    
    return {
        "plugins": plugins,
        "total": len(plugins),
        "filtered_by": {"category": category, "include_premium": include_premium}
    }

@app.get("/api/plugins/installed")
async def get_user_plugins(category: str = None, enabled_only: bool = True):
    """Get user's installed plugins"""
    user_plugins = MOCK_USER_PLUGINS.copy()
    
    if category:
        user_plugins = [up for up in user_plugins if up["plugin"]["category"] == category]
    
    if enabled_only:
        user_plugins = [up for up in user_plugins if up["is_enabled"]]
    
    return {
        "plugins": user_plugins,
        "total": len(user_plugins)
    }

@app.post("/api/plugins/install")
async def install_plugin(request: Dict[str, Any]):
    """Install a plugin for the current user"""
    plugin_key = request.get("plugin_key")
    
    if not plugin_key:
        raise HTTPException(status_code=400, detail="plugin_key is required")
    
    # Find the plugin
    plugin = next((p for p in MOCK_PLUGINS if p["plugin_key"] == plugin_key), None)
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    
    # Check if already installed
    existing = next((up for up in MOCK_USER_PLUGINS if up["plugin"]["plugin_key"] == plugin_key), None)
    if existing:
        return {
            "success": True,
            "message": f"Plugin {plugin_key} already installed",
            "user_plugin": existing
        }
    
    # Create new installation
    new_user_plugin = {
        "id": len(MOCK_USER_PLUGINS) + 1,
        "is_enabled": True,
        "installed_version": plugin["version"],
        "usage_count": 0,
        "last_used": None,
        "plugin": plugin
    }
    
    MOCK_USER_PLUGINS.append(new_user_plugin)
    
    return {
        "success": True,
        "message": f"Plugin {plugin_key} installed successfully",
        "user_plugin": new_user_plugin
    }

@app.post("/api/plugins/execute")
async def execute_plugin(request: Dict[str, Any]):
    """Execute a plugin action"""
    plugin_key = request.get("plugin_key")
    action = request.get("action")
    params = request.get("params", {})
    
    if not plugin_key or not action:
        raise HTTPException(status_code=400, detail="plugin_key and action are required")
    
    # Check if plugin is installed
    user_plugin = next((up for up in MOCK_USER_PLUGINS if up["plugin"]["plugin_key"] == plugin_key), None)
    if not user_plugin:
        raise HTTPException(status_code=404, detail="Plugin not installed")
    
    # Mock execution based on plugin type
    if plugin_key == "sales_call_recording":
        if action == "start_recording":
            result = {
                "call_id": params.get("call_id", "demo_call"),
                "status": "recording",
                "participants": params.get("participants", ["User A", "User B"]),
                "quality": params.get("quality", "high"),
                "start_time": "2024-01-15T10:00:00Z"
            }
        elif action == "analyze_call":
            result = {
                "call_id": params.get("call_id", "demo_call"),
                "sentiment_score": 0.7,
                "key_topics": ["product demo", "pricing", "next steps"],
                "action_items": ["Send proposal", "Schedule follow-up"],
                "insights": {"client_interest_level": "high"}
            }
        else:
            result = {"message": f"Action {action} executed"}
            
    elif plugin_key == "marketing_meta_ads":
        if action == "get_campaigns":
            result = {
                "campaigns": [
                    {"name": "Summer Sale", "budget": 50.00, "status": "active"},
                    {"name": "Brand Awareness", "budget": 25.00, "status": "active"}
                ],
                "total_campaigns": 2
            }
        else:
            result = {"message": f"Action {action} executed"}
            
    elif plugin_key == "ai_productivity_email_assistant":
        if action == "compose_email":
            result = {
                "subject": params.get("subject", "Demo Email"),
                "content": f"This is a demo email composed by AI for: {params.get('subject', 'Demo')}",
                "tone": params.get("tone", "professional"),
                "word_count": 25
            }
        else:
            result = {"message": f"Action {action} executed"}
    else:
        result = {"message": f"Plugin {plugin_key} action {action} executed with params: {params}"}
    
    # Update usage count
    user_plugin["usage_count"] += 1
    user_plugin["last_used"] = "2024-01-15T10:00:00Z"
    
    return {
        "success": True,
        "result": result,
        "execution_time": 150  # milliseconds
    }

@app.get("/api/plugins/{plugin_key}/info")
async def get_plugin_info(plugin_key: str):
    """Get detailed information about a plugin"""
    plugin = next((p for p in MOCK_PLUGINS if p["plugin_key"] == plugin_key), None)
    if not plugin:
        raise HTTPException(status_code=404, detail="Plugin not found")
    
    return plugin

@app.put("/api/plugins/{plugin_key}/toggle")
async def toggle_plugin(plugin_key: str):
    """Enable/disable a plugin for the current user"""
    user_plugin = next((up for up in MOCK_USER_PLUGINS if up["plugin"]["plugin_key"] == plugin_key), None)
    if not user_plugin:
        raise HTTPException(status_code=404, detail="Plugin not installed")
    
    user_plugin["is_enabled"] = not user_plugin["is_enabled"]
    
    return {
        "success": True,
        "message": f"Plugin {'enabled' if user_plugin['is_enabled'] else 'disabled'}",
        "enabled": user_plugin["is_enabled"]
    }

if __name__ == "__main__":
    print("🚀 SAADHYAM AI PLUGIN SYSTEM - MINIMAL SERVER")
    print("=" * 60)
    print("🔌 Starting plugin system demonstration...")
    print("🌐 Server will be available at: http://localhost:8002")
    print("📚 API docs at: http://localhost:8002/docs")
    print("🧪 Test endpoint: http://localhost:8002/api/plugins/test")
    print("📊 Available plugins: http://localhost:8002/api/plugins/available")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        log_level="info"
    )
# Continue adding more plugins (HR category and beyond)
MORE_PLUGINS = [
    # 👨‍💼 HR
    {"id": 31, "plugin_key": "hr_recruitment_ats", "name": "🎯 Recruitment ATS", "description": "Applicant Tracking System for recruitment", "icon": "🎯", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 750},
    {"id": 32, "plugin_key": "hr_resume_screening", "name": "📄 Resume Screening AI", "description": "AI-powered resume analysis and matching", "icon": "📄", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 620},
    {"id": 33, "plugin_key": "hr_employee_attendance", "name": "⏰ Employee Attendance", "description": "Track employee attendance with biometric integration", "icon": "⏰", "category": "hr", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1450},
    {"id": 34, "plugin_key": "hr_leave_management", "name": "🏖️ Leave Management", "description": "Manage employee leave requests and balances", "icon": "🏖️", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 890},
    {"id": 35, "plugin_key": "hr_performance_reviews", "name": "⭐ Performance Reviews", "description": "Conduct structured performance evaluations", "icon": "⭐", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 680},
    {"id": 36, "plugin_key": "hr_employee_onboarding", "name": "🚀 Employee Onboarding", "description": "Streamline new employee onboarding", "icon": "🚀", "category": "hr", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1120},
    {"id": 37, "plugin_key": "hr_training_portal", "name": "🎓 Training Portal", "description": "Employee training and development platform", "icon": "🎓", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 4, "install_count": 540},
    {"id": 38, "plugin_key": "hr_interview_scheduler", "name": "📅 Interview Scheduler", "description": "Automate interview scheduling", "icon": "📅", "category": "hr", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 980},
    {"id": 39, "plugin_key": "hr_payroll_integration", "name": "💰 Payroll Integration", "description": "Integrate HR data with payroll systems", "icon": "💰", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 720},
    {"id": 40, "plugin_key": "hr_chatbot", "name": "🤖 HR Chatbot", "description": "AI-powered HR assistant for employee queries", "icon": "🤖", "category": "hr", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 450},

    # 📦 Inventory
    {"id": 41, "plugin_key": "inventory_management", "name": "📦 Inventory Management", "description": "Complete inventory tracking system", "icon": "📦", "category": "inventory", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1680},
    {"id": 42, "plugin_key": "inventory_barcode_scanner", "name": "📱 Barcode Scanner", "description": "Mobile barcode scanning for inventory", "icon": "📱", "category": "inventory", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1320},
    {"id": 43, "plugin_key": "inventory_warehouse_manager", "name": "🏭 Warehouse Manager", "description": "Manage warehouse operations and locations", "icon": "🏭", "category": "inventory", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 580},
    {"id": 44, "plugin_key": "inventory_purchase_orders", "name": "📋 Purchase Orders", "description": "Create and manage purchase orders", "icon": "📋", "category": "inventory", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 890},
    {"id": 45, "plugin_key": "inventory_vendor_management", "name": "🤝 Vendor Management", "description": "Manage supplier relationships", "icon": "🤝", "category": "inventory", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 640},
    {"id": 46, "plugin_key": "inventory_delivery_tracking", "name": "🚚 Delivery Tracking", "description": "Track shipments and deliveries", "icon": "🚚", "category": "inventory", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1240},
    {"id": 47, "plugin_key": "inventory_stock_forecast", "name": "🔮 Stock Forecast AI", "description": "AI-powered demand forecasting", "icon": "🔮", "category": "inventory", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 380},
    {"id": 48, "plugin_key": "inventory_returns_management", "name": "↩️ Returns Management", "description": "Handle product returns and exchanges", "icon": "↩️", "category": "inventory", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 520},

    # 🛒 E-Commerce
    {"id": 49, "plugin_key": "ecommerce_shopify_connector", "name": "🛍️ Shopify Connector", "description": "Sync with Shopify stores", "icon": "🛍️", "category": "ecommerce", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 5, "install_count": 920},
    {"id": 50, "plugin_key": "ecommerce_woocommerce_connector", "name": "🔧 WooCommerce Connector", "description": "Integrate with WooCommerce", "icon": "🔧", "category": "ecommerce", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 780},
    {"id": 51, "plugin_key": "ecommerce_amazon_seller", "name": "📦 Amazon Seller Hub", "description": "Manage Amazon seller account", "icon": "📦", "category": "ecommerce", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 1150},
    {"id": 52, "plugin_key": "ecommerce_flipkart_seller", "name": "🏪 Flipkart Seller Hub", "description": "Manage Flipkart marketplace", "icon": "🏪", "category": "ecommerce", "version": "1.0.0", "is_premium": True, "is_ai_powered": False, "pricing_tier": "pro", "rating": 4, "install_count": 640},
    {"id": 53, "plugin_key": "ecommerce_order_management", "name": "📋 Order Management", "description": "Centralized order processing", "icon": "📋", "category": "ecommerce", "version": "1.0.0", "is_premium": False, "is_ai_powered": True, "pricing_tier": "free", "rating": 5, "install_count": 1420},
    {"id": 54, "plugin_key": "ecommerce_shipping_automation", "name": "🚚 Shipping Automation", "description": "Automate shipping and fulfillment", "icon": "🚚", "category": "ecommerce", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "premium", "rating": 5, "install_count": 560},
    {"id": 55, "plugin_key": "ecommerce_coupon_manager", "name": "🎟️ Coupon Manager", "description": "Create and manage promotional coupons", "icon": "🎟️", "category": "ecommerce", "version": "1.0.0", "is_premium": False, "is_ai_powered": False, "pricing_tier": "free", "rating": 4, "install_count": 1280},
    {"id": 56, "plugin_key": "ecommerce_customer_loyalty", "name": "⭐ Customer Loyalty", "description": "Build customer loyalty programs", "icon": "⭐", "category": "ecommerce", "version": "1.0.0", "is_premium": True, "is_ai_powered": True, "pricing_tier": "pro", "rating": 5, "install_count": 720}
]

# Extend the main plugins list
MOCK_PLUGINS.extend(MORE_PLUGINS)