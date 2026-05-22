import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Force stdout to write UTF-8 safely on Windows
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ No DATABASE_URL found in .env")
    exit(1)

sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url, connect_args={"sslmode": "require"})

with engine.connect() as conn:
    print("--- ALL USER PROFILES ---")
    users = conn.execute(text("SELECT id, email, name, business_name, business_location, business_description, business_setup_completed FROM users")).fetchall()
    for u in users:
        desc = u[5]
        if desc:
            # truncate for readability
            desc = desc[:150] + "..." if len(desc) > 150 else desc
        print(f"ID: {u[0]} | Email: {u[1]} | Name: {u[2]} | Business: {u[3]} | Location: {u[4]} | Desc: {desc} | Setup Completed: {u[6]}")
