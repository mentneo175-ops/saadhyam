"""
Delete all data for a specific user email
"""

import sys
from config.database import SyncSessionLocal
from models.user import User
from db.models import (
    BusinessAnalysis,
    ReviewHistory,
    AEOQuestion,
    AEOContent,
    AIVisibilityTracking
)
from models.business_profile import BusinessProfile
from models.instagram_analytics import (
    InstagramBusinessAccount,
    InstagramPost,
    InstagramStory,
    InstagramReel,
    InstagramInsight
)
from models.task_tracking import DailyTask, TaskTemplate
from models.whatsapp_account import WhatsAppAccount
from models.whatsapp_message import WhatsAppMessage
from models.whatsapp_campaign import WhatsAppCampaign
from models.whatsapp_automation import WhatsAppAutomation
from models.voice_agent import VoiceCall, VoiceRecording
from models.influencer import Influencer
from models.retention_campaign import RetentionCampaign, RetentionEmail

def delete_user_data(email: str):
    """Delete all data for a user"""
    db = SyncSessionLocal()
    
    try:
        # Find user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email {email} not found")
            return False
        
        user_id = user.id
        print(f"🔍 Found user ID: {user_id}")
        print(f"📧 Email: {email}")
        print(f"👤 Name: {user.name or 'N/A'}")
        print()
        
        # Delete related data
        print("🗑️  Deleting user data...")
        
        # Business Analysis
        count = db.query(BusinessAnalysis).filter(BusinessAnalysis.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} business analysis records")
        
        # Business Profile
        count = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} business profile records")
        
        # Review History
        count = db.query(ReviewHistory).filter(ReviewHistory.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} review history records")
        
        # AEO Questions
        count = db.query(AEOQuestion).filter(AEOQuestion.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} AEO question records")
        
        # AEO Content
        count = db.query(AEOContent).filter(AEOContent.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} AEO content records")
        
        # AI Visibility Tracking
        count = db.query(AIVisibilityTracking).filter(AIVisibilityTracking.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} AI visibility tracking records")
        
        # Instagram data
        ig_accounts = db.query(InstagramBusinessAccount).filter(InstagramBusinessAccount.user_id == user_id).all()
        for ig_account in ig_accounts:
            # Delete posts, stories, reels, insights
            db.query(InstagramPost).filter(InstagramPost.account_id == ig_account.id).delete()
            db.query(InstagramStory).filter(InstagramStory.account_id == ig_account.id).delete()
            db.query(InstagramReel).filter(InstagramReel.account_id == ig_account.id).delete()
            db.query(InstagramInsight).filter(InstagramInsight.account_id == ig_account.id).delete()
        count = db.query(InstagramBusinessAccount).filter(InstagramBusinessAccount.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} Instagram accounts and related data")
        
        # Task Tracking
        count = db.query(DailyTask).filter(DailyTask.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} daily tasks")
        
        # WhatsApp data
        wa_accounts = db.query(WhatsAppAccount).filter(WhatsAppAccount.user_id == user_id).all()
        for wa_account in wa_accounts:
            db.query(WhatsAppMessage).filter(WhatsAppMessage.account_id == wa_account.id).delete()
            db.query(WhatsAppCampaign).filter(WhatsAppCampaign.account_id == wa_account.id).delete()
            db.query(WhatsAppAutomation).filter(WhatsAppAutomation.account_id == wa_account.id).delete()
        count = db.query(WhatsAppAccount).filter(WhatsAppAccount.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} WhatsApp accounts and related data")
        
        # Voice Agent data
        count = db.query(VoiceCall).filter(VoiceCall.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} voice calls")
        count = db.query(VoiceRecording).filter(VoiceRecording.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} voice recordings")
        
        # Influencer data
        count = db.query(Influencer).filter(Influencer.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} influencer records")
        
        # Retention campaigns
        count = db.query(RetentionCampaign).filter(RetentionCampaign.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} retention campaigns")
        count = db.query(RetentionEmail).filter(RetentionEmail.user_id == user_id).delete()
        print(f"  ✓ Deleted {count} retention emails")
        
        # Finally, delete the user
        db.delete(user)
        print(f"  ✓ Deleted user account")
        
        # Commit all changes
        db.commit()
        print()
        print(f"✅ Successfully deleted all data for {email}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting user data: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()


if __name__ == "__main__":
    email = "suryasagar5659@gmail.com"
    
    print("=" * 60)
    print("  DELETE USER DATA")
    print("=" * 60)
    print()
    print(f"⚠️  WARNING: This will delete ALL data for {email}")
    print()
    
    # Confirm deletion
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm == "DELETE":
        print()
        success = delete_user_data(email)
        if success:
            print()
            print("🎉 User data deleted successfully!")
            print("You can now register with this email again.")
    else:
        print()
        print("❌ Deletion cancelled")
