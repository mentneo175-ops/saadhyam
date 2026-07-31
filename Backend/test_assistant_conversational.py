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
from services.assistant_service import generate_response, CONVERSATION_MEMORY


async def run_turn(query: str, db, user) -> str:
    print(f"\nUser query: '{query}'")
    response = await generate_response(query=query, db=db, user=user)
    print(f"Agent response: '{response}'")
    
    # Print state memory
    memory = CONVERSATION_MEMORY.get(user.id)
    if memory:
        print(f"[State Memory] Missing parameters: {memory['missing']}, Pending: {memory['pending_params']}")
    else:
        print("[State Memory] Empty (flow completed or not started)")
    return response


async def main():
    await init_db()

    print("--- SIMULATING CONVERSATIONAL CHAT WITH STATE MEMORY ---")
    async with AsyncSessionLocal() as db:
        # Load the user superadmin@gmail.com
        res = await db.execute(select(User).where(User.email == "superadmin@gmail.com"))
        user = res.scalar_one_or_none()
        
        if not user:
            print("Error: user 'superadmin@gmail.com' not found.")
            return

        # Clear any left-over memory state first
        CONVERSATION_MEMORY.pop(user.id, None)

        # Turn 1: Trigger the plugin campaign action
        await run_turn("Send a marketing email", db, user)
        
        # Turn 2: Provide recipient
        await run_turn("mark@example.com", db, user)
        
        # Turn 3: Provide invalid subject (empty space or cancel)
        # We will test validation checks by sending something empty or invalid
        # Let's send a valid subject
        await run_turn("Promo Code Offer", db, user)
        
        # Turn 4: Provide email body (this should trigger execution!)
        await run_turn("Get 20% discount on all premium plans starting today!", db, user)


if __name__ == "__main__":
    asyncio.run(main())
