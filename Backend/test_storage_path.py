"""Test script to verify storage path configuration"""
import sys
sys.path.insert(0, 'ai_models/website_ai')

from app.core.services.storage_service import StorageService

# Create storage service instance
storage = StorageService()

print(f"✅ Storage directory: {storage.base_websites_dir}")
print(f"✅ Directory exists: {storage.base_websites_dir.exists()}")

# Test creating a website directory
test_id = "test-website-123"
test_dir = storage.create_website_structure(test_id)
print(f"✅ Test directory created: {test_dir}")
print(f"✅ Test directory exists: {test_dir.exists()}")

# Clean up
import shutil
shutil.rmtree(test_dir)
print(f"✅ Test directory cleaned up")
