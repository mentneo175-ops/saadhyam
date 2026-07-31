"""
Email Marketing Plugin core entrypoint.
Defines the main class implementing the BasePlugin contract for sales_email_marketing.
"""

import logging
import time
import socket
import smtplib
import asyncio
from typing import Dict, Any, List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException
from plugins.base import BasePlugin

logger = logging.getLogger(__name__)


def mask_sensitive(val: str) -> str:
    if not val:
        return ""
    return val[:2] + "*" * (len(val) - 2) if len(val) > 2 else "*" * len(val)


class PluginMain(BasePlugin):
    """
    Email Marketing Plugin main class
    Inherits from BasePlugin to register metadata and declare available API actions
    """
    __plugin__ = True
    plugin_key = "sales_email_marketing"
    plugin_name = "Email Marketing"
    plugin_description = "Send automated bulk email campaigns to your customer leads, manage templates, and monitor bounce rates."
    plugin_icon = "✉️"
    plugin_category = "marketing"
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
                "action": "send_campaign",
                "name": "Send Email Campaign",
                "description": "Send bulk emails to multiple recipients using saved SMTP configuration",
                "parameters": {
                    "subject": {"type": "string", "required": True},
                    "body": {"type": "string", "required": True},
                    "recipients": {"type": "array", "required": True},
                    # Optional: pass is_html=True to send HTML-formatted email
                    "is_html": {"type": "boolean", "required": False}
                }
            }
        ]

    def get_config_schema(self) -> Dict[str, Any]:
        """Return schema validation rules for SMTP configuration"""
        return {
            "type": "object",
            "properties": {
                "smtp_host": {"type": "string", "description": "SMTP server host"},
                "smtp_port": {"type": "integer", "description": "SMTP port"},
                "sender_email": {"type": "string", "description": "SMTP sender email address"},
                "password_or_api_key": {"type": "string", "description": "SMTP password or API key"},
                "sender_name": {"type": "string", "description": "Optional display name"}
            },
            "required": ["smtp_host", "smtp_port", "sender_email", "password_or_api_key"]
        }

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate that all required credentials exist and are populated"""
        if not config:
            return False
        required = ["smtp_host", "smtp_port", "sender_email", "password_or_api_key"]
        return all(config.get(field) for field in required)

    def get_status(self) -> Dict[str, Any]:
        """Return basic status info"""
        return {
            "status": "ready",
            "version": self.plugin_version
        }

    async def send_campaign(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the send_campaign action.
        Sends emails to a list of recipients using saved SMTP configurations.
        """
        t_start = time.monotonic()
        user_config = context.get("user_config") or {}
        
        # 1. Validation of saved configuration
        if not self.validate_config(user_config):
            logger.error("Email Marketing: Configuration check failed or incomplete configuration provided.")
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": "Plugin is not configured."}
            )

        host = user_config.get("smtp_host")
        port = user_config.get("smtp_port")
        email = user_config.get("sender_email")
        password = user_config.get("password_or_api_key")
        sender_name = user_config.get("sender_name")

        # 2. Validation of action params
        subject = params.get("subject")
        body = params.get("body")
        recipients = params.get("recipients")
        # Optional: is_html defaults to False (plain-text) for full backward compatibility
        is_html = bool(params.get("is_html", False))
        mime_subtype = "html" if is_html else "plain"

        if not subject or not body or not recipients:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": "Parameters 'subject', 'body', and 'recipients' are required."}
            )

        if not isinstance(recipients, list):
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": "'recipients' must be a list of strings."}
            )

        logger.info(
            f"Email Marketing: Starting execution of send_campaign. Host={host}, Port={port}, "
            f"Sender={email}, RecipientsCount={len(recipients)}, IsHTML={is_html}, Password={mask_sensitive(password)}"
        )

        # 3. Synchronous sending helper running inside executor thread
        def do_sending():
            server = None
            emails_sent = 0
            failed = 0
            try:
                port_int = int(port)
                if port_int == 465:
                    server = smtplib.SMTP_SSL(host, port_int, timeout=15)
                else:
                    server = smtplib.SMTP(host, port_int, timeout=15)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()

                server.login(email, password)

                for idx, recipient in enumerate(recipients):
                    try:
                        msg = MIMEMultipart()
                        msg['From'] = f"{sender_name} <{email}>" if sender_name else email
                        msg['To'] = recipient
                        msg['Subject'] = subject
                        # Use 'html' MIME subtype for HTML emails, 'plain' for regular text
                        msg.attach(MIMEText(body, mime_subtype, 'utf-8'))

                        server.sendmail(email, [recipient], msg.as_string())
                        emails_sent += 1
                    except Exception as rc_err:
                        logger.error(f"Email Marketing: Failed recipient {recipient} (Index={idx}): {rc_err}")
                        failed += 1

                return {
                    "success": True,
                    "emails_sent": emails_sent,
                    "failed": failed
                }
            except smtplib.SMTPAuthenticationError as auth_err:
                logger.error(f"Email Marketing: SMTP Authentication failed: {auth_err}")
                return {"success": False, "error": "SMTP Authentication failed. Please verify credentials."}
            except (socket.timeout, TimeoutError) as tout_err:
                logger.error(f"Email Marketing: SMTP Connection timed out: {tout_err}")
                return {"success": False, "error": "SMTP connection timed out."}
            except ConnectionRefusedError as ref_err:
                logger.error(f"Email Marketing: SMTP Connection refused: {ref_err}")
                return {"success": False, "error": "SMTP connection was refused by target host."}
            except Exception as smtp_err:
                logger.error(f"Email Marketing: SMTP Connection failed unexpectedly: {smtp_err}")
                return {"success": False, "error": f"SMTP connection failed: {str(smtp_err)}"}
            finally:
                if server:
                    try:
                        server.quit()
                    except Exception:
                        pass

        loop = asyncio.get_running_loop()
        res = await loop.run_in_executor(None, do_sending)
        
        t_end = time.monotonic()
        duration_ms = int((t_end - t_start) * 1000)

        # 4. Error response or success tracking
        if not res.get("success"):
            logger.error(f"Email Marketing: Campaign sending failed. Error: {res.get('error')}")
            raise HTTPException(
                status_code=400,
                detail={"success": False, "message": res.get("error")}
            )

        logger.info(
            f"Email Marketing: Execution finished successfully in {duration_ms}ms. "
            f"Sent={res['emails_sent']}, Failed={res['failed']}"
        )

        return {
            "success": True,
            "emails_sent": res["emails_sent"],
            "failed": res["failed"]
        }
