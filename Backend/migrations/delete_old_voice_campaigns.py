import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_for_migration
from models.voice_agent import VoiceCampaign

def run_deletion():
    print("=" * 60)
    print("Deleting old voice agent campaigns...")
    print("=" * 60)
    
    db = get_db_for_migration()
    try:
        # Fetch campaigns of User ID 24
        campaigns = db.query(VoiceCampaign).filter(VoiceCampaign.user_id == 24).all()
        
        deleted_count = 0
        kept_count = 0
        
        for c in campaigns:
            name_lower = c.name.lower()
            if "mentneo" in name_lower:
                print(f"Keeping Campaign: ID: {c.id}, Name: {c.name}")
                kept_count += 1
            else:
                print(f"Deleting Campaign: ID: {c.id}, Name: {c.name}")
                db.delete(c)
                deleted_count += 1
                
        db.commit()
        print("\nDeletion completed successfully!")
        print(f"Campaigns deleted: {deleted_count}")
        print(f"Campaigns kept: {kept_count}")
        
    except Exception as e:
        print(f"\nDeletion failed: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("=" * 60)

if __name__ == "__main__":
    run_deletion()
