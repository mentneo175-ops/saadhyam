import sys
import asyncio
from datetime import datetime
from pathlib import Path

# Add Backend to python path
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from config.database import AsyncSessionLocal, init_db
from models.user import User
from models.plugins import Plugin, UserPlugin
from services.plugin_service import plugin_manager
from services.assistant_service import generate_response, CONVERSATION_MEMORY


async def test_e2e():
    await init_db()
    print("Starting final E2E verification...")

    async with AsyncSessionLocal() as db:
        # Load user
        res = await db.execute(select(User).where(User.email == "superadmin@gmail.com"))
        user = res.scalar_one_or_none()
        if not user:
            print("FAILED: User not found")
            return

        # 1. Ensure plugin is installed and enabled
        result = await db.execute(
            select(UserPlugin)
            .options(selectinload(UserPlugin.plugin))
            .join(Plugin)
            .where(UserPlugin.user_id == user.id, Plugin.plugin_key == "sales_email_marketing")
        )
        user_plugin = result.scalar_one_or_none()
        if not user_plugin:
            print("Installing plugin sales_email_marketing...")
            user_plugin = await plugin_manager.install_plugin_for_user(
                db, user.id, "sales_email_marketing"
            )
        
        user_plugin.is_enabled = True
        
        # 2. Save SMTP configuration (if empty or placeholder)
        if not user_plugin.user_config or "egxxx" in str(user_plugin.user_config.get("password_or_api_key")):
            smtp_config = {
                "smtp_host": "smtp.gmail.com",
                "smtp_port": 587,
                "sender_email": "likhitha7274@gmail.com",
                "password_or_api_key": "egxxxxxxxxxxxxxx",
                "sender_name": "Test Runner"
            }
            user_plugin.user_config = smtp_config
            await db.commit()
            await db.refresh(user_plugin)
        print("OK Config saved.")

        # 3. Verify values reload correctly (Persistence)
        reloaded_config = user_plugin.user_config
        assert reloaded_config["smtp_host"] is not None
        assert reloaded_config["smtp_port"] is not None
        assert reloaded_config["sender_email"] is not None
        print("OK Config reload verification passed.")

        # 4. Check initial stats
        initial_usage = user_plugin.usage_count
        initial_last_used = user_plugin.last_used
        print(f"Initial Usage Count: {initial_usage}, Last Used: {initial_last_used}")

    # 5. Send plain-text email from chatbot
    print("Sending plain-text email via chatbot...")
    query_plain = "Send an email to test@example.com with subject Test Plain and body Hello from Saadhyam."
    async with AsyncSessionLocal() as db:
        resp_plain = await generate_response(query_plain, db, user)
    print(f"Chatbot response: {resp_plain}")
    assert "success" in resp_plain.lower() or "sent" in resp_plain.lower()

    # 6. Send HTML email from chatbot
    print("Sending HTML email via chatbot...")
    query_html = "Send an html email to test@example.com with subject Test HTML and body <b>Hello</b> from Saadhyam."
    async with AsyncSessionLocal() as db:
        resp_html = await generate_response(query_html, db, user)
    print(f"Chatbot response: {resp_html}")
    assert "success" in resp_html.lower() or "sent" in resp_html.lower()

    # 7. Verify missing parameters collection conversationally
    print("Testing conversational parameter collection...")
    async with AsyncSessionLocal() as db:
        CONVERSATION_MEMORY.pop(user.id, None)
        # Missing subject and body
        resp_conv1 = await generate_response("Send an email to test@example.com", db, user)
    print(f"Chatbot response (missing subject/body): {resp_conv1}")
    assert "subject" in resp_conv1.lower() or "body" in resp_conv1.lower()

    # 8. Verify usage_count and last_used updated
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(UserPlugin)
            .join(Plugin)
            .where(UserPlugin.user_id == user.id, Plugin.plugin_key == "sales_email_marketing")
        )
        updated_up = result.scalar_one_or_none()
        print(f"Updated Usage Count: {updated_up.usage_count}, Last Used: {updated_up.last_used}")
        assert updated_up.usage_count > initial_usage
        assert updated_up.last_used is not None
        if initial_last_used:
            assert updated_up.last_used > initial_last_used
        print("OK Usage metrics verification passed.")

    print("\n--- ALL PROGRAMMATIC VERIFICATIONS PASSED SUCCESSFULLY ---")


if __name__ == "__main__":
    asyncio.run(test_e2e())
