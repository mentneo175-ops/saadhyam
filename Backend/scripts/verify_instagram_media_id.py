"""
Verification script for Instagram Media ID saving functionality.
This script checks if the Instagram publishing flow correctly saves media IDs.
"""

from config.database import sync_engine
from sqlalchemy import text
from datetime import datetime

def check_recent_posts():
    """Check recent posts to see if instagram_media_id is being saved"""
    print("=" * 100)
    print("INSTAGRAM MEDIA ID VERIFICATION")
    print("=" * 100)
    print()
    
    with sync_engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'scheduled_posts' AND column_name = 'instagram_media_id'"
        ))
        
        if result.fetchone():
            print("✅ Column 'instagram_media_id' exists in scheduled_posts table")
        else:
            print("❌ Column 'instagram_media_id' NOT FOUND in scheduled_posts table")
            print("   Run database migrations to add this column")
            return
        
        print()
        print("-" * 100)
        print("RECENT POSTS (Last 10)")
        print("-" * 100)
        
        # Get recent posts
        result = conn.execute(text(
            "SELECT id, status, instagram_post_id, instagram_media_id, posted_time, created_at "
            "FROM scheduled_posts ORDER BY id DESC LIMIT 10"
        ))
        
        posts = list(result)
        
        if not posts:
            print("No posts found in database")
            return
        
        # Print header
        print(f"{'ID':<5} {'Status':<10} {'Post ID':<20} {'Media ID':<20} {'Posted Time':<25}")
        print("-" * 100)
        
        # Count posts with and without media_id
        with_media_id = 0
        without_media_id = 0
        posted_with_media_id = 0
        posted_without_media_id = 0
        
        for post in posts:
            post_id, status, instagram_post_id, instagram_media_id, posted_time, created_at = post
            
            # Format values
            post_id_str = str(instagram_post_id) if instagram_post_id else "None"
            media_id_str = str(instagram_media_id) if instagram_media_id else "None"
            posted_time_str = posted_time.strftime("%Y-%m-%d %H:%M:%S") if posted_time else "Not posted"
            
            # Count
            if instagram_media_id:
                with_media_id += 1
                if status == "posted":
                    posted_with_media_id += 1
            else:
                without_media_id += 1
                if status == "posted":
                    posted_without_media_id += 1
            
            # Print row
            print(f"{post_id:<5} {status:<10} {post_id_str:<20} {media_id_str:<20} {posted_time_str:<25}")
        
        print("-" * 100)
        print()
        print("SUMMARY:")
        print(f"  Total posts: {len(posts)}")
        print(f"  Posts with media_id: {with_media_id}")
        print(f"  Posts without media_id: {without_media_id}")
        print(f"  Posted posts with media_id: {posted_with_media_id}")
        print(f"  Posted posts without media_id: {posted_without_media_id}")
        print()
        
        if posted_without_media_id > 0:
            print("⚠️  WARNING: Some posted posts don't have instagram_media_id saved")
            print("   These posts were published BEFORE the fix was applied")
            print("   They cannot be promoted with Meta Ads (full automation)")
            print()
        
        if posted_with_media_id > 0:
            print("✅ SUCCESS: Some posted posts have instagram_media_id saved correctly")
            print("   These posts can be promoted with Meta Ads (full automation)")
            print()
        
        if with_media_id == 0 and len([p for p in posts if p[1] == "posted"]) > 0:
            print("❌ ISSUE: No posted posts have instagram_media_id saved")
            print("   The scheduler may not be saving the media_id correctly")
            print("   Check Backend/services/scheduler.py lines 130-145")
            print()
        
        print("=" * 100)
        print("NEXT STEPS:")
        print("=" * 100)
        print()
        
        if posted_with_media_id == 0:
            print("1. Schedule a new Instagram post via the frontend")
            print("2. Wait for the scheduler to publish it (runs every 1 minute)")
            print("3. Run this script again to verify instagram_media_id is saved")
            print("4. Try promoting the post with Meta Ads")
        else:
            print("1. ✅ System is working correctly!")
            print("2. Try promoting a post with instagram_media_id via Meta Ads")
            print("3. Verify complete flow: Campaign → Ad Set → Creative → Ad")
        
        print()
        print("=" * 100)


if __name__ == "__main__":
    try:
        check_recent_posts()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
