"""
Firebase Authentication Service - PRODUCTION READY
Handles ONLY real Firebase token verification and user management
NO MOCK/DEMO MODE - REAL FIREBASE ONLY
FAILS PROPERLY IF NOT CONFIGURED
"""

import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class FirebaseService:
    """Production Firebase authentication service for real token verification ONLY"""
    
    _instance = None
    _initialized = False
    _firebase_available = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._initialize_firebase()
            self._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK - PRODUCTION ONLY - FAIL FAST"""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                logger.info("✅ Firebase Admin SDK already initialized")
                self._firebase_available = True
                return
            
            # Get credentials from environment - support JSON in env or file path
            # Priority: FIREBASE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT_JSON (JSON string) ->
            # GOOGLE_APPLICATION_CREDENTIALS (file path)
            sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT") or os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            project_id = os.getenv("FIREBASE_PROJECT_ID")

            if not sa_json and not credentials_path:
                error_msg = "❌ CRITICAL: Firebase credentials not provided. Set FIREBASE_SERVICE_ACCOUNT (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (file path)"
                logger.error(error_msg)
                logger.error("❌ Recommended: set FIREBASE_SERVICE_ACCOUNT with the service account JSON as an environment variable in production")
                raise ValueError(error_msg)

            if not project_id:
                error_msg = "❌ CRITICAL: FIREBASE_PROJECT_ID environment variable is REQUIRED"
                logger.error(error_msg)
                logger.error("❌ Set FIREBASE_PROJECT_ID=your-project-id in your environment")
                raise ValueError(error_msg)

            cred = None
            # If JSON is provided directly in environment, parse and use it
            if sa_json:
                try:
                    import json
                    cred_data = json.loads(sa_json)
                    # Basic validation of service account fields
                    if not cred_data.get("private_key") or not cred_data.get("client_email"):
                        raise ValueError("Missing private_key or client_email in provided service account JSON")
                    logger.info("🔍 Initializing Firebase with service account provided via environment variable")
                    cred = credentials.Certificate(cred_data)
                except Exception as e:
                    error_msg = f"❌ CRITICAL: Invalid JSON in FIREBASE_SERVICE_ACCOUNT: {e}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
            else:
                # Use file path
                credentials_path = Path(credentials_path)
                if not credentials_path.is_absolute():
                    credentials_path = (Path(__file__).resolve().parents[1] / credentials_path).resolve()
                credentials_path = str(credentials_path)

                # Check if credentials file exists
                if not os.path.exists(credentials_path):
                    error_msg = f"❌ CRITICAL: Firebase credentials file not found: {credentials_path}"
                    logger.error(error_msg)
                    logger.error("❌ Please download your Firebase service account key and place it at the specified path")
                    raise FileNotFoundError(error_msg)

                # Validate credentials file is not placeholder
                try:
                    import json
                    with open(credentials_path, 'r') as f:
                        cred_data = json.load(f)
                        if (cred_data.get('private_key', '').startswith('PLACEHOLDER') or 
                            cred_data.get('private_key_id', '').startswith('PLACEHOLDER') or
                            cred_data.get('client_id', '').startswith('PLACEHOLDER')):
                            error_msg = f"❌ CRITICAL: Firebase credentials file contains placeholder values: {credentials_path}"
                            logger.error(error_msg)
                            logger.error("❌ Please download the REAL Firebase service account key from Firebase Console")
                            logger.error("❌ Go to: Firebase Console > Project Settings > Service Accounts > Generate New Private Key")
                            raise ValueError(error_msg)
                except json.JSONDecodeError as e:
                    error_msg = f"❌ CRITICAL: Invalid JSON in Firebase credentials file: {e}"
                    logger.error(error_msg)
                    raise ValueError(error_msg)

                logger.info(f"🔍 Initializing Firebase with credentials file: {credentials_path}")
                logger.info(f"🔍 Project ID: {project_id}")
                cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
            })
            
            # Test Firebase connection
            try:
                # Try to get a non-existent user to test connection
                auth.get_user('test-connection-uid-that-does-not-exist')
            except auth.UserNotFoundError:
                # This is expected - means Firebase is working
                pass
            except Exception as e:
                error_msg = f"❌ CRITICAL: Firebase connection test failed: {e}"
                logger.error(error_msg)
                logger.error("❌ Please check your Firebase credentials and project configuration")
                raise RuntimeError(error_msg)
            
            self._firebase_available = True
            logger.info(f"🔥 Firebase Admin SDK initialized successfully")
            logger.info(f"📋 Project ID: {project_id}")
            logger.info(f"🔑 Credentials: {credentials_path}")
            logger.info(f"✅ Firebase connection test passed")
            
        except Exception as e:
            logger.error(f"❌ CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
            logger.error("❌ Backend CANNOT start without proper Firebase configuration")
            logger.error("❌ NO FALLBACK MODE - REAL FIREBASE REQUIRED")
            self._firebase_available = False
            # Don't raise here to allow server to start and show proper error messages
    
    def is_firebase_available(self) -> bool:
        """Check if Firebase is properly initialized and available"""
        return self._firebase_available and bool(firebase_admin._apps)
    
    async def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """
        Verify REAL Firebase ID token and return user information
        NO MOCK TOKENS ACCEPTED - PRODUCTION ONLY
        
        Args:
            id_token: Real Firebase ID token from frontend
            
        Returns:
            Dict containing verified user information
            
        Raises:
            HTTPException: If Firebase not available or token is invalid
        """
        # STRICT CHECK - Firebase MUST be available
        if not self.is_firebase_available():
            error_msg = "❌ CRITICAL: Firebase authentication not configured properly"
            logger.error(error_msg)
            logger.error("❌ Please configure Firebase credentials and restart the server")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Firebase authentication service not available. Please contact support."
            )
        
        if not id_token or not isinstance(id_token, str):
            logger.error("❌ Invalid token format received")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token format"
            )
        
        # REJECT ANY MOCK TOKENS IMMEDIATELY
        if id_token.startswith('mock-') or 'demo' in id_token.lower():
            logger.error(f"❌ REJECTED: Mock/demo token detected: {id_token[:50]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mock tokens not accepted. Please use real Firebase authentication."
            )
        
        # Log token info for debugging (first 20 chars only for security)
        logger.info(f"🔍 Verifying REAL Firebase token: {id_token[:20]}...")
        
        try:
            # Verify the REAL Firebase ID token
            decoded_token = auth.verify_id_token(id_token)
            
            # Extract user information from REAL Firebase token
            user_info = {
                'firebase_uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'provider': 'google',
                'auth_time': decoded_token.get('auth_time'),
                'exp': decoded_token.get('exp'),
                'iat': decoded_token.get('iat'),
            }
            
            # Validate required fields
            if not user_info['email']:
                logger.error("❌ No email in Firebase token")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )
            
            if not user_info['email_verified']:
                logger.error(f"❌ Email not verified: {user_info['email']}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not verified by Google"
                )
            
            logger.info(f"✅ REAL Firebase token verified successfully")
            logger.info(f"📧 User: {user_info['email']}")
            logger.info(f"🆔 Firebase UID: {user_info['firebase_uid']}")
            
            return user_info
            
        except auth.InvalidIdTokenError as e:
            logger.error(f"❌ Invalid Firebase ID token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        except auth.ExpiredIdTokenError as e:
            logger.error(f"❌ Expired Firebase ID token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired"
            )
        except auth.RevokedIdTokenError as e:
            logger.error(f"❌ Revoked Firebase ID token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has been revoked"
            )
        except auth.CertificateFetchError as e:
            logger.error(f"❌ Firebase certificate fetch error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service temporarily unavailable"
            )
        except Exception as e:
            logger.error(f"❌ Unexpected error verifying Firebase token: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication verification failed"
            )
    
    async def get_user_by_uid(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """
        Get Firebase user information by UID - PRODUCTION ONLY
        
        Args:
            firebase_uid: Firebase user UID
            
        Returns:
            Dict containing user information or None if not found
        """
        # STRICT CHECK - Firebase MUST be available
        if not self.is_firebase_available():
            logger.error("❌ Firebase not available for user lookup")
            return None
            
        try:
            user_record = auth.get_user(firebase_uid)
            
            return {
                'firebase_uid': user_record.uid,
                'email': user_record.email,
                'email_verified': user_record.email_verified,
                'display_name': user_record.display_name,
                'photo_url': user_record.photo_url,
                'disabled': user_record.disabled,
                'provider_data': [
                    {
                        'provider_id': provider.provider_id,
                        'uid': provider.uid,
                        'email': provider.email,
                        'display_name': provider.display_name,
                        'photo_url': provider.photo_url,
                    }
                    for provider in user_record.provider_data
                ],
                'custom_claims': user_record.custom_claims,
                'user_metadata': {
                    'creation_timestamp': user_record.user_metadata.creation_timestamp,
                    'last_sign_in_timestamp': user_record.user_metadata.last_sign_in_timestamp,
                }
            }
            
        except auth.UserNotFoundError:
            logger.warning(f"Firebase user not found: {firebase_uid}")
            return None
        except Exception as e:
            logger.error(f"Error fetching Firebase user {firebase_uid}: {e}")
            return None

# Create singleton instance
firebase_service = FirebaseService()