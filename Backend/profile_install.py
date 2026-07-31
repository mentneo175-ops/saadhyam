import sys
import os
import time
from pathlib import Path

# Add Backend to python path
current_dir = Path(__file__).parent.resolve()
sys.path.insert(0, str(current_dir))

import asyncio
from sqlalchemy import select
from config.database import AsyncSessionLocal, DATABASE_URL, async_engine
from models.user import User

async def main():
    print(f"DATABASE_URL: {DATABASE_URL}")
    print(f"Async Engine URL: {async_engine.url}")
    
    t0 = time.monotonic()
    print("Creating session...")
    async with AsyncSessionLocal() as db:
        t1 = time.monotonic()
        print(f"Session created in {t1-t0:.4f}s")
        
        print("Executing user query...")
        t_q0 = time.monotonic()
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        t_q1 = time.monotonic()
        print(f"User query completed in {t_q1-t_q0:.4f}s (user exists: {user is not None})")
        
        print("Executing another user query...")
        t_q2 = time.monotonic()
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        t_q3 = time.monotonic()
        print(f"Second user query completed in {t_q3-t_q2:.4f}s")

if __name__ == "__main__":
    asyncio.run(main())
