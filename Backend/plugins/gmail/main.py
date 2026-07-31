"""
Gmail Plugin Core Entrypoint
Defines the main class implementing the BasePlugin contract for Gmail with production hardening.
"""

import logging
import time
import asyncio
from typing import Dict, Any, List, Optional
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status
from plugins.base import BasePlugin
from plugins.gmail.constants import PLUGIN_KEY
from plugins.gmail.gmail_client import GmailClient
from collections import defaultdict

logger = logging.getLogger(__name__)

# ==============================================================
# Rate Limiting Store
# ==============================================================
class UserRateLimiter:
    def __init__(self):
        self.calls = defaultdict(list)
        
    def check_rate_limit(self, user_id: int) -> bool:
        now = time.time()
        # Keep calls in last 60 seconds
        self.calls[user_id] = [t for t in self.calls[user_id] if now - t < 60]
        if len(self.calls[user_id]) >= 100:
            return False
        self.calls[user_id].append(now)
        return True

rate_limiter = UserRateLimiter()

class PluginMain(BasePlugin):
    """
    Gmail Plugin main class
    Inherits from BasePlugin to register metadata and declare available API actions
    """
    __plugin__ = True
    plugin_key = PLUGIN_KEY
    plugin_name = "Gmail Integration"
    plugin_description = "Integrate Gmail with Saadhyam to send, search, retrieve, and list emails asynchronously with production hardening."
    plugin_icon = "✉️"
    plugin_category = "communication"
    plugin_version = "1.0.0"

    def get_info(self) -> Dict[str, Any]:
        """Return plugin details"""
        return {
            "key": self.plugin_key,
            "name": self.plugin_name,
            "description": self.plugin_description,
            "icon": self.plugin_icon,
            "category": self.plugin_category,
            "version": self.plugin_version
        }

    def get_actions(self) -> List[Dict[str, Any]]:
        """Return available execution methods"""
        return [
            {
                "action": "test_connection",
                "name": "Test Connection",
                "description": "Test Gmail authentication credentials and connectivity",
                "parameters": {}
            },
            {
                "action": "send_email",
                "name": "Send Email",
                "description": "Send an email message",
                "parameters": {
                    "to": {"type": "string", "required": True},
                    "subject": {"type": "string", "required": True},
                    "body": {"type": "string", "required": True},
                    "cc": {"type": "array", "required": False},
                    "bcc": {"type": "array", "required": False},
                    "attachments": {"type": "array", "required": False}
                }
            },
            {
                "action": "list_emails",
                "name": "List Emails",
                "description": "Retrieve recent emails matching options with pagination support",
                "parameters": {
                    "max_results": {"type": "number", "default": 10},
                    "page_token": {"type": "string", "required": False},
                    "label_ids": {"type": "array", "default": ["INBOX"]}
                }
            },
            {
                "action": "get_email",
                "name": "Get Email",
                "description": "Get detailed email content by message ID",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "search_emails",
                "name": "Search Emails",
                "description": "Search inbox using query patterns with pagination support",
                "parameters": {
                    "query": {"type": "string", "required": True},
                    "max_results": {"type": "number", "default": 10},
                    "page_token": {"type": "string", "required": False}
                }
            },
            {
                "action": "mark_as_read",
                "name": "Mark As Read",
                "description": "Mark an email as read",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "mark_as_unread",
                "name": "Mark As Unread",
                "description": "Mark an email as unread",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "delete_email",
                "name": "Delete Email",
                "description": "Delete an email permanently",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "archive_email",
                "name": "Archive Email",
                "description": "Archive an email by removing it from the inbox",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "star_email",
                "name": "Star Email",
                "description": "Star an email",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "unstar_email",
                "name": "Unstar Email",
                "description": "Unstar an email",
                "parameters": {
                    "email_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "download_attachment",
                "name": "Download Attachment",
                "description": "Download an email attachment content with detailed metadata support",
                "parameters": {
                    "email_id": {"type": "string", "required": True},
                    "attachment_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "create_draft",
                "name": "Create Draft",
                "description": "Create an email draft",
                "parameters": {
                    "to": {"type": "string", "required": True},
                    "subject": {"type": "string", "required": True},
                    "body": {"type": "string", "required": True}
                }
            },
            {
                "action": "list_drafts",
                "name": "List Drafts",
                "description": "List all drafts with pagination support",
                "parameters": {
                    "max_results": {"type": "number", "default": 10},
                    "page_token": {"type": "string", "required": False}
                }
            },
            {
                "action": "send_draft",
                "name": "Send Draft",
                "description": "Send a draft email",
                "parameters": {
                    "draft_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "delete_draft",
                "name": "Delete Draft",
                "description": "Delete a draft email",
                "parameters": {
                    "draft_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "list_labels",
                "name": "List Labels",
                "description": "List all labels with pagination support parameters",
                "parameters": {
                    "max_results": {"type": "number", "required": False},
                    "page_token": {"type": "string", "required": False}
                }
            },
            {
                "action": "create_label",
                "name": "Create Label",
                "description": "Create a new label",
                "parameters": {
                    "name": {"type": "string", "required": True}
                }
            },
            {
                "action": "delete_label",
                "name": "Delete Label",
                "description": "Delete a label",
                "parameters": {
                    "label_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "apply_label",
                "name": "Apply Label",
                "description": "Apply a label to an email",
                "parameters": {
                    "email_id": {"type": "string", "required": True},
                    "label_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "remove_label",
                "name": "Remove Label",
                "description": "Remove a label from an email",
                "parameters": {
                    "email_id": {"type": "string", "required": True},
                    "label_id": {"type": "string", "required": True}
                }
            },
            {
                "action": "batch_mark_as_read",
                "name": "Batch Mark As Read",
                "description": "Mark multiple emails as read",
                "parameters": {
                    "email_ids": {"type": "array", "required": True}
                }
            },
            {
                "action": "batch_mark_as_unread",
                "name": "Batch Mark As Unread",
                "description": "Mark multiple emails as unread",
                "parameters": {
                    "email_ids": {"type": "array", "required": True}
                }
            },
            {
                "action": "batch_archive",
                "name": "Batch Archive",
                "description": "Archive multiple emails",
                "parameters": {
                    "email_ids": {"type": "array", "required": True}
                }
            },
            {
                "action": "batch_delete",
                "name": "Batch Delete",
                "description": "Delete multiple emails permanently",
                "parameters": {
                    "email_ids": {"type": "array", "required": True}
                }
            },
            {
                "action": "batch_star",
                "name": "Batch Star",
                "description": "Star multiple emails",
                "parameters": {
                    "email_ids": {"type": "array", "required": True}
                }
            },
            {
                "action": "batch_unstar",
                "name": "Batch Unstar",
                "description": "Unstar multiple emails",
                "parameters": {
                    "email_ids": {"type": "array", "required": True}
                }
            }
        ]

    def get_config_schema(self) -> Dict[str, Any]:
        """Return schema validation rules for the plugin configuration settings"""
        return {
            "type": "object",
            "properties": {
                "client_id": {"type": "string", "description": "Google API Client ID"},
                "client_secret": {"type": "string", "description": "Google API Client Secret"},
                "refresh_token": {"type": "string", "description": "Google OAuth Refresh Token"}
            },
            "required": []
        }

    def _pre_execute(self, context: Dict[str, Any], action: str):
        """Prepare context and check rate limits before action runs"""
        user_id = context.get("user_id")
        context["retries"] = 0
        
        if not rate_limiter.check_rate_limit(user_id):
            logger.warning(f"Rate limit exceeded for user {user_id} on action {action}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"success": False, "error": "Rate limit exceeded. Maximum 100 Gmail API calls per minute."}
            )

    def _post_execute(self, context: Dict[str, Any], action: str, success: bool, duration: float, message_id: str = None):
        """Format metrics logging for hardening observability"""
        user_id = context.get("user_id")
        retry_count = context.get("retries", 0)
        status_str = "success" if success else "failure"
        logger.info(
            f"[GMAIL ACTION LOG] user_id={user_id} action={action} execution_time={duration:.4f}s "
            f"status={status_str} message_id={message_id or 'N/A'} retry_count={retry_count}"
        )

    async def test_connection(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Test API connection using credentials"""
        self._pre_execute(context, "test_connection")
        user_id = context.get("user_id")
        db = context.get("db")
        t0 = time.monotonic()
        
        try:
            service = await GmailClient.get_service(user_id, db)
            profile = await self._run_api_call(context, service.users().getProfile, userId="me")
            
            duration = time.monotonic() - t0
            self._post_execute(context, "test_connection", True, duration)
            return {
                "success": True,
                "email": profile.get("emailAddress"),
                "messages_total": profile.get("messagesTotal"),
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "test_connection", False, time.monotonic() - t0)
            raise e

    async def send_email(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send email through Gmail API"""
        self._pre_execute(context, "send_email")
        user_id = context.get("user_id")
        db = context.get("db")
        
        to_email = payload.get("to")
        subject = payload.get("subject", "")
        body = payload.get("body", "")
        cc = payload.get("cc", [])
        bcc = payload.get("bcc", [])
        
        if not to_email:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "to recipient is required"}
            )
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            from email.mime.base import MIMEBase
            from email import encoders
            import base64
            
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            
            if cc:
                message['cc'] = ", ".join(cc)
            if bcc:
                message['bcc'] = ", ".join(bcc)
                
            message.attach(MIMEText(body, 'plain'))
            
            attachments = payload.get("attachments", [])
            for att in attachments:
                filename = att.get("filename", "file")
                content_type = att.get("content_type", "application/octet-stream")
                content_base64 = att.get("content_base64", "")
                
                maintype, subtype = content_type.split("/", 1) if "/" in content_type else ("application", "octet-stream")
                part = MIMEBase(maintype, subtype)
                part.set_payload(base64.b64decode(content_base64))
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
                message.attach(part)
                
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            sent_msg = await self._run_api_call(
                context,
                service.users().messages().send,
                userId="me",
                body={"raw": raw_message}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "send_email", True, duration, sent_msg.get("id"))
            return {
                "success": True,
                "message_id": sent_msg.get("id"),
                "thread_id": sent_msg.get("threadId"),
                "attachments_uploaded": len(attachments),
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "send_email", False, time.monotonic() - t0)
            raise e

    async def list_emails(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """List recent emails with pagination support"""
        self._pre_execute(context, "list_emails")
        user_id = context.get("user_id")
        db = context.get("db")
        max_results = payload.get("max_results", 10)
        page_token = payload.get("page_token")
        label_ids = payload.get("label_ids", ["INBOX"])
        
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            
            list_args = {
                "userId": "me",
                "maxResults": max_results,
                "labelIds": label_ids
            }
            if page_token:
                list_args["pageToken"] = page_token
                
            list_res = await self._run_api_call(context, service.users().messages().list, **list_args)
            
            messages = list_res.get("messages", [])
            emails = []
            
            for msg in messages:
                metadata = await self._run_api_call(
                    context,
                    service.users().messages().get,
                    userId="me",
                    id=msg["id"],
                    format="metadata"
                )
                
                headers = metadata.get("payload", {}).get("headers", [])
                subject = ""
                sender = ""
                date_str = ""
                for h in headers:
                    name = h.get("name", "").lower()
                    if name == "subject":
                        subject = h.get("value", "")
                    elif name == "from":
                        sender = h.get("value", "")
                    elif name == "date":
                        date_str = h.get("value", "")
                        
                emails.append({
                    "id": metadata.get("id"),
                    "thread_id": metadata.get("threadId"),
                    "subject": subject,
                    "from": sender,
                    "snippet": metadata.get("snippet", ""),
                    "date": date_str
                })
                
            duration = time.monotonic() - t0
            self._post_execute(context, "list_emails", True, duration)
            
            next_page_token = list_res.get("nextPageToken")
            return {
                "success": True,
                "emails": emails,
                "next_page_token": next_page_token,
                "has_more": next_page_token is not None,
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "list_emails", False, time.monotonic() - t0)
            raise e

    async def get_email(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve specific email details"""
        self._pre_execute(context, "get_email")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "email_id parameter is required"}
            )
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            message = await self._run_api_call(
                context,
                service.users().messages().get,
                userId="me",
                id=email_id,
                format="full"
            )
            
            msg_payload = message.get("payload", {})
            headers = msg_payload.get("headers", [])
            
            subject = ""
            sender = ""
            recipient = ""
            for h in headers:
                name = h.get("name", "").lower()
                if name == "subject":
                    subject = h.get("value", "")
                elif name == "from":
                    sender = h.get("value", "")
                elif name == "to":
                    recipient = h.get("value", "")
                    
            _, decoded_body = self._extract_body(msg_payload)
            
            duration = time.monotonic() - t0
            self._post_execute(context, "get_email", True, duration, email_id)
            return {
                "success": True,
                "email": {
                    "id": message.get("id"),
                    "subject": subject,
                    "from": sender,
                    "to": recipient,
                    "body": decoded_body,
                    "snippet": message.get("snippet", "")
                },
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "get_email", False, time.monotonic() - t0, email_id)
            raise e

    async def search_emails(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Search email list using query string with pagination support"""
        self._pre_execute(context, "search_emails")
        user_id = context.get("user_id")
        db = context.get("db")
        query = payload.get("query", "")
        max_results = payload.get("max_results", 10)
        page_token = payload.get("page_token")
        
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            
            list_args = {
                "userId": "me",
                "q": query,
                "maxResults": max_results
            }
            if page_token:
                list_args["pageToken"] = page_token
                
            search_res = await self._run_api_call(context, service.users().messages().list, **list_args)
            
            messages = search_res.get("messages", [])
            emails = []
            
            for msg in messages:
                metadata = await self._run_api_call(
                    context,
                    service.users().messages().get,
                    userId="me",
                    id=msg["id"],
                    format="metadata"
                )
                
                headers = metadata.get("payload", {}).get("headers", [])
                subject = ""
                sender = ""
                date_str = ""
                for h in headers:
                    name = h.get("name", "").lower()
                    if name == "subject":
                        subject = h.get("value", "")
                    elif name == "from":
                        sender = h.get("value", "")
                    elif name == "date":
                        date_str = h.get("value", "")
                        
                emails.append({
                    "id": metadata.get("id"),
                    "thread_id": metadata.get("threadId"),
                    "subject": subject,
                    "from": sender,
                    "snippet": metadata.get("snippet", ""),
                    "date": date_str
                })
                
            duration = time.monotonic() - t0
            self._post_execute(context, "search_emails", True, duration)
            
            next_page_token = search_res.get("nextPageToken")
            return {
                "success": True,
                "emails": emails,
                "next_page_token": next_page_token,
                "has_more": next_page_token is not None,
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "search_emails", False, time.monotonic() - t0)
            raise e

    async def mark_as_read(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Mark an email as read by removing the UNREAD label"""
        self._pre_execute(context, "mark_as_read")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"removeLabelIds": ["UNREAD"]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "mark_as_read", True, duration, email_id)
            return {"success": True, "message": "Email marked as read.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "mark_as_read", False, time.monotonic() - t0, email_id)
            raise e

    async def mark_as_unread(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Mark an email as unread by adding the UNREAD label"""
        self._pre_execute(context, "mark_as_unread")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"addLabelIds": ["UNREAD"]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "mark_as_unread", True, duration, email_id)
            return {"success": True, "message": "Email marked as unread.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "mark_as_unread", False, time.monotonic() - t0, email_id)
            raise e

    async def delete_email(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Delete an email permanently"""
        self._pre_execute(context, "delete_email")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().delete,
                userId="me",
                id=email_id
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "delete_email", True, duration, email_id)
            return {"success": True, "message": "Email deleted.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "delete_email", False, time.monotonic() - t0, email_id)
            raise e

    async def archive_email(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Archive an email by removing it from the INBOX label"""
        self._pre_execute(context, "archive_email")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"removeLabelIds": ["INBOX"]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "archive_email", True, duration, email_id)
            return {"success": True, "message": "Email archived.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "archive_email", False, time.monotonic() - t0, email_id)
            raise e

    async def star_email(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Star an email by adding the STARRED label"""
        self._pre_execute(context, "star_email")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"addLabelIds": ["STARRED"]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "star_email", True, duration, email_id)
            return {"success": True, "message": "Email starred.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "star_email", False, time.monotonic() - t0, email_id)
            raise e

    async def unstar_email(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Unstar an email by removing the STARRED label"""
        self._pre_execute(context, "unstar_email")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        
        if not email_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"removeLabelIds": ["STARRED"]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "unstar_email", True, duration, email_id)
            return {"success": True, "message": "Email unstarred.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "unstar_email", False, time.monotonic() - t0, email_id)
            raise e

    async def download_attachment(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Download email attachment content with detailed metadata support"""
        self._pre_execute(context, "download_attachment")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        attachment_id = payload.get("attachment_id")
        
        if not email_id or not attachment_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id and attachment_id parameters are required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            
            # 1. Fetch metadata (filename and content_type) recursively
            msg = await self._run_api_call(context, service.users().messages().get, userId="me", id=email_id, format="full")
            filename = "file"
            content_type = "application/octet-stream"
            size = 0
            
            def find_attachment_metadata(part, target_att_id):
                if "parts" in part:
                    for p in part["parts"]:
                        fn, ct, sz = find_attachment_metadata(p, target_att_id)
                        if fn:
                            return fn, ct, sz
                if part.get("body", {}).get("attachmentId") == target_att_id:
                    return (
                        part.get("filename", "file"), 
                        part.get("mimeType", "application/octet-stream"),
                        part.get("body", {}).get("size", 0)
                    )
                return None, None, 0
                
            fn, ct, sz = find_attachment_metadata(msg.get("payload", {}), attachment_id)
            if fn:
                filename = fn
                content_type = ct
                size = sz
                
            # 2. Get attachment data content
            att = await self._run_api_call(context, service.users().messages().attachments().get, userId="me", messageId=email_id, id=attachment_id)
            
            duration = time.monotonic() - t0
            self._post_execute(context, "download_attachment", True, duration, email_id)
            return {
                "success": True,
                "filename": filename,
                "mime_type": content_type,
                "size": size or len(att.get("data", "")),
                "base64_content": att.get("data", ""),
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "download_attachment", False, time.monotonic() - t0, email_id)
            raise e

    async def create_draft(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new draft email"""
        self._pre_execute(context, "create_draft")
        user_id = context.get("user_id")
        db = context.get("db")
        to_email = payload.get("to")
        subject = payload.get("subject", "")
        body = payload.get("body", "")
        
        if not to_email:
            raise HTTPException(status_code=400, detail={"success": False, "error": "to parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            import base64
            
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            message.attach(MIMEText(body, 'plain'))
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            draft = await self._run_api_call(
                context,
                service.users().drafts().create,
                userId="me",
                body={"message": {"raw": raw_message}}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "create_draft", True, duration)
            return {
                "success": True,
                "draft_id": draft.get("id"),
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "create_draft", False, time.monotonic() - t0)
            raise e

    async def list_drafts(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """List all draft emails with pagination support"""
        self._pre_execute(context, "list_drafts")
        user_id = context.get("user_id")
        db = context.get("db")
        max_results = payload.get("max_results", 10)
        page_token = payload.get("page_token")
        
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            
            list_args = {
                "userId": "me",
                "maxResults": max_results
            }
            if page_token:
                list_args["pageToken"] = page_token
                
            list_res = await self._run_api_call(context, service.users().drafts().list, **list_args)
            
            duration = time.monotonic() - t0
            self._post_execute(context, "list_drafts", True, duration)
            
            next_page_token = list_res.get("nextPageToken")
            return {
                "success": True,
                "drafts": list_res.get("drafts", []),
                "next_page_token": next_page_token,
                "has_more": next_page_token is not None,
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "list_drafts", False, time.monotonic() - t0)
            raise e

    async def send_draft(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Send a draft email"""
        self._pre_execute(context, "send_draft")
        user_id = context.get("user_id")
        db = context.get("db")
        draft_id = payload.get("draft_id")
        
        if not draft_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "draft_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            sent = await self._run_api_call(
                context,
                service.users().drafts().send,
                userId="me",
                body={"id": draft_id}
            )
            
            duration = time.monotonic() - t0
            msg_id = sent.get("message", {}).get("id") if sent.get("message") else sent.get("id")
            self._post_execute(context, "send_draft", True, duration, msg_id)
            return {
                "success": True,
                "message_id": msg_id,
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "send_draft", False, time.monotonic() - t0)
            raise e

    async def delete_draft(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a draft email permanently"""
        self._pre_execute(context, "delete_draft")
        user_id = context.get("user_id")
        db = context.get("db")
        draft_id = payload.get("draft_id")
        
        if not draft_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "draft_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(context, service.users().drafts().delete, userId="me", id=draft_id)
            
            duration = time.monotonic() - t0
            self._post_execute(context, "delete_draft", True, duration)
            return {"success": True, "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "delete_draft", False, time.monotonic() - t0)
            raise e

    async def list_labels(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """List all labels with pagination support parameters compatibility"""
        self._pre_execute(context, "list_labels")
        user_id = context.get("user_id")
        db = context.get("db")
        
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            list_res = await self._run_api_call(context, service.users().labels().list, userId="me")
            
            duration = time.monotonic() - t0
            self._post_execute(context, "list_labels", True, duration)
            return {
                "success": True,
                "labels": list_res.get("labels", []),
                "next_page_token": None,
                "has_more": False,
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "list_labels", False, time.monotonic() - t0)
            raise e

    async def create_label(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new custom label"""
        self._pre_execute(context, "create_label")
        user_id = context.get("user_id")
        db = context.get("db")
        label_name = payload.get("name")
        
        if not label_name:
            raise HTTPException(status_code=400, detail={"success": False, "error": "name parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            label = await self._run_api_call(
                context,
                service.users().labels().create,
                userId="me",
                body={"name": label_name}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "create_label", True, duration)
            return {
                "success": True,
                "label": label,
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "create_label", False, time.monotonic() - t0)
            raise e

    async def delete_label(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Delete an existing label permanently"""
        self._pre_execute(context, "delete_label")
        user_id = context.get("user_id")
        db = context.get("db")
        label_id = payload.get("label_id")
        
        if not label_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "label_id parameter is required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(context, service.users().labels().delete, userId="me", id=label_id)
            
            duration = time.monotonic() - t0
            self._post_execute(context, "delete_label", True, duration)
            return {"success": True, "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "delete_label", False, time.monotonic() - t0)
            raise e

    async def apply_label(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Apply a label to an email message"""
        self._pre_execute(context, "apply_label")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        label_id = payload.get("label_id")
        
        if not email_id or not label_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id and label_id parameters are required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"addLabelIds": [label_id]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "apply_label", True, duration, email_id)
            return {"success": True, "message": "Label applied successfully.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "apply_label", False, time.monotonic() - t0, email_id)
            raise e

    async def remove_label(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Remove a label from an email message"""
        self._pre_execute(context, "remove_label")
        user_id = context.get("user_id")
        db = context.get("db")
        email_id = payload.get("email_id")
        label_id = payload.get("label_id")
        
        if not email_id or not label_id:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_id and label_id parameters are required"})
            
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            await self._run_api_call(
                context,
                service.users().messages().modify,
                userId="me",
                id=email_id,
                body={"removeLabelIds": [label_id]}
            )
            
            duration = time.monotonic() - t0
            self._post_execute(context, "remove_label", True, duration, email_id)
            return {"success": True, "message": "Label removed successfully.", "retries": context.get("retries", 0)}
        except Exception as e:
            self._post_execute(context, "remove_label", False, time.monotonic() - t0, email_id)
            raise e

    # ==============================================================
    # Batch Action Helpers & Implementations
    # ==============================================================
    async def _batch_modify_labels(self, context: Dict[str, Any], payload: Dict[str, Any], add_labels: List[str] = None, remove_labels: List[str] = None) -> Dict[str, Any]:
        email_ids = payload.get("email_ids", [])
        if not email_ids:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_ids list parameter is required"})
            
        user_id = context.get("user_id")
        db = context.get("db")
        service = await GmailClient.get_service(user_id, db)
        
        success_count = 0
        failed_count = 0
        failures = []
        
        body = {}
        if add_labels:
            body["addLabelIds"] = add_labels
        if remove_labels:
            body["removeLabelIds"] = remove_labels
            
        for eid in email_ids:
            try:
                await self._run_api_call(
                    context,
                    service.users().messages().modify,
                    userId="me",
                    id=eid,
                    body=body
                )
                success_count += 1
            except Exception as e:
                failed_count += 1
                failures.append({"email_id": eid, "error": str(e)})
                
        return {
            "success": True,
            "success_count": success_count,
            "failed_count": failed_count,
            "failures": failures,
            "batch_size": len(email_ids),
            "retries": context.get("retries", 0)
        }

    async def batch_mark_as_read(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Batch remove UNREAD label from multiple messages"""
        self._pre_execute(context, "batch_mark_as_read")
        t0 = time.monotonic()
        try:
            res = await self._batch_modify_labels(context, payload, remove_labels=["UNREAD"])
            self._post_execute(context, "batch_mark_as_read", True, time.monotonic() - t0)
            return res
        except Exception as e:
            self._post_execute(context, "batch_mark_as_read", False, time.monotonic() - t0)
            raise e

    async def batch_mark_as_unread(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Batch add UNREAD label to multiple messages"""
        self._pre_execute(context, "batch_mark_as_unread")
        t0 = time.monotonic()
        try:
            res = await self._batch_modify_labels(context, payload, add_labels=["UNREAD"])
            self._post_execute(context, "batch_mark_as_unread", True, time.monotonic() - t0)
            return res
        except Exception as e:
            self._post_execute(context, "batch_mark_as_unread", False, time.monotonic() - t0)
            raise e

    async def batch_archive(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Batch remove INBOX label from multiple messages"""
        self._pre_execute(context, "batch_archive")
        t0 = time.monotonic()
        try:
            res = await self._batch_modify_labels(context, payload, remove_labels=["INBOX"])
            self._post_execute(context, "batch_archive", True, time.monotonic() - t0)
            return res
        except Exception as e:
            self._post_execute(context, "batch_archive", False, time.monotonic() - t0)
            raise e

    async def batch_star(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Batch add STARRED label to multiple messages"""
        self._pre_execute(context, "batch_star")
        t0 = time.monotonic()
        try:
            res = await self._batch_modify_labels(context, payload, add_labels=["STARRED"])
            self._post_execute(context, "batch_star", True, time.monotonic() - t0)
            return res
        except Exception as e:
            self._post_execute(context, "batch_star", False, time.monotonic() - t0)
            raise e

    async def batch_unstar(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Batch remove STARRED label from multiple messages"""
        self._pre_execute(context, "batch_unstar")
        t0 = time.monotonic()
        try:
            res = await self._batch_modify_labels(context, payload, remove_labels=["STARRED"])
            self._post_execute(context, "batch_unstar", True, time.monotonic() - t0)
            return res
        except Exception as e:
            self._post_execute(context, "batch_unstar", False, time.monotonic() - t0)
            raise e

    async def batch_delete(self, context: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Batch delete multiple messages permanently"""
        self._pre_execute(context, "batch_delete")
        email_ids = payload.get("email_ids", [])
        if not email_ids:
            raise HTTPException(status_code=400, detail={"success": False, "error": "email_ids list parameter is required"})
            
        user_id = context.get("user_id")
        db = context.get("db")
        t0 = time.monotonic()
        try:
            service = await GmailClient.get_service(user_id, db)
            success_count = 0
            failed_count = 0
            failures = []
            
            for eid in email_ids:
                try:
                    await self._run_api_call(
                        context,
                        service.users().messages().delete,
                        userId="me",
                        id=eid
                    )
                    success_count += 1
                except Exception as e:
                    failed_count += 1
                    failures.append({"email_id": eid, "error": str(e)})
                    
            duration = time.monotonic() - t0
            self._post_execute(context, "batch_delete", True, duration)
            return {
                "success": True,
                "success_count": success_count,
                "failed_count": failed_count,
                "failures": failures,
                "batch_size": len(email_ids),
                "retries": context.get("retries", 0)
            }
        except Exception as e:
            self._post_execute(context, "batch_delete", False, time.monotonic() - t0)
            raise e

    # ==============================================================
    # API Exec Call with Exponential Backoff Retries
    # ==============================================================
    async def _run_api_call(self, context: Dict[str, Any], api_func, *args, **kwargs):
        """Helper to run blocking API call inside loop executor, with Exponential Backoff Retry"""
        from googleapiclient.errors import HttpError
        from concurrent.futures import ThreadPoolExecutor
        
        retry_codes = [429, 500, 502, 503, 504]
        max_retries = 3
        backoff = 1.0
        retries = 0
        
        while True:
            try:
                loop = asyncio.get_running_loop()
                with ThreadPoolExecutor() as pool:
                    res = await loop.run_in_executor(pool, lambda: api_func(*args, **kwargs).execute())
                return res
            except HttpError as e:
                if e.resp.status in retry_codes and retries < max_retries:
                    retries += 1
                    context["retries"] = context.get("retries", 0) + 1
                    logger.warning(f"Gmail API error (status {e.resp.status}). Retrying in {backoff}s... (attempt {retries}/{max_retries})")
                    await asyncio.sleep(backoff)
                    backoff *= 2.0
                    continue
                    
                logger.error(f"Gmail API request failure (status {e.resp.status}): {e.content}")
                content_str = e.content.decode('utf-8') if isinstance(e.content, bytes) else str(e.content)
                
                error_message = "Failed to communicate with Gmail API"
                if "attachment" in content_str.lower():
                    error_message = "Attachment not found"
                elif "draft" in content_str.lower():
                    error_message = "Draft not found"
                elif "label" in content_str.lower():
                    error_message = "Label not found"
                elif "message" in content_str.lower() or "email" in content_str.lower():
                    error_message = "Email not found"
                    
                if e.resp.status == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail={"success": False, "error": error_message}
                    )
                elif e.resp.status == 400:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={"success": False, "error": error_message}
                    )
                elif e.resp.status in [401, 403]:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail={"success": False, "error": "Invalid Gmail credentials"}
                    )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={"success": False, "error": "Google API failure"}
                )
            except (asyncio.TimeoutError, TimeoutError) as e:
                logger.error(f"Gmail API network timeout: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={"success": False, "error": "Network timeout"}
                )
            except Exception as e:
                logger.error(f"Failed to execute Gmail API call: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={"success": False, "error": "Google API failure"}
                )
            
    def _extract_body(self, part):
        """Recursively decode message parts and extract text/plain or text/html body"""
        import base64
        
        if "parts" in part:
            plain_body = ""
            html_body = ""
            for p in part["parts"]:
                body_type, body_data = self._extract_body(p)
                if body_type == "text/plain":
                    plain_body += body_data
                elif body_type == "text/html":
                    html_body += body_data
            if plain_body:
                return "text/plain", plain_body
            if html_body:
                return "text/html", html_body
            return "text/plain", ""
            
        mime_type = part.get("mimeType", "")
        data = part.get("body", {}).get("data", "")
        if not data:
            return mime_type, ""
            
        try:
            # Decode URL-safe base64 data with padding correction
            decoded = base64.urlsafe_b64decode(data + '=' * (4 - len(data) % 4)).decode('utf-8', errors='ignore')
            return mime_type, decoded
        except Exception:
            return mime_type, ""

# Expose GmailPlugin as alias
GmailPlugin = PluginMain
