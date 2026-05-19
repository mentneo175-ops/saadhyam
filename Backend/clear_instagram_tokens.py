"""
Clear all Instagram tokens from database to force reconnection with new long-lived tokens
"""
import sys
from sqlalchemy import create_engine, text
from config.settings import settings

def clear_instagram_tokens():
    """Delete all Instagram social accounts to force fresh OAuth"""
    try:
        # Create engine
        engine = create_engine(str(settings.DATABASE_URL).replace('+asyncpg', ''))
        
        with engine.connect() as conn:
            # Delete all Instagram social accounts
            result = conn.execute(
                text("DELETE FROM social_accounts WHERE platform = 'instagram'")
            )
            conn.commit()
            
            deleted_count = result.rowcount
            print(f"✅ Deleted {deleted_count} Instagram account(s)")
            print("🔄 Please reconnect your Instagram account from the dashboard")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🗑️  Clearing Instagram tokens from database...")
    clear_instagram_tokens()
