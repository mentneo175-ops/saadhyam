import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Change to the Backend directory and load environment variables
os.chdir("c:/Users/surya/Desktop/Saadhyam/Backend")
load_dotenv()

credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./firebase-adminsdk.json")
project_id = os.getenv("FIREBASE_PROJECT_ID", "saadhyam-ai")
db_url = os.getenv("DATABASE_URL", "sqlite:///c:/Users/surya/Desktop/saadhyam_admin_service/saadhyam_dev.db")

print(f"Initializing Firebase project '{project_id}' using '{credentials_path}'...")
print(f"Connecting to database: {db_url}")

# Initialize Firebase
try:
    cred = credentials.Certificate(credentials_path)
    firebase_admin.initialize_app(cred, {'projectId': project_id})
    print("Firebase initialized successfully.")
except Exception as e:
    print(f"Failed to initialize Firebase: {e}")
    exit(1)

# Initialize Database
engine = create_engine(db_url)
db = Session(bind=engine)

try:
    from models.user import User
    
    # List all users in Firebase
    print("Fetching users from Firebase Authentication...")
    page = auth.list_users()
    firebase_users = list(page.users)
    print(f"Found {len(firebase_users)} users in Firebase.")
    
    synced_count = 0
    already_exists_count = 0
    
    for fb_user in firebase_users:
        email = fb_user.email
        if not email:
            continue
            
        # Check if user exists in local database
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            # Update UID if missing
            if not existing.firebase_uid:
                existing.firebase_uid = fb_user.uid
                db.commit()
                print(f"Updated Firebase UID for existing user: {email}")
            already_exists_count += 1
        else:
            # Insert new user
            new_user = User(
                email=email,
                firebase_uid=fb_user.uid,
                auth_provider="google",
                name=fb_user.display_name or email.split('@')[0],
                is_active=True,
                is_suspended=False,
                business_setup_completed=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            # Explicitly set role to USER in the users table
            import sqlite3
            conn = sqlite3.connect("c:/Users/surya/Desktop/saadhyam_admin_service/saadhyam_dev.db")
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET role = 'USER' WHERE id = ?", (new_user.id,))
            conn.commit()
            conn.close()
            
            print(f"Synced user: {email} (ID={new_user.id})")
            synced_count += 1
            
    print(f"\nSync complete. Synced: {synced_count}, Already in DB: {already_exists_count}")

except Exception as e:
    print(f"Error during synchronization: {e}")
    db.rollback()
finally:
    db.close()
