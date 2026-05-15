"""Check database configuration"""
from config.database import IS_SQLITE, DATABASE_URL

print("=" * 60)
print("  DATABASE CONFIGURATION")
print("=" * 60)
print()
print(f"Database Type: {'SQLite' if IS_SQLITE else 'PostgreSQL (NeonDB)'}")
print(f"Database URL: {DATABASE_URL[:60]}...")
print()

if IS_SQLITE:
    print("⚠️  WARNING: Using SQLite (not recommended for production)")
else:
    print("✅ Using PostgreSQL (NeonDB) - Production ready!")
print()
print("=" * 60)
