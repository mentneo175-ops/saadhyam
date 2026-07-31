import sys
import os
import asyncio
from pathlib import Path

# Add Backend to python path
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

# pyrefly: ignore [missing-import]
from sqlalchemy import select
from config.database import AsyncSessionLocal, init_db
from models.user import User
from models.plugins import Plugin, UserPlugin


async def main():
    await init_db()

    target_email = "superadmin@gmail.com"
    print(f"--- UPDATING CONFIGURATION FOR USER: {target_email} ---")
    
    async with AsyncSessionLocal() as db:
        # 1. Query user by email
        user_res = await db.execute(select(User).where(User.email == target_email))
        user = user_res.scalar_one_or_none()
        
        if not user:
            print(f"Error: User '{target_email}' not found in the database.")
            return
            
        user_id = user.id

        # 2. Query the specific UserPlugin installation record
        stmt = (
            select(UserPlugin)
            .join(Plugin)
            .where(
                UserPlugin.user_id == user_id,
                Plugin.plugin_key == "sales_email_marketing"
            )
        )
        result = await db.execute(stmt)
        user_plugin = result.scalar_one_or_none()
        
        if not user_plugin:
            print(f"Error: No installation record found for 'sales_email_marketing' for user '{target_email}'.")
            print("Please install the plugin for this user first.")
            return

        old_config = user_plugin.user_config or {}
        # Retain existing password/API key if present, otherwise fall back to a placeholder
        existing_pw = "egorlpgderheuysa"

        new_config = {
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "sender_email": "likhitha7274@gmail.com",
            "password_or_api_key": existing_pw,
            "sender_name": "My Business"
        }

        # 3. Print verification stats
        print(f"User ID: {user_plugin.user_id}")
        print(f"Plugin ID: {user_plugin.plugin_id}")
        print(f"Old config: {old_config}")
        print(f"New config: {new_config}")

        # 4. Update config and commit
        user_plugin.user_config = new_config
        db.add(user_plugin)
        
        await db.commit()
        print("Transaction committed.")

        # 5. Refresh and verify
        await db.refresh(user_plugin)
        
        # Read again from DB to verify persistence
        stmt_verify = select(UserPlugin).where(UserPlugin.id == user_plugin.id)
        verify_res = await db.execute(stmt_verify)
        verified_row = verify_res.scalar_one()
        
        print(f"Saved JSON verification: {verified_row.user_config}")
        print("Configuration updated and verified successfully!")


if __name__ == "__main__":
    asyncio.run(main())
