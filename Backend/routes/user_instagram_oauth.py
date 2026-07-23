"""
User-based Instagram OAuth Routes
Modified Instagram OAuth flow that uses user-provided API keys instead of global keys
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from services.instagram_crud import InstagramCRUD
from utils.dependencies import get_current_user
from models.user import User
from routes.user_api_keys import get_user_platform_credentials
import logging
import requests
import urllib.parse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/user-instagram", tags=["user-instagram-oauth"])

def read_template(filename: str) -> str:
    """Read HTML template file."""
    import os
    template_path = os.path.join(os.path.dirname(__file__), "..", "templates", filename)
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        # Fallback HTML if template not found
        if "success" in filename:
            return """
            <!DOCTYPE html>
            <html><head><title>Success</title></head>
            <body>
                <h1>Instagram Connected Successfully!</h1>
                <p>You can close this window.</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({type: 'INSTAGRAM_OAUTH_SUCCESS'}, window.location.origin);
                        window.close();
                    }
                </script>
            </body></html>
            """
        else:
            return """
            <!DOCTYPE html>
            <html><head><title>Error</title></head>
            <body>
                <h1>Connection Failed</h1>
                <p>Please try again.</p>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({type: 'INSTAGRAM_OAUTH_ERROR'}, window.location.origin);
                        window.close();
                    }
                </script>
            </body></html>
            """

@router.get("/debug/{user_id}")
async def debug_user_oauth_config(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Debug endpoint to check user's Instagram API configuration
    """
    try:
        # Get user's API credentials
        credentials = await get_user_platform_credentials(db, user_id, "instagram")
        
        if not credentials:
            return {
                "status": "❌ No API Keys Found",
                "error": "User has not configured Instagram API keys",
                "required_action": "User must add Instagram API credentials in Settings > API Keys",
                "required_fields": ["client_id", "client_secret"]
            }
        
        client_id = credentials.get('client_id')
        client_secret = credentials.get('client_secret')
        
        if not client_id or not client_secret:
            return {
                "status": "❌ Incomplete Configuration", 
                "error": "Missing required credentials",
                "has_client_id": bool(client_id),
                "has_client_secret": bool(client_secret),
                "required_action": "User must provide both Client ID and Client Secret"
            }
        
        # Generate OAuth URL using user's credentials
        redirect_uri = f"http://localhost:8001/auth/user-instagram/callback"
        debug_state = f"debug_{user_id}_123"
        
        oauth_url = generate_facebook_oauth_url(client_id, redirect_uri, debug_state)
        
        return {
            "status": "✅ User Configuration Valid",
            "user_id": user_id,
            "client_id": client_id[:8] + "..." if len(client_id) > 8 else client_id,
            "redirect_uri": redirect_uri,
            "oauth_url": oauth_url,
            "oauth_flow": "User-specific Facebook Graph API + Instagram Graph API",
            "oauth_url_breakdown": {
                "base_url": "https://www.facebook.com/v19.0/dialog/oauth",
                "client_id": client_id[:8] + "...",
                "redirect_uri": redirect_uri,
                "scope": "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
                "response_type": "code",
                "state": debug_state
            },
            "requirements": {
                "app_exists": f"Verify app {client_id} exists in Facebook Developer Console",
                "products_added": "Instagram Basic Display + Facebook Login must be added",
                "redirect_uri_match": f"Must exactly match: {redirect_uri}",
                "instagram_account": "Must be Instagram Business Account linked to Facebook Page"
            }
        }
        
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        return {
            "status": "❌ Debug Error",
            "error": str(e),
            "user_id": user_id
        }

@router.get("/connect")
async def connect_user_instagram(
    token: str = Query(..., description="User JWT token for state parameter"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Connect Instagram account using user's personal API keys
    """
    try:
        # Get user's API credentials
        credentials = await get_user_platform_credentials(db, current_user.id, "instagram")
        
        if not credentials:
            # Redirect to API keys setup page instead of throwing error
            setup_url = f"http://localhost:5173/settings/api-keys?platform=instagram&error=no_credentials"
            return RedirectResponse(url=setup_url)
        
        client_id = credentials.get('client_id')
        client_secret = credentials.get('client_secret')
        
        if not client_id or not client_secret:
            setup_url = f"http://localhost:5173/settings/api-keys?platform=instagram&error=incomplete_credentials"
            return RedirectResponse(url=setup_url)
        
        # Generate OAuth URL using user's credentials
        redirect_uri = f"http://localhost:8001/auth/user-instagram/callback"
        oauth_url = generate_facebook_oauth_url(client_id, redirect_uri, token)
        
        logger.info(f"Generated user-specific Facebook OAuth URL for user {current_user.id}")
        logger.info(f"Using user's App ID: {client_id[:8]}...")
        
        return RedirectResponse(url=oauth_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User Instagram connect error: {str(e)}")
        error_url = f"http://localhost:5173/settings/api-keys?platform=instagram&error={urllib.parse.quote(str(e))}"
        return RedirectResponse(url=error_url)

@router.get("/callback")
async def user_instagram_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Facebook OAuth callback using user's API credentials
    """
    try:
        # Get parameters from callback
        code = request.query_params.get("code")
        state = request.query_params.get("state")  # User's JWT token
        error = request.query_params.get("error")
        error_description = request.query_params.get("error_description", "")
        
        logger.info(f"User Instagram OAuth callback - Code: {'✓' if code else '✗'}, State: {'✓' if state else '✗'}, Error: {error}")
        
        # Handle OAuth errors
        if error:
            error_msg = f"Facebook OAuth Error: {error}"
            if error_description:
                error_msg += f" - {error_description}"
            logger.error(error_msg)
            
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", f"OAuth Error: {error}"
            ).replace(
                "Please try again.", f"Error: {error_description or 'Please check your API configuration.'}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Validate required parameters
        if not code or not state:
            logger.error("Missing required parameters from Facebook callback")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Invalid Callback"
            ).replace(
                "Please try again.", "Missing required parameters from Facebook."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Decode JWT token to get user ID
        user_id = None
        try:
            from utils.security import decode_token
            payload = decode_token(state)
            user_id = payload.get("user_id") or payload.get("sub")
        except Exception as e:
            logger.error(f"Invalid state parameter (JWT token): {e}")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Invalid Session"
            ).replace(
                "Please try again.", "Your session token is invalid. Please login again."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        if not user_id:
            logger.error("Could not extract user ID from state token")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Session Error"
            ).replace(
                "Please try again.", "Could not identify your account."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Get user's API credentials
        credentials = await get_user_platform_credentials(db, int(user_id), "instagram")
        
        if not credentials:
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "API Keys Not Found"
            ).replace(
                "Please try again.", "Your Instagram API keys are not configured. Please set them up in Settings > API Keys."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        client_id = credentials.get('client_id')
        client_secret = credentials.get('client_secret')
        
        if not client_id or not client_secret:
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Incomplete API Configuration"
            ).replace(
                "Please try again.", "Your Instagram API credentials are incomplete."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        logger.info(f"Processing user Instagram OAuth for user ID: {user_id} with user's API keys")
        
        # Step 1: Exchange code for access token using user's credentials
        logger.info("Step 1: Exchanging authorization code for access token...")
        try:
            redirect_uri = f"http://localhost:8001/auth/user-instagram/callback"
            access_token = await exchange_code_for_token_user(code, client_id, client_secret, redirect_uri)
            logger.info("✅ Successfully obtained Facebook access token using user's credentials")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Token exchange failed: {error_msg}")
            
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Token Exchange Failed"
            ).replace(
                "Please try again.", f"Facebook API Error: {error_msg}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Step 2: Get Instagram Business account
        logger.info("Step 2: Fetching Instagram Business account...")
        try:
            ig_user_id, page_id, page_name, ig_username = await get_instagram_account_user(access_token)
            logger.info(f"✅ Found Instagram Business account: @{ig_username} (Page: {page_name})")
        except Exception as e:
            logger.error(f"❌ Instagram account fetch failed: {str(e)}")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Instagram Account Not Found"
            ).replace(
                "Please try again.", f"Error: {str(e)}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Step 3: Save to database
        logger.info("Step 3: Saving Instagram account to database...")
        try:
            social_account = await InstagramCRUD.create_social_account(
                db=db,
                user_id=int(user_id),
                platform="instagram",
                access_token=access_token,
                ig_user_id=ig_user_id,
                ig_username=ig_username,
                page_id=page_id,
                page_name=page_name,
                access_token_expires_at=None,
            )
            
            logger.info(f"✅ Successfully saved Instagram account to database (ID: {social_account.id})")
            
        except Exception as e:
            logger.error(f"❌ Database save failed: {str(e)}")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", "Database Error"
            ).replace(
                "Please try again.", f"Failed to save Instagram account: {str(e)}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Success!
        logger.info(f"🎉 User {user_id} successfully connected Instagram using personal API keys: @{ig_username}")
        
        success_html = read_template("oauth_success.html").replace(
            "Instagram Connected Successfully!", 
            f"Instagram Connected Successfully!"
        ).replace(
            "You can close this window.", 
            f"Account: @{ig_username}<br>Page: {page_name}<br>Using your personal API keys<br><br>You can close this window."
        )
        return HTMLResponse(content=success_html, status_code=200)
    
    except Exception as e:
        logger.error(f"❌ Unexpected error in user Instagram OAuth callback: {str(e)}")
        error_html = read_template("oauth_error.html").replace(
            "Connection Failed", "Unexpected Error"
        ).replace(
            "Please try again.", f"An unexpected error occurred: {str(e)}"
        )
        return HTMLResponse(content=error_html, status_code=200)

def generate_facebook_oauth_url(client_id: str, redirect_uri: str, state: str) -> str:
    """Generate Facebook OAuth URL using user's credentials"""
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
        "response_type": "code",
        "state": state
    }
    
    query_string = urllib.parse.urlencode(params)
    return f"https://www.facebook.com/v19.0/dialog/oauth?{query_string}"

async def exchange_code_for_token_user(code: str, client_id: str, client_secret: str, redirect_uri: str) -> str:
    """Exchange Facebook OAuth code for access token using user's credentials"""
    try:
        code = code.strip()
        if not code:
            raise Exception("Empty authorization code received")
        
        url = f"https://graph.facebook.com/v19.0/oauth/access_token"
        
        params = {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code": code
        }
        
        logger.info(f"Requesting access token using user's App ID: {client_id[:8]}...")
        
        response = requests.get(url, params=params, timeout=30)
        data = response.json()
        
        if response.status_code != 200:
            error_msg = data.get("error", {})
            if isinstance(error_msg, dict):
                error_message = error_msg.get("message", "Unknown error occurred")
                raise Exception(f"Facebook API Error: {error_message}")
            else:
                raise Exception(f"HTTP {response.status_code}: {data}")
        
        if "error" in data:
            error_info = data["error"]
            if isinstance(error_info, dict):
                error_message = error_info.get("message", "Unknown error occurred")
                raise Exception(f"Facebook OAuth Error: {error_message}")
            else:
                raise Exception(f"Facebook OAuth Error: {error_info}")
        
        if "access_token" not in data:
            raise Exception("No access token received from Facebook")
        
        short_lived_token = data["access_token"]
        logger.info("✅ Received short-lived token, exchanging for long-lived token...")
        
        # Exchange for long-lived token
        long_lived_token = await exchange_for_long_lived_token_user(short_lived_token, client_id, client_secret)
        
        return long_lived_token
        
    except Exception as e:
        raise Exception(f"Token exchange failed: {str(e)}")

async def exchange_for_long_lived_token_user(short_lived_token: str, client_id: str, client_secret: str) -> str:
    """Exchange short-lived token for long-lived token using user's credentials"""
    try:
        url = f"https://graph.facebook.com/v19.0/oauth/access_token"
        
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "fb_exchange_token": short_lived_token
        }
        
        logger.info("🔄 Exchanging for long-lived token...")
        
        response = requests.get(url, params=params, timeout=30)
        data = response.json()
        
        if response.status_code != 200:
            error_msg = data.get("error", {})
            if isinstance(error_msg, dict):
                error_message = error_msg.get("message", "Unknown error")
                raise Exception(f"Long-lived token exchange failed: {error_message}")
            else:
                raise Exception(f"Long-lived token exchange failed: {data}")
        
        if "access_token" not in data:
            raise Exception("No long-lived token received")
        
        expires_in = data.get("expires_in", 5184000)  # Default 60 days
        logger.info(f"✅ Long-lived token obtained (expires in {expires_in // 86400} days)")
        
        return data["access_token"]
        
    except Exception as e:
        logger.error(f"❌ Failed to get long-lived token: {e}")
        raise Exception(f"Long-lived token exchange failed: {str(e)}")

async def get_instagram_account_user(access_token: str) -> tuple[str, str, str, str]:
    """Get Instagram Business account from Facebook pages"""
    try:
        # Get user's Facebook pages
        pages_url = f"https://graph.facebook.com/v19.0/me/accounts"
        pages_params = {
            "access_token": access_token,
            "fields": "id,name,instagram_business_account"
        }
        
        pages_response = requests.get(pages_url, params=pages_params, timeout=30)
        pages_data = pages_response.json()
        
        if pages_response.status_code != 200:
            error_msg = pages_data.get("error", {})
            if isinstance(error_msg, dict):
                error_message = error_msg.get("message", "Unknown error")
                raise Exception(f"Failed to fetch Facebook pages: {error_message}")
            else:
                raise Exception(f"Failed to fetch Facebook pages: {pages_data}")
        
        if "data" not in pages_data or len(pages_data["data"]) == 0:
            raise Exception("No Facebook Pages found. Please create a Facebook Page and link your Instagram Business account.")
        
        pages = pages_data["data"]
        
        # Find page with Instagram Business account
        instagram_page = None
        for page in pages:
            if page.get("instagram_business_account"):
                instagram_page = page
                break
        
        if not instagram_page:
            page_names = [page.get("name", "Unnamed") for page in pages]
            raise Exception(f"No Instagram Business account found linked to your Facebook pages: {', '.join(page_names)}")
        
        page_id = instagram_page["id"]
        page_name = instagram_page["name"]
        ig_account_id = instagram_page["instagram_business_account"]["id"]
        
        # Get Instagram account details
        ig_url = f"https://graph.facebook.com/v19.0/{ig_account_id}"
        ig_params = {
            "access_token": access_token,
            "fields": "id,username,name,profile_picture_url"
        }
        
        ig_response = requests.get(ig_url, params=ig_params, timeout=30)
        ig_data = ig_response.json()
        
        if ig_response.status_code != 200:
            error_msg = ig_data.get("error", {})
            if isinstance(error_msg, dict):
                error_message = error_msg.get("message", "Unknown error")
                raise Exception(f"Failed to fetch Instagram account details: {error_message}")
            else:
                raise Exception(f"Failed to fetch Instagram account details: {ig_data}")
        
        ig_username = ig_data.get("username")
        if not ig_username:
            raise Exception("Instagram username not found. Ensure your Instagram account is configured as Business account.")
        
        return ig_account_id, page_id, page_name, ig_username
        
    except Exception as e:
        raise Exception(f"Failed to get Instagram account: {str(e)}")