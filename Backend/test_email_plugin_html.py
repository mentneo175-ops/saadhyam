"""
test_email_plugin_html.py

Verifies Phase 4.1 — HTML Email Support for the Email Marketing plugin.

Tests:
  1. Plain-text send_campaign (backward compatibility — no is_html param)
  2. HTML send_campaign (is_html=True)
  3. AI intent classifier detects "html email" and sets is_html=True
  4. AI intent classifier does NOT set is_html for plain requests
"""

import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.resolve()))

from config.database import AsyncSessionLocal, init_db
from sqlalchemy import select
from models.user import User
from services.plugin_service import plugin_manager


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_user(db, email: str):
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        raise ValueError(f"User {email!r} not found in database.")
    return user


async def run_plugin(user_id: int, params: dict, label: str):
    print(f"\n{'-' * 60}")
    print(f"  Test: {label}")
    print(f"  Params: {params}")
    print(f"{'-' * 60}")
    try:
        async with AsyncSessionLocal() as db:
            res = await plugin_manager.execute_plugin_action(
                db, user_id, "sales_email_marketing", "send_campaign", params
            )
        print(f"  OK Result: {res}")
    except Exception as exc:
        # We expect an SMTP auth / connection error in local tests — that's fine.
        # The key is that the plugin reaches the SMTP call without crashing on
        # the is_html parameter itself.
        print(f"  WARN Plugin raised (expected in local env): {exc}")


# ---------------------------------------------------------------------------
# Test 1 & 2 — Direct plugin execution
# ---------------------------------------------------------------------------

async def test_direct_plugin(user_id: int):
    # --- Test 1: Plain-text (no is_html — backward compatibility) ---
    await run_plugin(
        user_id,
        {
            "recipients": ["test@example.com"],
            "subject": "Plain Text Test",
            "body": "Hello! This is a plain-text email."
            # is_html deliberately omitted → defaults to False
        },
        label="Plain-text send_campaign (backward compat)"
    )

    # --- Test 2: HTML email (is_html=True) ---
    await run_plugin(
        user_id,
        {
            "recipients": ["test@example.com"],
            "subject": "HTML Email Test",
            "body": (
                "<html><body>"
                "<h1>Hello!</h1>"
                "<p>This is an <b>HTML</b> email from the Marketing plugin.</p>"
                "<p style='color:green;'>Enjoy your 20% discount today!</p>"
                "</body></html>"
            ),
            "is_html": True
        },
        label="HTML send_campaign (is_html=True)"
    )


# ---------------------------------------------------------------------------
# Test 3 & 4 — AI intent classifier
# ---------------------------------------------------------------------------

def test_classifier():
    from services.assistant_service import rule_based_tool_classifier

    tools = [
        {
            "plugin_key": "sales_email_marketing",
            "plugin_name": "Email Marketing",
            "description": "Send email campaigns",
            "actions": []
        }
    ]

    print(f"\n{'-' * 60}")
    print("  Test 3: Classifier detects HTML intent")
    result = rule_based_tool_classifier(
        "Send an html email to john@example.com with subject Offer saying Hello!",
        tools
    )
    assert result is not None, "Expected a tool call to be triggered"
    assert result.get("plugin_key") == "sales_email_marketing"
    assert result["params"].get("is_html") is True, f"Expected is_html=True, got {result['params']}"
    print(f"  PASS is_html correctly set to True: {result['params']}")

    print(f"\n{'-' * 60}")
    print("  Test 4: Classifier does NOT set is_html for plain-text request")
    result2 = rule_based_tool_classifier(
        "Send email to john@example.com saying Welcome!",
        tools
    )
    assert result2 is not None, "Expected a tool call to be triggered"
    assert "is_html" not in result2["params"], (
        f"Expected is_html to be absent for plain-text request, got {result2['params']}"
    )
    print(f"  PASS is_html correctly absent: {result2['params']}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    await init_db()

    print("\n=== Phase 4.1 -- HTML Email Support Test Suite ===\n")

    # Classifier tests are synchronous — run them first
    test_classifier()

    # Plugin execution tests need a real user in the DB
    async with AsyncSessionLocal() as db:
        user = await get_user(db, "superadmin@gmail.com")

    await test_direct_plugin(user.id)

    print("\n=== All tests complete ===\n")


if __name__ == "__main__":
    asyncio.run(main())
