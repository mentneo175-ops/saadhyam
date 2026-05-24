"""
WhatsApp Authentication Routes
Handles WhatsApp Business Account connection via Meta Embedded Signup
"""

import logging
import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from config.database import get_db, get_db_sync
from models.user import User
from models.whatsapp_account import WhatsAppAccount
from utils.dependencies import get_current_user
from services.whatsapp_service import whatsapp_service
import requests

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp-auth"])


class WhatsAppConnectRequest(BaseModel):
    """Request model for WhatsApp connection"""
    code: str
    phone_number_id: str
    waba_id: str


class WhatsAppConnectionStatus(BaseModel):
    """Response model for connection status"""
    is_connected: bool
    phone_number: Optional[str] = None
    business_name: Optional[str] = None
    connected_at: Optional[str] = None


@router.get("/embedded-signup")
async def whatsapp_embedded_signup(
    current_user: User = Depends(get_current_user)
):
    """
    Initiate WhatsApp Embedded Signup flow
    Returns configuration for frontend to open Meta signup dialog
    """
    try:
        app_id = os.getenv("META_APP_ID")
        config_id = os.getenv("WHATSAPP_CONFIG_ID")
        redirect_uri = os.getenv("WHATSAPP_REDIRECT_URI", "http://localhost:8000/api/whatsapp/callback")
        
        if not app_id or not config_id:
            raise HTTPException(
                status_code=500,
                detail="WhatsApp configuration not set. Please configure META_APP_ID and WHATSAPP_CONFIG_ID"
            )
        
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # CORRECT WhatsApp Embedded Signup URL with proper scopes
        # Using Facebook's embedded signup flow for WhatsApp Business
        # Required scopes for WhatsApp Business API:
        # - business_management: Access to business accounts and settings
        # - whatsapp_business_management: Manage WhatsApp Business accounts
        # - whatsapp_business_messaging: Send and receive WhatsApp messages
        scopes = [
            "business_management",
            "whatsapp_business_management", 
            "whatsapp_business_messaging"
        ]
        scope_string = ",".join(scopes)
        
        signup_url = (
            f"https://www.facebook.com/v21.0/dialog/oauth?"
            f"client_id={app_id}&"
            f"redirect_uri={redirect_uri}&"
            f"config_id={config_id}&"
            f"response_type=code&"
            f"state={state}&"
            f"scope={scope_string}"
        )
        
        logger.info(f"🔗 Generated WhatsApp OAuth URL")
        logger.info(f"   App ID: {app_id}")
        logger.info(f"   Redirect URI: {redirect_uri}")
        logger.info(f"   Config ID: {config_id}")
        logger.info(f"   Scopes: {scope_string}")
        logger.info(f"   State: {state}")
        
        return {
            "success": True,
            "signup_url": signup_url,
            "state": state,
            "scopes": scopes,
            "scope_string": scope_string
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error initiating WhatsApp signup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def whatsapp_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    request: Request = None,
    db: Session = Depends(get_db_sync)
):
    """
    Handle OAuth callback from Meta
    This is called after user completes the signup flow
    """
    try:
        if error:
            logger.error(f"❌ WhatsApp OAuth error: {error} - {error_description}")
            return HTMLResponse(
                content=f"""
                <html>
                    <body>
                        <h2>WhatsApp Connection Failed</h2>
                        <p>Error: {error_description or error}</p>
                        <script>
                            window.opener.postMessage({{
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: '{error_description or error}'
                            }}, '*');
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        if not code:
            return HTMLResponse(
                content="""
                <html>
                    <body>
                        <h2>WhatsApp Connection Error</h2>
                        <p>No authorization code received</p>
                        <script>
                            window.opener.postMessage({
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'No authorization code received'
                            }, '*');
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        # Exchange code for access token
        app_id = os.getenv("META_APP_ID")
        app_secret = os.getenv("META_APP_SECRET")
        redirect_uri = os.getenv("WHATSAPP_REDIRECT_URI", "http://localhost:8000/api/whatsapp/callback")
        
        if not app_id or not app_secret:
            return HTMLResponse(
                content="""
                <html>
                    <body>
                        <h2>Configuration Error</h2>
                        <p>Meta app credentials not configured</p>
                        <script>
                            window.opener.postMessage({
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'Server configuration error'
                            }, '*');
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
                """,
                status_code=500
            )
        
        logger.info(f"📱 Exchanging code for access token...")
        
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        token_params = {
            "client_id": app_id,
            "client_secret": app_secret,
            "code": code,
            "redirect_uri": redirect_uri
        }
        
        token_response = requests.get(token_url, params=token_params, timeout=30)
        token_response.raise_for_status()
        token_data = token_response.json()
        
        access_token = token_data.get("access_token")
        
        if not access_token:
            return HTMLResponse(
                content="""
                <html>
                    <body>
                        <h2>Authentication Error</h2>
                        <p>Failed to obtain access token from Meta</p>
                        <script>
                            window.opener.postMessage({
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'Failed to obtain access token'
                            }, '*');
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        logger.info("✅ Access token obtained successfully")
        logger.info(f"🔑 Access Token (first 20 chars): {access_token[:20]}...")
        logger.info(f"🔑 Token Length: {len(access_token)} characters")
        
        # DEBUG: Inspect token and permissions
        logger.info("=" * 80)
        logger.info("🔍 DEBUGGING TOKEN AND PERMISSIONS")
        logger.info("=" * 80)
        
        # Get token info
        debug_token_url = f"https://graph.facebook.com/v21.0/debug_token"
        debug_params = {
            "input_token": access_token,
            "access_token": f"{app_id}|{app_secret}"
        }
        
        try:
            debug_response = requests.get(debug_token_url, params=debug_params, timeout=30)
            debug_response.raise_for_status()
            debug_data = debug_response.json()
            logger.info(f"🔍 Token Debug Response: {debug_data}")
            
            if debug_data.get("data"):
                token_data_info = debug_data["data"]
                logger.info(f"📊 Token Type: {token_data_info.get('type')}")
                logger.info(f"📊 App ID: {token_data_info.get('app_id')}")
                logger.info(f"📊 User ID: {token_data_info.get('user_id')}")
                logger.info(f"📊 Scopes: {token_data_info.get('scopes', [])}")
                logger.info(f"📊 Expires At: {token_data_info.get('expires_at')}")
                logger.info(f"📊 Is Valid: {token_data_info.get('is_valid')}")
                
                # Check for required scopes
                granted_scopes = token_data_info.get('scopes', [])
                required_scopes = ['business_management', 'whatsapp_business_management', 'whatsapp_business_messaging']
                missing_scopes = [s for s in required_scopes if s not in granted_scopes]
                
                if missing_scopes:
                    logger.warning(f"⚠️  Missing required scopes: {missing_scopes}")
                else:
                    logger.info(f"✅ All required scopes granted!")
        except Exception as e:
            logger.error(f"❌ Error debugging token: {e}")
        
        # Get /me permissions
        logger.info("-" * 80)
        logger.info("🔍 CHECKING USER PERMISSIONS")
        logger.info("-" * 80)
        try:
            permissions_url = f"https://graph.facebook.com/v21.0/me/permissions"
            permissions_params = {"access_token": access_token}
            permissions_response = requests.get(permissions_url, params=permissions_params, timeout=30)
            permissions_response.raise_for_status()
            permissions_data = permissions_response.json()
            logger.info(f"🔍 User Permissions Response: {permissions_data}")
            
            # Log each permission with its status
            if permissions_data.get("data"):
                logger.info("📋 Granted Permissions:")
                for perm in permissions_data["data"]:
                    permission_name = perm.get("permission")
                    status = perm.get("status")
                    if status == "granted":
                        logger.info(f"   ✅ {permission_name}: {status}")
                    else:
                        logger.warning(f"   ❌ {permission_name}: {status}")
                
                # Check for business_management specifically
                has_business_mgmt = any(
                    p.get("permission") == "business_management" and p.get("status") == "granted"
                    for p in permissions_data["data"]
                )
                has_whatsapp_mgmt = any(
                    p.get("permission") == "whatsapp_business_management" and p.get("status") == "granted"
                    for p in permissions_data["data"]
                )
                has_whatsapp_msg = any(
                    p.get("permission") == "whatsapp_business_messaging" and p.get("status") == "granted"
                    for p in permissions_data["data"]
                )
                
                logger.info(f"🔐 business_management: {'✅ GRANTED' if has_business_mgmt else '❌ NOT GRANTED'}")
                logger.info(f"🔐 whatsapp_business_management: {'✅ GRANTED' if has_whatsapp_mgmt else '❌ NOT GRANTED'}")
                logger.info(f"🔐 whatsapp_business_messaging: {'✅ GRANTED' if has_whatsapp_msg else '❌ NOT GRANTED'}")
        except Exception as e:
            logger.error(f"❌ Error getting permissions: {e}")
        
        # Get /me info
        logger.info("-" * 80)
        logger.info("🔍 CHECKING USER INFO")
        logger.info("-" * 80)
        try:
            me_url = f"https://graph.facebook.com/v21.0/me"
            me_params = {"access_token": access_token, "fields": "id,name,email"}
            me_response = requests.get(me_url, params=me_params, timeout=30)
            me_response.raise_for_status()
            me_data = me_response.json()
            logger.info(f"🔍 User Info: {me_data}")
            logger.info(f"👤 User ID: {me_data.get('id')}")
            logger.info(f"👤 Name: {me_data.get('name')}")
            logger.info(f"👤 Email: {me_data.get('email', 'N/A')}")
        except Exception as e:
            logger.error(f"❌ Error getting user info: {e}")
        
        # Get /me/businesses
        logger.info("-" * 80)
        logger.info("🔍 CHECKING BUSINESSES")
        logger.info("-" * 80)
        
        logger.info("📱 Fetching WhatsApp Business Account details...")
        
        # CORRECT Meta Embedded Signup flow:
        # Step 1: Get user's businesses
        businesses_url = f"https://graph.facebook.com/v21.0/me/businesses"
        businesses_params = {"access_token": access_token}
        
        logger.info(f"🔍 Fetching businesses from: {businesses_url}")
        try:
            businesses_response = requests.get(businesses_url, params=businesses_params, timeout=30)
            businesses_response.raise_for_status()
            businesses_data = businesses_response.json()
            
            logger.info(f"📊 Businesses Response: {businesses_data}")
            
            if businesses_data.get("data"):
                logger.info(f"✅ Found {len(businesses_data['data'])} business(es)")
                for idx, biz in enumerate(businesses_data["data"], 1):
                    logger.info(f"   {idx}. Business ID: {biz.get('id')}, Name: {biz.get('name')}")
            else:
                logger.warning("⚠️  No businesses found in response")
                logger.warning("⚠️  This might be a System User account")
                
                # Try alternative: Get businesses via owned_whatsapp_business_accounts
                logger.info("🔄 Trying alternative method: Fetching WABAs directly...")
                try:
                    # Try to get WABAs directly from the user
                    direct_waba_url = f"https://graph.facebook.com/v21.0/me/owned_whatsapp_business_accounts"
                    direct_waba_params = {"access_token": access_token}
                    direct_waba_response = requests.get(direct_waba_url, params=direct_waba_params, timeout=30)
                    direct_waba_response.raise_for_status()
                    direct_waba_data = direct_waba_response.json()
                    
                    logger.info(f"📊 Direct WABA Response: {direct_waba_data}")
                    
                    if direct_waba_data.get("data"):
                        logger.info(f"✅ Found {len(direct_waba_data['data'])} WABA(s) directly!")
                        # Skip business lookup and go straight to WABA processing
                        waba = direct_waba_data["data"][0]
                        waba_id = waba["id"]
                        waba_name = waba.get("name", "WhatsApp Business")
                        
                        logger.info(f"📱 Selected WABA ID: {waba_id}, Name: {waba_name}")
                        
                        # Jump to phone number fetching
                        phone_numbers_url = f"https://graph.facebook.com/v21.0/{waba_id}/phone_numbers"
                        phone_numbers_params = {"access_token": access_token}
                        
                        logger.info(f"🔍 Fetching phone numbers from: {phone_numbers_url}")
                        phone_numbers_response = requests.get(phone_numbers_url, params=phone_numbers_params, timeout=30)
                        phone_numbers_response.raise_for_status()
                        phone_numbers_data = phone_numbers_response.json()
                        
                        logger.info(f"📊 Phone Numbers Response: {phone_numbers_data}")
                        
                        if not phone_numbers_data.get("data"):
                            raise Exception("No phone numbers found for this WABA")
                        
                        phone_data = phone_numbers_data["data"][0]
                        phone_number_id = phone_data["id"]
                        phone_number = phone_data.get("display_phone_number", "")
                        
                        logger.info(f"📞 Selected Phone Number ID: {phone_number_id}, Number: {phone_number}")
                        logger.info("✅ WhatsApp OAuth successful via direct WABA access")
                        
                        # Return success
                        return HTMLResponse(
                            content=f"""
                            <html>
                                <head>
                                    <style>
                                        body {{
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            min-height: 100vh;
                                            margin: 0;
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        }}
                                        .container {{
                                            background: white;
                                            padding: 2rem;
                                            border-radius: 1rem;
                                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                            text-align: center;
                                            max-width: 500px;
                                        }}
                                        .success-icon {{
                                            width: 64px;
                                            height: 64px;
                                            background: #10b981;
                                            border-radius: 50%;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            margin: 0 auto 1rem;
                                        }}
                                        .checkmark {{
                                            color: white;
                                            font-size: 32px;
                                        }}
                                        h2 {{
                                            color: #1f2937;
                                            margin: 0 0 0.5rem;
                                        }}
                                        p {{
                                            color: #6b7280;
                                            margin: 0 0 1rem;
                                        }}
                                        .details {{
                                            background: #f3f4f6;
                                            padding: 1rem;
                                            border-radius: 0.5rem;
                                            font-size: 0.875rem;
                                            color: #4b5563;
                                            text-align: left;
                                            margin: 1rem 0;
                                        }}
                                        .details strong {{
                                            color: #1f2937;
                                        }}
                                        .badge {{
                                            display: inline-block;
                                            background: #3b82f6;
                                            color: white;
                                            padding: 0.25rem 0.75rem;
                                            border-radius: 9999px;
                                            font-size: 0.75rem;
                                            margin-top: 0.5rem;
                                        }}
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="success-icon">
                                            <span class="checkmark">✓</span>
                                        </div>
                                        <h2>WhatsApp Connected!</h2>
                                        <span class="badge">System User Access</span>
                                        <p>Your WhatsApp Business account has been connected successfully.</p>
                                        <div class="details">
                                            <strong>Business:</strong> {waba_name}<br>
                                            <strong>Phone:</strong> {phone_number}<br>
                                            <strong>WABA ID:</strong> {waba_id}
                                        </div>
                                        <p style="font-size: 0.875rem;">Saving account details...</p>
                                    </div>
                                    <script>
                                        window.opener.postMessage({{
                                            type: 'WHATSAPP_OAUTH_SUCCESS',
                                            data: {{
                                                waba_id: '{waba_id}',
                                                phone_number_id: '{phone_number_id}',
                                                phone_number: '{phone_number}',
                                                business_name: '{waba_name}',
                                                access_token: '{access_token}'
                                            }}
                                        }}, '*');
                                        setTimeout(() => window.close(), 3000);
                                    </script>
                                </body>
                            </html>
                            """
                        )
                except Exception as direct_error:
                    logger.error(f"❌ Direct WABA access also failed: {direct_error}")
                    # Continue to show the business manager error
        except Exception as e:
            logger.error(f"❌ Error fetching businesses: {e}")
            businesses_data = {"data": []}
        
        logger.info("=" * 80)
        
        if not businesses_data.get("data"):
            logger.error("❌ No businesses found for this account")
            return HTMLResponse(
                content="""
                <html>
                    <head>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                            }
                            .container {
                                background: white;
                                padding: 2rem;
                                border-radius: 1rem;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                max-width: 500px;
                            }
                            .error-icon {
                                width: 64px;
                                height: 64px;
                                background: #ef4444;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin: 0 auto 1rem;
                            }
                            .icon {
                                color: white;
                                font-size: 32px;
                            }
                            h2 {
                                color: #1f2937;
                                margin: 0 0 0.5rem;
                                text-align: center;
                            }
                            p {
                                color: #6b7280;
                                margin: 0 0 1rem;
                                text-align: center;
                            }
                            .steps {
                                background: #fef3c7;
                                border-left: 4px solid #f59e0b;
                                padding: 1rem;
                                border-radius: 0.5rem;
                                margin: 1rem 0;
                            }
                            .steps h3 {
                                color: #92400e;
                                margin: 0 0 0.5rem;
                                font-size: 1rem;
                            }
                            .steps ol {
                                margin: 0;
                                padding-left: 1.5rem;
                                color: #78350f;
                            }
                            .steps li {
                                margin: 0.5rem 0;
                                font-size: 0.875rem;
                            }
                            .steps a {
                                color: #2563eb;
                                text-decoration: underline;
                            }
                            .button {
                                display: inline-block;
                                background: #2563eb;
                                color: white;
                                padding: 0.75rem 1.5rem;
                                border-radius: 0.5rem;
                                text-decoration: none;
                                font-weight: 600;
                                margin-top: 1rem;
                            }
                            .button:hover {
                                background: #1d4ed8;
                            }
                            .close-btn {
                                text-align: center;
                                margin-top: 1rem;
                            }
                            .close-btn button {
                                background: #6b7280;
                                color: white;
                                border: none;
                                padding: 0.5rem 1rem;
                                border-radius: 0.5rem;
                                cursor: pointer;
                                font-size: 0.875rem;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="error-icon">
                                <span class="icon">!</span>
                            </div>
                            <h2>Business Manager Required</h2>
                            <p>You need to create a Facebook Business Manager account first.</p>
                            
                            <div class="steps">
                                <h3>📋 Quick Setup Guide:</h3>
                                <ol>
                                    <li>Go to <a href="https://business.facebook.com/overview" target="_blank">business.facebook.com</a></li>
                                    <li>Click "Create Account" (it's free!)</li>
                                    <li>Enter your business name and details</li>
                                    <li>Add WhatsApp to your business</li>
                                    <li>Set up a phone number</li>
                                    <li>Come back and connect again</li>
                                </ol>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="https://business.facebook.com/overview" target="_blank" class="button">
                                    Create Business Manager →
                                </a>
                            </div>
                            
                            <div class="close-btn">
                                <button onclick="window.close()">Close Window</button>
                            </div>
                        </div>
                        <script>
                            window.opener.postMessage({
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'Business Manager account required. Please create one at business.facebook.com'
                            }, '*');
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        # Step 2: Get the first business (or iterate to find one with WhatsApp)
        business_id = businesses_data["data"][0]["id"]
        business_name = businesses_data["data"][0].get("name", "Unknown Business")
        
        logger.info(f"🏢 Selected Business ID: {business_id}, Name: {business_name}")
        
        # Step 3: Get WhatsApp Business Accounts for this business
        waba_url = f"https://graph.facebook.com/v21.0/{business_id}/owned_whatsapp_business_accounts"
        waba_params = {"access_token": access_token}
        
        logger.info(f"🔍 Fetching WABAs from: {waba_url}")
        waba_response = requests.get(waba_url, params=waba_params, timeout=30)
        waba_response.raise_for_status()
        waba_data = waba_response.json()
        
        logger.info(f"📊 WABA Response: {waba_data}")
        
        if not waba_data.get("data"):
            logger.error("❌ No WhatsApp Business Accounts found")
            return HTMLResponse(
                content="""
                <html>
                    <body>
                        <h2>No WhatsApp Business Account</h2>
                        <p>No WhatsApp Business Account found in your Business Manager.</p>
                        <script>
                            window.opener.postMessage({
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'No WhatsApp Business Account found'
                            }, '*');
                            setTimeout(() => window.close(), 3000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        # Step 4: Get the first WABA
        waba = waba_data["data"][0]
        waba_id = waba["id"]
        waba_name = waba.get("name", business_name)
        
        logger.info(f"📱 Selected WABA ID: {waba_id}, Name: {waba_name}")
        
        # Step 5: Get phone numbers for this WABA
        phone_numbers_url = f"https://graph.facebook.com/v21.0/{waba_id}/phone_numbers"
        phone_numbers_params = {"access_token": access_token}
        
        logger.info(f"🔍 Fetching phone numbers from: {phone_numbers_url}")
        phone_numbers_response = requests.get(phone_numbers_url, params=phone_numbers_params, timeout=30)
        phone_numbers_response.raise_for_status()
        phone_numbers_data = phone_numbers_response.json()
        
        logger.info(f"📊 Phone Numbers Response: {phone_numbers_data}")
        
        if not phone_numbers_data.get("data"):
            logger.error("❌ No phone numbers found for this WABA")
            return HTMLResponse(
                content="""
                <html>
                    <body>
                        <h2>No Phone Number</h2>
                        <p>No phone number found for your WhatsApp Business Account.</p>
                        <script>
                            window.opener.postMessage({
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'No phone number found'
                            }, '*');
                            setTimeout(() => window.close(), 3000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        # Step 6: Get the first phone number
        phone_data = phone_numbers_data["data"][0]
        phone_number_id = phone_data["id"]
        phone_number = phone_data.get("display_phone_number", "")
        
        logger.info(f"📞 Selected Phone Number ID: {phone_number_id}, Number: {phone_number}")
        
        # Step 7: Extract user_id from state or get from token
        # For now, we'll need to pass user_id through state parameter
        # This is a limitation - we need user context in callback
        
        # TEMPORARY: Store in a temporary table or cache with state as key
        # For now, we'll return success and let frontend call connect-manual
        
        logger.info("✅ WhatsApp OAuth successful - Account details retrieved")
        logger.info(f"📋 Summary: WABA={waba_id}, Phone={phone_number_id}, Business={business_name}")
        
        # Return success with account details for frontend to save
        return HTMLResponse(
            content=f"""
            <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }}
                        .container {{
                            background: white;
                            padding: 2rem;
                            border-radius: 1rem;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 500px;
                        }}
                        .success-icon {{
                            width: 64px;
                            height: 64px;
                            background: #10b981;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 1rem;
                        }}
                        .checkmark {{
                            color: white;
                            font-size: 32px;
                        }}
                        h2 {{
                            color: #1f2937;
                            margin: 0 0 0.5rem;
                        }}
                        p {{
                            color: #6b7280;
                            margin: 0 0 1rem;
                        }}
                        .details {{
                            background: #f3f4f6;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            font-size: 0.875rem;
                            color: #4b5563;
                            text-align: left;
                            margin: 1rem 0;
                        }}
                        .details strong {{
                            color: #1f2937;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">
                            <span class="checkmark">✓</span>
                        </div>
                        <h2>WhatsApp Connected!</h2>
                        <p>Your WhatsApp Business account has been connected successfully.</p>
                        <div class="details">
                            <strong>Business:</strong> {waba_name}<br>
                            <strong>Phone:</strong> {phone_number}<br>
                            <strong>WABA ID:</strong> {waba_id}
                        </div>
                        <p style="font-size: 0.875rem;">Saving account details...</p>
                    </div>
                    <script>
                        // Send account details to frontend
                        window.opener.postMessage({{
                            type: 'WHATSAPP_OAUTH_SUCCESS',
                            data: {{
                                waba_id: '{waba_id}',
                                phone_number_id: '{phone_number_id}',
                                phone_number: '{phone_number}',
                                business_name: '{waba_name}',
                                access_token: '{access_token}'
                            }}
                        }}, '*');
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in WhatsApp callback: {e}", exc_info=True)
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>WhatsApp Connection Error</h2>
                    <p>An error occurred: {str(e)}</p>
                    <script>
                        window.opener.postMessage({{
                            type: 'WHATSAPP_OAUTH_ERROR',
                            error: '{str(e)}'
                        }}, '*');
                        setTimeout(() => window.close(), 2000);
                    </script>
                </body>
            </html>
            """,
            status_code=500
        )


class ManualConnectRequest(BaseModel):
    """Request model for manual WhatsApp connection"""
    phone_number_id: str
    waba_id: str
    access_token: str
    business_name: Optional[str] = None
    phone_number: Optional[str] = None
    facebook_user_id: Optional[str] = None
    token_type: Optional[str] = "system_user"


class EmbeddedSignupCompleteRequest(BaseModel):
    """Request model for completing Embedded Signup with data from JavaScript SDK"""
    code: str  # OAuth code from callback
    waba_id: str  # From JavaScript SDK response
    phone_number_id: str  # From JavaScript SDK response
    business_name: Optional[str] = None


@router.post("/embedded-signup-complete")
async def complete_embedded_signup(
    request: EmbeddedSignupCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Complete Embedded Signup with WABA details from JavaScript SDK
    
    This endpoint receives:
    - OAuth code (to exchange for access token)
    - WABA ID (from JavaScript SDK callback)
    - Phone Number ID (from JavaScript SDK callback)
    
    This is the CORRECT way to handle Meta Embedded Signup for System Users.
    """
    try:
        logger.info("=" * 80)
        logger.info("🚀 COMPLETING EMBEDDED SIGNUP WITH SDK DATA")
        logger.info("=" * 80)
        logger.info(f"📱 WABA ID: {request.waba_id}")
        logger.info(f"📞 Phone Number ID: {request.phone_number_id}")
        
        # Exchange code for access token
        app_id = os.getenv("META_APP_ID")
        app_secret = os.getenv("META_APP_SECRET")
        redirect_uri = os.getenv("WHATSAPP_REDIRECT_URI", "http://localhost:8000/api/whatsapp/callback")
        
        if not app_id or not app_secret:
            raise HTTPException(status_code=500, detail="Meta app credentials not configured")
        
        logger.info("🔄 Exchanging code for access token...")
        
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        token_params = {
            "client_id": app_id,
            "client_secret": app_secret,
            "code": request.code,
            "redirect_uri": redirect_uri
        }
        
        token_response = requests.get(token_url, params=token_params, timeout=30)
        token_response.raise_for_status()
        token_data = token_response.json()
        
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to obtain access token")
        
        logger.info("✅ Access token obtained")
        
        # Get token info for user ID and type
        facebook_user_id = None
        token_type = "system_user"
        
        try:
            debug_token_url = f"https://graph.facebook.com/v21.0/debug_token"
            debug_params = {
                "input_token": access_token,
                "access_token": f"{app_id}|{app_secret}"
            }
            debug_response = requests.get(debug_token_url, params=debug_params, timeout=30)
            debug_response.raise_for_status()
            debug_data = debug_response.json()
            
            if debug_data.get("data"):
                token_type = debug_data["data"].get('type', 'system_user').lower()
                facebook_user_id = debug_data["data"].get('user_id')
                logger.info(f"📊 Token Type: {token_type}")
                logger.info(f"📊 Facebook User ID: {facebook_user_id}")
        except Exception as e:
            logger.warning(f"⚠️  Could not get token debug info: {e}")
        
        # Get phone number details
        phone_number = None
        try:
            phone_url = f"https://graph.facebook.com/v21.0/{request.phone_number_id}"
            phone_params = {"access_token": access_token}
            phone_response = requests.get(phone_url, params=phone_params, timeout=30)
            phone_response.raise_for_status()
            phone_data = phone_response.json()
            phone_number = phone_data.get("display_phone_number", "")
            logger.info(f"📞 Phone Number: {phone_number}")
        except Exception as e:
            logger.warning(f"⚠️  Could not get phone number details: {e}")
        
        # Check if account already exists for this user
        existing_account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        business_name = request.business_name or "WhatsApp Business"
        
        if existing_account:
            # Update existing account
            existing_account.phone_number = phone_number or existing_account.phone_number
            existing_account.phone_number_id = request.phone_number_id
            existing_account.waba_id = request.waba_id
            existing_account.access_token = access_token
            existing_account.business_name = business_name
            existing_account.facebook_user_id = facebook_user_id
            existing_account.token_type = token_type
            existing_account.connected_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_account)
            
            logger.info(f"✅ Updated WhatsApp account for user {current_user.id}")
            
            return {
                "success": True,
                "message": "WhatsApp account updated successfully",
                "account": {
                    "id": existing_account.id,
                    "phone_number": existing_account.phone_number,
                    "business_name": existing_account.business_name,
                    "waba_id": existing_account.waba_id,
                    "phone_number_id": existing_account.phone_number_id,
                    "token_type": existing_account.token_type,
                    "connected_at": existing_account.connected_at.isoformat()
                }
            }
        else:
            # Create new account
            new_account = WhatsAppAccount(
                user_id=current_user.id,
                business_name=business_name,
                phone_number=phone_number or "Configured",
                phone_number_id=request.phone_number_id,
                waba_id=request.waba_id,
                access_token=access_token,
                facebook_user_id=facebook_user_id,
                token_type=token_type,
                is_active=True
            )
            
            db.add(new_account)
            db.commit()
            db.refresh(new_account)
            
            logger.info(f"✅ Created WhatsApp account for user {current_user.id}")
            logger.info(f"   WABA ID: {new_account.waba_id}")
            logger.info(f"   Phone Number ID: {new_account.phone_number_id}")
            logger.info(f"   Token Type: {new_account.token_type}")
            
            return {
                "success": True,
                "message": "WhatsApp account connected successfully",
                "account": {
                    "id": new_account.id,
                    "phone_number": new_account.phone_number,
                    "business_name": new_account.business_name,
                    "waba_id": new_account.waba_id,
                    "phone_number_id": new_account.phone_number_id,
                    "token_type": new_account.token_type,
                    "connected_at": new_account.connected_at.isoformat()
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error completing embedded signup: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect")
async def connect_whatsapp_account(
    request: WhatsAppConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Connect WhatsApp Business Account
    Called after successful OAuth with account details
    """
    try:
        # Exchange code for long-lived access token
        app_id = os.getenv("META_APP_ID")
        app_secret = os.getenv("META_APP_SECRET")
        
        if not app_id or not app_secret:
            raise HTTPException(status_code=500, detail="Meta app credentials not configured")
        
        # Get long-lived token
        token_url = "https://graph.facebook.com/v21.0/oauth/access_token"
        token_params = {
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": request.code
        }
        
        token_response = requests.get(token_url, params=token_params, timeout=30)
        token_response.raise_for_status()
        token_data = token_response.json()
        
        access_token = token_data.get("access_token")
        
        # Get phone number details
        phone_url = f"https://graph.facebook.com/v21.0/{request.phone_number_id}"
        phone_params = {"access_token": access_token}
        
        phone_response = requests.get(phone_url, params=phone_params, timeout=30)
        phone_response.raise_for_status()
        phone_data = phone_response.json()
        
        phone_number = phone_data.get("display_phone_number", "")
        
        # Get business profile
        profile_result = await whatsapp_service.get_business_profile(
            phone_number_id=request.phone_number_id,
            access_token=access_token
        )
        
        business_name = None
        if profile_result.get("success"):
            business_name = profile_result.get("data", {}).get("about")
        
        # Check if account already exists
        existing_account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.phone_number_id == request.phone_number_id
        ).first()
        
        if existing_account:
            # Update existing account
            existing_account.access_token = access_token
            existing_account.waba_id = request.waba_id
            existing_account.business_name = business_name or existing_account.business_name
            existing_account.is_active = True
            existing_account.connected_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_account)
            
            logger.info(f"✅ Updated WhatsApp account: {phone_number}")
            
            return {
                "success": True,
                "message": "WhatsApp account reconnected successfully",
                "account": {
                    "id": existing_account.id,
                    "phone_number": existing_account.phone_number,
                    "business_name": existing_account.business_name
                }
            }
        else:
            # Create new account
            new_account = WhatsAppAccount(
                user_id=current_user.id,
                business_name=business_name,
                phone_number=phone_number,
                phone_number_id=request.phone_number_id,
                waba_id=request.waba_id,
                access_token=access_token,
                is_active=True
            )
            
            db.add(new_account)
            db.commit()
            db.refresh(new_account)
            
            logger.info(f"✅ Connected WhatsApp account: {phone_number}")
            
            return {
                "success": True,
                "message": "WhatsApp account connected successfully",
                "account": {
                    "id": new_account.id,
                    "phone_number": new_account.phone_number,
                    "business_name": new_account.business_name
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error connecting WhatsApp account: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect-manual")
async def connect_whatsapp_manual(
    request: ManualConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Manually connect WhatsApp Business Account with credentials
    Use this after OAuth to save account details
    """
    try:
        # Verify the access token works by getting phone number details
        phone_url = f"https://graph.facebook.com/v21.0/{request.phone_number_id}"
        phone_params = {"access_token": request.access_token}
        
        try:
            phone_response = requests.get(phone_url, params=phone_params, timeout=30)
            phone_response.raise_for_status()
            phone_data = phone_response.json()
            phone_number = phone_data.get("display_phone_number", request.phone_number or "")
        except:
            # If API call fails, use provided phone number
            phone_number = request.phone_number or "Unknown"
        
        # Get business profile if possible
        business_name = request.business_name
        if not business_name:
            profile_result = await whatsapp_service.get_business_profile(
                phone_number_id=request.phone_number_id,
                access_token=request.access_token
            )
            if profile_result.get("success"):
                business_name = profile_result.get("data", {}).get("about")
        
        # Check if account already exists for this user
        existing_account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if existing_account:
            # Update existing account
            existing_account.phone_number = phone_number
            existing_account.phone_number_id = request.phone_number_id
            existing_account.waba_id = request.waba_id
            existing_account.access_token = request.access_token
            existing_account.business_name = business_name or existing_account.business_name
            existing_account.facebook_user_id = request.facebook_user_id
            existing_account.token_type = request.token_type or "system_user"
            existing_account.connected_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_account)
            
            logger.info(f"✅ Updated WhatsApp account manually: {phone_number}")
            logger.info(f"   Token Type: {existing_account.token_type}")
            logger.info(f"   Facebook User ID: {existing_account.facebook_user_id}")
            
            return {
                "success": True,
                "message": "WhatsApp account updated successfully",
                "account": {
                    "id": existing_account.id,
                    "phone_number": existing_account.phone_number,
                    "business_name": existing_account.business_name,
                    "connected_at": existing_account.connected_at.isoformat(),
                    "token_type": existing_account.token_type
                }
            }
        else:
            # Create new account
            new_account = WhatsAppAccount(
                user_id=current_user.id,
                business_name=business_name or "My Business",
                phone_number=phone_number,
                phone_number_id=request.phone_number_id,
                waba_id=request.waba_id,
                access_token=request.access_token,
                facebook_user_id=request.facebook_user_id,
                token_type=request.token_type or "system_user",
                is_active=True
            )
            
            db.add(new_account)
            db.commit()
            db.refresh(new_account)
            
            logger.info(f"✅ Connected WhatsApp account manually: {phone_number}")
            logger.info(f"   Token Type: {new_account.token_type}")
            logger.info(f"   Facebook User ID: {new_account.facebook_user_id}")
            
            return {
                "success": True,
                "message": "WhatsApp account connected successfully",
                "account": {
                    "id": new_account.id,
                    "phone_number": new_account.phone_number,
                    "business_name": new_account.business_name,
                    "connected_at": new_account.connected_at.isoformat(),
                    "token_type": new_account.token_type
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error connecting WhatsApp account manually: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug-token")
async def debug_token(
    token: str = Query(..., description="Access token to debug"),
    current_user: User = Depends(get_current_user)
):
    """
    Debug endpoint to inspect access token permissions and scopes
    """
    try:
        app_id = os.getenv("META_APP_ID")
        app_secret = os.getenv("META_APP_SECRET")
        
        if not app_id or not app_secret:
            raise HTTPException(status_code=500, detail="Meta app credentials not configured")
        
        # Debug token
        debug_token_url = f"https://graph.facebook.com/v21.0/debug_token"
        debug_params = {
            "input_token": token,
            "access_token": f"{app_id}|{app_secret}"
        }
        
        debug_response = requests.get(debug_token_url, params=debug_params, timeout=30)
        debug_response.raise_for_status()
        debug_data = debug_response.json()
        
        # Get permissions
        permissions_url = f"https://graph.facebook.com/v21.0/me/permissions"
        permissions_params = {"access_token": token}
        permissions_response = requests.get(permissions_url, params=permissions_params, timeout=30)
        permissions_response.raise_for_status()
        permissions_data = permissions_response.json()
        
        # Get user info
        me_url = f"https://graph.facebook.com/v21.0/me"
        me_params = {"access_token": token, "fields": "id,name,email"}
        me_response = requests.get(me_url, params=me_params, timeout=30)
        me_response.raise_for_status()
        me_data = me_response.json()
        
        # Get businesses
        businesses_url = f"https://graph.facebook.com/v21.0/me/businesses"
        businesses_params = {"access_token": token}
        businesses_response = requests.get(businesses_url, params=businesses_params, timeout=30)
        businesses_response.raise_for_status()
        businesses_data = businesses_response.json()
        
        return {
            "success": True,
            "token_debug": debug_data,
            "permissions": permissions_data,
            "user_info": me_data,
            "businesses": businesses_data,
            "analysis": {
                "has_business_management": any(
                    p.get("permission") == "business_management" and p.get("status") == "granted"
                    for p in permissions_data.get("data", [])
                ),
                "has_whatsapp_business_management": any(
                    p.get("permission") == "whatsapp_business_management" and p.get("status") == "granted"
                    for p in permissions_data.get("data", [])
                ),
                "has_whatsapp_business_messaging": any(
                    p.get("permission") == "whatsapp_business_messaging" and p.get("status") == "granted"
                    for p in permissions_data.get("data", [])
                ),
                "business_count": len(businesses_data.get("data", []))
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error debugging token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connection-status", response_model=WhatsAppConnectionStatus)
async def get_connection_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Get WhatsApp connection status for current user
    """
    try:
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if account:
            return WhatsAppConnectionStatus(
                is_connected=True,
                phone_number=account.phone_number,
                business_name=account.business_name,
                connected_at=account.connected_at.isoformat() if account.connected_at else None
            )
        else:
            return WhatsAppConnectionStatus(is_connected=False)
        
    except Exception as e:
        logger.error(f"❌ Error getting connection status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect")
async def disconnect_whatsapp_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Disconnect WhatsApp Business Account
    """
    try:
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        logger.info(f"🔄 Disconnecting WhatsApp account: {account.phone_number}")
        
        # Option 1: Soft delete - Deactivate account but keep data
        # This preserves message history and analytics
        account.is_active = False
        
        # Option 2: Hard delete - Remove all related data (uncomment if you want this)
        # WARNING: This will delete ALL messages, campaigns, and automations
        
        # Delete all messages
        # from models.whatsapp_message import WhatsAppMessage
        # db.query(WhatsAppMessage).filter(
        #     WhatsAppMessage.account_id == account.id
        # ).delete(synchronize_session=False)
        # logger.info(f"   Deleted messages for account {account.id}")
        
        # Delete all campaigns
        # from models.whatsapp_campaign import WhatsAppCampaign
        # db.query(WhatsAppCampaign).filter(
        #     WhatsAppCampaign.account_id == account.id
        # ).delete(synchronize_session=False)
        # logger.info(f"   Deleted campaigns for account {account.id}")
        
        # Delete all automations
        # from models.whatsapp_automation import WhatsAppAutomation
        # db.query(WhatsAppAutomation).filter(
        #     WhatsAppAutomation.account_id == account.id
        # ).delete(synchronize_session=False)
        # logger.info(f"   Deleted automations for account {account.id}")
        
        # Delete the account itself
        # await db.delete(account)
        # logger.info(f"   Deleted account {account.id}")
        
        db.commit()
        
        logger.info(f"✅ Disconnected WhatsApp account: {account.phone_number}")
        logger.info(f"   Account deactivated (data preserved)")
        logger.info(f"   To permanently delete data, use the 'Delete Account' option")
        
        return {
            "success": True,
            "message": "WhatsApp account disconnected successfully",
            "note": "Account deactivated. Message history preserved. Use 'Delete Account' to remove all data."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error disconnecting WhatsApp account: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


from datetime import datetime


@router.delete("/disconnect/permanent")
async def disconnect_whatsapp_permanent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync)
):
    """
    Permanently disconnect WhatsApp account and DELETE ALL DATA
    
    ⚠️ WARNING: This will permanently delete:
    - All messages and conversations
    - All campaigns
    - All automations
    - The WhatsApp account connection
    
    This action CANNOT be undone!
    """
    try:
        account = db.query(WhatsAppAccount).filter(
            WhatsAppAccount.user_id == current_user.id,
            WhatsAppAccount.is_active == True
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="No active WhatsApp account found")
        
        logger.warning(f"⚠️  PERMANENT DELETE requested for WhatsApp account: {account.phone_number}")
        
        account_id = account.id
        phone_number = account.phone_number
        
        # Delete all messages
        from models.whatsapp_message import WhatsAppMessage
        message_count = db.query(WhatsAppMessage).filter(
            WhatsAppMessage.account_id == account_id
        ).count()
        db.query(WhatsAppMessage).filter(
            WhatsAppMessage.account_id == account_id
        ).delete(synchronize_session=False)
        logger.info(f"   🗑️  Deleted {message_count} messages")
        
        # Delete all campaigns
        from models.whatsapp_campaign import WhatsAppCampaign
        campaign_count = db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.account_id == account_id
        ).count()
        db.query(WhatsAppCampaign).filter(
            WhatsAppCampaign.account_id == account_id
        ).delete(synchronize_session=False)
        logger.info(f"   🗑️  Deleted {campaign_count} campaigns")
        
        # Delete all automations
        from models.whatsapp_automation import WhatsAppAutomation
        automation_count = db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.account_id == account_id
        ).count()
        db.query(WhatsAppAutomation).filter(
            WhatsAppAutomation.account_id == account_id
        ).delete(synchronize_session=False)
        logger.info(f"   🗑️  Deleted {automation_count} automations")
        
        # Delete the account itself
        db.delete(account)
        logger.info(f"   🗑️  Deleted account {account_id}")
        
        db.commit()
        
        logger.warning(f"✅ PERMANENTLY DELETED WhatsApp account: {phone_number}")
        logger.warning(f"   - {message_count} messages deleted")
        logger.warning(f"   - {campaign_count} campaigns deleted")
        logger.warning(f"   - {automation_count} automations deleted")
        
        return {
            "success": True,
            "message": "WhatsApp account and all data permanently deleted",
            "deleted": {
                "messages": message_count,
                "campaigns": campaign_count,
                "automations": automation_count,
                "account": phone_number
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error permanently deleting WhatsApp account: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
