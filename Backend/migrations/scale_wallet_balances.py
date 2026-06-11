import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_for_migration

def run_migration():
    print("=" * 60)
    print("Scaling SaaS Wallet Balances from USD to INR...")
    print("=" * 60)
    
    db = get_db_for_migration()
    try:
        # Check current user balances
        print("Checking user balances before scaling...")
        users = db.execute(text("SELECT id, email, wallet_balance FROM users;")).fetchall()
        for u in users:
            print(f"User ID: {u.id}, Email: {u.email}, Balance: ${u.wallet_balance:.2f}")
            
        print("\nUpdating wallet balances: wallet_balance = wallet_balance * 80...")
        result = db.execute(text("UPDATE users SET wallet_balance = wallet_balance * 80;"))
        db.commit()
        print(f"Updated {result.rowcount} users successfully.")
        
        print("\nChecking user balances after scaling...")
        updated_users = db.execute(text("SELECT id, email, wallet_balance FROM users;")).fetchall()
        for u in updated_users:
            print(f"User ID: {u.id}, Email: {u.email}, Balance: ₹{u.wallet_balance:.2f}")
            
        print("\nWallet scaling completed successfully!")
        
    except Exception as e:
        print(f"\nScaling failed: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("=" * 60)

if __name__ == "__main__":
    run_migration()
