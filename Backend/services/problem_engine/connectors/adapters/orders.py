"""
Order & E-Commerce Connector Adapter for Problem Discovery Engine
Ingests Order and OrderItem records from models/order.py
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from services.problem_engine.connectors.base import BaseBusinessConnector

logger = logging.getLogger(__name__)


class OrderConnector(BaseBusinessConnector):
    """Connector for Sales Order Management subsystem."""

    @property
    def connector_key(self) -> str:
        return "orders"

    @property
    def source_type(self) -> str:
        return "ecommerce"

    @property
    def display_name(self) -> str:
        return "Order & Sales Management"

    @property
    def description(self) -> str:
        return "Synchronizes customer orders, payment transactions, line items, and fulfillment events."

    async def test_connection(self, db: AsyncSession, user_id: int) -> bool:
        """Check if order model is queryable for tenant."""
        try:
            from models.order import Order
            stmt = select(Order.id).where(Order.user_id == user_id).limit(1)
            await db.execute(stmt)
            return True
        except Exception as e:
            logger.warning(f"OrderConnector test_connection failed for user {user_id}: {e}")
            return False

    async def fetch_entities(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.order import Order, OrderItem
        from sqlalchemy.orm import selectinload

        stmt = select(Order).where(Order.user_id == user_id).options(selectinload(Order.items))
        if since:
            stmt = stmt.where(Order.updated_at >= since)

        result = await db.execute(stmt)
        orders = result.scalars().all()

        entities = []
        for o in orders:
            order_status = str(o.order_status.value if hasattr(o.order_status, "value") else o.order_status)
            payment_status = str(o.payment_status.value if hasattr(o.payment_status, "value") else o.payment_status)

            props = {
                "order_number": o.order_number,
                "customer_name": o.customer_name,
                "customer_email": o.customer_email,
                "customer_phone": o.customer_phone,
                "total_amount": float(o.total_amount or 0.0),
                "currency": getattr(o, "currency", "INR"),
                "order_status": order_status,
                "payment_status": payment_status,
                "items_count": len(o.items) if o.items else 0,
                "channel": getattr(o, "channel", "direct"),
                "notes": o.notes,
            }

            entities.append({
                "entity_type": "order",
                "entity_key": f"order:{o.id}",
                "source_record_id": str(o.id),
                "display_name": f"Order #{o.order_number or o.id}",
                "status": order_status,
                "properties": self.sanitize(props),
                "created_at": o.created_at or datetime.utcnow(),
                "updated_at": o.updated_at or datetime.utcnow(),
            })

            # Also generate lightweight customer entity if customer info exists
            if o.customer_email or o.customer_name:
                cust_key = o.customer_email or f"cust_order_{o.id}"
                entities.append({
                    "entity_type": "customer",
                    "entity_key": f"customer:{cust_key}",
                    "source_record_id": str(cust_key),
                    "display_name": o.customer_name or o.customer_email,
                    "status": "ACTIVE",
                    "properties": self.sanitize({
                        "name": o.customer_name,
                        "email": o.customer_email,
                        "phone": o.customer_phone,
                        "last_order_id": str(o.id),
                    }),
                    "created_at": o.created_at or datetime.utcnow(),
                    "updated_at": o.updated_at or datetime.utcnow(),
                })

        return entities

    async def fetch_events(
        self, db: AsyncSession, user_id: int, since: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        from models.order import Order

        stmt = select(Order).where(Order.user_id == user_id)
        if since:
            stmt = stmt.where(Order.created_at >= since)

        result = await db.execute(stmt)
        orders = result.scalars().all()

        events = []
        for o in orders:
            order_status = str(o.order_status.value if hasattr(o.order_status, "value") else o.order_status).upper()
            payment_status = str(o.payment_status.value if hasattr(o.payment_status, "value") else o.payment_status).upper()

            # Base creation event
            events.append({
                "event_name": "order.created",
                "source": "orders",
                "entity_id": str(o.id),
                "payload": self.sanitize({
                    "order_id": o.id,
                    "order_number": o.order_number,
                    "total_amount": float(o.total_amount or 0.0),
                    "status": order_status,
                    "payment_status": payment_status,
                    "customer_name": o.customer_name,
                }),
                "occurred_at": o.created_at or datetime.utcnow(),
            })

            # Specific lifecycle events
            if order_status in ("CANCELLED", "VOID"):
                events.append({
                    "event_name": "order.cancelled",
                    "source": "orders",
                    "entity_id": str(o.id),
                    "payload": self.sanitize({
                        "order_id": o.id,
                        "total_amount": float(o.total_amount or 0.0),
                        "reason": o.notes or "Order cancelled by system/customer",
                    }),
                    "occurred_at": o.updated_at or datetime.utcnow(),
                })
            elif order_status in ("COMPLETED", "DELIVERED"):
                events.append({
                    "event_name": "order.completed",
                    "source": "orders",
                    "entity_id": str(o.id),
                    "payload": self.sanitize({
                        "order_id": o.id,
                        "total_amount": float(o.total_amount or 0.0),
                    }),
                    "occurred_at": o.updated_at or datetime.utcnow(),
                })

            if payment_status == "FAILED":
                events.append({
                    "event_name": "payment.failed",
                    "source": "orders",
                    "entity_id": str(o.id),
                    "payload": self.sanitize({
                        "order_id": o.id,
                        "amount": float(o.total_amount or 0.0),
                        "customer": o.customer_name,
                    }),
                    "occurred_at": o.updated_at or datetime.utcnow(),
                })

        return events

    async def fetch_relationships(
        self, db: AsyncSession, user_id: int
    ) -> List[Dict[str, Any]]:
        from models.order import Order

        stmt = select(Order).where(Order.user_id == user_id)
        result = await db.execute(stmt)
        orders = result.scalars().all()

        rels = []
        for o in orders:
            if o.customer_email or o.customer_name:
                cust_key = o.customer_email or f"cust_order_{o.id}"
                rels.append({
                    "from_entity_key": f"customer:{cust_key}",
                    "to_entity_key": f"order:{o.id}",
                    "relationship_type": "placed",
                    "metadata": {"total_amount": float(o.total_amount or 0.0)},
                })
        return rels
