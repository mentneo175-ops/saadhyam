"""
Diagnostic script to check Meta campaigns
Run this to see what's actually in Meta's system vs your database
"""

import requests
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("Backend/.env")

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

print("=" * 80)
print("META CAMPAIGNS DIAGNOSTIC TOOL")
print("=" * 80)
print()

# Step 1: Check database campaigns
print("STEP 1: Checking campaigns in YOUR DATABASE")
print("-" * 80)

try:
    result = db.execute("""
        SELECT 
            c.id,
            c.campaign_id,
            c.campaign_name,
            c.objective,
            c.status,
            c.daily_budget,
            c.created_at,
            u.email,
            m.ad_account_id,
            m.access_token
        FROM ad_campaigns c
        JOIN users u ON c.user_id = u.id
        JOIN meta_accounts m ON c.meta_account_id = m.id
        ORDER BY c.created_at DESC
        LIMIT 10
    """)
    
    campaigns = result.fetchall()
    
    if not campaigns:
        print("❌ No campaigns found in database")
        print()
        print("This means:")
        print("  1. You haven't created any campaigns yet")
        print("  2. Or campaign creation is failing before saving to database")
        print()
        print("ACTION: Try creating a campaign and check backend logs for errors")
        sys.exit(0)
    
    print(f"✅ Found {len(campaigns)} campaigns in database:")
    print()
    
    for i, camp in enumerate(campaigns, 1):
        print(f"{i}. Campaign: {camp[2]}")
        print(f"   Database ID: {camp[0]}")
        print(f"   Meta Campaign ID: {camp[1]}")
        print(f"   Status: {camp[4]}")
        print(f"   Budget: ₹{camp[5]}/day")
        print(f"   Created: {camp[6]}")
        print(f"   User: {camp[7]}")
        print()
    
    # Step 2: Check if campaigns exist in Meta
    print()
    print("STEP 2: Checking if campaigns exist in META ADS MANAGER")
    print("-" * 80)
    
    # Get first campaign's Meta account details
    first_campaign = campaigns[0]
    ad_account_id = first_campaign[8]
    encrypted_token = first_campaign[9]
    
    print(f"Ad Account ID: {ad_account_id}")
    print()
    
    # Try to decrypt token (simplified - you may need to adjust based on your encryption)
    # For now, we'll just check if we can access the Meta API
    
    print("Attempting to fetch campaigns from Meta API...")
    print()
    
    # Note: This requires decryption of the access token
    # You'll need to implement the decryption logic here
    print("⚠️  Cannot check Meta API without decrypting access token")
    print()
    print("To check manually:")
    print("1. Go to https://business.facebook.com/adsmanager")
    print(f"2. Select Ad Account: {ad_account_id}")
    print("3. Click 'Campaigns' tab")
    print("4. Enable filter: 'Show paused campaigns'")
    print("5. Look for these campaign IDs:")
    for camp in campaigns[:5]:
        if camp[1]:  # If Meta campaign ID exists
            print(f"   - {camp[1]} ({camp[2]})")
    
    print()
    print("=" * 80)
    print("DIAGNOSIS SUMMARY")
    print("=" * 80)
    print()
    
    # Check if Meta campaign IDs exist
    campaigns_with_meta_id = [c for c in campaigns if c[1]]
    campaigns_without_meta_id = [c for c in campaigns if not c[1]]
    
    if campaigns_without_meta_id:
        print(f"❌ PROBLEM FOUND: {len(campaigns_without_meta_id)} campaigns have NO Meta campaign ID")
        print()
        print("This means:")
        print("  - Campaigns were saved to database")
        print("  - But Meta API call FAILED")
        print("  - Campaigns don't actually exist in Meta's system")
        print()
        print("Affected campaigns:")
        for camp in campaigns_without_meta_id:
            print(f"  - {camp[2]} (DB ID: {camp[0]})")
        print()
        print("ACTION REQUIRED:")
        print("  1. Check backend logs for Meta API errors")
        print("  2. Verify Meta account connection is valid")
        print("  3. Check if access token has expired")
        print("  4. Verify ad account has proper permissions")
        print("  5. Try creating a new campaign and watch the logs")
    
    if campaigns_with_meta_id:
        print(f"✅ {len(campaigns_with_meta_id)} campaigns have Meta campaign IDs")
        print()
        print("This means:")
        print("  - Campaigns were successfully created in Meta's system")
        print("  - They should appear in Meta Ads Manager")
        print()
        print("If you don't see them in Meta Ads Manager:")
        print("  1. Complete account setup at https://business.facebook.com/settings")
        print("  2. Add payment method")
        print("  3. Verify business information")
        print("  4. Enable 'Show paused campaigns' filter")
        print("  5. Check you're viewing the correct ad account")
    
    print()
    print("=" * 80)
    print("NEXT STEPS")
    print("=" * 80)
    print()
    print("1. Check backend server logs:")
    print("   - Look for 'Creating campaign' messages")
    print("   - Look for 'Meta API Error' messages")
    print("   - Check if campaign_id is returned from Meta")
    print()
    print("2. Verify Meta account connection:")
    print("   - Go to Dashboard → Meta Ads")
    print("   - Check connection status")
    print("   - Try disconnecting and reconnecting")
    print()
    print("3. Complete Meta Business Manager setup:")
    print("   - https://business.facebook.com/settings")
    print("   - Add payment method")
    print("   - Verify business info")
    print("   - Check ad account status")
    print()
    print("4. Check Meta Ads Manager:")
    print("   - https://business.facebook.com/adsmanager")
    print("   - Select correct ad account")
    print("   - Enable 'Show paused campaigns'")
    print("   - Look for campaign IDs listed above")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

finally:
    db.close()

print()
print("=" * 80)
print("END OF DIAGNOSTIC")
print("=" * 80)
