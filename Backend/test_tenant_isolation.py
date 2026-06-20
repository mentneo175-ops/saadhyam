import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add Backend folder to path
sys.path.append("c:/Users/Sai kiran/Desktop/Sadhyam/Backend")
load_dotenv("c:/Users/Sai kiran/Desktop/Sadhyam/Backend/.env")

# Import the FastAPI app
from main import fastapi_app
from utils.dependencies import get_current_user
from models.user import User
from models.voice_agent import CompanyProfile, AIAgent, Campaign, Lead, CallSession
from config.database import Base

client = TestClient(fastapi_app)

# Helper: Mock Users
class MockUser:
    def __init__(self, id, email):
        self.id = id
        self.email = email
        self.is_active = True
        self.is_suspended = False
        self.wallet_balance = 500.00
        self.leased_phone_number = "+1234567890"

# Global state to control which user is authenticated in the dependency override
active_mock_user = MockUser(id=24, email="saikiranmain1708@gmail.com")

def override_get_current_user():
    return active_mock_user

fastapi_app.dependency_overrides[get_current_user] = override_get_current_user

def run_tests():
    global active_mock_user
    
    print("🚀 Running Tenant Isolation Validation Tests...")

    # --- SETUP TEST DATA IN DB FOR USER 24 ---
    # We will use the database sync engine to check & create test entries if they don't exist
    DATABASE_URL = os.getenv("DATABASE_URL")
    sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(sync_url, connect_args={"sslmode": "require"})
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Create user 9999 if not present in users table (just mock is enough, but db FKey constraint requires actual user in DB)
        db.execute(
            text(
                "INSERT INTO users (id, email, hashed_password, name, role, is_active, created_at, updated_at) "
                "VALUES (9999, 'testuserB@saadhyam.ai', 'hashedpassword', 'User B', 'USER', true, now(), now()) "
                "ON CONFLICT (id) DO NOTHING"
            )
        )
        db.commit()

        # Clean up any existing test records for user 9999
        db.query(Lead).filter(Lead.user_id == 9999).delete()
        db.query(Campaign).filter(Campaign.user_id == 9999).delete()
        db.query(AIAgent).filter(AIAgent.user_id == 9999).delete()
        db.query(CompanyProfile).filter(CompanyProfile.user_id == 9999).delete()
        db.commit()

        # Ensure user 24 has a CompanyProfile, Agent, Campaign, and Lead
        agent_24 = db.query(AIAgent).filter(AIAgent.user_id == 24).first()
        if not agent_24:
            agent_24 = AIAgent(user_id=24, name="Swetha User 24", role="Sales assistant", prompt="Greet user")
            db.add(agent_24)
            db.commit()
            db.refresh(agent_24)

        campaign_24 = db.query(Campaign).filter(Campaign.user_id == 24).first()
        if not campaign_24:
            campaign_24 = Campaign(user_id=24, name="Campaign User 24", objective="Test objective", agent_id=agent_24.id)
            db.add(campaign_24)
            db.commit()
            db.refresh(campaign_24)

        lead_24 = db.query(Lead).filter(Lead.user_id == 24).first()
        if not lead_24:
            lead_24 = Lead(user_id=24, name="Lead User 24", phone="+919951768407", campaign_id=campaign_24.id)
            db.add(lead_24)
            db.commit()
            db.refresh(lead_24)

        print("\n--- Test 1: Fetching records as User A (ID 24) ---")
        active_mock_user = MockUser(id=24, email="saikiranmain1708@gmail.com")
        
        # Verify user 24 can see their own campaign
        res = client.get("/api/campaigns")
        assert res.status_code == 200, f"Failed: {res.status_code}"
        campaign_ids = [c["id"] for c in res.json()]
        assert campaign_24.id in campaign_ids, "User 24 should see their campaign"
        print("✅ User A successfully fetched their own campaigns.")

        # Verify user 24 can see their own lead
        res = client.get("/api/leads")
        assert res.status_code == 200
        lead_ids = [l["id"] for l in res.json()]
        assert lead_24.id in lead_ids, "User 24 should see their lead"
        print("✅ User A successfully fetched their own leads.")

        # Verify user 24 can see their own agent
        res = client.get("/api/agents")
        assert res.status_code == 200
        agent_ids = [a["id"] for a in res.json()]
        assert agent_24.id in agent_ids, "User 24 should see their agent"
        print("✅ User A successfully fetched their own agents.")

        print("\n--- Test 2: Fetching records as User B (ID 9999) ---")
        active_mock_user = MockUser(id=9999, email="testuserB@saadhyam.ai")

        # Verify user 9999 sees empty/zero campaigns (they shouldn't see user 24's campaign)
        res = client.get("/api/campaigns")
        assert res.status_code == 200
        campaign_ids = [c["id"] for c in res.json()]
        assert campaign_24.id not in campaign_ids, "User B should NOT see User A's campaign!"
        print("✅ User B cannot see User A's campaigns.")

        # Verify user 9999 sees empty/zero leads (they shouldn't see user 24's lead)
        res = client.get("/api/leads")
        assert res.status_code == 200
        lead_ids = [l["id"] for l in res.json()]
        assert lead_24.id not in lead_ids, "User B should NOT see User A's lead!"
        print("✅ User B cannot see User A's leads.")

        # Verify user 9999 sees empty/zero agents
        res = client.get("/api/agents")
        assert res.status_code == 200
        agent_ids = [a["id"] for a in res.json()]
        assert agent_24.id not in agent_ids, "User B should NOT see User A's agent!"
        print("✅ User B cannot see User A's agents.")

        print("\n--- Test 3: Mutating/Accessing other user's resource directly ---")
        
        # User B tries to update User A's agent
        res = client.put(f"/api/agents/{agent_24.id}", json={
            "name": "Hacked Agent",
            "role": "Scammer",
            "prompt": "Steal data",
            "voice_id": "dummy",
            "languages": "en",
            "whatsapp_threshold": 50
        })
        assert res.status_code == 404, f"Should return 404 Not Found (isolated). Got: {res.status_code}"
        print("✅ User B was blocked from updating User A's agent (returned 404).")

        # User B tries to delete User A's campaign
        res = client.delete(f"/api/campaigns/{campaign_24.id}")
        assert res.status_code == 404, f"Should return 404. Got: {res.status_code}"
        print("✅ User B was blocked from deleting User A's campaign (returned 404).")

        # User B tries to trigger a call to User A's lead
        res = client.post(f"/api/voice-agent/leads/{lead_24.id}/call-real")
        assert res.status_code == 404, f"Should return 404. Got: {res.status_code}"
        print("✅ User B was blocked from triggering calls on User A's lead (returned 404).")

        print("\n--- Test 4: Creating resources and verifying owner mapping ---")
        
        # User B creates an agent
        res = client.post("/api/agents", json={
            "name": "Agent User B",
            "role": "Tech Support",
            "prompt": "Help users",
            "voice_id": "voiceB",
            "languages": "en",
            "whatsapp_threshold": 80
        })
        assert res.status_code == 200
        agent_B_id = res.json()["id"]
        
        # Query DB directly to verify agent_B has user_id = 9999
        agent_B_db = db.query(AIAgent).filter(AIAgent.id == agent_B_id).first()
        assert agent_B_db.user_id == 9999, f"Owner ID incorrect: {agent_B_db.user_id}"
        print("✅ New agent created by User B correctly maps to User B's ID in database.")

        # User B tries to create a campaign with User A's agent (agent_24)
        res = client.post("/api/campaigns", json={
            "name": "Malicious Campaign",
            "objective": "Use A's agent",
            "agent_id": agent_24.id,
            "status": "draft"
        })
        assert res.status_code == 404, f"Should return 404 Agent not found/authorized. Got: {res.status_code}"
        print("✅ User B was blocked from creating campaign using User A's agent.")

        # User B creates a campaign with their own agent (agent_B_id)
        res = client.post("/api/campaigns", json={
            "name": "Campaign User B",
            "objective": "Valid campaign",
            "agent_id": agent_B_id,
            "status": "draft"
        })
        assert res.status_code == 200
        campaign_B_id = res.json()["id"]
        campaign_B_db = db.query(Campaign).filter(Campaign.id == campaign_B_id).first()
        assert campaign_B_db.user_id == 9999
        print("✅ New campaign created by User B correctly maps to User B's ID.")

        print("\n🎉 ALL TENANT ISOLATION TESTS PASSED SUCCESSFULLY! 🎉")

    except Exception as e:
        print(f"\n❌ Test validation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        # CLEANUP
        print("\n🧹 Cleaning up test data...")
        db.query(Lead).filter(Lead.user_id == 9999).delete()
        db.query(Campaign).filter(Campaign.user_id == 9999).delete()
        db.query(AIAgent).filter(AIAgent.user_id == 9999).delete()
        db.query(CompanyProfile).filter(CompanyProfile.user_id == 9999).delete()
        db.execute(text("DELETE FROM users WHERE id = 9999"))
        db.commit()
        db.close()

if __name__ == "__main__":
    run_tests()
