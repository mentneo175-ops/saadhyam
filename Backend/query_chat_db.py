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
    print("--- USERS ---")
    users = conn.execute(text("SELECT id, email, name, business_name FROM users WHERE business_setup_completed = TRUE")).fetchall()
    for u in users:
        print(f"User ID: {u[0]}, Email: {u[1]}, Name: {u[2]}, Business: {u[3]}")
    
    print("\n--- CHAT ROOMS ---")
    rooms = conn.execute(text("SELECT id, user1_id, user2_id, created_at FROM chat_rooms")).fetchall()
    for r in rooms:
        print(f"Room ID: {r[0]}, User1: {r[1]}, User2: {r[2]}, Created: {r[3]}")
        
    print("\n--- CHAT MESSAGES ---")
    messages = conn.execute(text("SELECT id, room_id, sender_id, message, created_at FROM chat_messages")).fetchall()
    for m in messages:
        print(f"Msg ID: {m[0]}, Room: {m[1]}, Sender: {m[2]}, Msg: {m[3]}, Created: {m[4]}")
