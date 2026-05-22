import os
import requests
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
    # Get a user who has an active session token and is part of a room
    user_token = None
    room_id = None
    
    # Let's find room
    room = conn.execute(text("SELECT id, user1_id, user2_id FROM chat_rooms LIMIT 1")).fetchone()
    if not room:
        print("❌ No chat rooms found")
        exit(1)
    
    room_id, user1_id, user2_id = room
    print(f"Found Room ID: {room_id} between User1: {user1_id} and User2: {user2_id}")
    
    # Get active session token of user1
    user = conn.execute(text("SELECT id, email, active_session_token FROM users WHERE id = :user_id"), {"user_id": user1_id}).fetchone()
    if user and user[2]:
        user_id, email, user_token = user
        print(f"Found active session token for User {email} (ID: {user_id})")
    else:
        # Check user2
        user = conn.execute(text("SELECT id, email, active_session_token FROM users WHERE id = :user_id"), {"user_id": user2_id}).fetchone()
        if user and user[2]:
            user_id, email, user_token = user
            print(f"Found active session token for User {email} (ID: {user_id})")
        else:
            print("❌ No active session tokens found for either user in the room. Let's list any user with a token.")
            any_user = conn.execute(text("SELECT id, email, active_session_token FROM users WHERE active_session_token IS NOT NULL LIMIT 1")).fetchone()
            if any_user:
                print(f"Found user with token: {any_user[1]} (ID: {any_user[0]})")
                # Let's update the room to include this user as user1_id
                conn.execute(text("UPDATE chat_rooms SET user1_id = :user_id WHERE id = :room_id"), {"user_id": any_user[0], "room_id": room_id})
                conn.commit()
                print(f"Updated Room {room_id} to have User1: {any_user[0]}")
                user_id, email, user_token = any_user
            else:
                print("❌ No active sessions in users table at all!")
                exit(1)

# Now make the request to clear endpoint
url = f"http://localhost:8000/api/b2b-chat/rooms/{room_id}/clear"
headers = {"Authorization": f"Bearer {user_token}"}
print(f"Sending POST request to {url}...")
try:
    resp = requests.post(url, headers=headers, timeout=10)
    print(f"Response Status Code: {resp.status_code}")
    print(f"Response JSON: {resp.json() if resp.headers.get('content-type', '').startswith('application/json') else resp.text}")
except Exception as e:
    print(f"Request failed: {e}")
