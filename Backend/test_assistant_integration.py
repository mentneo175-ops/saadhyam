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
from services.assistant_service import generate_response


async def main():
    await init_db()

    print("--- SIMULATING CHATBOT CONVERSATION WITH AI AGENT ---")
    async with AsyncSessionLocal() as db:
        # Load the user superadmin@gmail.com
        res = await db.execute(select(User).where(User.email == "superadmin@gmail.com"))
        user = res.scalar_one_or_none()
        
        if not user:
            print("Error: user 'superadmin@gmail.com' not found.")
            return

        # Scenario: User requests the agent to send an email campaign
        query = "Send campaign to mark@example.com saying Welcome to our newsletter subscription!"
        print(f"\nUser query: '{query}'")
        print("Processing request through assistant pipeline...")
        
        # We pass get_db_sync mock or a session for sync queries. 
        # Since business_context fallback query might execute a sync DB check, we pass the db session.
        try:
            response = await generate_response(query=query, db=db, user=user)
            print("\n--- AGENT CHAT RESPONSE ---")
            print(response)
        except Exception as e:
            print(f"\n--- AGENT ENCOUNTERED ERROR ---")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
