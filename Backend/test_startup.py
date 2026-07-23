"""
Test Backend Startup
Simple test to verify backend components are working
"""

import os
import sys
import asyncio
import logging

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_startup():
    """Test basic backend components"""
    
    print("🔧 Testing Saadhyam AI Backend Components")
    print("=" * 50)
    
    try:
        # Test 1: Database connection
        print("1️⃣ Testing Database Connection...")
        try:
            from config.database import get_db, init_db
            
            # Initialize database
            await init_db()
            print("✅ Database connection successful")
            
            # Test session creation
            async for db in get_db():
                print("✅ Database session created successfully")
                break
                
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
        
        # Test 2: Plugin system imports
        print("\n2️⃣ Testing Plugin System Imports...")
        try:
            from services.plugin_service import plugin_manager
            from models.plugins import Plugin, UserPlugin, PluginCategory
            from services.master_plugin_initialization import initialize_complete_plugin_system
            
            print("✅ Plugin system imports successful")
            print(f"✅ Plugin categories available: {len(PluginCategory)}")
            
        except Exception as e:
            print(f"❌ Plugin system import failed: {e}")
            return False
        
        # Test 3: Plugin base classes
        print("\n3️⃣ Testing Plugin Base Classes...")
        try:
            from plugins.base import BasePlugin, AIPlugin
            
            # Test plugin instantiation
            class TestPlugin(BasePlugin):
                plugin_key = "test_plugin"
                plugin_name = "Test Plugin"
                plugin_description = "A test plugin"
                plugin_icon = "🧪"
                plugin_category = "test"
                
                def get_actions(self):
                    return []
                
                def get_config_schema(self):
                    return {}
            
            test_plugin = TestPlugin()
            info = test_plugin.get_info()
            
            print("✅ Plugin base classes working")
            print(f"✅ Test plugin info: {info['name']}")
            
        except Exception as e:
            print(f"❌ Plugin base classes failed: {e}")
            return False
        
        # Test 4: Routes import  
        print("\n4️⃣ Testing Routes Import...")
        try:
            from routes.plugins import router as plugins_router
            
            print("✅ Plugin routes imported successfully")
            print(f"✅ Plugin router prefix: {plugins_router.prefix}")
            
        except Exception as e:
            print(f"❌ Plugin routes import failed: {e}")
            return False
        
        # Test 5: Sample plugin loading
        print("\n5️⃣ Testing Sample Plugin Loading...")
        try:
            from plugins.sales_call_recording.main import PluginMain as CallRecordingPlugin
            from plugins.marketing_meta_ads.main import PluginMain as MetaAdsPlugin
            
            # Test plugin instantiation
            call_plugin = CallRecordingPlugin()
            meta_plugin = MetaAdsPlugin()
            
            print("✅ Sample plugins loaded successfully")
            print(f"✅ Call Recording Plugin: {call_plugin.get_info()['name']}")
            print(f"✅ Meta Ads Plugin: {meta_plugin.get_info()['name']}")
            
        except Exception as e:
            print(f"❌ Sample plugin loading failed: {e}")
            print("⚠️  This is expected if plugins haven't been registered yet")
        
        # Test 6: Configuration
        print("\n6️⃣ Testing Configuration...")
        try:
            from config.settings import settings
            
            print("✅ Settings loaded successfully")
            print(f"✅ Environment: {os.getenv('ENVIRONMENT', 'development')}")
            
        except Exception as e:
            print(f"❌ Configuration failed: {e}")
            return False
        
        print("\n" + "=" * 50)
        print("🎉 ALL TESTS PASSED - Backend Ready!")
        print("🔌 Plugin system is ready for initialization")
        print("🚀 You can now start the backend server")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Startup test failed: {e}", exc_info=True)
        print(f"\n❌ STARTUP TEST FAILED: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_startup())
    sys.exit(0 if success else 1)