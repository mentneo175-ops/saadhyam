"""
WhatsApp System User Migration Script
Adds facebook_user_id and token_type fields to whatsapp_accounts table
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def run_migration():
    """Run the WhatsApp System User migration"""
    
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        return False
    
    # Fix SSL mode for asyncpg - convert sslmode=require to ssl=require
    if "sslmode=require" in database_url:
        database_url = database_url.replace("sslmode=require", "ssl=require")
    
    print("=" * 80)
    print("🚀 WhatsApp System User Migration")
    print("=" * 80)
    print(f"📊 Database: {database_url.split('@')[1].split('/')[0] if '@' in database_url else 'Unknown'}")
    print()
    
    # Create async engine with proper SSL configuration
    engine = create_async_engine(
        database_url, 
        echo=False,
        connect_args={"ssl": "require"} if "neon.tech" in database_url else {}
    )
    
    try:
        async with engine.begin() as conn:
            print("📝 Step 1: Checking if columns already exist...")
            
            # Check if columns exist
            check_facebook_user_id = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='whatsapp_accounts' 
                AND column_name='facebook_user_id'
            """)
            
            check_token_type = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='whatsapp_accounts' 
                AND column_name='token_type'
            """)
            
            result_fb = await conn.execute(check_facebook_user_id)
            fb_exists = result_fb.fetchone() is not None
            
            result_token = await conn.execute(check_token_type)
            token_exists = result_token.fetchone() is not None
            
            if fb_exists and token_exists:
                print("✅ Columns already exist. Migration not needed.")
                return True
            
            print("📝 Step 2: Adding facebook_user_id column...")
            if not fb_exists:
                await conn.execute(text("""
                    ALTER TABLE whatsapp_accounts 
                    ADD COLUMN facebook_user_id VARCHAR(255)
                """))
                print("   ✅ facebook_user_id column added")
            else:
                print("   ⏭️  facebook_user_id column already exists")
            
            print("📝 Step 3: Adding token_type column...")
            if not token_exists:
                await conn.execute(text("""
                    ALTER TABLE whatsapp_accounts 
                    ADD COLUMN token_type VARCHAR(50) DEFAULT 'system_user' NOT NULL
                """))
                print("   ✅ token_type column added")
            else:
                print("   ⏭️  token_type column already exists")
            
            print("📝 Step 4: Creating index on facebook_user_id...")
            try:
                await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_facebook_user_id 
                    ON whatsapp_accounts(facebook_user_id)
                """))
                print("   ✅ Index created")
            except Exception as e:
                print(f"   ⚠️  Index creation skipped: {e}")
            
            print("📝 Step 5: Updating existing records...")
            result = await conn.execute(text("""
                UPDATE whatsapp_accounts 
                SET token_type = 'system_user' 
                WHERE token_type IS NULL
            """))
            updated_count = result.rowcount
            print(f"   ✅ Updated {updated_count} existing records")
            
            print()
            print("=" * 80)
            print("✅ Migration completed successfully!")
            print("=" * 80)
            print()
            print("📋 Summary:")
            print(f"   - facebook_user_id column: {'Added' if not fb_exists else 'Already existed'}")
            print(f"   - token_type column: {'Added' if not token_exists else 'Already existed'}")
            print(f"   - Index created: ✅")
            print(f"   - Existing records updated: {updated_count}")
            print()
            
            return True
            
    except Exception as e:
        print()
        print("=" * 80)
        print("❌ Migration failed!")
        print("=" * 80)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        await engine.dispose()


if __name__ == "__main__":
    print()
    success = asyncio.run(run_migration())
    
    if success:
        print("🎉 You can now use the updated WhatsApp OAuth flow!")
        print("   The system now supports System User tokens properly.")
        print()
        sys.exit(0)
    else:
        print("❌ Migration failed. Please check the error above.")
        print()
        sys.exit(1)
