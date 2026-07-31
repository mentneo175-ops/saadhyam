import sys
import os
import time
from pathlib import Path

# Add Backend to python path
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

import asyncio
from sqlalchemy import select
from config.database import AsyncSessionLocal, init_db
from models.user import User
from models.plugins import Plugin, UserPlugin
from services.plugin_service import plugin_manager

async def main():
    await init_db()
    
    print("--- TESTING DYNAMIC PLUGIN EXECUTION LAYER ---")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        if not user:
            print("No user found")
            return
        
        user_id = user.id
        plugin_key = "sales_email_marketing"
        
        # Check plugin registry exists
        res = await db.execute(select(Plugin).where(Plugin.plugin_key == plugin_key))
        plugin = res.scalar_one_or_none()
        if not plugin:
            print(f"Plugin registry '{plugin_key}' not found in database catalog.")
            return
        
        # Verify installed for user or install it
        res = await db.execute(
            select(UserPlugin).where(
                UserPlugin.user_id == user_id,
                UserPlugin.plugin_id == plugin.id
            )
        )
        user_plugin = res.scalar_one_or_none()
        if not user_plugin:
            print("Installing plugin for user...")
            user_plugin = await plugin_manager.install_plugin_for_user(db, user_id, plugin_key)
            
        # Update user_config with dummy configurations
        print("Configuring SMTP credentials...")
        user_plugin.user_config = {
            "smtp_host": "localhost",
            "smtp_port": 1025, # dummy local port
            "sender_email": "test@example.com",
            "password_or_api_key": "dummy_password",
            "sender_name": "Test Sender"
        }
        user_plugin.is_enabled = True
        db.add(user_plugin)
        await db.commit()
        await db.refresh(user_plugin)
        
        # Execute send_campaign
        print("\nExecuting plugin action 'send_campaign'...")
        t_start = time.monotonic()
        try:
            action_res = await plugin_manager.execute_plugin_action(
                db=db,
                user_id=user_id,
                plugin_key=plugin_key,
                action="send_campaign",
                params={
                    "subject": "Test Subject",
                    "body": "Test Body message contents",
                    "recipients": ["rec1@example.com", "rec2@example.com"]
                }
            )
            t_end = time.monotonic()
            print(f"Action execution response: {action_res}")
            print(f"Action took: {t_end-t_start:.4f}s")
        except Exception as e:
            t_end = time.monotonic()
            print(f"Action execution raised an error: {e}")
            # If it's a connection refuse error from localhost:1025, it means the SMTP connection check ran correctly!
            print(f"Action took: {t_end-t_start:.4f}s")

if __name__ == "__main__":
    asyncio.run(main())
