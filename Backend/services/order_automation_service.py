"""
Order Automation Service ΓÇö Standalone Workflow Engine.
Handles:
  1. Idempotent Inventory Check, Reservation, Release, and Deduction.
  2. Payment-Gated Order Status Transitions (pending -> confirmed -> processing).
  3. Non-blocking Customer Email Notifications via SMTP (confirmation, payment_failure, shipment, delivery, cancellation).
  4. Automatic Carrier & Tracking Number Generation for fulfillment.
"""

import os
import logging
import asyncio
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, List, Tuple, Set

from sqlalchemy import select, and_, text
from sqlalchemy.ext.asyncio import AsyncSession

from models.order import Order, OrderItem, InventoryItem, OrderStatus, PaymentStatus

from config.database import async_engine, Base

logger = logging.getLogger(__name__)

_tables_created = False

# ---------------------------------------------------------------------------
# Status Transition Rules
# ---------------------------------------------------------------------------

ALLOWED_STATUS_TRANSITIONS: Dict[str, Set[str]] = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": {"completed"},
    "completed": set(),
    "cancelled": set(),
}


def validate_status_transition(
    current_status: Any,
    new_status: Any,
) -> Tuple[bool, str]:
    """
    Validate if transition from current_status to new_status is permitted.

    Allowed transitions:
      - pending -> confirmed, cancelled
      - confirmed -> processing, cancelled
      - processing -> shipped, cancelled
      - shipped -> delivered
      - delivered -> completed

    Terminal states: completed, cancelled (no outgoing transitions allowed)
    """
    curr = current_status.value if isinstance(current_status, OrderStatus) else str(current_status).lower()
    target = new_status.value if isinstance(new_status, OrderStatus) else str(new_status).lower()

    if curr not in ALLOWED_STATUS_TRANSITIONS:
        return False, f"Invalid current order status: '{curr}'."

    if target not in ALLOWED_STATUS_TRANSITIONS:
        return False, f"Invalid target order status: '{target}'."

    if curr == target:
        return True, f"Status unchanged ({curr})."

    allowed = ALLOWED_STATUS_TRANSITIONS[curr]
    if target not in allowed:
        if not allowed:
            return False, f"Cannot transition order from terminal status '{curr}' to '{target}'."
        allowed_list = ", ".join(sorted(allowed))
        return False, f"Invalid status transition from '{curr}' to '{target}'. Allowed transitions from '{curr}': {allowed_list}."

    return True, f"Valid transition from '{curr}' to '{target}'."



async def ensure_order_tables_exist(db: Optional[AsyncSession] = None):
    """Ensure order management tables & missing columns exist in the database."""
    global _tables_created
    if _tables_created:
        return
    try:
        if db:
            conn = await db.connection()
            import models.order  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
            try:
                await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_reserved BOOLEAN DEFAULT FALSE NOT NULL;"))
            except Exception:
                pass
        _tables_created = True
        logger.info("Γ£à Order management tables and columns verified in database.")
    except Exception as e:
        logger.warning(f"ΓÜá∩╕Å Table auto-creation check note: {e}")


# ---------------------------------------------------------------------------
# 1. Inventory Management Helpers
# ---------------------------------------------------------------------------

async def get_or_create_inventory_item(
    user_id: int,
    product_name: str,
    sku: Optional[str] = None,
    default_stock: int = 100,
    db: Optional[AsyncSession] = None,
) -> InventoryItem:
    """Fetch existing inventory item by product_name/sku or auto-provision with default stock."""
    if not db:
        raise ValueError("Database session is required for inventory operations")

    stmt = select(InventoryItem).where(
        and_(
            InventoryItem.user_id == user_id,
            InventoryItem.product_name.ilike(product_name.strip()),
        )
    )
    res = await db.execute(stmt)
    inv = res.scalars().first()

    if not inv:
        inv = InventoryItem(
            user_id=user_id,
            product_name=product_name.strip(),
            sku=sku or f"SKU-{int(datetime.utcnow().timestamp())}",
            available_stock=default_stock,
            reserved_stock=0,
        )
        db.add(inv)
        await db.commit()
        await db.refresh(inv)
        logger.info(f"≡ƒôª Provisioned new inventory item '{product_name}' with stock={default_stock} for user_id={user_id}")

    return inv


async def check_inventory_availability(
    user_id: int,
    items: List[OrderItem],
    db: AsyncSession,
) -> Tuple[bool, str]:
    """Check if all line items have sufficient available stock."""
    for item in items:
        inv = await get_or_create_inventory_item(user_id, item.product_name, item.sku, default_stock=100, db=db)
        if inv.available_stock < item.quantity:
            msg = f"Insufficient stock for '{item.product_name}': requested {item.quantity}, available {inv.available_stock}."
            logger.warning(f"[INVENTORY] {msg}")
            return False, msg

    return True, "Stock available for all line items."


async def reserve_order_inventory(order: Order, db: AsyncSession) -> Tuple[bool, str]:
    """
    Idempotently reserve stock for an order.
    Deducts quantity from available_stock and adds to reserved_stock.
    """
    if order.inventory_reserved:
        return True, "Inventory already reserved for this order."

    avail, msg = await check_inventory_availability(order.user_id, getattr(order, "items", []), db)
    if not avail:
        return False, msg

    for item in getattr(order, "items", []):
        inv = await get_or_create_inventory_item(order.user_id, item.product_name, item.sku, db=db)
        inv.available_stock -= item.quantity
        inv.reserved_stock += item.quantity
        inv.updated_at = datetime.utcnow()

    order.inventory_reserved = True
    logger.info(f"≡ƒöÆ Reserved inventory for Order #{order.order_number} (user_id={order.user_id})")
    return True, "Inventory reserved successfully."


async def release_order_inventory(order: Order, db: AsyncSession) -> Tuple[bool, str]:
    """
    Idempotently release reserved stock on order cancellation.
    Restores quantity to available_stock and decrements reserved_stock.
    """
    if not order.inventory_reserved:
        return True, "No reserved inventory to release."

    for item in getattr(order, "items", []):
        inv = await get_or_create_inventory_item(order.user_id, item.product_name, item.sku, db=db)
        inv.available_stock += item.quantity
        inv.reserved_stock = max(0, inv.reserved_stock - item.quantity)
        inv.updated_at = datetime.utcnow()

    order.inventory_reserved = False
    logger.info(f"≡ƒöô Released reserved inventory for Order #{order.order_number}")
    return True, "Inventory released successfully."


async def finalize_shipped_inventory(order: Order, db: AsyncSession) -> Tuple[bool, str]:
    """
    Deduct reserved stock when order is fulfilled/completed without returning to available.
    """
    if not order.inventory_reserved:
        return True, "Inventory already finalized."

    for item in getattr(order, "items", []):
        inv = await get_or_create_inventory_item(order.user_id, item.product_name, item.sku, db=db)
        inv.reserved_stock = max(0, inv.reserved_stock - item.quantity)
        inv.updated_at = datetime.utcnow()

    order.inventory_reserved = False
    logger.info(f"Γ£à Finalized inventory deduction for completed Order #{order.order_number}")
    return True, "Inventory finalized."


# ---------------------------------------------------------------------------
# 2. Logistics & Tracking Helper
# ---------------------------------------------------------------------------

def ensure_carrier_and_tracking(order: Order) -> Tuple[str, str]:
    """Auto-generate carrier and tracking number if not specified."""
    carrier = order.carrier_name or "Express Logistics"
    if not order.tracking_number:
        timestamp_str = datetime.utcnow().strftime("%Y%m%d%H%M")
        tracking = f"TRK-{timestamp_str}-{order.id:04d}"
    else:
        tracking = order.tracking_number

    order.carrier_name = carrier
    order.tracking_number = tracking
    return carrier, tracking


# ---------------------------------------------------------------------------
# 3. Fixed Transactional Email Templates & Per-User Encrypted SMTP Engine
# ---------------------------------------------------------------------------

DEFAULT_EMAIL_TEMPLATES: Dict[str, Dict[str, str]] = {
    "confirmation": {
        "subject": "Your Order {{order_number}} Has Been Confirmed",
        "title": "Order Confirmed & Payment Verified",
        "color": "#059669",
        "badge": "Confirmed",
        "headline": "Great news! Your order has been confirmed.",
        "description": "We have received your order and verified payment. Our fulfillment team will begin preparing it shortly.",
    },
    "processing": {
        "subject": "Your Order {{order_number}} Is Being Prepared",
        "title": "Order In Processing",
        "color": "#d97706",
        "badge": "Processing",
        "headline": "Your order is now being packed and prepared for shipment.",
        "description": "Our warehouse fulfillment team is carefully preparing, quality-checking, and packaging your items.",
    },
    "shipment": {
        "subject": "Your Order {{order_number}} Has Been Shipped",
        "title": "Package On Its Way",
        "color": "#2563eb",
        "badge": "Shipped",
        "headline": "Your package has been dispatched!",
        "description": "Your items have been handed over to our express courier partner with real-time tracking.",
    },
    "delivery": {
        "subject": "Your Order {{order_number}} Has Been Delivered",
        "title": "Order Delivered Successfully",
        "color": "#059669",
        "badge": "Delivered",
        "headline": "Your order has been delivered!",
        "description": "Your package has arrived at your destination address. We hope you enjoy your purchase!",
    },
    "completed": {
        "subject": "Your Order {{order_number}} Is Complete",
        "title": "Order Completed & Closed",
        "color": "#059669",
        "badge": "Completed",
        "headline": "Thank you for shopping with us! Your order is complete.",
        "description": "Your order fulfillment is 100% complete and closed. Thank you for your business!",
    },
    "cancellation": {
        "subject": "Your Order {{order_number}} Has Been Cancelled",
        "title": "Order Cancellation Notice",
        "color": "#dc2626",
        "badge": "Cancelled",
        "headline": "Your order has been cancelled.",
        "description": "Your order has been cancelled per store policy or customer request. Any reserved inventory has been released.",
    },
    "payment_failure": {
        "subject": "Payment Failed for Order {{order_number}}",
        "title": "Payment Authorization Failure",
        "color": "#dc2626",
        "badge": "Payment Failed",
        "headline": "Action Required: We could not process your payment.",
        "description": "Your transaction could not be completed. Please update your payment method to avoid order cancellation.",
    },
}


def render_order_email_html(
    order: Order,
    event_type: str,
    custom_templates: Optional[Dict[str, Any]] = None,
    business_name: str = "Saadhyam Store"
) -> Tuple[str, str]:
    """
    Render professional, responsive transactional HTML email with dynamic variable replacement.
    Returns (subject, html_content).
    """
    tmpl_data = DEFAULT_EMAIL_TEMPLATES.get(event_type, DEFAULT_EMAIL_TEMPLATES["confirmation"])
    
    # Check custom template override
    subject_raw = tmpl_data["subject"]
    custom_body_text = None
    if custom_templates and event_type in custom_templates:
        ct = custom_templates[event_type]
        if isinstance(ct, dict):
            subject_raw = ct.get("subject") or subject_raw
            custom_body_text = ct.get("body")
        elif hasattr(ct, "subject"):
            subject_raw = getattr(ct, "subject", subject_raw)
            custom_body_text = getattr(ct, "body", None)

    order_num = order.order_number or f"#{order.id}"
    customer_name = order.customer_name or "Valued Customer"
    customer_email = order.customer_email or ""
    order_status_str = str(order.order_status.value if hasattr(order.order_status, "value") else order.order_status).capitalize()
    payment_status_str = str(order.payment_status.value if hasattr(order.payment_status, "value") else order.payment_status).capitalize()
    formatted_amount = f"Γé╣{order.total_amount:,.2f}"
    carrier = order.carrier_name or "Express Logistics"
    tracking = order.tracking_number or "Pending"
    address = order.shipping_address or "N/A"
    order_date = (order.created_at or datetime.utcnow()).strftime("%B %d, %Y")

    # Generate item rows HTML
    items_html = ""
    items_text_list = []
    order_items = getattr(order, "items", []) or []
    if order_items:
        items_html = "<table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>"
        items_html += "<tr style='background:#f3f4f6; color:#4b5563; font-size:12px; text-transform:uppercase;'><th style='padding:8px; text-align:left;'>Item</th><th style='padding:8px; text-align:center;'>Qty</th><th style='padding:8px; text-align:right;'>Price</th></tr>"
        for it in order_items:
            p_name = getattr(it, "product_name", "Item")
            qty = getattr(it, "quantity", 1)
            price = getattr(it, "unit_price", 0.0)
            tot = getattr(it, "total_price", qty * price)
            items_html += f"<tr><td style='padding:8px; border-bottom:1px solid #e5e7eb; font-weight:500;'>{p_name}</td><td style='padding:8px; border-bottom:1px solid #e5e7eb; text-align:center;'>{qty}</td><td style='padding:8px; border-bottom:1px solid #e5e7eb; text-align:right;'>Γé╣{tot:,.2f}</td></tr>"
            items_text_list.append(f"{p_name} (x{qty}) - Γé╣{tot:,.2f}")
        items_html += "</table>"
    else:
        items_html = "<p style='color:#6b7280; font-size:13px; font-style:italic;'>Standard order package</p>"

    items_text = ", ".join(items_text_list) if items_text_list else "Standard Package"

    # Replacement dictionary
    replacements = {
        "{{customer_name}}": customer_name,
        "{{order_number}}": order_num,
        "{{customer_email}}": customer_email,
        "{{order_status}}": order_status_str,
        "{{payment_status}}": payment_status_str,
        "{{order_items}}": items_text,
        "{{total_amount}}": formatted_amount,
        "{{carrier_name}}": carrier,
        "{{tracking_number}}": tracking,
        "{{shipping_address}}": address,
        "{{business_name}}": business_name,
        "{{order_date}}": order_date,
    }

    # Format subject
    rendered_subject = subject_raw
    for k, v in replacements.items():
        rendered_subject = rendered_subject.replace(k, str(v))

    badge_color = tmpl_data["color"]
    badge_label = tmpl_data["badge"]
    title_text = tmpl_data["title"]
    headline_text = tmpl_data["headline"]
    desc_text = tmpl_data["description"]

    # If custom body provided, replace variables in it
    custom_body_html = ""
    if custom_body_text:
        rendered_custom_body = custom_body_text
        for k, v in replacements.items():
            rendered_custom_body = rendered_custom_body.replace(k, str(v))
        custom_body_html = f"<div style='margin-bottom:20px; padding:15px; background:#f9fafb; border-left:4px solid {badge_color}; border-radius:4px; font-size:14px; color:#374151; white-space: pre-line;'>{rendered_custom_body}</div>"

    tracking_section = ""
    if event_type in ["shipment", "delivery", "completed"] and order.tracking_number:
        tracking_section = f"""
        <div style="margin-top: 15px; padding: 15px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <p style="margin:0; font-size: 12px; text-transform: uppercase; color: #1e40af; font-weight: bold;">Tracking & Carrier Information</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #1e3a8a;">
                Carrier: <strong>{carrier}</strong><br>
                Tracking Number: <strong style="font-family: monospace; font-size: 15px; color: #2563eb;">{tracking}</strong>
            </p>
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">{business_name}</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Order Notification #{order_num}</p>
            </div>

            <!-- Body Container -->
            <div style="padding: 28px;">
                
                <!-- Status Badge -->
                <div style="display: inline-block; padding: 4px 12px; background-color: {badge_color}15; border: 1px solid {badge_color}40; border-radius: 9999px; margin-bottom: 16px;">
                    <span style="font-size: 12px; font-weight: 600; color: {badge_color}; text-transform: uppercase;">{badge_label}</span>
                </div>

                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">{headline_text}</h2>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563;">Dear <strong>{customer_name}</strong>, {desc_text}</p>

                {custom_body_html}
                {tracking_section}

                <!-- Items Table -->
                <div style="margin-top: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div style="padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 13px; color: #374151;">Order Summary</div>
                    <div style="padding: 10px 14px;">
                        {items_html}
                    </div>
                </div>

                <!-- Summary Details -->
                <table style="width: 100%; margin-top: 16px; border-collapse: collapse; background: #f9fafb; border-radius: 8px; font-size: 13px;">
                    <tr>
                        <td style="padding: 10px 14px; color: #6b7280;">Total Amount:</td>
                        <td style="padding: 10px 14px; text-align: right; font-weight: 700; font-size: 15px; color: #111827;">{formatted_amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 14px; color: #6b7280; border-top: 1px solid #e5e7eb;">Payment Status:</td>
                        <td style="padding: 10px 14px; text-align: right; font-weight: 600; color: #111827; border-top: 1px solid #e5e7eb;">{payment_status_str}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 14px; color: #6b7280; border-top: 1px solid #e5e7eb;">Delivery Address:</td>
                        <td style="padding: 10px 14px; text-align: right; color: #111827; border-top: 1px solid #e5e7eb;">{address}</td>
                    </tr>
                </table>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px 0;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                    If you have questions about your order, please reply to this email.<br>
                    Powered by <strong>Saadhyam AI Order Management</strong>
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    return rendered_subject, html_content


async def get_user_order_smtp_config(db: AsyncSession, user_id: int) -> Dict[str, Any]:
    """
    Fetch per-user encrypted SMTP configuration from UserPlugin for 'sales_order_management'.
    Decrypts the password using EncryptionService.
    Falls back safely to system environment variables if user has not yet configured custom SMTP.
    """
    try:
        from models.plugins import Plugin, UserPlugin
        from services.encryption_service import EncryptionService

        plugin_stmt = select(Plugin).where(Plugin.plugin_key == "sales_order_management")
        plugin_res = await db.execute(plugin_stmt)
        plugin = plugin_res.scalars().first()
        if plugin:
            up_stmt = select(UserPlugin).where(
                UserPlugin.user_id == user_id,
                UserPlugin.plugin_id == plugin.id
            )
            up_res = await db.execute(up_stmt)
            user_plugin = up_res.scalars().first()
            if user_plugin and user_plugin.user_config:
                cfg = dict(user_plugin.user_config)
                enc_pass = cfg.get("smtp_password_encrypted", "")
                dec_pass = ""
                if enc_pass:
                    try:
                        dec_pass = EncryptionService().decrypt(enc_pass)
                    except Exception as e:
                        logger.warning(f"Failed to decrypt user SMTP password for user {user_id}: {e}")
                
                host = cfg.get("smtp_host") or os.getenv("SMTP_HOST", "smtp.gmail.com")
                port_val = cfg.get("smtp_port") or os.getenv("SMTP_PORT", 587)
                user = cfg.get("smtp_user") or os.getenv("SMTP_USER", "")
                password = dec_pass or os.getenv("SMTP_PASSWORD", "")
                from_email = cfg.get("from_email") or os.getenv("SMTP_FROM_EMAIL", user or "noreply@saadhyam.ai")
                business_name = cfg.get("business_name") or cfg.get("store_name") or ""
                enabled = cfg.get("email_notifications_enabled", True)
                templates = cfg.get("templates", {})
                currency = cfg.get("currency", "INR")
                contact_email = cfg.get("contact_email", "")
                setup_completed = cfg.get("setup_completed", None)

                return {
                    "setup_completed": setup_completed,
                    "currency": currency,
                    "contact_email": contact_email,
                    "enabled": enabled,
                    "provider": cfg.get("provider", "gmail"),
                    "host": host,
                    "port": int(port_val),
                    "user": user,
                    "password": password,
                    "from_email": from_email,
                    "business_name": business_name,
                    "store_name": business_name,
                    "templates": templates,
                    "is_custom": bool(cfg.get("smtp_user") and dec_pass),
                    "has_user_config": True
                }
    except Exception as e:
        logger.warning(f"Note loading user SMTP config for user {user_id}: {e}")

    # Fallback to system environment configuration
    env_user = os.getenv("SMTP_USER", "")
    env_pass = os.getenv("SMTP_PASSWORD", "")
    env_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    env_port = int(os.getenv("SMTP_PORT", 587))
    env_from = os.getenv("SMTP_FROM_EMAIL", env_user or "noreply@saadhyam.ai")

    return {
        "setup_completed": None,
        "currency": "INR",
        "contact_email": "",
        "enabled": True,
        "provider": "gmail",
        "host": env_host,
        "port": env_port,
        "user": env_user,
        "password": env_pass,
        "from_email": env_from,
        "business_name": "",
        "store_name": "",
        "templates": {},
        "is_custom": False,
        "has_user_config": False
    }


def test_smtp_connection(
    host: str,
    port: int,
    user: str,
    password: str,
    from_email: Optional[str] = None,
) -> Tuple[bool, str, Optional[str]]:
    """
    Test live SMTP connectivity and authentication synchronously.
    Returns (success, message, details).
    """
    if not host or not user or not password:
        return False, "SMTP Host, Username, and Password are all required.", "Missing fields"

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=8) as server:
                server.login(user, password)
        else:
            with smtplib.SMTP(host, port, timeout=8) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
        return True, "SMTP connection and authentication successful", f"Connected to {host}:{port} as {user}"
    except smtplib.SMTPAuthenticationError as e:
        return False, "SMTP Authentication Failed: Invalid username or password / app password.", str(e)
    except smtplib.SMTPConnectError as e:
        return False, f"Could not connect to SMTP server at {host}:{port}.", str(e)
    except Exception as e:
        return False, f"SMTP Connection Failed: {str(e)}", str(e)


async def send_order_email(
    order: Order,
    event_type: str,
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    Send non-blocking customer transactional email using user-scoped encrypted SMTP configuration.
    Supports events: 'confirmation', 'processing', 'shipment', 'delivery', 'completed', 'cancellation', 'payment_failure'.
    Catches all SMTP errors gracefully to preserve database transaction integrity.
    """
    recipient_email = order.customer_email
    if not recipient_email or not recipient_email.strip():
        logger.info(f"Skipping order email for Order #{order.order_number}: no customer email.")
        return {"success": False, "reason": "No recipient email"}

    smtp_cfg = await get_user_order_smtp_config(db, order.user_id)
    if not smtp_cfg.get("enabled", True):
        logger.info(f"Order email notification disabled by user settings for Order #{order.order_number}.")
        return {"success": True, "skipped": True, "reason": "Notifications disabled"}

    if not smtp_cfg["user"] or not smtp_cfg["password"]:
        logger.info(f"[EMAIL_SKIPPED] SMTP credentials not configured. Would send '{event_type}' email to {recipient_email} for Order #{order.order_number}.")
        return {"success": True, "simulated": True, "event": event_type}

    subject, html_content = render_order_email_html(
        order=order,
        event_type=event_type,
        custom_templates=smtp_cfg.get("templates"),
        business_name=smtp_cfg.get("business_name", "Saadhyam Store")
    )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_cfg["from_email"]
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_content, "html"))

        host = smtp_cfg["host"]
        port = smtp_cfg["port"]
        user = smtp_cfg["user"]
        password = smtp_cfg["password"]

        def _do_send():
            if port == 465:
                with smtplib.SMTP_SSL(host, port, timeout=8) as server:
                    server.login(user, password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(host, port, timeout=8) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(user, password)
                    server.send_message(msg)

        await asyncio.to_thread(_do_send)

        logger.info(f"Γ£ë∩╕Å Sent '{event_type}' notification email to {recipient_email} for Order #{order.order_number}")
        return {"success": True, "event": event_type, "recipient": recipient_email}
    except Exception as e:
        logger.warning(f"ΓÜá∩╕Å Failed to send order email ({event_type}) for Order #{order.order_number}: {e}")
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# 4. State Transition Engine
# ---------------------------------------------------------------------------

async def process_order_automation(
    order: Order,
    db: AsyncSession,
    trigger_event: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Evaluate and execute state transitions for an order.
    Automates:
      - pending -> confirmed -> processing (when payment=PAID and stock available)
      - cancellation (releases reserved inventory & sends cancellation email)
      - fulfillment progression (processing, shipment, delivery, completion)
    """
    actions_taken = []

    # 1. Handle Cancellation Trigger / Status
    if order.order_status == OrderStatus.CANCELLED or trigger_event == "cancellation":
        released, r_msg = await release_order_inventory(order, db)
        if released:
            actions_taken.append("released_inventory")
        await send_order_email(order, "cancellation", db)
        actions_taken.append("sent_cancellation_email")
        return {"success": True, "order_status": order.order_status.value, "actions": actions_taken}

    # 2. Payment Failure Handling
    if order.payment_status == PaymentStatus.FAILED or trigger_event == "payment_failed":
        await send_order_email(order, "payment_failure", db)
        actions_taken.append("sent_payment_failure_email")
        return {"success": True, "order_status": order.order_status.value, "actions": actions_taken}

    # 3. Auto-Advance & Reservation: PENDING / CONFIRMED -> PROCESSING (when PAID & stock available)
    if order.order_status in [OrderStatus.PENDING, OrderStatus.CONFIRMED] and order.payment_status == PaymentStatus.PAID and not order.inventory_reserved:
        reserved, res_msg = await reserve_order_inventory(order, db)
        if reserved:
            order.order_status = OrderStatus.CONFIRMED
            history = list(order.status_history or [])
            history.append({
                "from_status": "pending",
                "status": "confirmed",
                "timestamp": datetime.utcnow().isoformat(),
                "note": "Order confirmed automatically after payment verification & stock reservation."
            })
            order.status_history = history
            actions_taken.append("confirmed_order")

            # Move to processing
            order.order_status = OrderStatus.PROCESSING
            history.append({
                "from_status": "confirmed",
                "status": "processing",
                "timestamp": datetime.utcnow().isoformat(),
                "note": "Order moved to fulfillment processing."
            })
            order.status_history = history
            order.updated_at = datetime.utcnow()
            actions_taken.append("processing_order")

            # Send confirmation and processing email
            await send_order_email(order, "confirmation", db)
            actions_taken.append("sent_confirmation_email")
        else:
            # Stock unavailable hold
            history = list(order.status_history or [])
            history.append({
                "from_status": "pending",
                "status": "pending",
                "timestamp": datetime.utcnow().isoformat(),
                "note": f"Fulfillment hold: {res_msg}"
            })
            order.status_history = history
            actions_taken.append("inventory_hold")

    # 4. Handle Explicit Trigger / Status Changes
    if trigger_event == "processing" or (order.order_status == OrderStatus.PROCESSING and "processing_order" not in actions_taken):
        await send_order_email(order, "processing", db)
        actions_taken.append("sent_processing_email")

    elif trigger_event == "shipped" or order.order_status == OrderStatus.SHIPPED:
        ensure_carrier_and_tracking(order)
        await send_order_email(order, "shipment", db)
        actions_taken.append("sent_shipment_email")

    elif trigger_event == "delivered" or order.order_status == OrderStatus.DELIVERED:
        await send_order_email(order, "delivery", db)
        actions_taken.append("sent_delivery_email")

    elif trigger_event == "completed" or order.order_status == OrderStatus.COMPLETED:
        await finalize_shipped_inventory(order, db)
        actions_taken.append("finalized_inventory")
        await send_order_email(order, "completed", db)
        actions_taken.append("sent_completed_email")

    if actions_taken:
        try:
            await db.commit()
        except Exception as e:
            logger.warning(f"Note during workflow commit: {e}")

    return {
        "success": True,
        "order_status": order.order_status.value if hasattr(order.order_status, "value") else str(order.order_status),
        "payment_status": order.payment_status.value if hasattr(order.payment_status, "value") else str(order.payment_status),
        "inventory_reserved": order.inventory_reserved,
        "actions": actions_taken,
    }
