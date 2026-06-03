#!/usr/bin/env python
"""
Simulate an upgrade checkout for the user with email containing 'surya'.
This script finds the user, computes the amount due to upgrade to Premium (₹4,999),
updates the user's plan fields to simulate a successful payment, and prints before/after.
"""
import sys
from datetime import datetime

try:
    from config.database import get_db_for_migration
    from models.user import User
except Exception as e:
    print('IMPORT_ERROR', e)
    sys.exit(2)


def main():
    db = get_db_for_migration()
    try:
        user = db.query(User).filter(User.email.ilike('%surya%')).first()
        if not user:
            print('NO_USER')
            return

        print('BEFORE:', user.id, user.email, user.selected_plan_key, user.selected_plan_amount_paid)

        # Compute current paid
        current_paid = 0.0
        if user.selected_plan_amount_paid is not None:
            current_paid = float(user.selected_plan_amount_paid)
        elif user.selected_plan_price:
            digits = ''.join(ch for ch in str(user.selected_plan_price) if ch.isdigit())
            current_paid = float(digits) if digits else 0.0

        target_price = 4999.0
        amount_due = max(0.0, target_price - current_paid)
        payment_id = f"test-razorpay-{int(datetime.utcnow().timestamp())}"

        # Update user to premium, simulate persisting only the delta as amount_paid
        user.selected_plan_key = 'premium'
        user.selected_plan_name = 'Premium Pack'
        user.selected_plan_price = '₹4,999'
        user.selected_plan_payment_id = payment_id
        user.selected_plan_amount_paid = amount_due
        user.selected_plan_currency = 'INR'
        user.selected_plan_status = 'active'
        user.selected_plan_purchased_at = datetime.utcnow()

        db.commit()
        db.refresh(user)

        print('AFTER:', user.id, user.email, user.selected_plan_key, user.selected_plan_amount_paid)

    except Exception as exc:
        print('ERROR', exc)
    finally:
        db.close()


if __name__ == '__main__':
    main()
