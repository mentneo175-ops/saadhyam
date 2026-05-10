# WhatsApp Sales & Automation Module - Setup Guide

## Overview

This module integrates WhatsApp Business Cloud API into Saadhyam AI, enabling:
- ✅ WhatsApp Business account connection via Meta Embedded Signup
- ✅ Send/receive WhatsApp messages
- ✅ Real-time chat dashboard
- ✅ Campaign management and broadcasting
- ✅ Automated follow-ups and AI auto-replies
- ✅ Lead management and conversation tracking

## Prerequisites

### 1. Meta Business Account
- Create a Meta Business account at https://business.facebook.com/
- Verify your business (required for production)

### 2. Meta Developer App
1. Go to https://developers.facebook.com/apps/
2. Create a new app or use existing one
3. Add **WhatsApp** product to your app
4. Note down:
   - App ID
   - App Secret

### 3. WhatsApp Business Account
- You'll connect this through the Embedded Signup flow in the app
- Requires a phone number not already connected to WhatsApp
- Recommended: Use a dedicated business phone number

## Configuration

### 1. Environment Variables

Add to `Backend/.env`:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_APP_ID=your_app_id_here
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_REDIRECT_URI=http://localhost:8000/auth/whatsapp/callback
WHATSAPP_API_VERSION=v18.0
WHATSAPP_VERIFY_TOKEN=your_secure_random_token_here
```

### 2. Meta App Configuration

#### A. Configure OAuth Redirect URIs
1. Go to your Meta app dashboard
2. Navigate to **WhatsApp > Configuration**
3. Add redirect URI: `http://localhost:8000/auth/whatsapp/callback`
4. For production, add your production URL

#### B. Configure Webhook
1. In Meta app dashboard, go to **WhatsApp > Configuration**
2. Set Webhook URL: `http://your-domain.com/webhooks/whatsapp`
3. Set Verify Token: (same as `WHATSAPP_VERIFY_TOKEN` in .env)
4. Subscribe to webhook fields:
   - `messages`
   - `message_status`

**For local development:**
- Use ngrok or similar tool to expose localhost
- Example: `ngrok http 8000`
- Use the ngrok URL as webhook URL

#### C. Required Permissions
Ensure your app has these permissions:
- `whatsapp_business_management`
- `whatsapp_business_messaging`

## Database Setup

The migration will run automatically on server start. Tables created:
- `whatsapp_accounts` - Connected WhatsApp Business accounts
- `whatsapp_messages` - All messages (incoming/outgoing)
- `whatsapp_campaigns` - Broadcast campaigns
- `whatsapp_automations` - Automation rules

## Testing the Integration

### 1. Start the Backend
```bash
cd Backend
python main.py
```

### 2. Start Celery Worker (for background tasks)
```bash
cd Backend
celery -A celery_worker worker --loglevel=info
```

### 3. Start Celery Beat (for scheduled tasks)
```bash
cd Backend
celery -A celery_worker beat --loglevel=info
```

### 4. Test Webhook Verification
```bash
curl "http://localhost:8000/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge"
```

Should return: `test_challenge`

### 5. Connect WhatsApp Account
1. Login to the frontend
2. Go to Settings
3. Click "Connect WhatsApp"
4. Follow Meta Embedded Signup flow
5. Select your WhatsApp Business account
6. Grant permissions

## API Endpoints

### Authentication
- `GET /auth/whatsapp/connect` - Initiate OAuth flow
- `GET /auth/whatsapp/callback` - OAuth callback
- `GET /auth/whatsapp/status` - Get connection status
- `POST /auth/whatsapp/disconnect` - Disconnect account

### Webhooks
- `GET /webhooks/whatsapp` - Webhook verification
- `POST /webhooks/whatsapp` - Receive webhook events

### Messages
- `POST /whatsapp/messages/send` - Send message
- `GET /whatsapp/messages/conversations` - Get all conversations
- `GET /whatsapp/messages/conversation/{phone}` - Get conversation messages
- `GET /whatsapp/messages/ai-suggestion/{phone}` - Get AI reply suggestion
- `GET /whatsapp/messages/stats` - Get message statistics

### Campaigns
- `POST /whatsapp/campaigns` - Create campaign
- `GET /whatsapp/campaigns` - Get all campaigns
- `POST /whatsapp/campaigns/{id}/send` - Send campaign
- `GET /whatsapp/campaigns/{id}/analytics` - Get campaign analytics
- `DELETE /whatsapp/campaigns/{id}` - Delete campaign

### Automations
- `POST /whatsapp/automations` - Create automation
- `GET /whatsapp/automations` - Get all automations
- `PUT /whatsapp/automations/{id}` - Update automation
- `DELETE /whatsapp/automations/{id}` - Delete automation
- `POST /whatsapp/automations/{id}/toggle` - Toggle automation

## Features

### 1. Real-time Messaging
- Receive messages via webhooks
- Send text messages
- Send template messages (approved by Meta)
- Message status tracking (sent, delivered, read)

### 2. Campaigns
- Create broadcast campaigns
- Schedule campaigns for later
- Upload recipient lists
- Track delivery and read rates
- Campaign analytics

### 3. Automations
- **Auto-reply**: Respond to incoming messages automatically
- **Follow-up**: Send follow-up messages after X minutes of no reply
- **Welcome message**: Greet new customers
- **Keyword triggers**: Respond to specific keywords
- **AI-powered replies**: Generate contextual responses

### 4. AI Features
- AI reply suggestions based on conversation context
- Smart auto-replies
- Lead qualification
- Sentiment analysis (future)

## Production Considerations

### 1. Security
- Encrypt access tokens in database
- Verify webhook signatures
- Use HTTPS for all endpoints
- Implement rate limiting

### 2. Scalability
- Use Redis for caching
- Implement message queuing
- Database connection pooling
- Horizontal scaling with load balancer

### 3. Compliance
- Follow Meta's WhatsApp Business Policy
- Implement opt-in/opt-out mechanisms
- Respect user privacy
- Store data securely

### 4. Monitoring
- Log all API calls
- Monitor webhook delivery
- Track message delivery rates
- Set up alerts for failures

## Troubleshooting

### Webhook not receiving events
1. Check webhook URL is accessible from internet
2. Verify webhook token matches
3. Check webhook subscriptions in Meta dashboard
4. Review server logs for errors

### Messages not sending
1. Check access token is valid
2. Verify phone number is verified
3. Check message template is approved (for template messages)
4. Review API error responses

### OAuth connection fails
1. Verify App ID and Secret are correct
2. Check redirect URI matches exactly
3. Ensure app has required permissions
4. Check user has admin access to WhatsApp Business account

## Support

For issues or questions:
1. Check Meta's WhatsApp Business API documentation
2. Review server logs
3. Test with Meta's API Explorer
4. Contact Meta Business Support

## Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
