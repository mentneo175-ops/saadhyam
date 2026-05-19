"""Test if the app has the auth routes"""
from main import app

print("=" * 60)
print("Testing app routes...")
print("=" * 60)

auth_routes = [r for r in app.routes if '/auth' in str(r.path)]
print(f"Found {len(auth_routes)} auth routes:")
for route in auth_routes:
    print(f"  - {route.path} ({route.methods if hasattr(route, 'methods') else 'N/A'})")

print("=" * 60)
print(f"Total routes: {len(app.routes)}")
print("=" * 60)
