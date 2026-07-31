import sys
import asyncio
import logging
from pathlib import Path

# Add Backend to python path
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

from sqlalchemy import select
from config.database import AsyncSessionLocal, init_db
from models.user import User
from services.assistant_service import generate_response, CONVERSATION_MEMORY


async def main():
    await init_db()

    print("--- SIMULATING CHAT EMAIL FLOW ---")
    async with AsyncSessionLocal() as db:
        # Load the user superadmin@gmail.com
        res = await db.execute(select(User).where(User.email == "superadmin@gmail.com"))
        user = res.scalar_one_or_none()
        
        if not user:
            print("Error: user 'superadmin@gmail.com' not found.")
            return

        # Clear any left-over memory state first
        CONVERSATION_MEMORY.pop(user.id, None)

        # Simulating user query
        query = "Send an email to test@example.com with subject Test Email and body Hello from Saadhyam."
        print(f"User Query: '{query}'")
        
        response = await generate_response(query=query, db=db, user=user)
        print(f"Assistant Response:\n{response}")


if __name__ == "__main__":
    asyncio.run(main())
