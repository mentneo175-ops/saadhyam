import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_for_migration
from models.voice_agent import VoiceCampaign, Campaign

def inspect_campaigns():
    db = get_db_for_migration()
    try:
        voice_campaigns = db.query(VoiceCampaign).all()
        crm_campaigns = db.query(Campaign).all()
        
        print("=== VOICE CAMPAIGNS ===")
        print(f"Total: {len(voice_campaigns)}")
        for vc in voice_campaigns:
            print(f"ID: {vc.id}, Name: {vc.name}, User ID: {vc.user_id}, Status: {vc.status}")
            
        print("\n=== CRM CAMPAIGNS ===")
        print(f"Total: {len(crm_campaigns)}")
        for c in crm_campaigns:
            print(f"ID: {c.id}, Name: {c.name}, User ID: {c.user_id}, Status: {c.status}")
            
    finally:
        db.close()

if __name__ == "__main__":
    inspect_campaigns()
