import os
import sys
import httpx
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add Backend folder to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "Backend"))

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "Backend", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ No DATABASE_URL found in .env")
    exit(1)

sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
engine = create_engine(sync_url, connect_args={"sslmode": "require"})

# Import security and config settings from backend
from utils.security import create_access_token
from config.settings import settings

# Get a user to test with
with engine.connect() as conn:
    user = conn.execute(text("SELECT id, email FROM users WHERE id = 24")).fetchone()
    if not user:
        print("❌ User 24 not found")
        exit(1)
    user_id, email = user
    print(f"Testing with User {user_id} ({email})")

    # Generate token
    token = create_access_token(user_id, email)
    
    # Update active session token in DB to bypass single session check
    conn.execute(text("UPDATE users SET active_session_token = :token WHERE id = :user_id"), {"token": token, "user_id": user_id})
    conn.commit()
    print("✅ Updated active_session_token in database.")

# Make request to local backend
url = "http://localhost:8000/api/b2b-chat/rooms"
headers = {"Authorization": f"Bearer {token}"}

print(f"Sending GET request to {url}...")
try:
    with httpx.Client() as client:
        response = client.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(response.text)
except Exception as e:
    print(f"❌ Request failed: {e}")
