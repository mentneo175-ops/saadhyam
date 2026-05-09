"""
Test if routes are properly registered
Run this to verify all routes are available
"""

import sys
sys.path.insert(0, '.')

from main import app

print("=" * 60)
print("REGISTERED ROUTES TEST")
print("=" * 60)
print()

# Get all routes
routes = []
for route in app.routes:
    if hasattr(route, "methods") and hasattr(route, "path"):
        routes.append({
            "path": route.path,
            "methods": list(route.methods),
            "name": route.name
        })

# Filter for the problematic routes
print("🔍 Checking for missing routes:")
print()

missing_routes = [
    ("/api/profile/business", "PUT"),
    ("/api/business/import-website", "POST"),
]

for path, method in missing_routes:
    found = False
    for route in routes:
        if route["path"] == path and method in route["methods"]:
            print(f"✅ FOUND: {method} {path}")
            found = True
            break
    
    if not found:
        print(f"❌ MISSING: {method} {path}")

print()
print("=" * 60)
print("ALL PROFILE ROUTES:")
print("=" * 60)

profile_routes = [r for r in routes if "/profile" in r["path"]]
for route in profile_routes:
    methods_str = ", ".join(route["methods"])
    print(f"  {methods_str:20} {route['path']}")

print()
print("=" * 60)
print("ALL BUSINESS ROUTES:")
print("=" * 60)

business_routes = [r for r in routes if "/business" in r["path"]]
for route in business_routes:
    methods_str = ", ".join(route["methods"])
    print(f"  {methods_str:20} {route['path']}")

print()
print("=" * 60)
print(f"TOTAL ROUTES: {len(routes)}")
print("=" * 60)
