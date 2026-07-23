"""
Expense Tracker Plugin
Track business expenses with receipt scanning and categorization
"""

import logging
from typing import Dict, Any, List
from plugins.base import AIPlugin
import base64

logger = logging.getLogger(__name__)

class PluginMain(AIPlugin):
    """
    Expense Tracker Plugin Implementation
    """
    
    # Plugin metadata
    __plugin__ = True
    plugin_key = "finance_expense_tracker"
    plugin_name = "📊 Expense Tracker"
    plugin_description = "Track business expenses with receipt scanning and categorization"
    plugin_icon = "📊"
    plugin_category = "finance"
    plugin_version = "1.0.0"
    
    def get_info(self) -> Dict[str, Any]:
        """Return plugin information"""
        return {
            "key": self.plugin_key,
            "name": self.plugin_name,
            "description": self.plugin_description,
            "icon": self.plugin_icon,
            "category": self.plugin_category,
            "version": self.plugin_version
        }
    
    def get_actions(self) -> List[Dict[str, Any]]:
        """Return list of available actions"""
        return [
            {
                "action": "add_expense",
                "name": "Add Expense",
                "description": "Manually add a business expense",
                "parameters": {
                    "amount": {"type": "number", "required": True},
                    "description": {"type": "string", "required": True},
                    "category": {"type": "string", "required": True},
                    "date": {"type": "string", "required": True},
                    "payment_method": {"type": "string", "enum": ["cash", "credit_card", "debit_card", "bank_transfer", "check"], "default": "credit_card"},
                    "vendor": {"type": "string", "required": False},
                    "tax_deductible": {"type": "boolean", "default": True}
                }
            },
            {
                "action": "scan_receipt",
                "name": "Scan Receipt",
                "description": "Scan receipt image and extract expense data automatically",
                "parameters": {
                    "receipt_image": {"type": "string", "required": True, "description": "Base64 encoded receipt image"},
                    "auto_categorize": {"type": "boolean", "default": True}
                }
            },
            {
                "action": "get_expenses",
                "name": "Get Expenses",
                "description": "Retrieve expenses with filtering options",
                "parameters": {
                    "date_from": {"type": "string", "required": False},
                    "date_to": {"type": "string", "required": False},
                    "category": {"type": "string", "required": False},
                    "min_amount": {"type": "number", "required": False},
                    "max_amount": {"type": "number", "required": False},
                    "limit": {"type": "number", "default": 50}
                }
            },
            {
                "action": "get_categories",
                "name": "Get Categories",
                "description": "Get all expense categories with totals",
                "parameters": {
                    "period": {"type": "string", "enum": ["this_month", "last_month", "this_year", "last_year", "all_time"], "default": "this_month"}
                }
            },
            {
                "action": "generate_report",
                "name": "Generate Report",
                "description": "Generate expense report for specified period",
                "parameters": {
                    "report_type": {"type": "string", "enum": ["summary", "detailed", "tax_deductible"], "default": "summary"},
                    "period": {"type": "string", "enum": ["this_month", "last_month", "this_quarter", "last_quarter", "this_year", "last_year"], "required": True},
                    "format": {"type": "string", "enum": ["json", "csv", "pdf"], "default": "json"}
                }
            },
            {
                "action": "approve_expense",
                "name": "Approve Expense",
                "description": "Approve expense for reimbursement or payment",
                "parameters": {
                    "expense_id": {"type": "string", "required": True},
                    "approval_notes": {"type": "string", "required": False}
                }
            }
        ]
    
    def get_config_schema(self) -> Dict[str, Any]:
        """Return configuration schema"""
        return {
            "type": "object",
            "properties": {
                "expense_categories": {
                    "type": "array",
                    "default": [
                        "Travel", "Meals", "Office Supplies", "Software", "Marketing",
                        "Utilities", "Rent", "Insurance", "Professional Services", "Other"
                    ],
                    "description": "List of expense categories"
                },
                "receipt_scanning": {
                    "type": "boolean",
                    "default": True,
                    "description": "Enable AI-powered receipt scanning"
                },
                "approval_workflow": {
                    "type": "boolean",
                    "default": False,
                    "description": "Require approval for expenses above threshold"
                },
                "approval_threshold": {
                    "type": "number",
                    "default": 500.00,
                    "description": "Amount threshold requiring approval"
                },
                "default_currency": {
                    "type": "string",
                    "default": "USD",
                    "description": "Default currency for expenses"
                },
                "integration_accounting": {
                    "type": "string",
                    "enum": ["quickbooks", "xero", "freshbooks", "none"],
                    "default": "none",
                    "description": "Accounting system integration"
                }
            },
            "required": []
        }
    
    async def add_expense(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new expense manually"""
        try:
            amount = params["amount"]
            description = params["description"]
            category = params["category"]
            date = params["date"]
            payment_method = params.get("payment_method", "credit_card")
            vendor = params.get("vendor", "")
            tax_deductible = params.get("tax_deductible", True)
            
            self.logger.info(f"Adding expense: ${amount} for {description} in category {category}")
            
            # Validate category
            valid_categories = self.config.get("expense_categories", [])
            if category not in valid_categories and valid_categories:
                return {
                    "success": False,
                    "error": f"Invalid category. Valid categories: {', '.join(valid_categories)}"
                }
            
            # Generate expense ID
            expense_id = f"exp_{hash(f'{description}{date}{amount}') % 100000}"
            
            expense_data = {
                "expense_id": expense_id,
                "amount": amount,
                "currency": self.config.get("default_currency", "USD"),
                "description": description,
                "category": category,
                "date": date,
                "payment_method": payment_method,
                "vendor": vendor,
                "tax_deductible": tax_deductible,
                "status": "pending" if self.config.get("approval_workflow") and amount > self.config.get("approval_threshold", 500) else "approved",
                "receipt_attached": False,
                "created_at": "2024-01-01T10:00:00Z",
                "created_by": context.get("user_id")
            }
            
            return {
                "success": True,
                "message": f"Expense of ${amount} added successfully",
                "data": expense_data
            }
            
        except Exception as e:
            self.logger.error(f"Failed to add expense: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def scan_receipt(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Scan receipt image and extract expense data"""
        try:
            receipt_image = params["receipt_image"]
            auto_categorize = params.get("auto_categorize", True)
            
            self.logger.info("Processing receipt image with AI OCR")
            
            if not self.config.get("receipt_scanning", True):
                return {
                    "success": False,
                    "error": "Receipt scanning is disabled in configuration"
                }
            
            # In a real implementation, this would:
            # 1. Decode the base64 image
            # 2. Use OCR service (Google Vision, AWS Textract, etc.)
            # 3. Extract text from receipt
            # 4. Use AI to parse structured data
            # 5. Categorize expense automatically
            
            # Mock extracted data
            extracted_data = {
                "vendor": "Office Depot",
                "date": "2024-01-15",
                "amount": 87.50,
                "tax_amount": 7.50,
                "payment_method": "credit_card",
                "items": [
                    {"description": "HP Printer Paper", "amount": 45.99},
                    {"description": "Stapler Set", "amount": 25.99},
                    {"description": "Folder Pack", "amount": 15.52}
                ],
                "suggested_category": "Office Supplies" if auto_categorize else None,
                "confidence_score": 0.92,
                "receipt_number": "REC-789456123"
            }
            
            # Auto-create expense if confidence is high
            if extracted_data["confidence_score"] > 0.8:
                expense_result = await self.add_expense(context, {
                    "amount": extracted_data["amount"],
                    "description": f"Receipt from {extracted_data['vendor']}",
                    "category": extracted_data.get("suggested_category", "Other"),
                    "date": extracted_data["date"],
                    "payment_method": extracted_data["payment_method"],
                    "vendor": extracted_data["vendor"],
                    "tax_deductible": True
                })
                
                if expense_result["success"]:
                    expense_data = expense_result["data"]
                    expense_data["receipt_attached"] = True
                    expense_data["receipt_data"] = extracted_data
                    
                    return {
                        "success": True,
                        "message": "Receipt scanned and expense created automatically",
                        "data": {
                            "extraction_result": extracted_data,
                            "expense": expense_data,
                            "auto_created": True
                        }
                    }
            
            # Return extraction results for manual review
            return {
                "success": True,
                "message": "Receipt scanned successfully - please review extracted data",
                "data": {
                    "extraction_result": extracted_data,
                    "auto_created": False,
                    "requires_review": True
                }
            }
            
        except Exception as e:
            self.logger.error(f"Failed to scan receipt: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_expenses(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Get expenses with filtering"""
        try:
            date_from = params.get("date_from")
            date_to = params.get("date_to")
            category = params.get("category")
            min_amount = params.get("min_amount")
            max_amount = params.get("max_amount")
            limit = params.get("limit", 50)
            
            self.logger.info(f"Fetching expenses with filters: category={category}, date_from={date_from}, limit={limit}")
            
            # Mock expense data
            expenses = [
                {
                    "expense_id": "exp_12345",
                    "amount": 150.00,
                    "currency": "USD",
                    "description": "Client dinner at downtown restaurant",
                    "category": "Meals",
                    "date": "2024-01-15",
                    "vendor": "The Steakhouse",
                    "payment_method": "credit_card",
                    "tax_deductible": True,
                    "status": "approved",
                    "receipt_attached": True
                },
                {
                    "expense_id": "exp_12346",
                    "amount": 87.50,
                    "currency": "USD",
                    "description": "Office supplies from Office Depot",
                    "category": "Office Supplies",
                    "date": "2024-01-14",
                    "vendor": "Office Depot",
                    "payment_method": "credit_card",
                    "tax_deductible": True,
                    "status": "approved",
                    "receipt_attached": True
                },
                {
                    "expense_id": "exp_12347",
                    "amount": 2500.00,
                    "currency": "USD",
                    "description": "MacBook Pro for development team",
                    "category": "Equipment",
                    "date": "2024-01-12",
                    "vendor": "Apple Store",
                    "payment_method": "bank_transfer",
                    "tax_deductible": True,
                    "status": "pending_approval",
                    "receipt_attached": False
                }
            ]
            
            # Apply filters
            filtered_expenses = expenses
            
            if category:
                filtered_expenses = [e for e in filtered_expenses if e["category"] == category]
            
            if min_amount:
                filtered_expenses = [e for e in filtered_expenses if e["amount"] >= min_amount]
                
            if max_amount:
                filtered_expenses = [e for e in filtered_expenses if e["amount"] <= max_amount]
            
            # Apply limit
            filtered_expenses = filtered_expenses[:limit]
            
            # Calculate summary
            total_amount = sum(e["amount"] for e in filtered_expenses)
            tax_deductible_amount = sum(e["amount"] for e in filtered_expenses if e["tax_deductible"])
            
            return {
                "success": True,
                "message": f"Retrieved {len(filtered_expenses)} expenses",
                "data": {
                    "expenses": filtered_expenses,
                    "summary": {
                        "count": len(filtered_expenses),
                        "total_amount": total_amount,
                        "tax_deductible_amount": tax_deductible_amount,
                        "average_amount": total_amount / len(filtered_expenses) if filtered_expenses else 0
                    }
                }
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get expenses: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_report(self, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate expense report"""
        try:
            report_type = params.get("report_type", "summary")
            period = params["period"]
            format_type = params.get("format", "json")
            
            self.logger.info(f"Generating {report_type} report for {period} in {format_type} format")
            
            # Mock report data
            report_data = {
                "report_id": f"rpt_{hash(f'{report_type}{period}') % 10000}",
                "report_type": report_type,
                "period": period,
                "generated_at": "2024-01-01T10:00:00Z",
                "currency": self.config.get("default_currency", "USD"),
                "summary": {
                    "total_expenses": 15750.50,
                    "total_tax_deductible": 14200.25,
                    "expense_count": 42,
                    "average_expense": 375.01
                },
                "category_breakdown": [
                    {"category": "Travel", "amount": 5250.00, "count": 8, "percentage": 33.3},
                    {"category": "Meals", "amount": 3200.50, "count": 12, "percentage": 20.3},
                    {"category": "Office Supplies", "amount": 1850.25, "count": 15, "percentage": 11.7},
                    {"category": "Software", "amount": 2400.00, "count": 4, "percentage": 15.2},
                    {"category": "Marketing", "amount": 1750.75, "count": 2, "percentage": 11.1},
                    {"category": "Other", "amount": 1299.00, "count": 1, "percentage": 8.2}
                ],
                "monthly_trend": [
                    {"month": "Jan", "amount": 15750.50},
                    {"month": "Dec", "amount": 12450.75},
                    {"month": "Nov", "amount": 9875.25}
                ],
                "payment_method_breakdown": {
                    "credit_card": 12500.25,
                    "bank_transfer": 2750.00,
                    "cash": 500.25
                }
            }
            
            if report_type == "tax_deductible":
                report_data["tax_summary"] = {
                    "total_deductible": 14200.25,
                    "total_non_deductible": 1550.25,
                    "deductible_percentage": 90.2,
                    "estimated_tax_savings": 3550.06  # Assuming 25% tax rate
                }
            
            return {
                "success": True,
                "message": f"Report generated successfully",
                "data": report_data
            }
            
        except Exception as e:
            self.logger.error(f"Failed to generate report: {e}")
            return {
                "success": False,
                "error": str(e)
            }