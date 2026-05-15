"""
Meta OAuth Routes
Handles Meta (Facebook/Instagram) OAuth connection flow
"""

import logging
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config.database import get_db
from models.user import User
from models.meta_ads import MetaAccount
from services.meta_oauth_service import meta_oauth_service
from utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/meta", tags=["Meta OAuth"])


@router.get("/connect")
async def connect_meta(
    token: str = Query(..., description="User auth token"),
    db: Session = Depends(get_db),
):
    """
    Initiate Meta OAuth flow
    
    Opens Meta OAuth dialog for user to authorize app
    """
    try:
        # Verify token and get user
        from utils.security import decode_token
        
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
            user = db.query(User).filter(User.id == user_id).first()
        except:
            user = None
        
        if not user:
            return HTMLResponse(
                content="""
                <html>
                    <body>
                        <h2>Authentication Error</h2>
                        <p>Invalid or expired token. Please try again.</p>
                        <script>
                            setTimeout(() => window.close(), 3000);
                        </script>
                    </body>
                </html>
                """,
                status_code=401,
            )
        
        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state in session (you might want to use Redis for production)
        # For now, we'll include user_id in state
        state_with_user = f"{user.id}:{state}"
        
        # Get authorization URL
        auth_url = meta_oauth_service.get_authorization_url(state_with_user)
        
        logger.info(f"Redirecting user {user.id} to Meta OAuth")
        
        return RedirectResponse(url=auth_url)
        
    except Exception as e:
        logger.error(f"Failed to initiate Meta OAuth: {e}")
        return HTMLResponse(
            content=f"""
            <html>
                <body>
                    <h2>Connection Error</h2>
                    <p>Failed to connect to Meta: {str(e)}</p>
                    <script>
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """,
            status_code=500,
        )


@router.get("/callback")
async def meta_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Meta OAuth callback
    
    Handles the redirect from Meta after user authorization
    """
    try:
        # Check for errors
        if error:
            logger.error(f"Meta OAuth error: {error} - {error_description}")
            return HTMLResponse(
                content=f"""
                <html>
                    <head>
                        <style>
                            body {{
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
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
                                max-width: 400px;
                            }}
                            h2 {{ color: #e53e3e; margin-bottom: 1rem; }}
                            p {{ color: #4a5568; margin-bottom: 1.5rem; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>❌ Connection Failed</h2>
                            <p>{error_description or 'Failed to connect Meta account'}</p>
                            <p style="font-size: 0.875rem; color: #718096;">This window will close automatically...</p>
                        </div>
                        <script>
                            setTimeout(() => window.close(), 3000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400,
            )
        
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state parameter")
        
        # Extract user_id from state
        try:
            user_id_str, _ = state.split(":", 1)
            user_id = int(user_id_str)
        except:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Exchange code for token
        logger.info(f"Exchanging code for token for user {user.id}")
        token_data = await meta_oauth_service.exchange_code_for_token(code)
        
        access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 5184000)  # 60 days default
        
        # Get user's Facebook Pages
        logger.info("Fetching user's Facebook Pages")
        pages = await meta_oauth_service.get_user_pages(access_token)
        
        if not pages:
            return HTMLResponse(
                content="""
                <html>
                    <head>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            }
                            .container {
                                background: white;
                                padding: 2rem;
                                border-radius: 1rem;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                text-align: center;
                                max-width: 400px;
                            }
                            h2 { color: #e53e3e; margin-bottom: 1rem; }
                            p { color: #4a5568; margin-bottom: 1.5rem; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>⚠️ No Facebook Page Found</h2>
                            <p>You need a Facebook Page connected to an Instagram Business account to use Meta Ads.</p>
                            <p style="font-size: 0.875rem; color: #718096;">Please create a Facebook Page and connect your Instagram Business account, then try again.</p>
                        </div>
                        <script>
                            setTimeout(() => window.close(), 5000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400,
            )
        
        # Use first page (or let user select in future)
        page = pages[0]
        page_id = page["id"]
        page_name = page["name"]
        page_access_token = page["access_token"]
        
        # Get Instagram Business Account
        logger.info("Fetching Instagram Business Account")
        instagram_account = await meta_oauth_service.get_instagram_business_account(
            page_id=page_id,
            page_access_token=page_access_token,
        )
        
        instagram_business_id = None
        instagram_username = None
        
        if instagram_account:
            instagram_business_id = instagram_account["id"]
            instagram_username = instagram_account.get("username")
        
        # Get Ad Accounts
        logger.info("Fetching Ad Accounts")
        ad_accounts = await meta_oauth_service.get_ad_accounts(access_token)
        
        if not ad_accounts:
            return HTMLResponse(
                content="""
                <html>
                    <head>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            }
                            .container {
                                background: white;
                                padding: 2rem;
                                border-radius: 1rem;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                text-align: center;
                                max-width: 400px;
                            }
                            h2 { color: #e53e3e; margin-bottom: 1rem; }
                            p { color: #4a5568; margin-bottom: 1.5rem; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>⚠️ No Ad Account Found</h2>
                            <p>You need a Meta Ad Account to run ads.</p>
                            <p style="font-size: 0.875rem; color: #718096;">Please create an Ad Account in Meta Business Suite, then try again.</p>
                        </div>
                        <script>
                            setTimeout(() => window.close(), 5000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400,
            )
        
        # Use first ad account
        ad_account = ad_accounts[0]
        ad_account_id = ad_account["id"]
        ad_account_name = ad_account.get("name")
        
        # Get business info if available
        business_id = ad_account.get("business", {}).get("id") if isinstance(ad_account.get("business"), dict) else None
        business_name = None
        
        if business_id:
            business_info = await meta_oauth_service.get_business_info(business_id, access_token)
            if business_info:
                business_name = business_info.get("name")
        
        # Encrypt tokens
        encrypted_access_token = meta_oauth_service.encrypt_token(access_token)
        encrypted_page_token = meta_oauth_service.encrypt_token(page_access_token)
        
        # Check if account already exists
        existing_account = db.query(MetaAccount).filter(
            MetaAccount.user_id == user.id,
            MetaAccount.ad_account_id == ad_account_id,
        ).first()
        
        if existing_account:
            # Update existing account
            existing_account.ad_account_name = ad_account_name
            existing_account.page_id = page_id
            existing_account.page_name = page_name
            existing_account.page_access_token = encrypted_page_token
            existing_account.instagram_business_id = instagram_business_id
            existing_account.instagram_username = instagram_username
            existing_account.access_token = encrypted_access_token
            existing_account.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            existing_account.business_id = business_id
            existing_account.business_name = business_name
            existing_account.is_active = True
            existing_account.connection_error = None
            existing_account.last_synced_at = datetime.utcnow()
            
            meta_account = existing_account
        else:
            # Create new account
            meta_account = MetaAccount(
                user_id=user.id,
                ad_account_id=ad_account_id,
                ad_account_name=ad_account_name,
                page_id=page_id,
                page_name=page_name,
                page_access_token=encrypted_page_token,
                instagram_business_id=instagram_business_id,
                instagram_username=instagram_username,
                access_token=encrypted_access_token,
                token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
                business_id=business_id,
                business_name=business_name,
                is_active=True,
                last_synced_at=datetime.utcnow(),
            )
            db.add(meta_account)
        
        db.commit()
        
        logger.info(f"✅ Meta account connected successfully for user {user.id}")
        
        # Return success page
        return HTMLResponse(
            content=f"""
            <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
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
                            max-width: 400px;
                        }}
                        h2 {{ color: #48bb78; margin-bottom: 1rem; }}
                        .info {{ background: #f7fafc; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }}
                        .info-item {{ margin: 0.5rem 0; color: #4a5568; }}
                        .label {{ font-weight: 600; color: #2d3748; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>✅ Meta Ads Connected!</h2>
                        <div class="info">
                            <div class="info-item">
                                <span class="label">Ad Account:</span> {ad_account_name or ad_account_id}
                            </div>
                            <div class="info-item">
                                <span class="label">Facebook Page:</span> {page_name}
                            </div>
                            {f'<div class="info-item"><span class="label">Instagram:</span> @{instagram_username}</div>' if instagram_username else ''}
                        </div>
                        <p style="color: #718096; font-size: 0.875rem;">You can now create and manage Meta Ads!</p>
                        <p style="color: #718096; font-size: 0.875rem;">This window will close automatically...</p>
                    </div>
                    <script>
                        // Notify parent window
                        if (window.opener) {{
                            window.opener.postMessage({{
                                type: 'meta-auth-success',
                                data: {{
                                    ad_account_name: '{ad_account_name or ad_account_id}',
                                    page_name: '{page_name}',
                                    instagram_username: '{instagram_username or ''}'
                                }}
                            }}, '*');
                        }}
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """,
        )
        
    except Exception as e:
        logger.error(f"Meta OAuth callback error: {e}")
        return HTMLResponse(
            content=f"""
            <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
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
                            max-width: 400px;
                        }}
                        h2 {{ color: #e53e3e; margin-bottom: 1rem; }}
                        p {{ color: #4a5568; margin-bottom: 1.5rem; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>❌ Connection Failed</h2>
                        <p>Failed to connect Meta account: {str(e)}</p>
                        <p style="font-size: 0.875rem; color: #718096;">This window will close automatically...</p>
                    </div>
                    <script>
                        if (window.opener) {{
                            window.opener.postMessage({{
                                type: 'meta-auth-error',
                                message: '{str(e)}'
                            }}, '*');
                        }}
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
            """,
            status_code=500,
        )


@router.get("/status")
async def get_meta_connection_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get Meta connection status for current user"""
    try:
        meta_account = db.query(MetaAccount).filter(
            MetaAccount.user_id == current_user.id,
            MetaAccount.is_active == True,
        ).first()
        
        if not meta_account:
            return {
                "is_connected": False,
            }
        
        return {
            "is_connected": True,
            "ad_account_id": meta_account.ad_account_id,
            "ad_account_name": meta_account.ad_account_name,
            "page_name": meta_account.page_name,
            "instagram_username": meta_account.instagram_username,
            "business_name": meta_account.business_name,
            "last_synced_at": meta_account.last_synced_at.isoformat() if meta_account.last_synced_at else None,
        }
        
    except Exception as e:
        logger.error(f"Failed to get Meta connection status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect")
async def disconnect_meta(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnect Meta account"""
    try:
        meta_account = db.query(MetaAccount).filter(
            MetaAccount.user_id == current_user.id,
            MetaAccount.is_active == True,
        ).first()
        
        if not meta_account:
            raise HTTPException(status_code=404, detail="No Meta account connected")
        
        # Revoke token
        access_token = meta_oauth_service.decrypt_token(meta_account.access_token)
        await meta_oauth_service.revoke_token(access_token)
        
        # Deactivate account
        meta_account.is_active = False
        db.commit()
        
        logger.info(f"✅ Meta account disconnected for user {current_user.id}")
        
        return {
            "success": True,
            "message": "Meta account disconnected successfully",
        }
        
    except Exception as e:
        logger.error(f"Failed to disconnect Meta account: {e}")
        raise HTTPException(status_code=500, detail=str(e))
