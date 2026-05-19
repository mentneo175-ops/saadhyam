from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from config.database import get_db_sync
from services.instagram_crud import InstagramCRUD
from services.instagram_service import InstagramGraphAPIService
from utils.dependencies import get_current_user
from models.user import User
import logging
import os
import requests
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/instagram", tags=["instagram-oauth"])

# Instagram Graph API Service
instagram_service = InstagramGraphAPIService()

def read_template(filename: str) -> str:
    """Read HTML template file."""
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


@router.get(
    "/debug",
    summary="Debug Instagram Graph API Configuration",
    responses={
        200: {"description": "OAuth configuration details"},
    },
)
async def debug_oauth_config():
    """
    Debug endpoint to check Instagram Graph API configuration.
    Shows the Facebook OAuth URL and configuration details.
    """
    try:
        # Generate Facebook OAuth URL for debugging
        debug_state = "debug_token_123"
        oauth_url = instagram_service.get_facebook_oauth_url(state=debug_state)
        
        return {
            "status": "✅ Configuration Valid",
            "instagram_app_id": settings.INSTAGRAM_APP_ID,
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "api_version": instagram_service.api_version,
            "oauth_url": oauth_url,
            "oauth_flow": "Facebook Graph API + Instagram Graph API (CORRECT)",
            "oauth_url_breakdown": {
                "base_url": f"https://www.facebook.com/{instagram_service.api_version}/dialog/oauth",
                "client_id": settings.INSTAGRAM_APP_ID,
                "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
                "scope": "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
                "response_type": "code",
                "state": debug_state
            },
            "facebook_app_requirements": {
                "app_exists": f"Verify app {settings.INSTAGRAM_APP_ID} exists in Facebook Developer Console",
                "facebook_login_product": "✅ Must be added to your Facebook app",
                "instagram_basic_display": "✅ Must be added to your Facebook app", 
                "redirect_uri_exact_match": f"Must be exactly: {settings.INSTAGRAM_REDIRECT_URI}",
                "app_mode": "Development mode: Add yourself as test user | Live mode: Submit for review"
            },
            "instagram_requirements": {
                "account_type": "✅ Must be Instagram Business Account (not Personal)",
                "facebook_page_link": "✅ Instagram Business Account must be linked to Facebook Page",
                "page_admin_access": "✅ You must be admin of the Facebook Page",
                "business_verification": "For production: Business verification may be required"
            },
            "troubleshooting_steps": {
                "step_1": f"Go to https://developers.facebook.com/apps/{settings.INSTAGRAM_APP_ID}",
                "step_2": "Check if app exists and you have access",
                "step_3": "Verify Products: Facebook Login + Instagram Basic Display are added",
                "step_4": f"Check redirect URI exactly matches: {settings.INSTAGRAM_REDIRECT_URI}",
                "step_5": "If development mode: Add your Facebook account as test user",
                "step_6": "Ensure Instagram account is Business type and linked to Facebook Page"
            },
            "test_oauth_url": f"Test this URL in browser: {oauth_url}",
            "removed_deprecated": {
                "instagram_basic_display_oauth": "❌ REMOVED (deprecated)",
                "instagram_oauth_authorize": "❌ REMOVED (causes 'Invalid platform app')",
                "direct_instagram_oauth": "❌ REMOVED (not supported)"
            }
        }
        
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        return {
            "status": "❌ Configuration Error",
            "error": str(e),
            "instagram_app_id": settings.INSTAGRAM_APP_ID,
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "suggestion": "Check .env file and ensure all Instagram credentials are set correctly"
        }


@router.get(
    "/connect",
    summary="Connect Instagram via Facebook Graph API OAuth",
    responses={
        302: {"description": "Redirect to Facebook OAuth"},
        400: {"description": "Invalid configuration"},
        500: {"description": "Internal server error"},
    },
)
async def connect_instagram(
    token: str = Query(..., description="User JWT token for state parameter"),
):
    """
    Connect Instagram account via Facebook Graph API OAuth flow.
    
    This is the CORRECT method for Instagram integration.
    Uses Facebook OAuth → Instagram Graph API (NOT Instagram Basic Display).
    """
    try:
        # Validate configuration
        if not settings.INSTAGRAM_APP_ID or settings.INSTAGRAM_APP_ID == "your_instagram_app_id":
            logger.error("Instagram App ID not configured")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instagram OAuth not configured. Please check INSTAGRAM_APP_ID in environment variables."
            )
        
        # Generate Facebook OAuth URL using Instagram Graph API service
        oauth_url = instagram_service.get_facebook_oauth_url(state=token)
        
        logger.info(f"Generated Facebook OAuth URL: {oauth_url}")
        logger.info(f"App ID: {settings.INSTAGRAM_APP_ID}")
        logger.info(f"Redirect URI: {settings.INSTAGRAM_REDIRECT_URI}")
        logger.info(f"Using Facebook Graph API OAuth → Instagram Graph API (CORRECT METHOD)")
        
        # Redirect to Facebook OAuth (NOT Instagram OAuth)
        return RedirectResponse(url=oauth_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Instagram connect error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Instagram connection: {str(e)}"
        )


@router.get(
    "/callback",
    summary="Facebook OAuth Callback for Instagram Graph API",
    responses={
        200: {"description": "HTML response with success or error"},
        400: {"description": "OAuth error or invalid state"},
        500: {"description": "Internal server error"},
    },
)
async def instagram_callback(
    request: Request,
    db: Session = Depends(get_db_sync),
):
    """
    Handle Facebook OAuth callback for Instagram Graph API connection.
    
    Complete flow:
    1. Receive Facebook OAuth code
    2. Exchange for Facebook access token
    3. Get user's Facebook pages
    4. Find Instagram Business account
    5. Store in database
    6. Return success/error HTML page
    """
    try:
        # Get parameters from callback
        code = request.query_params.get("code")
        state = request.query_params.get("state")  # User's JWT token
        error = request.query_params.get("error")
        error_description = request.query_params.get("error_description", "")
        
        logger.info(f"Instagram OAuth callback received - Code: {'✓' if code else '✗'}, State: {'✓' if state else '✗'}, Error: {error}")
        
        # Handle OAuth errors from Facebook
        if error:
            error_msg = f"Facebook OAuth Error: {error}"
            if error_description:
                error_msg += f" - {error_description}"
            logger.error(error_msg)
            
            # Return error HTML with specific message
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                f"OAuth Error: {error}"
            ).replace(
                "Please try again.", 
                f"Error: {error_description or 'Please check your Facebook app configuration.'}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Validate required parameters
        if not code:
            logger.error("No authorization code received from Facebook")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                "No Authorization Code"
            ).replace(
                "Please try again.", 
                "Facebook did not provide an authorization code. Please try connecting again."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        if not state:
            logger.error("No state parameter received")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                "Invalid Request"
            ).replace(
                "Please try again.", 
                "Missing state parameter. Please try connecting again from the settings page."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Validate state (should be user's JWT token)
        user_id = None
        try:
            from utils.security import decode_token
            payload = decode_token(state)
            user_id = payload.get("user_id")  # Use user_id instead of sub
            if not user_id:
                user_id = payload.get("sub")  # Fallback to sub for compatibility
        except Exception as e:
            logger.error(f"Invalid state parameter (JWT token): {e}")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                "Invalid Session"
            ).replace(
                "Please try again.", 
                "Your session token is invalid. Please login again and try connecting Instagram."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        if not user_id:
            logger.error("Could not extract user ID from state token")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                "Session Error"
            ).replace(
                "Please try again.", 
                "Could not identify your user account. Please login again and try connecting Instagram."
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        logger.info(f"Processing Instagram OAuth for user ID: {user_id}")
        
        # Step 1: Exchange code for Facebook access token
        logger.info("Step 1: Exchanging authorization code for access token...")
        try:
            access_token = await exchange_code_for_token(code)
            logger.info("✅ Successfully obtained Facebook access token")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Token exchange failed: {error_msg}")
            
            # Provide specific guidance based on error type
            if "Invalid verification code format" in error_msg:
                error_html = read_template("oauth_error.html").replace(
                    "Connection Failed", 
                    "Authorization Code Expired"
                ).replace(
                    "Please try again.", 
                    "The authorization code has expired (codes expire in ~10 minutes). Please close this window and try connecting Instagram again from your settings page."
                )
            elif "Invalid client_id" in error_msg:
                error_html = read_template("oauth_error.html").replace(
                    "Connection Failed", 
                    "Invalid App Configuration"
                ).replace(
                    "Please try again.", 
                    f"Your Facebook app (ID: {settings.INSTAGRAM_APP_ID}) configuration is invalid. Please check your Facebook Developer Console settings."
                )
            elif "redirect_uri" in error_msg.lower():
                error_html = read_template("oauth_error.html").replace(
                    "Connection Failed", 
                    "Redirect URI Mismatch"
                ).replace(
                    "Please try again.", 
                    f"The redirect URI in your Facebook app must exactly match: {settings.INSTAGRAM_REDIRECT_URI}"
                )
            else:
                error_html = read_template("oauth_error.html").replace(
                    "Connection Failed", 
                    "Token Exchange Failed"
                ).replace(
                    "Please try again.", 
                    f"Facebook API Error: {error_msg}"
                )
            
            return HTMLResponse(content=error_html, status_code=200)
        
        # Step 2: Get Instagram Business account
        logger.info("Step 2: Fetching Instagram Business account...")
        try:
            ig_user_id, page_id, page_name, ig_username = await get_instagram_account(access_token)
            logger.info(f"✅ Found Instagram Business account: @{ig_username} (Page: {page_name})")
        except Exception as e:
            logger.error(f"❌ Instagram account fetch failed: {str(e)}")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                "Instagram Account Not Found"
            ).replace(
                "Please try again.", 
                f"Error: {str(e)}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Step 3: Save to database
        logger.info("Step 3: Saving Instagram account to database...")
        try:
            instagram_crud = InstagramCRUD()
            
            # Create or update social account
            social_account = instagram_crud.create_social_account(
                db=db,
                user_id=int(user_id),
                platform="instagram",
                access_token=access_token,
                ig_user_id=ig_user_id,
                ig_username=ig_username,
                page_id=page_id,
                page_name=page_name,
                access_token_expires_at=None,  # Facebook tokens don't expire by default
            )
            
            logger.info(f"✅ Successfully saved Instagram account to database (ID: {social_account.id})")
            
        except Exception as e:
            logger.error(f"❌ Database save failed: {str(e)}")
            error_html = read_template("oauth_error.html").replace(
                "Connection Failed", 
                "Database Error"
            ).replace(
                "Please try again.", 
                f"Failed to save Instagram account: {str(e)}"
            )
            return HTMLResponse(content=error_html, status_code=200)
        
        # Success! Return success HTML page
        logger.info(f"🎉 User {user_id} successfully connected Instagram Business account: @{ig_username}")
        
        success_html = read_template("oauth_success.html").replace(
            "Instagram Connected Successfully!", 
            f"Instagram Connected Successfully!"
        ).replace(
            "You can close this window.", 
            f"Account: @{ig_username}<br>Page: {page_name}<br><br>You can close this window."
        )
        return HTMLResponse(content=success_html, status_code=200)
    
    except Exception as e:
        logger.error(f"❌ Unexpected error in Instagram OAuth callback: {str(e)}")
        error_html = read_template("oauth_error.html").replace(
            "Connection Failed", 
            "Unexpected Error"
        ).replace(
            "Please try again.", 
            f"An unexpected error occurred: {str(e)}"
        )
        return HTMLResponse(content=error_html, status_code=200)


async def exchange_code_for_token(code: str) -> str:
    """
    Exchange Facebook OAuth code for access token with proper error handling.
    
    Args:
        code: Authorization code from Facebook OAuth
        
    Returns:
        Facebook access token
        
    Raises:
        Exception: If token exchange fails
    """
    try:
        # Clean and validate the authorization code
        code = code.strip()
        if not code:
            raise Exception("Empty authorization code received")
        
        url = f"https://graph.facebook.com/{settings.INSTAGRAM_GRAPH_API_VERSION}/oauth/access_token"
        
        params = {
            "client_id": settings.INSTAGRAM_APP_ID,
            "client_secret": settings.INSTAGRAM_APP_SECRET,
            "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
            "code": code
        }
        
        logger.info(f"Requesting access token from: {url}")
        logger.info(f"Parameters: client_id={settings.INSTAGRAM_APP_ID}, redirect_uri={settings.INSTAGRAM_REDIRECT_URI}")
        logger.info(f"Code length: {len(code)} characters")
        
        response = requests.get(url, params=params, timeout=30)
        data = response.json()
        
        logger.info(f"Facebook token response status: {response.status_code}")
        
        if response.status_code != 200:
            error_msg = data.get("error", {})
            if isinstance(error_msg, dict):
                error_type = error_msg.get("type", "unknown_error")
                error_message = error_msg.get("message", "Unknown error occurred")
                error_code = error_msg.get("code", "")
                
                # Provide specific guidance for common errors
                if error_code == 100 and "verification code" in error_message.lower():
                    raise Exception(f"Invalid verification code format. The authorization code has expired or was already used. Please try connecting again.")
                elif "client_id" in error_message.lower():
                    raise Exception(f"Invalid client_id. Check your Facebook app ID ({settings.INSTAGRAM_APP_ID}) in Developer Console.")
                elif "redirect_uri" in error_message.lower():
                    raise Exception(f"Redirect URI mismatch. Ensure {settings.INSTAGRAM_REDIRECT_URI} is configured in your Facebook app.")
                else:
                    raise Exception(f"Facebook API Error ({error_type}): {error_message}")
            else:
                raise Exception(f"HTTP {response.status_code}: {data}")
        
        if "error" in data:
            error_info = data["error"]
            if isinstance(error_info, dict):
                error_type = error_info.get("type", "unknown_error")
                error_message = error_info.get("message", "Unknown error occurred")
                raise Exception(f"Facebook OAuth Error ({error_type}): {error_message}")
            else:
                raise Exception(f"Facebook OAuth Error: {error_info}")
        
        if "access_token" not in data:
            raise Exception("No access token received from Facebook")
        
        short_lived_token = data["access_token"]
        logger.info("✅ Received short-lived token, exchanging for long-lived token...")
        
        # Exchange for long-lived token (60 days)
        long_lived_token = await exchange_for_long_lived_token(short_lived_token)
        
        return long_lived_token
        
    except requests.exceptions.Timeout:
        raise Exception("Request to Facebook timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error connecting to Facebook: {str(e)}")
    except Exception as e:
        if "Facebook" in str(e) or "verification code" in str(e) or "client_id" in str(e):
            raise  # Re-raise Facebook-specific errors
        else:
            raise Exception(f"Token exchange failed: {str(e)}")


async def exchange_for_long_lived_token(short_lived_token: str) -> str:
    """
    Exchange short-lived token (1 hour) for long-lived token (60 days).
    
    Args:
        short_lived_token: Short-lived access token from OAuth
        
    Returns:
        Long-lived access token (valid for 60 days)
        
    Raises:
        Exception: If exchange fails
    """
    try:
        url = f"https://graph.facebook.com/{settings.INSTAGRAM_GRAPH_API_VERSION}/oauth/access_token"
        
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": settings.INSTAGRAM_APP_ID,
            "client_secret": settings.INSTAGRAM_APP_SECRET,
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



async def get_instagram_account(access_token: str) -> tuple[str, str, str, str]:
    """
    Get Instagram Business account from Facebook pages with proper error handling.
    
    Args:
        access_token: Facebook access token
        
    Returns:
        Tuple of (ig_user_id, page_id, page_name, ig_username)
        
    Raises:
        Exception: If Instagram account not found or not properly configured
    """
    try:
        # Step 1: Get user's Facebook pages
        pages_url = f"https://graph.facebook.com/{settings.INSTAGRAM_GRAPH_API_VERSION}/me/accounts"
        pages_params = {
            "access_token": access_token,
            "fields": "id,name,instagram_business_account"
        }
        
        logger.info("Fetching Facebook pages...")
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
            raise Exception("No Facebook Pages found. You need to create a Facebook Page and link your Instagram Business account to it.")
        
        pages = pages_data["data"]
        logger.info(f"Found {len(pages)} Facebook page(s)")
        
        # Step 2: Find page with Instagram Business account
        instagram_page = None
        for page in pages:
            if page.get("instagram_business_account"):
                instagram_page = page
                break
        
        if not instagram_page:
            page_names = [page.get("name", "Unnamed") for page in pages]
            raise Exception(f"No Instagram Business account found linked to your Facebook pages: {', '.join(page_names)}. Please link your Instagram Business account to a Facebook Page.")
        
        page_id = instagram_page["id"]
        page_name = instagram_page["name"]
        ig_account_id = instagram_page["instagram_business_account"]["id"]
        
        logger.info(f"Found Instagram Business account linked to page: {page_name}")
        
        # Step 3: Get Instagram account details
        ig_url = f"https://graph.facebook.com/{settings.INSTAGRAM_GRAPH_API_VERSION}/{ig_account_id}"
        ig_params = {
            "access_token": access_token,
            "fields": "id,username,name,profile_picture_url"
        }
        
        logger.info("Fetching Instagram account details...")
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
            raise Exception("Instagram account username not found. Make sure your Instagram account is properly configured as a Business account.")
        
        logger.info(f"Instagram account details: @{ig_username} (ID: {ig_account_id})")
        
        return ig_account_id, page_id, page_name, ig_username
        
    except requests.exceptions.Timeout:
        raise Exception("Request to Facebook timed out while fetching Instagram account. Please try again.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error while fetching Instagram account: {str(e)}")
    except Exception as e:
        if "Instagram" in str(e) or "Facebook" in str(e):
            raise  # Re-raise specific errors
        else:
            raise Exception(f"Failed to get Instagram account: {str(e)}")


@router.get(
    "/test-callback",
    summary="Test Instagram OAuth Callback (Development Only)",
    responses={
        200: {"description": "Test callback response"},
    },
)
async def test_callback(
    code: str = Query(None, description="Test authorization code"),
    state: str = Query(None, description="Test state parameter"),
    error: str = Query(None, description="Test error parameter"),
):
    """
    Test endpoint to simulate Instagram OAuth callback for debugging.
    Only use this in development to test the callback flow.
    """
    try:
        if not settings.DEBUG:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test endpoint only available in debug mode"
            )
        
        return {
            "message": "Test callback endpoint",
            "received_parameters": {
                "code": code,
                "state": state,
                "error": error
            },
            "next_steps": {
                "with_code": "If you have a real code, use the /callback endpoint",
                "with_error": "Check Facebook app configuration if you see errors",
                "debug_config": "Use /debug endpoint to check OAuth URL configuration"
            },
            "facebook_requirements": {
                "app_products": ["Facebook Login", "Instagram Basic Display"],
                "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
                "account_type": "Instagram Business Account linked to Facebook Page",
                "permissions": "instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement"
            }
        }
        
    except Exception as e:
        return {"error": str(e)}


@router.post(
    "/disconnect",
    summary="Disconnect Instagram Account",
    responses={
        200: {"description": "Instagram account disconnected"},
        400: {"description": "No Instagram account connected"},
        500: {"description": "Internal server error"},
    },
)
async def disconnect_instagram(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_sync),
):
    """
    Disconnect the user's Instagram account.
    """
    try:
        instagram_crud = InstagramCRUD()
        
        # Get user's Instagram accounts
        accounts = instagram_crud.get_user_social_accounts(db, current_user.id)
        instagram_accounts = [acc for acc in accounts if acc.platform == "instagram"]
        
        if not instagram_accounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Instagram account connected"
            )
        
        # Disconnect all Instagram accounts
        for account in instagram_accounts:
            instagram_crud.disconnect_account(db, account.id)
        
        logger.info(f"User {current_user.id} disconnected Instagram")
        
        return {
            "success": True,
            "message": "Instagram account disconnected successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Instagram disconnect error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect Instagram account"
        )

