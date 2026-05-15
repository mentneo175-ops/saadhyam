# This is the new callback function - will be integrated into whatsapp_auth.py

@router.get("/callback")
async def whatsapp_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    request: Request = None,
    db: Session = Depends(get_sync_db)
):
    """
    Handle OAuth callback from Meta Embedded Signup
    
    NEW SAAS ARCHITECTURE:
    - Supports System User tokens (most common for Embedded Signup)
    - Does NOT require /me/businesses to succeed
    - Extracts WABA and phone number from embedded signup response
    - Saves credentials per user for multi-tenant support
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
        
        logger.info("=" * 80)
        logger.info("🚀 WHATSAPP EMBEDDED SIGNUP - OAUTH CALLBACK")
        logger.info("=" * 80)
        logger.info(f"📱 Exchanging authorization code for access token...")
        
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
        
        facebook_user_id = None
        token_type = "system_user"
        granted_scopes = []
        user_name = "Unknown User"
        
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
            
            if debug_data.get("data"):
                token_data_info = debug_data["data"]
                token_type = token_data_info.get('type', 'system_user')
                facebook_user_id = token_data_info.get('user_id')
                granted_scopes = token_data_info.get('scopes', [])
                
                logger.info(f"📊 Token Type: {token_type}")
                logger.info(f"📊 App ID: {token_data_info.get('app_id')}")
                logger.info(f"📊 User ID: {facebook_user_id}")
                logger.info(f"📊 Scopes: {granted_scopes}")
                logger.info(f"📊 Expires At: {token_data_info.get('expires_at')}")
                logger.info(f"📊 Is Valid: {token_data_info.get('is_valid')}")
                
                # Check for required scopes
                required_scopes = ['business_management', 'whatsapp_business_management', 'whatsapp_business_messaging']
                missing_scopes = [s for s in required_scopes if s not in granted_scopes]
                
                if missing_scopes:
                    logger.warning(f"⚠️  Missing required scopes: {missing_scopes}")
                else:
                    logger.info(f"✅ All required scopes granted!")
        except Exception as e:
            logger.error(f"❌ Error debugging token: {e}")
        
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
            user_name = me_data.get('name', 'Unknown User')
            logger.info(f"👤 User ID: {me_data.get('id')}")
            logger.info(f"👤 Name: {user_name}")
            logger.info(f"👤 Email: {me_data.get('email', 'N/A')}")
        except Exception as e:
            logger.error(f"❌ Error getting user info: {e}")
        
        # NEW SAAS ARCHITECTURE: Try to get WABAs directly
        logger.info("=" * 80)
        logger.info("🔍 FETCHING WHATSAPP BUSINESS ACCOUNTS (DIRECT METHOD)")
        logger.info("=" * 80)
        
        waba_id = None
        waba_name = None
        phone_number_id = None
        phone_number = None
        
        # Method 1: Try direct WABA access (works for System Users)
        try:
            direct_waba_url = f"https://graph.facebook.com/v21.0/me/owned_whatsapp_business_accounts"
            direct_waba_params = {"access_token": access_token}
            direct_waba_response = requests.get(direct_waba_url, params=direct_waba_params, timeout=30)
            direct_waba_response.raise_for_status()
            direct_waba_data = direct_waba_response.json()
            
            logger.info(f"📊 Direct WABA Response: {direct_waba_data}")
            
            if direct_waba_data.get("data") and len(direct_waba_data["data"]) > 0:
                waba = direct_waba_data["data"][0]
                waba_id = waba["id"]
                waba_name = waba.get("name", "WhatsApp Business")
                
                logger.info(f"✅ Found WABA via direct access!")
                logger.info(f"📱 WABA ID: {waba_id}")
                logger.info(f"📱 WABA Name: {waba_name}")
                
                # Get phone numbers for this WABA
                phone_numbers_url = f"https://graph.facebook.com/v21.0/{waba_id}/phone_numbers"
                phone_numbers_params = {"access_token": access_token}
                
                logger.info(f"🔍 Fetching phone numbers from: {phone_numbers_url}")
                phone_numbers_response = requests.get(phone_numbers_url, params=phone_numbers_params, timeout=30)
                phone_numbers_response.raise_for_status()
                phone_numbers_data = phone_numbers_response.json()
                
                logger.info(f"📊 Phone Numbers Response: {phone_numbers_data}")
                
                if phone_numbers_data.get("data") and len(phone_numbers_data["data"]) > 0:
                    phone_data = phone_numbers_data["data"][0]
                    phone_number_id = phone_data["id"]
                    phone_number = phone_data.get("display_phone_number", "")
                    
                    logger.info(f"✅ Found phone number!")
                    logger.info(f"📞 Phone Number ID: {phone_number_id}")
                    logger.info(f"📞 Phone Number: {phone_number}")
        except Exception as e:
            logger.warning(f"⚠️  Direct WABA access failed: {e}")
        
        # Method 2: If direct access failed, try via businesses (fallback for regular users)
        if not waba_id:
            logger.info("-" * 80)
            logger.info("🔄 Trying fallback: Fetching via /me/businesses")
            logger.info("-" * 80)
            try:
                businesses_url = f"https://graph.facebook.com/v21.0/me/businesses"
                businesses_params = {"access_token": access_token}
                businesses_response = requests.get(businesses_url, params=businesses_params, timeout=30)
                businesses_response.raise_for_status()
                businesses_data = businesses_response.json()
                
                logger.info(f"📊 Businesses Response: {businesses_data}")
                
                if businesses_data.get("data") and len(businesses_data["data"]) > 0:
                    business_id = businesses_data["data"][0]["id"]
                    business_name = businesses_data["data"][0].get("name", "Unknown Business")
                    
                    logger.info(f"🏢 Found business: {business_name} (ID: {business_id})")
                    
                    # Get WABAs for this business
                    waba_url = f"https://graph.facebook.com/v21.0/{business_id}/owned_whatsapp_business_accounts"
                    waba_params = {"access_token": access_token}
                    waba_response = requests.get(waba_url, params=waba_params, timeout=30)
                    waba_response.raise_for_status()
                    waba_data = waba_response.json()
                    
                    if waba_data.get("data") and len(waba_data["data"]) > 0:
                        waba = waba_data["data"][0]
                        waba_id = waba["id"]
                        waba_name = waba.get("name", business_name)
                        
                        # Get phone numbers
                        phone_numbers_url = f"https://graph.facebook.com/v21.0/{waba_id}/phone_numbers"
                        phone_numbers_params = {"access_token": access_token}
                        phone_numbers_response = requests.get(phone_numbers_url, params=phone_numbers_params, timeout=30)
                        phone_numbers_response.raise_for_status()
                        phone_numbers_data = phone_numbers_response.json()
                        
                        if phone_numbers_data.get("data") and len(phone_numbers_data["data"]) > 0:
                            phone_data = phone_numbers_data["data"][0]
                            phone_number_id = phone_data["id"]
                            phone_number = phone_data.get("display_phone_number", "")
            except Exception as e:
                logger.warning(f"⚠️  Business fallback also failed: {e}")
        
        # NEW SAAS VALIDATION: Check if we have the essential data
        logger.info("=" * 80)
        logger.info("✅ ONBOARDING VALIDATION")
        logger.info("=" * 80)
        
        onboarding_success = bool(waba_id and phone_number_id and access_token)
        
        logger.info(f"📊 WABA ID: {waba_id or 'NOT FOUND'}")
        logger.info(f"📊 Phone Number ID: {phone_number_id or 'NOT FOUND'}")
        logger.info(f"📊 Access Token: {'✅ Present' if access_token else '❌ Missing'}")
        logger.info(f"📊 Token Type: {token_type}")
        logger.info(f"📊 Facebook User ID: {facebook_user_id or 'N/A'}")
        logger.info(f"📊 Onboarding Success: {'✅ YES' if onboarding_success else '❌ NO'}")
        logger.info("=" * 80)
        
        if not onboarding_success:
            logger.error("❌ Onboarding failed: Missing required data (WABA ID or Phone Number ID)")
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
                                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                            }}
                            .container {{
                                background: white;
                                padding: 2rem;
                                border-radius: 1rem;
                                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                                max-width: 500px;
                            }}
                            .error-icon {{
                                width: 64px;
                                height: 64px;
                                background: #ef4444;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin: 0 auto 1rem;
                            }}
                            h2 {{ color: #1f2937; text-align: center; }}
                            p {{ color: #6b7280; text-align: center; }}
                            .steps {{
                                background: #fef3c7;
                                border-left: 4px solid #f59e0b;
                                padding: 1rem;
                                border-radius: 0.5rem;
                                margin: 1rem 0;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="error-icon">
                                <span style="color: white; font-size: 32px;">!</span>
                            </div>
                            <h2>WhatsApp Setup Incomplete</h2>
                            <p>Could not find WhatsApp Business Account or phone number.</p>
                            <div class="steps">
                                <h3>Please ensure:</h3>
                                <ol>
                                    <li>You have a WhatsApp Business Account</li>
                                    <li>A phone number is registered</li>
                                    <li>The account is properly configured</li>
                                </ol>
                            </div>
                        </div>
                        <script>
                            window.opener.postMessage({{
                                type: 'WHATSAPP_OAUTH_ERROR',
                                error: 'WhatsApp Business Account or phone number not found'
                            }}, '*');
                            setTimeout(() => window.close(), 5000);
                        </script>
                    </body>
                </html>
                """,
                status_code=400
            )
        
        # SUCCESS: Return account details to frontend
        logger.info("✅ WhatsApp Embedded Signup completed successfully!")
        logger.info(f"📋 Summary:")
        logger.info(f"   - WABA ID: {waba_id}")
        logger.info(f"   - Phone Number ID: {phone_number_id}")
        logger.info(f"   - Phone Number: {phone_number}")
        logger.info(f"   - Business Name: {waba_name}")
        logger.info(f"   - Token Type: {token_type}")
        logger.info(f"   - Facebook User ID: {facebook_user_id}")
        
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
                        h2 {{ color: #1f2937; margin: 0 0 0.5rem; }}
                        p {{ color: #6b7280; margin: 0 0 1rem; }}
                        .details {{
                            background: #f3f4f6;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            font-size: 0.875rem;
                            color: #4b5563;
                            text-align: left;
                            margin: 1rem 0;
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
                            <span style="color: white; font-size: 32px;">✓</span>
                        </div>
                        <h2>WhatsApp Connected!</h2>
                        <span class="badge">{token_type.replace('_', ' ').title()}</span>
                        <p>Your WhatsApp Business account has been connected successfully.</p>
                        <div class="details">
                            <strong>Business:</strong> {waba_name or 'WhatsApp Business'}<br>
                            <strong>Phone:</strong> {phone_number or 'Configured'}<br>
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
                                phone_number: '{phone_number or ''}',
                                business_name: '{waba_name or 'WhatsApp Business'}',
                                access_token: '{access_token}',
                                facebook_user_id: '{facebook_user_id or ''}',
                                token_type: '{token_type}'
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
