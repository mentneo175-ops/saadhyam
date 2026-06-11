import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_for_migration

def check_balances():
    db = get_db_for_migration()
    try:
        users = db.execute(text("SELECT id, email, wallet_balance FROM users;")).fetchall()
        print("--- USER WALLET BALANCES ---")
        for u in users:
            print(f"User ID: {u.id}, Email: {u.email}, Balance: INR {u.wallet_balance:.2f}")
    finally:
        db.close()

if __name__ == "__main__":
    check_balances()
