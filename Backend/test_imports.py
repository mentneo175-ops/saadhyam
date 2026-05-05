"""
Test script to verify all imports work correctly
"""

import sys
from pathlib import Path

print("="*70)
print("TESTING IMPORTS FOR CONTENT CREATOR & IMAGE GENERATOR")
print("="*70)

# Test 1: Import content creator service
print("\n1. Testing content_creator_service import...")
try:
    from services.content_creator_service import generate_content
    print("   ✅ content_creator_service imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import content_creator_service: {e}")
    sys.exit(1)

# Test 2: Import image generator service
print("\n2. Testing image_generator_service import...")
try:
    from services.image_generator_service import generate_image
    print("   ✅ image_generator_service imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import image_generator_service: {e}")
    sys.exit(1)

# Test 3: Import content creator route
print("\n3. Testing content_creator route import...")
try:
    from routes.content_creator import router
    print("   ✅ content_creator route imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import content_creator route: {e}")
    sys.exit(1)

# Test 4: Import image generator route
print("\n4. Testing image_generator route import...")
try:
    from routes.image_generator import router
    print("   ✅ image_generator route imported successfully")
except Exception as e:
    print(f"   ❌ Failed to import image_generator route: {e}")
    sys.exit(1)

# Test 5: Check if content_creator app path is accessible
print("\n5. Testing content_creator app path...")
try:
    CONTENT_CREATOR_PATH = Path(__file__).resolve().parent / "ai_models" / "content_creator" / "app"
    if CONTENT_CREATOR_PATH.exists():
        print(f"   ✅ Content creator app path exists: {CONTENT_CREATOR_PATH}")
    else:
        print(f"   ❌ Content creator app path not found: {CONTENT_CREATOR_PATH}")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Error checking path: {e}")
    sys.exit(1)

# Test 6: Try importing from content_creator app
print("\n6. Testing content_creator app imports...")
try:
    sys.path.insert(0, str(CONTENT_CREATOR_PATH))
    from app.services.mistral_content_service import generate_content_with_mistral_adapter
    from app.models.schema import ImageGenerationRequest
    from app.services.flux_service import generate_flux_image
    from app.services.sd_service import generate_sd_image
    print("   ✅ All content_creator app imports successful")
except Exception as e:
    print(f"   ❌ Failed to import from content_creator app: {e}")
    sys.exit(1)

# Test 7: Check output directory
print("\n7. Testing output directory...")
try:
    OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "images"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if OUTPUT_DIR.exists():
        print(f"   ✅ Output directory exists: {OUTPUT_DIR}")
    else:
        print(f"   ❌ Output directory not found: {OUTPUT_DIR}")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Error with output directory: {e}")
    sys.exit(1)

# Test 8: Verify function signatures
print("\n8. Testing function signatures...")
try:
    # Test generate_content signature
    import inspect
    sig = inspect.signature(generate_content)
    params = list(sig.parameters.keys())
    if 'data' in params:
        print("   ✅ generate_content has correct signature")
    else:
        print(f"   ❌ generate_content has unexpected signature: {params}")
        sys.exit(1)
    
    # Test generate_image signature
    sig = inspect.signature(generate_image)
    params = list(sig.parameters.keys())
    if 'data' in params:
        print("   ✅ generate_image has correct signature")
    else:
        print(f"   ❌ generate_image has unexpected signature: {params}")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Error checking function signatures: {e}")
    sys.exit(1)

print("\n" + "="*70)
print("✅ ALL IMPORT TESTS PASSED!")
print("="*70)
print("\nNext steps:")
print("1. Start the backend: python main.py")
print("2. Run API tests: python test_content_creator_detailed.py")
print("="*70)
