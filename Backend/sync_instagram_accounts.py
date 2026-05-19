"""
Sync SocialAccount to InstagramBusinessAccount
Creates InstagramBusinessAccount entries from SocialAccount entries
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.settings import settings
from models.instagram import SocialAccount
from models.instagram_analytics import InstagramBusinessAccount

def sync_accounts():
    """Sync Instagram accounts from SocialAccount to InstagramBusinessAccount"""
    try:
        # Create engine
        engine = create_engine(str(settings.DATABASE_URL).replace('+asyncpg', ''))
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        # Get all Instagram social accounts
        social_accounts = db.query(SocialAccount).filter(
            SocialAccount.platform == "instagram",
            SocialAccount.is_active == True
        ).all()
        
        print(f"📊 Found {len(social_accounts)} Instagram social account(s)")
        
        for social_account in social_accounts:
            # Check if business account already exists
            existing = db.query(InstagramBusinessAccount).filter(
                InstagramBusinessAccount.ig_account_id == social_account.ig_user_id
            ).first()
            
            if existing:
                print(f"✅ Business account already exists for @{social_account.ig_username}")
                # Update access token
                existing.access_token = social_account.access_token
                existing.access_token_expires_at = social_account.access_token_expires_at
                existing.is_active = True
                print(f"🔄 Updated access token for @{social_account.ig_username}")
            else:
                # Create new business account
                business_account = InstagramBusinessAccount(
                    user_id=social_account.user_id,
                    ig_account_id=social_account.ig_user_id,
                    username=social_account.ig_username,
                    access_token=social_account.access_token,
                    access_token_expires_at=social_account.access_token_expires_at,
                    facebook_page_id=social_account.page_id,
                    facebook_page_name=social_account.page_name,
                    is_active=True
                )
                db.add(business_account)
                print(f"✨ Created business account for @{social_account.ig_username}")
        
        db.commit()
        print("✅ Sync complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Syncing Instagram accounts...")
    sync_accounts()
