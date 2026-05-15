"""Check which routes are registered"""
import sys
sys.path.insert(0, '.')

# Import after path is set
from main import app

print("=" * 80)
print("REGISTERED ROUTES IN FASTAPI APP")
print("=" * 80)

routes_by_prefix = {}

for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        path = route.path
        methods = ', '.join(route.methods)
        
        # Group by prefix
        prefix = path.split('/')[1] if len(path.split('/')) > 1 else 'root'
        if prefix not in routes_by_prefix:
            routes_by_prefix[prefix] = []
        routes_by_prefix[prefix].append(f"{methods:15} {path}")

# Print grouped routes
for prefix in sorted(routes_by_prefix.keys()):
    print(f"\n📁 /{prefix}")
    print("-" * 80)
    for route in sorted(routes_by_prefix[prefix]):
        print(f"  {route}")

print("\n" + "=" * 80)
print(f"Total routes: {len([r for r in app.routes if hasattr(r, 'path')])}")
print("=" * 80)

# Check for specific routes
print("\n🔍 Checking for specific routes:")
print(f"  Auth routes (/auth): {len([r for r in app.routes if hasattr(r, 'path') and '/auth' in r.path])}")
print(f"  Voice Agent V2 (/api/v2/voice-agent): {len([r for r in app.routes if hasattr(r, 'path') and '/api/v2/voice-agent' in r.path])}")
print(f"  Protected routes (/me, /profile): {len([r for r in app.routes if hasattr(r, 'path') and ('/me' in r.path or '/profile' in r.path)])}")
