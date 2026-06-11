import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_for_migration

def run_migration():
    print("=" * 60)
    print("Running SaaS Wallet & Leased Number Migration...")
    print("=" * 60)
    
    db = get_db_for_migration()
    try:
        # Add wallet_balance column
        print("Adding wallet_balance column...")
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance FLOAT DEFAULT 0.00;"))
        db.commit()
        print("wallet_balance column verified/added.")

        # Add leased_phone_number column
        print("Adding leased_phone_number column...")
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS leased_phone_number VARCHAR(50);"))
        db.commit()
        print("leased_phone_number column verified/added.")
        
        # Gift existing users $25.00 for testing purposes
        print("Gifting existing users $25.00 in test wallet balance...")
        db.execute(text("UPDATE users SET wallet_balance = 25.00 WHERE wallet_balance = 0.00;"))
        db.commit()
        print("Gifted $25.00 test credits to all eligible users.")
        
        print("\nMigration completed successfully!")
        
    except Exception as e:
        print(f"\nMigration failed: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("=" * 60)

if __name__ == "__main__":
    run_migration()
