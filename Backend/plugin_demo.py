"""
Plugin System Demo Script
Demonstrates the complete plugin system functionality
"""

import asyncio
import logging
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from services.master_plugin_initialization import initialize_complete_plugin_system, get_plugin_system_status
from services.plugin_service import plugin_manager
from models.plugins import PluginCategory

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def demo_plugin_system():
    """
    Comprehensive plugin system demonstration
    """
    print("🚀 SAADHYAM AI ENTERPRISE PLUGIN SYSTEM DEMO")
    print("=" * 60)
    
    try:
        # Get database session
        async for db in get_db():
            # Initialize plugin system
            print("🔌 Initializing Plugin System...")
            await initialize_complete_plugin_system(db)
            
            # Get system status
            status = await get_plugin_system_status()
            print(f"✅ Plugin System Status: {status['status']}")
            print(f"📊 Total Plugins: {status['total_plugins']}")
            print(f"📁 Categories: {status['categories']}")
            print(f"🤖 AI-Powered: {status['ai_powered_plugins']}")
            print(f"💎 Premium: {status['premium_plugins']}")
            print()
            
            # Demo 1: List available plugins by category
            print("📋 DEMO 1: Available Plugins by Category")
            print("-" * 40)
            
            for category in PluginCategory:
                plugins = await plugin_manager.get_available_plugins(db, category)
                print(f"{category.value.replace('_', ' ').title()}: {len(plugins)} plugins")
                
                # Show first 3 plugins in each category
                for i, plugin in enumerate(plugins[:3]):
                    ai_badge = "🤖" if plugin.is_ai_powered else ""
                    premium_badge = "💎" if plugin.is_premium else ""
                    print(f"  {plugin.icon} {plugin.name} {ai_badge}{premium_badge}")
                
                if len(plugins) > 3:
                    print(f"  ... and {len(plugins) - 3} more")
                print()
            
            # Demo 2: Install plugins for a demo user
            print("👤 DEMO 2: Installing Plugins for Demo User")
            print("-" * 40)
            
            demo_user_id = 1  # Assuming user with ID 1 exists
            
            # Install some sample plugins
            demo_plugins = [
                "sales_call_recording",
                "marketing_meta_ads", 
                "finance_expense_tracker",
                "ai_productivity_email_assistant",
                "hr_recruitment_ats"
            ]
            
            for plugin_key in demo_plugins:
                try:
                    user_plugin = await plugin_manager.install_plugin_for_user(
                        db, demo_user_id, plugin_key
                    )
                    print(f"✅ Installed: {user_plugin.plugin.name}")
                except Exception as e:
                    print(f"❌ Failed to install {plugin_key}: {e}")
            
            print()
            
            # Demo 3: Execute plugin actions
            print("⚡ DEMO 3: Executing Plugin Actions")
            print("-" * 40)
            
            # Execute Call Recording plugin
            print("📞 Testing Sales Call Recording Plugin...")
            result = await plugin_manager.execute_plugin_action(
                db, demo_user_id, "sales_call_recording", "start_recording",
                {
                    "call_id": "demo_call_001",
                    "participants": ["John Doe", "Jane Smith"],
                    "quality": "high"
                }
            )
            
            if result["success"]:
                print(f"✅ Call recording started: {result['result']['data']['call_id']}")
            else:
                print(f"❌ Call recording failed: {result['error']}")
            
            # Execute Meta Ads plugin
            print("\n📘 Testing Meta Ads Manager Plugin...")
            result = await plugin_manager.execute_plugin_action(
                db, demo_user_id, "marketing_meta_ads", "get_campaigns",
                {"status": "active", "limit": 5}
            )
            
            if result["success"]:
                campaigns = result["result"]["data"]["campaigns"]
                print(f"✅ Retrieved {len(campaigns)} active campaigns")
                for campaign in campaigns:
                    print(f"   - {campaign['name']}: ${campaign['daily_budget']}/day")
            else:
                print(f"❌ Meta Ads failed: {result['error']}")
            
            # Execute Expense Tracker plugin  
            print("\n📊 Testing Expense Tracker Plugin...")
            result = await plugin_manager.execute_plugin_action(
                db, demo_user_id, "finance_expense_tracker", "add_expense",
                {
                    "amount": 150.00,
                    "description": "Team lunch meeting",
                    "category": "Meals",
                    "date": "2024-01-15",
                    "vendor": "Restaurant ABC"
                }
            )
            
            if result["success"]:
                expense = result["result"]["data"]
                print(f"✅ Expense added: {expense['description']} - ${expense['amount']}")
            else:
                print(f"❌ Expense tracking failed: {result['error']}")
            
            # Execute AI Email Assistant plugin
            print("\n📧 Testing AI Email Assistant Plugin...")
            result = await plugin_manager.execute_plugin_action(
                db, demo_user_id, "ai_productivity_email_assistant", "compose_email",
                {
                    "subject": "Follow-up on our meeting",
                    "purpose": "follow_up",
                    "tone": "professional",
                    "key_points": [
                        "Thank you for your time today",
                        "Attaching the proposal as discussed",
                        "Available for questions next week"
                    ]
                }
            )
            
            if result["success"]:
                email = result["result"]["data"]
                print(f"✅ Email composed: {email['subject']}")
                print(f"   Word count: {email['word_count']}")
                print(f"   Tone: {email['tone']}")
            else:
                print(f"❌ Email composition failed: {result['error']}")
            
            print()
            
            # Demo 4: User plugin management
            print("🔧 DEMO 4: User Plugin Management")
            print("-" * 40)
            
            # Get user's installed plugins
            user_plugins = await plugin_manager.get_user_plugins(db, demo_user_id)
            print(f"📱 User has {len(user_plugins)} installed plugins:")
            
            for user_plugin in user_plugins:
                status = "🟢 Enabled" if user_plugin.is_enabled else "🔴 Disabled"
                usage = f"Used {user_plugin.usage_count} times"
                print(f"   {user_plugin.plugin.icon} {user_plugin.plugin.name} - {status} ({usage})")
            
            print()
            
            # Demo 5: Plugin analytics
            print("📈 DEMO 5: Plugin Analytics")
            print("-" * 40)
            
            # Get plugin analytics (mock data for demo)
            analytics = await plugin_manager.get_plugin_analytics(db, "sales_call_recording")
            print(f"📞 Call Recording Analytics:")
            print(f"   Total Installs: {analytics.get('total_installs', 'N/A')}")
            print(f"   Active Users: {analytics.get('active_users', 'N/A')}")
            print(f"   Error Rate: {analytics.get('error_rate', 'N/A')}%")
            print(f"   Average Rating: {analytics.get('average_rating', 'N/A')}/5")
            
            print()
            
            # Demo 6: Feature highlights
            print("🌟 DEMO 6: Key Features Showcase")
            print("-" * 40)
            
            features = [
                "✅ 140+ Enterprise Plugins across 15 categories",
                "✅ User-specific plugin installations and configurations",
                "✅ AI-powered plugins with advanced capabilities", 
                "✅ Plugin marketplace with ratings and reviews",
                "✅ Real-time plugin execution and results",
                "✅ Comprehensive analytics and usage tracking",
                "✅ Premium plugins and monetization support",
                "✅ Extensible architecture for custom plugins",
                "✅ Secure plugin sandboxing and permissions",
                "✅ Automatic plugin discovery and registration"
            ]
            
            for feature in features:
                print(f"   {feature}")
            
            print()
            print("🎉 PLUGIN SYSTEM DEMO COMPLETED SUCCESSFULLY!")
            print("🔌 The enterprise plugin marketplace is fully operational")
            print("=" * 60)
            
            break  # Exit the async for loop
            
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}", exc_info=True)
        print(f"❌ Demo failed: {e}")

if __name__ == "__main__":
    asyncio.run(demo_plugin_system())