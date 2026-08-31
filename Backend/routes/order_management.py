"""
Sales Order Management Routes ΓÇö Authenticated CRUD Endpoints.
Enforces multi-tenant workspace isolation by filtering all queries against current_user.id.
Supports Soft Delete, Statistics, Export, and Health Diagnostics.
"""

import logging
import uuid
import csv
import io
from datetime import datetime, date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, desc, or_, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.order import Order, OrderItem, InventoryItem, OrderStatus, PaymentStatus
from models.user import User
from models.plugins import Plugin, UserPlugin
from schemas.order_management import (
    CreateOrderRequest,
    UpdateOrderRequest,
    UpdateOrderStatusRequest,
    OrderResponse,
    OrderListResponse,
    OrderItemResponse,
    InventoryItemResponse,
    UpdateInventoryRequest,
    InventoryListResponse,
    OrderSMTPConfigRequest,
    OrderSMTPConfigResponse,
    OrderSMTPTestRequest,
    OrderSMTPTestResponse,
    OrderPaymentWebhookRequest,
    EmailTemplateItem,
)
from utils.dependencies import get_current_user
from services.order_automation_service import (
    process_order_automation,
    release_order_inventory,
    get_or_create_inventory_item,
    validate_status_transition,
    get_user_order_smtp_config,
    test_smtp_connection,
    DEFAULT_EMAIL_TEMPLATES,
)
from services.encryption_service import EncryptionService
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["Order Management"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _get_order_or_404(
    order_id: int,
    user_id: int,
    db: AsyncSession,
) -> Order:
    """Fetch a non-deleted sales order belonging to the current user or raise HTTP 404."""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
            Order.is_deleted == False,
        )
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found",
        )
    return order


async def _generate_sequential_order_number(session: AsyncSession, attempt: int = 1) -> str:
    """Generate unique sequential order number SO-YYYY-XXXXXX globally across all users."""
    year = datetime.utcnow().year
    prefix = f"SO-{year}-"
    
    stmt = (
        select(Order.order_number)
        .where(Order.order_number.like(f"{prefix}%"))
        .order_by(desc(Order.id))
        .limit(20)
    )
    result = await session.execute(stmt)
    recent_order_nums = result.scalars().all()

    max_seq = 0
    for num_str in recent_order_nums:
        if not num_str:
            continue
        try:
            parts = str(num_str).split("-")
            if len(parts) >= 3 and parts[-1].isdigit():
                val = int(parts[-1])
                if val > max_seq:
                    max_seq = val
        except (ValueError, IndexError):
            pass

    next_seq = max_seq + (attempt - 1) + 1
    order_num = f"{prefix}{next_seq:06d}"
    logger.info(f"[ORDER_NUMBER] Generated Order Number: {order_num} (max_seq={max_seq}, attempt={attempt})")
    return order_num


# ---------------------------------------------------------------------------
# Static Route Endpoints (Must appear before parameterized /{id} routes)
# ---------------------------------------------------------------------------

@router.get("/statistics")
async def get_order_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve aggregated order metrics for the dashboard."""
    try:
        stmt = select(Order).where(and_(Order.user_id == current_user.id, Order.is_deleted == False))
        result = await db.execute(stmt)
        all_orders = result.scalars().all()

        total_orders = len(all_orders)
        pending_orders = sum(1 for o in all_orders if o.order_status == OrderStatus.PENDING)
        active_shipments = sum(1 for o in all_orders if o.order_status == OrderStatus.SHIPPED)
        completed_orders = sum(1 for o in all_orders if o.order_status in [OrderStatus.DELIVERED, OrderStatus.COMPLETED])
        cancelled_orders = sum(1 for o in all_orders if o.order_status == OrderStatus.CANCELLED)

        today = date.today()
        todays_orders = sum(1 for o in all_orders if o.created_at and o.created_at.date() == today)

        paid_orders = [o for o in all_orders if o.payment_status == PaymentStatus.PAID and o.order_status != OrderStatus.CANCELLED]
        total_revenue = sum(o.total_amount for o in paid_orders)
        paid_orders_count = len(paid_orders)
        avg_order_value = total_revenue / paid_orders_count if paid_orders_count > 0 else 0.0

        return {
            "success": True,
            "data": {
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "active_shipments": active_shipments,
                "completed_orders": completed_orders,
                "cancelled_orders": cancelled_orders,
                "todays_orders": todays_orders,
                "total_revenue": round(total_revenue, 2),
                "average_order_value": round(avg_order_value, 2),
            }
        }
    except Exception as e:
        logger.error(f"Failed to fetch order statistics for user_id={current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve order statistics: {str(e)}"
        )


@router.get("/export")
async def export_orders(
    format: str = Query("csv", description="Export format: csv or excel"),
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None, alias="query"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export orders matching current search & status filters."""
    try:
        stmt = select(Order).where(and_(Order.user_id == current_user.id, Order.is_deleted == False))

        if status_filter:
            stmt = stmt.where(Order.order_status == status_filter)

        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Order.customer_name.ilike(term),
                    Order.order_number.ilike(term),
                    Order.customer_email.ilike(term),
                )
            )

        stmt = stmt.order_by(desc(Order.created_at))
        result = await db.execute(stmt)
        orders = result.scalars().all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Order Number", "Customer Name", "Email", "Phone", "Total Amount", "Order Status", "Payment Status", "Created At"])

        for o in orders:
            writer.writerow([
                o.order_number,
                o.customer_name,
                o.customer_email or "",
                o.customer_phone or "",
                o.total_amount,
                o.order_status.value if hasattr(o.order_status, "value") else str(o.order_status),
                o.payment_status.value if hasattr(o.payment_status, "value") else str(o.payment_status),
                o.created_at.isoformat() if o.created_at else "",
            ])

        filename = f"sales_orders_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Failed to export orders for user_id={current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export orders: {str(e)}"
        )


@router.get("/health")
async def plugin_health_check():
    """Diagnostic health check for Sales Order Management plugin."""
    return {
        "status": "healthy",
        "code": 200,
        "plugin_key": "sales_order_management",
        "plugin_version": "v1.0",
        "manifest_version": "v1.0",
        "schema_version": "v1.0",
        "database_status": "connected",
        "health_status": "healthy",
    }


# ---------------------------------------------------------------------------
# Order Management SMTP & Transactional Email Settings Endpoints
# ---------------------------------------------------------------------------

@router.get("/config", response_model=OrderSMTPConfigResponse)
async def get_order_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get authenticated user's Order Management SMTP settings & email templates.
    SMTP password is encrypted at rest and always returned masked as boolean flag.
    Never fails or throws 404/500 if unconfigured; returns safe defaults.
    """
    try:
        cfg = await get_user_order_smtp_config(db, current_user.id)
    except Exception as e:
        logger.warning(f"Error reading user SMTP config for user {current_user.id}: {e}")
        cfg = {
            "setup_completed": False,
            "currency": "INR",
            "contact_email": "",
            "enabled": True,
            "provider": "gmail",
            "host": "smtp.gmail.com",
            "port": 587,
            "user": "",
            "password": "",
            "from_email": "",
            "business_name": "",
            "store_name": "",
            "templates": {},
            "is_custom": False,
        }

    templates_dict = {}
    for ev_key, tmpl in DEFAULT_EMAIL_TEMPLATES.items():
        sub = tmpl["subject"]
        body = ""
        custom_t = cfg.get("templates", {})
        if custom_t and ev_key in custom_t:
            ct = custom_t[ev_key]
            if isinstance(ct, dict):
                sub = ct.get("subject") or sub
                body = ct.get("body") or body
        templates_dict[ev_key] = EmailTemplateItem(subject=sub, body=body)

    smtp_user = cfg.get("user", "")
    from_email = cfg.get("from_email", "")
    provider = cfg.get("provider", "gmail")
    smtp_host = cfg.get("host", "smtp.gmail.com")
    smtp_port = int(cfg.get("port", 587))
    enabled = cfg.get("enabled", True)
    biz_name = cfg.get("business_name", "")
    currency = cfg.get("currency", "INR")
    contact_email = cfg.get("contact_email", "")

    # Determine setup completion: check explicit flag or backward compatibility
    setup_completed = cfg.get("setup_completed")
    if setup_completed is None:
        # Backward-compatibility: Check if existing user has real orders or configured SMTP/store
        order_count_res = await db.execute(
            select(func.count(Order.id)).where(Order.user_id == current_user.id, Order.is_deleted == False)
        )
        order_count = order_count_res.scalar() or 0
        has_user_cfg = bool(cfg.get("has_user_config"))
        setup_completed = bool(order_count > 0 or (has_user_cfg and (biz_name or smtp_user)))

    display_biz_name = biz_name or "Saadhyam Store"

    return OrderSMTPConfigResponse(
        success=True,
        setup_completed=bool(setup_completed),
        email_notifications_enabled=enabled,
        email_enabled=enabled,
        provider=provider,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_user=smtp_user,
        smtp_username=smtp_user,
        is_password_configured=bool(cfg.get("password")),
        from_email=from_email,
        sender_email=from_email,
        business_name=biz_name,
        store_name=biz_name,
        currency=currency,
        contact_email=contact_email,
        templates=templates_dict,
    )


@router.post("/config", response_model=OrderSMTPConfigResponse)
async def save_order_config(
    payload: OrderSMTPConfigRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Save authenticated user's Order Management SMTP settings, store onboarding, & templates.
    Encrypts sensitive SMTP password/app-password before storing in database.
    """
    try:
        # Find or create UserPlugin for sales_order_management
        plugin_stmt = select(Plugin).where(Plugin.plugin_key == "sales_order_management")
        plugin_res = await db.execute(plugin_stmt)
        plugin = plugin_res.scalars().first()

        if not plugin:
            # Fallback create plugin definition if missing
            plugin = Plugin(
                plugin_key="sales_order_management",
                name="Order Management",
                category="sales",
                version="1.0.0",
                description="End-to-end sales order processing, stock reservation, tracking, and transactional emails.",
                is_active=True
            )
            db.add(plugin)
            await db.flush()

        up_stmt = select(UserPlugin).where(
            UserPlugin.user_id == current_user.id,
            UserPlugin.plugin_id == plugin.id
        )
        up_res = await db.execute(up_stmt)
        user_plugin = up_res.scalars().first()

        if not user_plugin:
            user_plugin = UserPlugin(
                user_id=current_user.id,
                plugin_id=plugin.id,
                is_enabled=True,
                user_config={}
            )
            db.add(user_plugin)

        existing_config = dict(user_plugin.user_config or {})

        # Handle password encryption
        encrypted_pass = existing_config.get("smtp_password_encrypted", "")
        if payload.smtp_password and payload.smtp_password.strip():
            encrypted_pass = EncryptionService().encrypt(payload.smtp_password.strip())

        # Serialize templates
        tmpl_dict = {}
        if payload.templates:
            for k, v in payload.templates.items():
                tmpl_dict[k] = {"subject": v.subject, "body": v.body}

        smtp_user = (payload.smtp_user or payload.smtp_username or existing_config.get("smtp_user", "")).strip()
        from_email = (payload.from_email or payload.sender_email or smtp_user or existing_config.get("from_email", "")).strip()
        provider = payload.provider or existing_config.get("provider", "gmail")
        smtp_host = (payload.smtp_host or existing_config.get("smtp_host", "smtp.gmail.com")).strip()
        smtp_port = payload.smtp_port or existing_config.get("smtp_port", 587)
        enabled = payload.email_notifications_enabled if payload.email_notifications_enabled is not None else (payload.email_enabled if payload.email_enabled is not None else True)
        business_name = (payload.business_name or payload.store_name or existing_config.get("business_name", "")).strip()
        currency = (payload.currency or existing_config.get("currency", "INR")).strip()
        contact_email = (payload.contact_email or existing_config.get("contact_email", "")).strip()

        # Onboarding setup completed flag
        setup_completed = payload.setup_completed if payload.setup_completed is not None else existing_config.get("setup_completed", True)

        updated_config = {
            **existing_config,
            "setup_completed": bool(setup_completed),
            "currency": currency,
            "contact_email": contact_email,
            "email_notifications_enabled": enabled,
            "provider": provider,
            "smtp_host": smtp_host,
            "smtp_port": smtp_port,
            "smtp_user": smtp_user,
            "smtp_password_encrypted": encrypted_pass,
            "from_email": from_email,
            "business_name": business_name,
            "store_name": business_name,
            "templates": tmpl_dict if tmpl_dict else existing_config.get("templates", {}),
            "updated_at": datetime.utcnow().isoformat(),
        }

        user_plugin.user_config = updated_config
        await db.commit()
        await db.refresh(user_plugin)

        logger.info(f"≡ƒöÆ Saved Order Management configuration for user_id={current_user.id} (setup_completed={setup_completed})")

        return OrderSMTPConfigResponse(
            success=True,
            setup_completed=bool(setup_completed),
            email_notifications_enabled=enabled,
            email_enabled=enabled,
            provider=provider,
            smtp_host=smtp_host,
            smtp_port=smtp_port,
            smtp_user=smtp_user,
            smtp_username=smtp_user,
            is_password_configured=bool(encrypted_pass),
            from_email=from_email,
            sender_email=from_email,
            business_name=business_name,
            store_name=business_name,
            currency=currency,
            contact_email=contact_email,
            templates=payload.templates or {},
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save order SMTP config for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save configuration: {str(e)}"
        )


@router.post("/config/test-smtp", response_model=OrderSMTPTestResponse)
async def test_order_smtp_endpoint(
    payload: OrderSMTPTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Test live SMTP connection and authentication for the user without exposing credentials.
    Uses provided password or loads user's saved encrypted password.
    """
    host = (payload.smtp_host or "smtp.gmail.com").strip()
    port = payload.smtp_port or 587
    user = (payload.smtp_user or payload.smtp_username or "").strip()
    password = payload.smtp_password or ""
    from_email = (payload.from_email or payload.sender_email or user).strip()

    if not user or not password:
        # Load from saved user config
        saved_cfg = await get_user_order_smtp_config(db, current_user.id)
        if not user:
            user = saved_cfg.get("user", "")
        if not password:
            password = saved_cfg.get("password", "")
        if not from_email:
            from_email = saved_cfg.get("from_email", user)

    if not user:
        return OrderSMTPTestResponse(
            success=False,
            message="SMTP Username / Email is required."
        )

    if not password:
        return OrderSMTPTestResponse(
            success=False,
            message="No SMTP password provided or configured. Please enter your SMTP Password or App Password."
        )

    # Run connection test in worker thread
    success, message, details = await asyncio.to_thread(
        test_smtp_connection,
        host=host,
        port=port,
        user=user,
        password=password,
        from_email=from_email
    )

    return OrderSMTPTestResponse(
        success=success,
        message=message,
        details=details
    )


# ---------------------------------------------------------------------------
# Payment Gateway Webhook Endpoint (Stage 2 Architecture)
# ---------------------------------------------------------------------------

@router.post("/payment/webhook", response_model=OrderResponse)
@router.post("/webhook/payment", response_model=OrderResponse)
async def order_payment_webhook(
    payload: OrderPaymentWebhookRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Dedicated Payment Gateway Webhook for standalone Order Management.
    Receives automated payment verification from gateways (Razorpay, Stripe, Cashfree, etc.),
    updates payment status to 'paid', reserves stock, confirms order, and triggers customer notifications.
    """
    if not payload.order_id and not payload.order_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either order_id or order_number is required in payment webhook payload."
        )

    stmt = select(Order).where(Order.is_deleted == False)
    if payload.order_id:
        stmt = stmt.where(Order.id == payload.order_id)
    else:
        stmt = stmt.where(Order.order_number == payload.order_number.strip())

    res = await db.execute(stmt)
    order = res.scalars().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order not found for webhook: {payload.order_id or payload.order_number}"
        )

    old_payment = order.payment_status
    order.payment_status = payload.payment_status
    order.updated_at = datetime.utcnow()

    # Append to status history
    history = list(order.status_history or [])
    history.append({
        "event": "payment_webhook",
        "gateway": payload.gateway_name or "gateway",
        "transaction_id": payload.transaction_id,
        "amount": payload.amount,
        "from_payment_status": old_payment.value if hasattr(old_payment, "value") else str(old_payment),
        "new_payment_status": payload.payment_status.value if hasattr(payload.payment_status, "value") else str(payload.payment_status),
        "timestamp": datetime.utcnow().isoformat(),
        "notes": payload.notes or f"Verified payment received via {payload.gateway_name or 'gateway'}"
    })
    order.status_history = history
    await db.commit()

    # Trigger automation for payment update (reserves inventory, confirms order, sends email)
    if payload.payment_status == PaymentStatus.PAID:
        await process_order_automation(order, db, trigger_event="payment_paid")
    elif payload.payment_status == PaymentStatus.FAILED:
        await process_order_automation(order, db, trigger_event="payment_failed")

    await db.refresh(order)
    logger.info(f"≡ƒÆ│ Payment webhook processed for Order #{order.order_number}: {payload.payment_status}")
    return OrderResponse.from_orm(order)


# ---------------------------------------------------------------------------
# Inventory Endpoints
# ---------------------------------------------------------------------------

@router.get("/inventory", response_model=InventoryListResponse)
async def list_inventory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List inventory stock items for the current user."""
    stmt = select(InventoryItem).where(InventoryItem.user_id == current_user.id).order_by(InventoryItem.product_name)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return InventoryListResponse(
        success=True,
        total=len(items),
        inventory=[InventoryItemResponse.from_orm(i) for i in items],
    )


@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_inventory(
    item_id: int,
    payload: UpdateInventoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Adjust stock quantity or SKU for an inventory item."""
    stmt = select(InventoryItem).where(and_(InventoryItem.id == item_id, InventoryItem.user_id == current_user.id))
    result = await db.execute(stmt)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory item ID {item_id} not found")

    if payload.available_stock is not None:
        item.available_stock = payload.available_stock
    if payload.sku is not None:
        item.sku = payload.sku

    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return InventoryItemResponse.from_orm(item)


# ---------------------------------------------------------------------------
# Order List & Create Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=OrderListResponse)
@router.get("/", response_model=OrderListResponse)
async def list_orders(
    order_status: Optional[OrderStatus] = Query(None, alias="status", description="Filter by order status"),
    search: Optional[str] = Query(None, alias="query", description="Search by customer name, order #, or address"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=100, description="Pagination limit size"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all non-deleted sales orders belonging to current user."""
    try:
        stmt = select(Order).where(and_(Order.user_id == current_user.id, Order.is_deleted == False))

        if order_status:
            stmt = stmt.where(Order.order_status == order_status)

        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Order.customer_name.ilike(term),
                    Order.order_number.ilike(term),
                    Order.shipping_address.ilike(term),
                    Order.customer_email.ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        stmt = stmt.order_by(desc(Order.created_at)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        orders = result.scalars().all()

        return OrderListResponse(
            success=True,
            total=total,
            orders=[OrderResponse.from_orm(o) for o in orders],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch orders for user_id={current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve orders: {str(e)}",
        )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new sales order with sequential numbering (SO-YYYY-XXXXXX)."""
    try:
        if not payload.items or len(payload.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order must contain at least one line item.",
            )

        generated_order_number = await _generate_sequential_order_number(db)

        calculated_total = 0.0
        order_items = []

        for item_data in payload.items:
            line_total = item_data.quantity * item_data.unit_price
            calculated_total += line_total
            order_items.append(
                OrderItem(
                    product_name=item_data.product_name,
                    sku=item_data.sku,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    total_price=line_total,
                )
            )

        total_amount = payload.total_amount if payload.total_amount is not None else calculated_total

        new_order = Order(
            user_id=current_user.id,
            order_number=generated_order_number,
            customer_name=payload.customer_name,
            customer_email=str(payload.customer_email) if payload.customer_email else None,
            customer_phone=payload.customer_phone,
            shipping_address=payload.shipping_address,
            total_amount=total_amount,
            payment_status=payload.payment_status or PaymentStatus.PENDING,
            order_status=payload.order_status or OrderStatus.PENDING,
            carrier_name=payload.carrier_name,
            tracking_number=payload.tracking_number,
            notes=payload.notes,
            is_deleted=False,
            created_by=current_user.id,
            updated_by=current_user.id,
            status_history=[{
                "status": OrderStatus.PENDING.value,
                "timestamp": datetime.utcnow().isoformat(),
                "updated_by": current_user.id,
                "note": "Order created via REST API."
            }],
            items=order_items,
        )

        db.add(new_order)
        await db.commit()
        await db.refresh(new_order)

        # Trigger automated order workflow
        await process_order_automation(new_order, db)
        await db.refresh(new_order)

        logger.info(f"Γ£à Order #{new_order.order_number} created & automated for user_id={current_user.id} (ID: {new_order.id})")
        return OrderResponse.from_orm(new_order)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create order for user_id={current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create sales order: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Parameterized Order ID Endpoints (Must appear after static endpoints)
# ---------------------------------------------------------------------------

@router.get("/{id}", response_model=OrderResponse)
async def get_order(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details of a specific sales order by ID."""
    order = await _get_order_or_404(id, current_user.id, db)
    return OrderResponse.from_orm(order)


@router.put("/{id}", response_model=OrderResponse)
async def update_order(
    id: int,
    payload: UpdateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update customer details, shipping address, or carrier notes for an existing order."""
    try:
        order = await _get_order_or_404(id, current_user.id, db)

        if payload.customer_name is not None:
            order.customer_name = payload.customer_name
        if payload.customer_email is not None:
            order.customer_email = str(payload.customer_email) if payload.customer_email else None
        if payload.customer_phone is not None:
            order.customer_phone = payload.customer_phone
        if payload.shipping_address is not None:
            order.shipping_address = payload.shipping_address
        if payload.payment_status is not None:
            order.payment_status = payload.payment_status
        if payload.order_status is not None:
            is_valid, err_msg = validate_status_transition(order.order_status, payload.order_status)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=err_msg,
                )
            order.order_status = payload.order_status
        if payload.carrier_name is not None:
            order.carrier_name = payload.carrier_name
        if payload.tracking_number is not None:
            order.tracking_number = payload.tracking_number
        if payload.notes is not None:
            order.notes = payload.notes

        order.updated_at = datetime.utcnow()
        order.updated_by = current_user.id

        await db.commit()
        await db.refresh(order)
        logger.info(f"Γ£Å∩╕Å Order #{order.order_number} (ID: {id}) updated by user_id={current_user.id}")
        return OrderResponse.from_orm(order)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update order id={id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order: {str(e)}",
        )


@router.put("/{id}/status", response_model=OrderResponse)
async def update_order_status(
    id: int,
    payload: UpdateOrderStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Dedicated endpoint for advancing order status or payment status.
    Strictly validates lifecycle state machine transitions:
    pending -> confirmed -> shipped -> delivered -> completed.
    Triggers automated inventory reservation/release and customer transactional emails.
    """
    try:
        order = await _get_order_or_404(id, current_user.id, db)
        old_status = order.order_status
        old_payment = order.payment_status
        new_status = payload.order_status
        new_payment = payload.payment_status or old_payment

        # Validate order status transition
        if new_status and new_status != old_status:
            is_valid, err_msg = validate_status_transition(old_status, new_status)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=err_msg,
                )
            order.order_status = new_status

        # Update carrier/tracking if provided
        if payload.carrier_name is not None:
            order.carrier_name = payload.carrier_name.strip()
        if payload.tracking_number is not None:
            order.tracking_number = payload.tracking_number.strip()
        if payload.notes is not None:
            order.notes = payload.notes.strip()

        order.payment_status = new_payment
        order.updated_at = datetime.utcnow()
        order.updated_by = current_user.id

        # Record event in status_history audit log
        history = list(order.status_history or [])
        history.append({
            "from_status": old_status.value if hasattr(old_status, "value") else str(old_status),
            "to_status": (new_status or old_status).value if hasattr(new_status or old_status, "value") else str(new_status or old_status),
            "from_payment": old_payment.value if hasattr(old_payment, "value") else str(old_payment),
            "to_payment": new_payment.value if hasattr(new_payment, "value") else str(new_payment),
            "timestamp": datetime.utcnow().isoformat(),
            "updated_by": current_user.id,
            "carrier_name": order.carrier_name,
            "tracking_number": order.tracking_number,
            "notes": payload.notes or "Status updated via API."
        })
        order.status_history = history

        await db.commit()
        await db.refresh(order)

        # Trigger order automation rules (inventory reservation/deduction/release + transactional emails)
        trigger_ev = None
        if new_payment == PaymentStatus.PAID and old_payment != PaymentStatus.PAID:
            trigger_ev = "payment_paid"
        elif new_status and new_status != old_status:
            trigger_ev = new_status.value

        await process_order_automation(order, db, trigger_event=trigger_ev)
        await db.refresh(order)

        logger.info(f"≡ƒÜÜ Order #{order.order_number} status updated to '{order.order_status}' with automation.")
        return OrderResponse.from_orm(order)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update order status for id={id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}",
        )


@router.delete("/{id}")
async def delete_order(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft Delete a sales order record."""
    try:
        order = await _get_order_or_404(id, current_user.id, db)
        order_number = order.order_number

        order.is_deleted = True
        order.order_status = OrderStatus.CANCELLED
        order.deleted_at = datetime.utcnow()
        order.deleted_by = current_user.id
        order.updated_at = datetime.utcnow()

        await db.commit()

        # Trigger automation for cancellation (releases inventory & sends email)
        await process_order_automation(order, db, trigger_event="cancellation")

        logger.info(f"≡ƒùæ∩╕Å Order #{order_number} (ID: {id}) soft deleted & inventory released for user_id={current_user.id}")
        return {
            "success": True,
            "message": f"Order #{order_number} deleted successfully",
            "id": id,
            "is_deleted": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to soft delete order id={id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete order: {str(e)}",
        )