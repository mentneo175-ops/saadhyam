#!/usr/bin/env python3
"""Test if AEO/GEO module imports correctly"""

import sys
import os

# Add Backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Backend'))

try:
    print("Testing AEO/GEO module import...")
    from routes.aeo_geo import router
    print("✓ SUCCESS: aeo_geo router imported successfully")
    print(f"  Router prefix: {router.prefix}")
    print(f"  Router tags: {router.tags}")
    
    # Count endpoints
    endpoints = [r for r in router.routes]
    print(f"  Total endpoints: {len(endpoints)}")
    
except Exception as e:
    print(f"✗ FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nAll imports successful!")
