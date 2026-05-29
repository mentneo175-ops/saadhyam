"""
Migration: Add subscription pack fields to users table
Stores the selected plan details after a successful Razorpay payment.
"""

import logging
from sqlalchemy import inspect, text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def migrate_add_subscription_pack_fields():
    """Add subscription pack fields to the users table if missing."""

    try:
        logger.info("🔄 Running migration: Add subscription pack fields...")

        inspector = inspect(sync_engine)
        existing_columns = [column["name"] for column in inspector.get_columns("users")]

        new_columns = [
            ("selected_plan_key", "VARCHAR(50)"),
            ("selected_plan_name", "VARCHAR(255)"),
            ("selected_plan_price", "VARCHAR(50)"),
            ("selected_plan_payment_id", "VARCHAR(255)"),
            ("selected_plan_coupon_code", "VARCHAR(50)"),
            ("selected_plan_amount_paid", "FLOAT"),
            ("selected_plan_currency", "VARCHAR(10)"),
            ("selected_plan_status", "VARCHAR(50)"),
            ("selected_plan_purchased_at", "TIMESTAMP"),
        ]

        with sync_engine.connect() as connection:
            for column_name, column_type in new_columns:
                if column_name in existing_columns:
                    logger.info(f"   ⏭️  Column already exists: {column_name}")
                    continue

                logger.info(f"   Adding column: {column_name}")
                if "sqlite" in str(sync_engine.url):
                    if column_name == "selected_plan_purchased_at":
                        sql = f"ALTER TABLE users ADD COLUMN {column_name} DATETIME"
                    else:
                        sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                else:
                    if column_name == "selected_plan_purchased_at":
                        sql = f"ALTER TABLE users ADD COLUMN {column_name} TIMESTAMP NULL"
                    else:
                        sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type} NULL"

                connection.execute(text(sql))
                connection.commit()
                logger.info(f"   ✅ Added column: {column_name}")

        logger.info("✅ Migration completed: Subscription pack fields added")

    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate_add_subscription_pack_fields()