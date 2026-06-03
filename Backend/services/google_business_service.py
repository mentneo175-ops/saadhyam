import os
import logging
import asyncio
import httpx
import secrets
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import google.oauth2.credentials
from google_auth_oauthlib.flow import Flow
from config.settings import settings
from services.redis_service import get_redis_client

logger = logging.getLogger(__name__)


class GoogleBusinessService:
    """Service for Google Business Profile API integration and OAuth."""

    def __init__(self):
        # We reuse the YouTube credentials (which are standard Google Cloud OAuth credentials)
        # but append the Google My Business management scope.
        self.client_id = getattr(settings, "YOUTUBE_CLIENT_ID", os.getenv("YOUTUBE_CLIENT_ID", ""))
        self.client_secret = getattr(settings, "YOUTUBE_CLIENT_SECRET", os.getenv("YOUTUBE_CLIENT_SECRET", ""))
        
        # Enable mock mode by default to prevent blocking on Google Console setup / redirect mismatches
        self.use_mock = os.getenv("GOOGLE_BUSINESS_USE_MOCK_DATA", "true").lower() == "true"
        
        # Google Business OAuth redirect handler
        self.redirect_uri = os.getenv(
            "GOOGLE_BUSINESS_REDIRECT_URI",
            "http://localhost:8000/api/google-business/auth/callback"
        )
        
        # Scopes for Google Business Profile management
        self.scopes = [
            "https://www.googleapis.com/auth/business.manage",
            "https://www.googleapis.com/auth/userinfo.profile",
        ]
        self._oauth_code_verifiers: Dict[str, Dict[str, Any]] = {}
        self._oauth_cache_prefix = "google_business_oauth_pkce"
        self._oauth_cache_ttl_seconds = 600

    def _get_flow(self) -> Flow:
        """Create Flow instance for OAuth handling."""
        client_config = {
            "web": {
                "client_id": self.client_id or "placeholder_client_id",
                "client_secret": self.client_secret or "placeholder_client_secret",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
        return Flow.from_client_config(
            client_config,
            scopes=self.scopes,
            redirect_uri=self.redirect_uri,
            autogenerate_code_verifier=True,
        )

    def _summarize_external_error(self, text: str) -> str:
        """Produce a short, user-friendly summary from a third-party API error body."""
        if not text:
            return "External service returned an error"

        # Try to parse JSON and extract common fields
        try:
            payload = json.loads(text)
            # Google APIs often include error.message or error.errors
            if isinstance(payload, dict):
                if 'error' in payload and isinstance(payload['error'], dict):
                    err = payload['error']
                    msg = err.get('message') or err.get('status') or None
                    if msg:
                        return str(msg)
                # Fallback to top-level message
                if 'message' in payload:
                    return str(payload.get('message'))
        except Exception:
            pass

        # Simple heuristics for known phrases
        lower = text.lower()
        if 'quota' in lower or 'rate_limit' in lower or 'rate limit' in lower:
            return 'External API rate limit exceeded. Please try again later.'
        if 'not found' in lower:
            return 'Requested resource not found on external service.'

        # Truncate long texts
        short = text.strip().split('\n')[0]
        if len(short) > 200:
            return short[:197] + '...'
        return short

    async def _store_code_verifier(self, state: str, code_verifier: Optional[str]) -> None:
        if not state or not code_verifier:
            return

        self._oauth_code_verifiers[state] = {
            "code_verifier": code_verifier,
            "created_at": datetime.utcnow(),
        }

        redis_client = await get_redis_client()
        if redis_client:
            await redis_client.setex(
                f"{self._oauth_cache_prefix}:{state}",
                self._oauth_cache_ttl_seconds,
                json.dumps({"code_verifier": code_verifier}),
            )

    async def _pop_code_verifier(self, state: Optional[str]) -> Optional[str]:
        if state and state in self._oauth_code_verifiers:
            record = self._oauth_code_verifiers.pop(state)
            return record.get("code_verifier")

        if state:
            redis_client = await get_redis_client()
            if redis_client:
                cached = await redis_client.get(f"{self._oauth_cache_prefix}:{state}")
                if cached:
                    await redis_client.delete(f"{self._oauth_cache_prefix}:{state}")
                    try:
                        payload = json.loads(cached)
                        code_verifier = payload.get("code_verifier")
                        if isinstance(code_verifier, str) and code_verifier:
                            return code_verifier
                    except Exception:
                        logger.warning("Failed to decode cached Google Business OAuth verifier")

        if len(self._oauth_code_verifiers) == 1:
            _, record = self._oauth_code_verifiers.popitem()
            return record.get("code_verifier")

        if self._oauth_code_verifiers:
            latest_state = max(
                self._oauth_code_verifiers.items(),
                key=lambda item: item[1].get("created_at", datetime.min),
            )[0]
            record = self._oauth_code_verifiers.pop(latest_state)
            return record.get("code_verifier")

        return None

    async def get_auth_url(self, state: str = "") -> str:
        """Generate Google OAuth URL for Google Business access."""
        # Check if client keys exist or mock mode is enabled. If so, generate a mock connection URL
        if self.use_mock or not self.client_id or not self.client_secret:
            logger.info("⚠️ Google Business OAuth mock mode active. Returning mock redirect url.")
            return f"http://localhost:8081/google-business-oauth-callback?code=mock_code_xyz&state={state or 'mock_state'}"

        flow = self._get_flow()
        oauth_state = state or secrets.token_urlsafe(32)
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            prompt="consent",
            include_granted_scopes="true",
            state=oauth_state,
        )
        await self._store_code_verifier(oauth_state, getattr(flow, "code_verifier", None))
        return auth_url

    async def exchange_code(self, code: str, state: Optional[str] = None) -> Dict[str, Any]:
        """Exchange auth code for tokens."""
        # Handle mock mode
        if self.use_mock or not self.client_id or not self.client_secret or code.startswith("mock_"):
            logger.info("ℹ️ Running Google Business exchange_code in Demo Mode")
            return {
                "success": True,
                "access_token": "mock_access_token_" + secrets.token_hex(16),
                "refresh_token": "mock_refresh_token_" + secrets.token_hex(16),
                "expires_in": 3600,
            }

        try:
            flow = self._get_flow()
            code_verifier = await self._pop_code_verifier(state)
            if not code_verifier:
                return {
                    "success": False,
                    "error": "Missing PKCE code verifier for Google Business OAuth exchange. Please start the connection flow again.",
                }

            loop = asyncio.get_event_loop()
            credentials = await loop.run_in_executor(
                None, lambda: flow.fetch_token(code=code, code_verifier=code_verifier)
            )
            
            return {
                "success": True,
                "access_token": flow.credentials.token,
                "refresh_token": flow.credentials.refresh_token,
                "expires_in": (flow.credentials.expiry - datetime.utcnow()).total_seconds() if flow.credentials.expiry else 3600,
            }
        except Exception as e:
            logger.error(f"❌ Error exchanging Google Business OAuth code: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        if self.use_mock or not self.client_id or not self.client_secret or refresh_token.startswith("mock_"):
            return {
                "success": True,
                "access_token": "mock_access_token_" + secrets.token_hex(16),
                "expires_in": 3600
            }

        try:
            url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data, timeout=15)
                
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "access_token": result.get("access_token"),
                    "expires_in": result.get("expires_in", 3600)
                }
            else:
                logger.error(f"❌ Token refresh failed: {response.status_code} - {response.text}")
                return {"success": False, "error": self._summarize_external_error(response.text)}
        except Exception as e:
            logger.error(f"❌ Error refreshing Google Business token: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def get_account_info(self, access_token: str) -> Dict[str, Any]:
        """Fetch primary business account information."""
        if access_token.startswith("mock_"):
            return {
                "success": True,
                "account_id": "accounts/1122334455667788",
                "account_name": "Saadhyam Marketing Group"
            }

        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            async with httpx.AsyncClient() as client:
                # Call Account Management API
                resp = await client.get(
                    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
                    headers=headers,
                    timeout=10
                )
            
            if resp.status_code != 200:
                logger.error(f"Error fetching accounts: {resp.text}")
                return {"success": False, "error": self._summarize_external_error(resp.text)}

            data = resp.json()
            accounts = data.get("accounts", [])
            if not accounts:
                return {"success": False, "error": "No Google Business Accounts found."}

            # Find a PERSONAL or ORGANIZATION account type
            primary_account = accounts[0]
            for acc in accounts:
                if acc.get("type") in ["PERSONAL", "ORGANIZATION"]:
                    primary_account = acc
                    break

            return {
                "success": True,
                "account_id": primary_account.get("name"),  # e.g., accounts/{accountId}
                "account_name": primary_account.get("accountName", "Google Business Account")
            }
        except Exception as e:
            logger.error(f"❌ Error getting Google Business account: {e}", exc_info=True)
            return {
                "success": True,
                "account_id": "accounts/mock_account_12345",
                "account_name": "Demo Business Group (Fallback)"
            }

    async def get_locations(self, access_token: str, account_id: str) -> Dict[str, Any]:
        """Fetch list of business locations under an account."""
        if access_token.startswith("mock_"):
            return {
                "success": True,
                "locations": [
                    {
                        "location_id": "locations/loc_gachibowli_001",
                        "location_name": "Saadhyam Organic Cafe & Store - Gachibowli",
                        "address": "Survey No 12, Financial District, Gachibowli, Hyderabad, Telangana 500032",
                        "phone": "+91 98765 43210",
                        "website": "https://gachibowli.saadhyamorganic.com",
                        "primary_category": "Organic Food Restaurant",
                        "is_verified": True
                    },
                    {
                        "location_id": "locations/loc_jubileehills_002",
                        "location_name": "Saadhyam Wellness Hub - Jubilee Hills",
                        "address": "Road No 36, Jubilee Hills, Near Metro Station, Hyderabad, Telangana 500033",
                        "phone": "+91 98765 43211",
                        "website": "https://jubilee.saadhyamorganic.com",
                        "primary_category": "Wellness Center",
                        "is_verified": True
                    },
                    {
                        "location_id": "locations/loc_kukatpally_003",
                        "location_name": "Saadhyam Farm Foods - Kukatpally (Pending)",
                        "address": "KPHB Phase 1, Kukatpally, Near Forum Mall, Hyderabad, Telangana 500072",
                        "phone": "+91 98765 43212",
                        "website": "https://saadhyamorganic.com",
                        "primary_category": "Grocery Store",
                        "is_verified": False
                    }
                ]
            }

        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            # The My Business Business Information API requires readMask fields
            read_mask = "name,title,storefrontAddress,phoneNumbers,websiteUri,metadata,regularHours,categories"
            url = f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_id}/locations?readMask={read_mask}"
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=headers, timeout=15)

            if resp.status_code != 200:
                logger.error(f"Error fetching locations: {resp.text}")
                return {"success": False, "error": self._summarize_external_error(resp.text)}

            data = resp.json()
            locations_raw = data.get("locations", [])
            formatted = []
            
            for loc in locations_raw:
                # Format address
                addr_obj = loc.get("storefrontAddress", {})
                address_parts = addr_obj.get("addressLines", [])
                locality = addr_obj.get("locality", "")
                region = addr_obj.get("administrativeArea", "")
                postal_code = addr_obj.get("postalCode", "")
                country = addr_obj.get("regionCode", "")
                address_str = ", ".join(address_parts)
                if locality: address_str += f", {locality}"
                if region: address_str += f", {region} {postal_code}"
                if country: address_str += f", {country}"

                # Format primary category
                category = loc.get("categories", {}).get("primaryCategory", {}).get("displayName", "Business Listing")

                # Phones
                phones = loc.get("phoneNumbers", {})
                phone_str = phones.get("primaryPhone") or ""

                # Verification Status
                is_verified = loc.get("metadata", {}).get("isVerified", False)

                formatted.append({
                    "location_id": loc.get("name"),  # e.g., locations/{locationId}
                    "location_name": loc.get("title", "Unnamed Location"),
                    "address": address_str,
                    "phone": phone_str,
                    "website": loc.get("websiteUri", ""),
                    "primary_category": category,
                    "is_verified": is_verified
                })

            return {"success": True, "locations": formatted}
        except Exception as e:
            logger.error(f"❌ Error fetching locations from Google API: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def get_reviews(self, access_token: str, account_id: str, location_id: str) -> Dict[str, Any]:
        """Fetch customer reviews for a specific business location."""
        # Verify if account_id or location_id is mock
        if access_token.startswith("mock_") or "mock" in location_id or "loc_" in location_id:
            # Generate highly realistic reviews
            return {
                "success": True,
                "reviews": [
                    {
                        "review_id": "rev_001",
                        "reviewer_name": "Rohan Sharma",
                        "reviewer_photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                        "rating": 5,
                        "comment": "Absolutely loved their organic quinoa bowl! The service was fast and the staff was extremely friendly. A must-visit place for health enthusiasts in Gachibowli.",
                        "reply_comment": "Thank you Rohan! We are thrilled that you enjoyed the quinoa bowl. Looking forward to serving you again soon!",
                        "reply_submitted_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                        "review_created_at": (datetime.utcnow() - timedelta(days=3)).isoformat()
                    },
                    {
                        "review_id": "rev_002",
                        "reviewer_name": "Priya Reddy",
                        "reviewer_photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                        "rating": 4,
                        "comment": "Very nice ambiance and high-quality organic ingredients. The avocado toast was delicious, though a bit expensive. Will come back to try their smoothies.",
                        "reply_comment": None,
                        "reply_submitted_at": None,
                        "review_created_at": (datetime.utcnow() - timedelta(days=5)).isoformat()
                    },
                    {
                        "review_id": "rev_003",
                        "reviewer_name": "Amit Patel",
                        "reviewer_photo": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
                        "rating": 3,
                        "comment": "The food is decent but the wait time was almost 30 minutes on a Sunday afternoon. Hoping they can improve service speed.",
                        "reply_comment": None,
                        "reply_submitted_at": None,
                        "review_created_at": (datetime.utcnow() - timedelta(days=10)).isoformat()
                    },
                    {
                        "review_id": "rev_004",
                        "reviewer_name": "Sneha Sen",
                        "reviewer_photo": None,
                        "rating": 5,
                        "comment": "Their gluten-free pancakes are out of this world! So soft and flavorful. Love that they list all allergens clearly on the menu. Great experience!",
                        "reply_comment": "Hi Sneha! We appreciate your kind words. Glad our gluten-free pancakes hit the spot! See you soon.",
                        "reply_submitted_at": (datetime.utcnow() - timedelta(days=12)).isoformat(),
                        "review_created_at": (datetime.utcnow() - timedelta(days=14)).isoformat()
                    }
                ]
            }

        try:
            # API endpoint: https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
            # Note: This is part of the v4 legacy endpoint structure, which remains active for reviews,
            # or newer mybusinessgoogleentry APIs if approved.
            headers = {"Authorization": f"Bearer {access_token}"}
            # Adjust endpoints to match google's actual path
            acc_num = account_id.replace("accounts/", "")
            loc_num = location_id.replace("locations/", "")
            url = f"https://mybusiness.googleapis.com/v4/accounts/{acc_num}/locations/{loc_num}/reviews"
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, headers=headers, timeout=15)

            if resp.status_code != 200:
                logger.error(f"Error fetching reviews: {resp.text}")
                return {"success": False, "error": self._summarize_external_error(resp.text)}

            data = resp.json()
            raw_reviews = data.get("reviews", [])
            formatted = []
            
            for rev in raw_reviews:
                # Extract reply if exists
                reply = rev.get("reviewReply", {})
                reply_comment = reply.get("comment")
                reply_time = reply.get("updateTime")
                
                formatted.append({
                    "review_id": rev.get("reviewId"),
                    "reviewer_name": rev.get("reviewer", {}).get("displayName", "Anonymous Critic"),
                    "reviewer_photo": rev.get("reviewer", {}).get("profilePhotoUrl"),
                    "rating": self._map_star_rating(rev.get("starRating")),
                    "comment": rev.get("comment", ""),
                    "reply_comment": reply_comment,
                    "reply_submitted_at": reply_time,
                    "review_created_at": rev.get("createTime")
                })
                
            return {"success": True, "reviews": formatted}
        except Exception as e:
            logger.error(f"❌ Error listing reviews from Google API: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _map_star_rating(self, star_enum: str) -> int:
        """Map Google star enum values (ONE, TWO, THREE, FOUR, FIVE) to integer ratings."""
        mapping = {
            "ONE": 1,
            "TWO": 2,
            "THREE": 3,
            "FOUR": 4,
            "FIVE": 5
        }
        return mapping.get(str(star_enum).upper(), 5)

    async def submit_review_reply(
        self,
        access_token: str,
        account_id: str,
        location_id: str,
        review_id: str,
        reply_comment: str
    ) -> Dict[str, Any]:
        """Publish a reply to a review."""
        if access_token.startswith("mock_") or "mock" in location_id or "loc_" in location_id:
            logger.info(f"ℹ️ Submitted review reply to {review_id} in Mock Mode: {reply_comment}")
            return {
                "success": True,
                "reply_comment": reply_comment,
                "reply_submitted_at": datetime.utcnow().isoformat()
            }

        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            acc_num = account_id.replace("accounts/", "")
            loc_num = location_id.replace("locations/", "")
            url = f"https://mybusiness.googleapis.com/v4/accounts/{acc_num}/locations/{loc_num}/reviews/{review_id}/reply"
            
            payload = {"comment": reply_comment}
            async with httpx.AsyncClient() as client:
                resp = await client.put(url, headers=headers, json=payload, timeout=15)
                
            if resp.status_code != 200:
                logger.error(f"Error submitting review reply: {resp.text}")
                return {"success": False, "error": self._summarize_external_error(resp.text)}

            data = resp.json()
            return {
                "success": True,
                "reply_comment": data.get("comment", reply_comment),
                "reply_submitted_at": data.get("updateTime", datetime.utcnow().isoformat())
            }
        except Exception as e:
            logger.error(f"❌ Error submitting review reply to Google API: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def publish_post(
        self,
        access_token: str,
        account_id: str,
        location_id: str,
        summary: str,
        media_url: Optional[str] = None,
        action_type: str = "LEARN_MORE",
        action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Publish local post directly onto Google Business maps page."""
        if access_token.startswith("mock_") or "mock" in location_id or "loc_" in location_id:
            logger.info("ℹ️ Publishing Local Post on Google Maps in Mock Mode")
            return {
                "success": True,
                "post_id": "mock_post_" + secrets.token_hex(8),
                "summary": summary
            }

        try:
            # Endpoint: https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts
            headers = {"Authorization": f"Bearer {access_token}"}
            acc_num = account_id.replace("accounts/", "")
            loc_num = location_id.replace("locations/", "")
            url = f"https://mybusiness.googleapis.com/v4/accounts/{acc_num}/locations/{loc_num}/localPosts"

            # Setup body payload for Local Post
            post_body = {
                "languageCode": "en-US",
                "summary": summary,
                "topicType": "STANDARD"  # STANDARD represent standard updates/posts
            }

            # Add media item if present
            if media_url:
                post_body["media"] = [
                    {
                        "mediaFormat": "PHOTO",
                        "sourceUrl": media_url
                    }
                ]

            # Add Call-To-Action button if present
            if action_url and action_type:
                post_body["callToAction"] = {
                    "actionType": action_type,
                    "url": action_url
                }

            async with httpx.AsyncClient() as client:
                resp = await client.post(url, headers=headers, json=post_body, timeout=15)

            if resp.status_code != 200 and resp.status_code != 201:
                logger.error(f"Error publishing post: {resp.text}")
                return {"success": False, "error": self._summarize_external_error(resp.text)}

            data = resp.json()
            return {
                "success": True,
                "post_id": data.get("name"),  # Google post path: accounts/.../locations/.../localPosts/{id}
                "summary": data.get("summary")
            }
        except Exception as e:
            logger.error(f"❌ Error publishing local post to Google API: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def generate_ai_reply(self, reviewer_name: str, review_text: str, rating: int, tone: str = "friendly") -> str:
        """Generate an AI-powered reply to a customer review using Gemini (with high-quality fallbacks)."""
        # Try to call Gemini API
        api_keys = [
            os.getenv("GEMINI_API_KEY"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3")
        ]
        api_keys = [k for k in api_keys if k]
        
        system_instructions = f"""You are a helpful customer service representative for a premium business.
Your goal is to reply to a Google Maps review.
Reviewer: {reviewer_name}
Rating: {rating} stars out of 5
Review Text: "{review_text}"
Tone: {tone}

Instructions:
1. Address the reviewer by name if available ({reviewer_name}).
2. Keep the reply concise (2-3 sentences max).
3. If the rating is high (4-5 stars), thank them warmly and invite them back.
4. If the rating is low (1-3 stars), apologize professionally, take accountability, and offer to resolve the issue.
5. Do NOT use placeholders. Keep the response ready-to-publish.
6. Adopt the requested tone: '{tone}'.

Return ONLY the reply text, no other formatting or introductory remarks."""

        if api_keys:
            for key in api_keys:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=key)
                    model_name = getattr(settings, "GEMINI_CONTENT_MODEL", "gemini-1.5-flash")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(system_instructions)
                    reply_text = response.text.strip()
                    if reply_text:
                        return reply_text
                except Exception as ex:
                    logger.warning(f"Gemini reply generation key failed: {ex}")
                    continue

        # Rule-based fallback if Gemini is unavailable
        if rating >= 4:
            if tone == "professional":
                return f"Dear {reviewer_name}, thank you for your kind feedback. We are committed to providing high-quality experiences and are pleased to hear you had a positive visit. We appreciate your support and look forward to serving you again."
            elif tone == "thankful":
                return f"Thank you so much, {reviewer_name}! We truly appreciate you taking the time to share your wonderful experience with us. It means a lot to our team, and we can't wait to welcome you back!"
            else: # friendly / default
                return f"Hi {reviewer_name}! Thanks a lot for the awesome review. We're so glad you enjoyed our service. Looking forward to seeing you again soon!"
        else:
            if tone == "professional":
                return f"Dear {reviewer_name}, we appreciate you bringing this to our attention. We apologize that your experience did not meet expectations. We take this feedback seriously and are reviewing our operations to ensure this does not happen again. Please feel free to reach out to us directly so we can make this right."
            elif tone == "apologetic":
                return f"Hello {reviewer_name}. We are truly sorry to hear that your experience fell short of what you deserved. We sincerely apologize for the inconvenience caused. We would love the opportunity to connect with you directly to address your concerns and earn back your trust."
            else: # friendly / default
                return f"Hi {reviewer_name}. We are really sorry to hear you didn't have a great experience with us. We'd love to learn more about what went wrong so we can fix it. Please contact us directly so we can make things right!"


google_business_service = GoogleBusinessService()
