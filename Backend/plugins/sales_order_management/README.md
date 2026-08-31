# Sales Order Management Plugin ΓÇö Developer & Architecture Guide

The **Sales Order Management Plugin** provides production-ready automated order creation, line item management, fulfillment tracking, audit trail logging, statistics calculation, and report exporting via AI Chat, Voice Commands, and REST APIs.

---

## 1. Plugin Architecture & Component Overview

```
+-------------------------------------------------------------------+
|                        Client Layer                               |
|        (AssistantWidget / VoiceAssistant / REST API)              |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               Universal Parameter Extractor                       |
|           (services/universal_parameter_extractor.py)              |
|        Extracts parameters & validates against schema             |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                   Sales Order Management Plugin                   |
|              (plugins/sales_order_management/main.py)              |
|   - Sequential Number Generator (SO-YYYY-XXXXXX)                  |
|   - Input Validation Rules                                        |
|   - Rich Structured Markdown AI Responses                         |
|   - Audit Trail & Soft Delete Engine                              |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                  SQLAlchemy Database Engine                       |
|                 (Order & OrderItem Models)                        |
+-------------------------------------------------------------------+
```

---

## 2. Production Features & Capabilities

1. **Validation Engine**:
   - Customer name required & must be $\ge 2$ characters.
   - Amount must be a positive number $> 0$.
   - Email format validation (`regex`).
   - Phone format validation (`regex`).
   - Valid order status enum: `pending`, `processing`, `shipped`, `delivered`, `cancelled`.
2. **Sequential Production Order Numbering**:
   - Replaces random UUIDs with `SO-YYYY-XXXXXX` (e.g. `SO-2026-000001`, `SO-2026-000002`).
   - Guarantees uniqueness per year & tenant.
3. **Audit Trail & Soft Delete**:
   - Orders track `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, and `status_history`.
   - Soft Delete sets `is_deleted = True`, hiding records from normal queries while preserving audit compliance.
4. **Search, Filtering, Sorting & Pagination**:
   - Search by Order Number, Customer Name, or Email.
   - Filter by Status (`pending`, `shipped`, `delivered`, `cancelled`).
   - Sorting: `newest`, `oldest`, `amount`, `customer`.
   - Paginated API & Plugin returns.
5. **Dashboard Statistics**:
   - Aggregates total revenue, today's order count, pending/completed/cancelled counts, and Average Order Value (AOV).
6. **Data Exporting**:
   - Supports exporting filtered orders to CSV, Excel, and PDF formats.

---

## 3. Exposed Plugin Actions

| Action | Description | Parameters |
|---|---|---|
| `create_order` | Create a sales order with sequential numbering | `customer_name` (req), `shipping_address`, `customer_email`, `customer_phone`, `total_amount`, `items` |
| `list_orders` | List orders with search, filter, sort & pagination | `status`, `query`, `sort`, `page`, `page_size` |
| `get_order` | Retrieve single order details & status history | `order_number` (req) |
| `update_order` | Update customer info or shipping address | `order_number` (req), `customer_name`, `customer_email`, `customer_phone`, `shipping_address` |
| `update_order_status` | Update fulfillment status & tracking number | `order_number` (req), `order_status` (req), `carrier_name`, `tracking_number` |
| `delete_order` | Soft delete an order record | `order_number` (req), `reason` |
| `get_statistics` | Fetch dashboard metrics & revenue analytics | None |
| `export_orders` | Export filtered orders to CSV / Excel | `format`, `status`, `query` |
| `get_health` | Diagnostic health & connectivity status | None |

---

## 4. REST API Endpoints

- `GET /api/orders` ΓÇö List orders (search, status filter, pagination)
- `POST /api/orders` ΓÇö Create new sales order
- `GET /api/orders/{id}` ΓÇö Get order details
- `PUT /api/orders/{id}` ΓÇö Update order details
- `PUT /api/orders/{id}/status` ΓÇö Update order status & tracking info
- `DELETE /api/orders/{id}` ΓÇö Soft delete order
- `GET /api/orders/statistics` ΓÇö Get aggregated dashboard metrics
- `GET /api/orders/export` ΓÇö Export orders to CSV
- `GET /api/orders/health` ΓÇö Plugin health check

---

## 5. Example Natural Language Prompts

- *"Create an order for Rahul worth $1200"*
- *"Create an order for Alice worth 5000"*
- *"Create an order for Bob worth Γé╣9999"*
- *"Show all pending orders"*
- *"Mark order SO-2026-000001 as shipped via BlueDart with tracking BD99283741"*
- *"Cancel order SO-2026-000002"*