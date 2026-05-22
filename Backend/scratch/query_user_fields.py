import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ No DATABASE_URL found in .env")
    exit(1)

sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url, connect_args={"sslmode": "require"})

with engine.connect() as conn:
    print("--- USER PROFILES ---")
    users = conn.execute(text("SELECT id, email, name, business_name, business_location, business_description, business_setup_completed FROM users")).fetchall()
    for u in users:
        print(f"ID: {u[0]} | Email: {u[1]} | Name: {u[2]} | Business: {u[3]} | Location: {u[4]} | Desc: {u[5]} | Completed: {u[6]}")
