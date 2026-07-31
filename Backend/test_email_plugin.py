import sys
import os
import asyncio
from pathlib import Path

# Add Backend to python path
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

from sqlalchemy import select
from config.database import AsyncSessionLocal, init_db
from models.user import User
from services.plugin_service import plugin_manager
from fastapi import HTTPException


async def main():
    await init_db()

    print("--- INITIATING EMAIL MARKETING PLUGIN TEST EXECUTION ---")
    async with AsyncSessionLocal() as db:
        # Load the first user
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        
        if not user:
            print("Error: No user found in database.")
            return

        print(f"Executing plugin action for User: {user.email} (ID: {user.id})...")
        
        # Test campaign parameters
        params = {
            "subject": "Test",
            "body": "Hello",
            "recipients": ["test@example.com"]
        }
        
        try:
            result = await plugin_manager.execute_plugin_action(
                db=db,
                user_id=user.id,
                plugin_key="sales_email_marketing",
                action="send_campaign",
                params=params
            )
            print("\n--- EXECUTION SUCCESSFUL ---")
            print(result)
        except HTTPException as e:
            print("\n--- EXECUTION FAILED (HTTPException) ---")
            print(f"Status Code: {e.status_code}")
            print(f"Detail: {e.detail}")
        except Exception as e:
            print("\n--- EXECUTION FAILED (General Exception) ---")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
