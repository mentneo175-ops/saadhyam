"""
Migration: Add Order Management Plugin Tables
Creates database tables for the sales_order_management plugin:
  - orders
  - order_items
"""

import logging

from config.database import Base, sync_engine

logger = logging.getLogger(__name__)


def migrate_add_order_management_tables():
    """Create Order Management plugin tables in the database."""
    logger.info("≡ƒöä Running Order Management tables migration...")

    if sync_engine is None:
        logger.warning(
            "ΓÜá∩╕Å Sync database engine not available, skipping order management tables migration"
        )
        return

    try:
        import models  # noqa: F401 ΓÇö registers all models with Base
        from models.order import (
            Order,
            OrderItem,
            InventoryItem,
        )

        Base.metadata.create_all(
            bind=sync_engine,
            tables=[
                Order.__table__,
                OrderItem.__table__,
                InventoryItem.__table__,
            ],
        )
        logger.info("Γ£à Order Management tables migration completed successfully")
    except Exception as e:
        logger.error(f"Γ¥î Order Management tables migration failed: {e}")
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_add_order_management_tables()