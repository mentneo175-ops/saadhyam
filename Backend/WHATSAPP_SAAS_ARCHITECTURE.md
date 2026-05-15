# WhatsApp SaaS Architecture - Multi-User Support

## Overview

This document describes the updated WhatsApp Embedded Signup architecture that supports multi-user SaaS applications with System User tokens.

## Key Changes

### 1. **Removed `/me/businesses` Dependency**

**Problem:** System User tokens (most common in Embedded Signup) return empty arrays for `/me/businesses` even when onboarding succeeds.

**Solution:** 
- Primary method: Direct WABA access via `/me/owned_whatsapp_business_accounts`
- Fallback method: Traditional `/me/businesses` flow for regular user tokens
- Success validation: Based on presence of `waba_id`, `phone_number_id`, and `access_token`

### 2. **New Database Schema**

Added fields to `whatsapp_accounts` table:

```sql
facebook_user_id VARCHAR(255)  -- Facebook User ID from OAuth
token_type VARCHAR(50)          -- 'system_user' or 'user'
```

### 3. **Multi-Tenant Architecture**

Each user can connect their own WhatsApp Business Account independently:

```python
{
    "user_id": 123,                    # Your app's user ID
    "facebook_user_id": "122095...",   # Facebook's user ID
    "business_name": "My Business",
    "waba_id": "123456789",            # WhatsApp Business Account ID
    "phone_number_id": "987654321",    # Phone Number ID
    "access_token": "EAABsbCS...",     # System User token
    "token_type": "system_user"        # Token type
}
```

## OAuth Flow

### Step 1: Initiate Embedded Signup

```http
GET /api/whatsapp/embedded-signup
```

Returns OAuth URL with required scopes:
- `business_management`
- `whatsapp_business_management`
- `whatsapp_business_messaging`

### Step 2: OAuth Callback

```http
GET /api/whatsapp/callback?code=...&state=...
```

**New Flow:**

1. Exchange code for access token ✅
2. Debug token to get type and user ID ✅
3. **Try Method 1:** Direct WABA access
   ```
   GET /me/owned_whatsapp_business_accounts
   ```
4. **Try Method 2 (fallback):** Business-based access
   ```
   GET /me/businesses
   GET /{business_id}/owned_whatsapp_business_accounts
   ```
5. **Validate:** Check if `waba_id` AND `phone_number_id` exist
6. **Success:** Return account details to frontend

### Step 3: Save Account

```http
POST /api/whatsapp/connect-manual
```

```json
{
    "waba_id": "123456789",
    "phone_number_id": "987654321",
    "phone_number": "+1234567890",
    "business_name": "My Business",
    "access_token": "EAABsbCS...",
    "facebook_user_id": "122095251081322932",
    "token_type": "system_user"
}
```

## Success Validation

### Old (Broken) Logic:
```python
if not businesses_data.get("data"):
    raise Exception("No businesses found")  # ❌ Fails for System Users
```

### New (Working) Logic:
```python
onboarding_success = bool(waba_id and phone_number_id and access_token)

if onboarding_success:
    # Save to database ✅
    # Works for both System Users and regular users
```

## Logging

Comprehensive logging added for debugging:

```
🚀 WHATSAPP EMBEDDED SIGNUP - OAUTH CALLBACK
================================================================================
📱 Exchanging authorization code for access token...
✅ Access token obtained successfully
🔑 Access Token (first 20 chars): EAABsbCS...
🔑 Token Length: 285 characters

🔍 DEBUGGING TOKEN AND PERMISSIONS
================================================================================
📊 Token Type: system_user
📊 User ID: 122095251081322932
📊 Scopes: ['business_management', 'whatsapp_business_management', ...]
✅ All required scopes granted!

🔍 FETCHING WHATSAPP BUSINESS ACCOUNTS (DIRECT METHOD)
================================================================================
✅ Found WABA via direct access!
📱 WABA ID: 123456789
📱 WABA Name: My Business
✅ Found phone number!
📞 Phone Number ID: 987654321
📞 Phone Number: +1234567890

✅ ONBOARDING VALIDATION
================================================================================
📊 WABA ID: 123456789
📊 Phone Number ID: 987654321
📊 Access Token: ✅ Present
📊 Token Type: system_user
📊 Facebook User ID: 122095251081322932
📊 Onboarding Success: ✅ YES
================================================================================
```

## API Endpoints

### 1. Initiate Signup
```
GET /api/whatsapp/embedded-signup
```

### 2. OAuth Callback
```
GET /api/whatsapp/callback
```

### 3. Save Account (Manual)
```
POST /api/whatsapp/connect-manual
```

### 4. Get Connection Status
```
GET /api/whatsapp/connection-status
```

### 5. Debug Token
```
GET /api/whatsapp/debug-token?token=...
```

### 6. Disconnect Account
```
POST /api/whatsapp/disconnect
```

## Database Migration

Run the migration to add new fields:

```bash
psql -U your_user -d your_database -f Backend/migrations/add_whatsapp_system_user_fields.sql
```

Or use your ORM migration tool:

```bash
alembic revision --autogenerate -m "Add System User fields to WhatsApp accounts"
alembic upgrade head
```

## Multi-User Support

### User Isolation

Each user's WhatsApp account is isolated:

```python
# Get current user's account
account = db.query(WhatsAppAccount).filter(
    WhatsAppAccount.user_id == current_user.id,
    WhatsAppAccount.is_active == True
).first()
```

### Multiple Accounts Per User

Currently supports one active account per user. To support multiple:

1. Remove unique constraint on `phone_number_id`
2. Add account selection UI
3. Update queries to filter by selected account

## Security Considerations

1. **Token Storage:** Access tokens should be encrypted at rest
2. **Token Rotation:** Implement token refresh mechanism
3. **Rate Limiting:** Add rate limits to OAuth endpoints
4. **CSRF Protection:** Validate `state` parameter in callback
5. **User Verification:** Ensure user is authenticated before saving account

## Testing

### Test with System User:
1. Go through Embedded Signup flow
2. Check logs for "Token Type: system_user"
3. Verify `/me/businesses` returns empty array
4. Confirm direct WABA access succeeds
5. Verify account is saved with correct fields

### Test with Regular User:
1. Use personal Facebook account
2. Check logs for "Token Type: user"
3. Verify `/me/businesses` returns data
4. Confirm fallback method works
5. Verify account is saved correctly

## Troubleshooting

### Issue: "No businesses found"
**Solution:** This is expected for System Users. The new code handles this automatically.

### Issue: "No WABA found"
**Causes:**
- WhatsApp Business Account not set up
- Phone number not registered
- Insufficient permissions

**Debug:**
```bash
curl -X GET "https://graph.facebook.com/v21.0/me/owned_whatsapp_business_accounts?access_token=YOUR_TOKEN"
```

### Issue: Missing permissions
**Solution:** Ensure OAuth URL includes all required scopes:
- `business_management`
- `whatsapp_business_management`
- `whatsapp_business_messaging`

## Future Enhancements

1. **Token Refresh:** Implement automatic token refresh
2. **Webhook Setup:** Auto-configure webhooks during onboarding
3. **Multi-Account:** Support multiple WhatsApp accounts per user
4. **Business Verification:** Check business verification status
5. **Phone Number Selection:** Let users choose from multiple phone numbers

## References

- [Meta Embedded Signup Documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/business-management-api)
- [System Users Documentation](https://developers.facebook.com/docs/development/build-and-test/system-users)
