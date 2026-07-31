// Comprehensive Plugin Marketplace Data for Saadhyam AI
// All 130+ enterprise plugins organized by categories

export interface Plugin {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  pricing: string;
  rating: number;
  installs: number;
  aiPowered?: boolean;
}

// Complete plugin list organized by categories
export const ALL_PLUGINS: Plugin[] = [
  // 🏢 SALES & CRM
  { id: "call-recording", name: "Call Recording & AI Analysis", category: "Sales & CRM", icon: "📞", description: "Record and analyze sales calls with AI transcription", pricing: "₹2,999/mo", rating: 4.8, installs: 1250, aiPowered: true },
  { id: "lead-scoring", name: "Lead Scoring AI", category: "Sales & CRM", icon: "🎯", description: "AI-powered lead qualification and scoring", pricing: "₹3,499/mo", rating: 4.7, installs: 980, aiPowered: true },
  { id: "email-marketing", name: "Email Marketing", category: "Sales & CRM", icon: "📧", description: "Create and manage email campaigns", pricing: "₹1,999/mo", rating: 4.6, installs: 2100 },
  { id: "sms-campaigns", name: "SMS Campaigns", category: "Sales & CRM", icon: "📱", description: "Bulk SMS with personalization", pricing: "₹999/mo", rating: 4.5, installs: 1800 },
  { id: "live-chat", name: "Live Chat", category: "Sales & CRM", icon: "�", description: "Real-time customer chat support", pricing: "₹1,499/mo", rating: 4.7, installs: 2300 },
  { id: "ai-sales-coach", name: "AI Sales Coach", category: "Sales & CRM", icon: "🤖", description: "AI coaching for sales teams", pricing: "₹4,999/mo", rating: 4.9, installs: 650, aiPowered: true },
  { id: "proposal-generator", name: "Proposal Generator", category: "Sales & CRM", icon: "📋", description: "Auto-generate professional proposals", pricing: "₹1,799/mo", rating: 4.6, installs: 890, aiPowered: true },
  { id: "quotation-generator", name: "Quotation Generator", category: "Sales & CRM", icon: "📄", description: "Create quotes instantly", pricing: "₹1,299/mo", rating: 4.5, installs: 1100 },
  { id: "affiliate-management", name: "Affiliate Management", category: "Sales & CRM", icon: "🤝", description: "Manage affiliate partners and commissions", pricing: "₹2,499/mo", rating: 4.4, installs: 720 },
  { id: "payment-reminder", name: "Payment Reminder AI", category: "Sales & CRM", icon: "💳", description: "Automated payment follow-ups", pricing: "₹999/mo", rating: 4.6, installs: 1500, aiPowered: true },

  // 📢 MARKETING
  { id: "meta-ads", name: "Meta Ads Manager", category: "Marketing", icon: "📱", description: "Manage Facebook and Instagram ads", pricing: "₹3,999/mo", rating: 4.8, installs: 1800, aiPowered: true },
  { id: "google-ads", name: "Google Ads AI", category: "Marketing", icon: "🔍", description: "AI-optimized Google advertising", pricing: "₹3,999/mo", rating: 4.7, installs: 1650, aiPowered: true },
  { id: "linkedin-marketing", name: "LinkedIn Marketing", category: "Marketing", icon: "💼", description: "Create professional LinkedIn posts with AI, generate industry-specific hashtags, and manage your content from one place.", pricing: "Free", rating: 5.0, installs: 1200, aiPowered: true },
  { id: "seo-optimizer", name: "SEO Optimizer", category: "Marketing", icon: "🎯", description: "AI-powered SEO optimization", pricing: "₹2,499/mo", rating: 4.8, installs: 2100, aiPowered: true },
  { id: "blog-generator", name: "Blog Generator", category: "Marketing", icon: "✍️", description: "AI blog writing and publishing", pricing: "₹1,999/mo", rating: 4.7, installs: 1450, aiPowered: true },
  { id: "landing-page", name: "Landing Page Builder", category: "Marketing", icon: "🎨", description: "Create high-converting landing pages", pricing: "₹1,799/mo", rating: 4.6, installs: 1200 },
  { id: "video-generator", name: "AI Video Generator", category: "Marketing", icon: "🎥", description: "Create marketing videos with AI", pricing: "₹4,999/mo", rating: 4.9, installs: 980, aiPowered: true },
  { id: "image-studio", name: "AI Image Studio", category: "Marketing", icon: "🖼️", description: "Generate marketing images", pricing: "₹2,999/mo", rating: 4.8, installs: 1350, aiPowered: true },
  { id: "influencer-finder", name: "Influencer Finder", category: "Marketing", icon: "⭐", description: "Find and manage influencers", pricing: "₹2,499/mo", rating: 4.5, installs: 650 },
  { id: "campaign-analytics", name: "Campaign Analytics", category: "Marketing", icon: "📊", description: "Advanced marketing analytics", pricing: "₹2,999/mo", rating: 4.7, installs: 1550 },

  // 💰 FINANCE
  { id: "gst-filing", name: "GST Filing", category: "Finance", icon: "📋", description: "Automated GST return filing", pricing: "₹1,999/mo", rating: 4.8, installs: 3200 },
  { id: "payroll", name: "Payroll", category: "Finance", icon: "💵", description: "Complete payroll management", pricing: "₹2,499/mo", rating: 4.7, installs: 2800 },
  { id: "employee-salary", name: "Employee Salary", category: "Finance", icon: "💰", description: "Salary processing and disbursement", pricing: "₹1,799/mo", rating: 4.6, installs: 2500 },
  { id: "expense-tracker", name: "Expense Tracker", category: "Finance", icon: "📊", description: "Track business expenses", pricing: "₹999/mo", rating: 4.5, installs: 3500 },
  { id: "budget-planner", name: "Budget Planner", category: "Finance", icon: "📈", description: "Plan and monitor budgets", pricing: "₹1,499/mo", rating: 4.6, installs: 1900 },
  { id: "cashflow-dashboard", name: "Cash Flow Dashboard", category: "Finance", icon: "💳", description: "Real-time cash flow monitoring", pricing: "₹2,999/mo", rating: 4.8, installs: 1650 },
  { id: "subscription-billing", name: "Subscription Billing", category: "Finance", icon: "🔄", description: "Recurring billing automation", pricing: "₹2,499/mo", rating: 4.7, installs: 1200 },
  { id: "payment-gateway", name: "Payment Gateway Manager", category: "Finance", icon: "💳", description: "Manage multiple payment gateways", pricing: "₹1,999/mo", rating: 4.6, installs: 2100 },
  { id: "tax-calculator", name: "Tax Calculator", category: "Finance", icon: "🧮", description: "Automated tax calculations", pricing: "₹1,299/mo", rating: 4.5, installs: 2600, aiPowered: true },
  { id: "financial-forecast", name: "Financial Forecast AI", category: "Finance", icon: "🔮", description: "AI financial forecasting", pricing: "₹3,999/mo", rating: 4.9, installs: 890, aiPowered: true },

  // 👨‍💼 HR
  { id: "recruitment-ats", name: "Recruitment ATS", category: "HR", icon: "👔", description: "Applicant tracking system", pricing: "₹2,999/mo", rating: 4.7, installs: 1450 },
  { id: "resume-screening", name: "Resume Screening AI", category: "HR", icon: "📄", description: "AI-powered resume analysis", pricing: "₹2,499/mo", rating: 4.8, installs: 1200, aiPowered: true },
  { id: "employee-attendance", name: "Employee Attendance", category: "HR", icon: "⏰", description: "Track employee attendance", pricing: "₹1,499/mo", rating: 4.6, installs: 3800 },
  { id: "leave-management", name: "Leave Management", category: "HR", icon: "🏖️", description: "Manage leave requests", pricing: "₹1,299/mo", rating: 4.5, installs: 3200 },
  { id: "performance-reviews", name: "Performance Reviews", category: "HR", icon: "📊", description: "Employee performance tracking", pricing: "₹1,999/mo", rating: 4.7, installs: 1800 },
  { id: "employee-onboarding", name: "Employee Onboarding", category: "HR", icon: "🎓", description: "Streamline new hire onboarding", pricing: "₹1,799/mo", rating: 4.6, installs: 1500 },
  { id: "training-portal", name: "Training Portal", category: "HR", icon: "📚", description: "Employee training management", pricing: "₹2,499/mo", rating: 4.7, installs: 1100 },
  { id: "interview-scheduler", name: "Interview Scheduler", category: "HR", icon: "📅", description: "Automated interview scheduling", pricing: "₹999/mo", rating: 4.5, installs: 1300, aiPowered: true },
  { id: "payroll-integration", name: "Payroll Integration", category: "HR", icon: "💼", description: "HR-Payroll sync", pricing: "₹1,499/mo", rating: 4.6, installs: 2200 },
  { id: "hr-chatbot", name: "HR Chatbot", category: "HR", icon: "🤖", description: "AI HR assistant", pricing: "₹1,999/mo", rating: 4.8, installs: 950, aiPowered: true },

  // 📦 INVENTORY
  { id: "inventory-management", name: "Inventory Management", category: "Inventory", icon: "📦", description: "Complete inventory tracking", pricing: "₹2,999/mo", rating: 4.7, installs: 2800 },
  { id: "barcode-scanner", name: "Barcode Scanner", category: "Inventory", icon: "📱", description: "Mobile barcode scanning", pricing: "₹999/mo", rating: 4.6, installs: 2100 },
  { id: "warehouse-manager", name: "Warehouse Manager", category: "Inventory", icon: "🏭", description: "Warehouse operations management", pricing: "₹3,499/mo", rating: 4.7, installs: 1650 },
  { id: "purchase-orders", name: "Purchase Orders", category: "Inventory", icon: "📋", description: "PO management system", pricing: "₹1,999/mo", rating: 4.5, installs: 2400 },
  { id: "vendor-management", name: "Vendor Management", category: "Inventory", icon: "🤝", description: "Supplier relationship management", pricing: "₹2,499/mo", rating: 4.6, installs: 1900 },
  { id: "delivery-tracking", name: "Delivery Tracking", category: "Inventory", icon: "🚚", description: "Real-time delivery tracking", pricing: "₹1,799/mo", rating: 4.7, installs: 2200 },
  { id: "stock-forecast", name: "Stock Forecast AI", category: "Inventory", icon: "🔮", description: "AI-powered inventory forecasting", pricing: "₹3,999/mo", rating: 4.8, installs: 980, aiPowered: true },
  { id: "returns-management", name: "Returns Management", category: "Inventory", icon: "↩️", description: "Handle product returns", pricing: "₹1,499/mo", rating: 4.5, installs: 1750 },

  // 🛒 E-COMMERCE
  { id: "shopify-connector", name: "Shopify Connector", category: "E-Commerce", icon: "🛍️", description: "Shopify store integration", pricing: "₹2,499/mo", rating: 4.8, installs: 3200 },
  { id: "woocommerce-connector", name: "WooCommerce Connector", category: "E-Commerce", icon: "🛒", description: "WooCommerce integration", pricing: "₹2,499/mo", rating: 4.7, installs: 2900 },
  { id: "amazon-seller", name: "Amazon Seller Hub", category: "E-Commerce", icon: "📦", description: "Amazon marketplace management", pricing: "₹3,499/mo", rating: 4.8, installs: 2400 },
  { id: "flipkart-seller", name: "Flipkart Seller Hub", category: "E-Commerce", icon: "🛍️", description: "Flipkart marketplace tools", pricing: "₹2,999/mo", rating: 4.7, installs: 1800 },
  { id: "order-management", name: "Order Management", category: "E-Commerce", icon: "📋", description: "Centralized order processing", pricing: "₹2,499/mo", rating: 4.6, installs: 3500 },
  { id: "shipping-automation", name: "Shipping Automation", category: "E-Commerce", icon: "✈️", description: "Automated shipping workflows", pricing: "₹1,999/mo", rating: 4.7, installs: 2800 },
  { id: "coupon-manager", name: "Coupon Manager", category: "E-Commerce", icon: "🎟️", description: "Discount and coupon system", pricing: "₹1,299/mo", rating: 4.5, installs: 2300 },
  { id: "customer-loyalty", name: "Customer Loyalty", category: "E-Commerce", icon: "💎", description: "Loyalty rewards program", pricing: "₹2,999/mo", rating: 4.8, installs: 1650 },

  // 📄 DOCUMENTS
  { id: "contract-writer", name: "AI Contract Writer", category: "Documents", icon: "📝", description: "Generate legal contracts", pricing: "₹2,999/mo", rating: 4.7, installs: 1200, aiPowered: true },
  { id: "ocr-scanner", name: "OCR Scanner", category: "Documents", icon: "📷", description: "Scan and digitize documents", pricing: "₹1,499/mo", rating: 4.6, installs: 2600 },
  { id: "pdf-editor", name: "PDF Editor", category: "Documents", icon: "📄", description: "Edit and manage PDFs", pricing: "₹999/mo", rating: 4.5, installs: 3200 },
  { id: "digital-signature", name: "Digital Signature", category: "Documents", icon: "✍️", description: "E-signature solution", pricing: "₹1,799/mo", rating: 4.8, installs: 2400 },
  { id: "invoice-ocr", name: "Invoice OCR", category: "Documents", icon: "📊", description: "Extract data from invoices", pricing: "₹2,499/mo", rating: 4.7, installs: 1800, aiPowered: true },
  { id: "nda-generator", name: "NDA Generator", category: "Documents", icon: "🔒", description: "Generate NDA documents", pricing: "₹999/mo", rating: 4.6, installs: 1500, aiPowered: true },
  { id: "proposal-templates", name: "Proposal Templates", category: "Documents", icon: "📑", description: "Professional proposal templates", pricing: "₹799/mo", rating: 4.5, installs: 1900 },
  { id: "document-review", name: "AI Document Review", category: "Documents", icon: "🔍", description: "AI-powered document analysis", pricing: "₹3,499/mo", rating: 4.8, installs: 890, aiPowered: true },

  // ⚖️ LEGAL
  { id: "company-registration", name: "Company Registration", category: "Legal", icon: "🏢", description: "Business registration assistance", pricing: "₹4,999/mo", rating: 4.7, installs: 1100 },
  { id: "trademark-assistant", name: "Trademark Assistant", category: "Legal", icon: "™️", description: "Trademark search and filing", pricing: "₹2,999/mo", rating: 4.6, installs: 850 },
  { id: "compliance-tracker", name: "Compliance Tracker", category: "Legal", icon: "📋", description: "Legal compliance monitoring", pricing: "₹2,499/mo", rating: 4.7, installs: 1450 },
  { id: "legal-notice", name: "Legal Notice Generator", category: "Legal", icon: "⚖️", description: "Generate legal notices", pricing: "₹1,999/mo", rating: 4.5, installs: 780, aiPowered: true },
  { id: "contract-review", name: "Contract Review AI", category: "Legal", icon: "🔍", description: "AI contract analysis", pricing: "₹3,999/mo", rating: 4.8, installs: 920, aiPowered: true },
  { id: "privacy-policy", name: "Privacy Policy Generator", category: "Legal", icon: "🔐", description: "Generate privacy policies", pricing: "₹999/mo", rating: 4.6, installs: 1600, aiPowered: true },
  { id: "terms-conditions", name: "Terms & Conditions Generator", category: "Legal", icon: "📜", description: "T&C document generator", pricing: "₹999/mo", rating: 4.5, installs: 1500, aiPowered: true },

  // 📊 ANALYTICS
  { id: "executive-dashboard", name: "Executive Dashboard", category: "Analytics", icon: "📊", description: "C-suite analytics dashboard", pricing: "₹3,999/mo", rating: 4.9, installs: 1650 },
  { id: "sales-dashboard", name: "Sales Dashboard", category: "Analytics", icon: "📈", description: "Sales performance analytics", pricing: "₹2,999/mo", rating: 4.7, installs: 2400 },
  { id: "marketing-dashboard", name: "Marketing Dashboard", category: "Analytics", icon: "📊", description: "Marketing metrics tracking", pricing: "₹2,999/mo", rating: 4.7, installs: 2100 },
  { id: "customer-analytics", name: "Customer Analytics", category: "Analytics", icon: "👥", description: "Customer behavior insights", pricing: "₹2,499/mo", rating: 4.8, installs: 1900, aiPowered: true },
  { id: "employee-analytics", name: "Employee Analytics", category: "Analytics", icon: "👨‍💼", description: "Workforce analytics", pricing: "₹2,499/mo", rating: 4.6, installs: 1500 },
  { id: "profit-prediction", name: "Profit Prediction AI", category: "Analytics", icon: "🔮", description: "AI profit forecasting", pricing: "₹4,999/mo", rating: 4.9, installs: 780, aiPowered: true },
  { id: "kpi-monitor", name: "KPI Monitor", category: "Analytics", icon: "🎯", description: "Track business KPIs", pricing: "₹1,999/mo", rating: 4.7, installs: 2600 },
  { id: "ai-insights", name: "AI Insights", category: "Analytics", icon: "🧠", description: "AI-driven business insights", pricing: "₹4,999/mo", rating: 4.9, installs: 980, aiPowered: true },

  // 🤖 AI AGENTS
  { id: "ceo-agent", name: "CEO Agent", category: "AI Agents", icon: "👔", description: "AI executive assistant", pricing: "₹9,999/mo", rating: 4.9, installs: 450, aiPowered: true },
  { id: "sales-agent", name: "Sales Agent", category: "AI Agents", icon: "💼", description: "AI sales assistant", pricing: "₹4,999/mo", rating: 4.8, installs: 890, aiPowered: true },
  { id: "hr-agent", name: "HR Agent", category: "AI Agents", icon: "👥", description: "AI HR assistant", pricing: "₹4,999/mo", rating: 4.7, installs: 750, aiPowered: true },
  { id: "finance-agent", name: "Finance Agent", category: "AI Agents", icon: "💰", description: "AI finance assistant", pricing: "₹4,999/mo", rating: 4.8, installs: 820, aiPowered: true },
  { id: "marketing-agent", name: "Marketing Agent", category: "AI Agents", icon: "📢", description: "AI marketing assistant", pricing: "₹4,999/mo", rating: 4.8, installs: 950, aiPowered: true },
  { id: "research-agent", name: "Research Agent", category: "AI Agents", icon: "🔬", description: "AI research assistant", pricing: "₹3,999/mo", rating: 4.7, installs: 680, aiPowered: true },
  { id: "coding-agent", name: "Coding Agent", category: "AI Agents", icon: "💻", description: "AI coding assistant", pricing: "₹3,999/mo", rating: 4.8, installs: 1200, aiPowered: true },
  { id: "data-analyst-agent", name: "Data Analyst Agent", category: "AI Agents", icon: "📊", description: "AI data analysis", pricing: "₹4,999/mo", rating: 4.9, installs: 720, aiPowered: true },
  { id: "meeting-agent", name: "Meeting Agent", category: "AI Agents", icon: "📅", description: "AI meeting assistant", pricing: "₹2,999/mo", rating: 4.7, installs: 980, aiPowered: true },
  { id: "support-agent", name: "Customer Support Agent", category: "AI Agents", icon: "💬", description: "AI customer support", pricing: "₹3,999/mo", rating: 4.8, installs: 1450, aiPowered: true },

  // 🌐 WEBSITE
  { id: "website-builder", name: "Website Builder", category: "Website", icon: "🌐", description: "No-code website builder", pricing: "₹2,999/mo", rating: 4.7, installs: 2800 },
  { id: "ai-landing-page", name: "AI Landing Page Builder", category: "Website", icon: "🎯", description: "AI-generated landing pages", pricing: "₹2,499/mo", rating: 4.8, installs: 1650, aiPowered: true },
  { id: "seo-scanner", name: "SEO Scanner", category: "Website", icon: "🔍", description: "Website SEO analysis", pricing: "₹1,499/mo", rating: 4.6, installs: 2400 },
  { id: "website-chatbot", name: "Website Chatbot", category: "Website", icon: "💬", description: "AI website chat widget", pricing: "₹1,999/mo", rating: 4.7, installs: 2200, aiPowered: true },
  { id: "forms-builder", name: "Forms Builder", category: "Website", icon: "📝", description: "Custom form creator", pricing: "₹999/mo", rating: 4.5, installs: 3100 },
  { id: "analytics-integration", name: "Analytics Integration", category: "Website", icon: "📊", description: "Connect analytics tools", pricing: "₹1,299/mo", rating: 4.6, installs: 2600 },
  { id: "booking-system", name: "Booking System", category: "Website", icon: "📅", description: "Appointment booking", pricing: "₹2,499/mo", rating: 4.7, installs: 1900 },

  // 📱 COMMUNICATION
  { id: "whatsapp-api", name: "WhatsApp API", category: "Communication", icon: "💬", description: "WhatsApp Business API", pricing: "₹2,999/mo", rating: 4.8, installs: 4200 },
  { id: "telegram-bot", name: "Telegram Bot", category: "Communication", icon: "✈️", description: "Telegram bot integration", pricing: "₹999/mo", rating: 4.6, installs: 1500 },
  { id: "slack-integration", name: "Slack", category: "Communication", icon: "💬", description: "Slack workspace integration", pricing: "₹1,499/mo", rating: 4.7, installs: 2800 },
  { id: "discord", name: "Discord", category: "Communication", icon: "🎮", description: "Discord server integration", pricing: "₹999/mo", rating: 4.5, installs: 980 },
  { id: "zoom", name: "Zoom", category: "Communication", icon: "🎥", description: "Zoom meeting integration", pricing: "₹1,799/mo", rating: 4.7, installs: 3400 },
  { id: "google-meet", name: "Google Meet", category: "Communication", icon: "📹", description: "Google Meet integration", pricing: "₹1,499/mo", rating: 4.6, installs: 2900 },
  { id: "ms-teams", name: "Microsoft Teams", category: "Communication", icon: "👥", description: "Teams integration", pricing: "₹1,999/mo", rating: 4.7, installs: 2400 },
  { id: "bulk-sms", name: "Bulk SMS", category: "Communication", icon: "📱", description: "SMS gateway integration", pricing: "₹999/mo", rating: 4.5, installs: 3200 },

  // 🎓 EDUCATION
  { id: "lms", name: "LMS", category: "Education", icon: "📚", description: "Learning management system", pricing: "₹3,999/mo", rating: 4.8, installs: 1650 },
  { id: "student-portal", name: "Student Portal", category: "Education", icon: "🎓", description: "Student self-service portal", pricing: "₹2,499/mo", rating: 4.7, installs: 2100 },
  { id: "faculty-portal", name: "Faculty Portal", category: "Education", icon: "👨‍🏫", description: "Teacher management system", pricing: "₹2,499/mo", rating: 4.6, installs: 1900 },
  { id: "edu-attendance", name: "Attendance", category: "Education", icon: "✅", description: "Student attendance tracking", pricing: "₹1,499/mo", rating: 4.7, installs: 2800 },
  { id: "online-exams", name: "Online Exams", category: "Education", icon: "📝", description: "Online examination platform", pricing: "₹2,999/mo", rating: 4.8, installs: 1750 },
  { id: "parent-communication", name: "Parent Communication", category: "Education", icon: "👨‍👩‍👧", description: "Parent-teacher messaging", pricing: "₹1,799/mo", rating: 4.7, installs: 2200 },
  { id: "certificates", name: "Certificates", category: "Education", icon: "🏆", description: "Generate digital certificates", pricing: "₹999/mo", rating: 4.6, installs: 1800 },
  { id: "course-builder", name: "Course Builder", category: "Education", icon: "📖", description: "Create online courses", pricing: "₹2,499/mo", rating: 4.7, installs: 1500 },

  // 🏥 INDUSTRY PLUGINS
  { id: "hospital-mgmt", name: "Hospital Management", category: "Industry Plugins", icon: "🏥", description: "Complete hospital ERP", pricing: "₹14,999/mo", rating: 4.9, installs: 520 },
  { id: "pharmacy", name: "Pharmacy", category: "Industry Plugins", icon: "💊", description: "Pharmacy management system", pricing: "₹3,999/mo", rating: 4.7, installs: 980 },
  { id: "restaurant-pos", name: "Restaurant POS", category: "Industry Plugins", icon: "🍽️", description: "Restaurant point of sale", pricing: "₹4,999/mo", rating: 4.8, installs: 1450 },
  { id: "hotel-mgmt", name: "Hotel Management", category: "Industry Plugins", icon: "🏨", description: "Hotel booking and operations", pricing: "₹7,999/mo", rating: 4.8, installs: 720 },
  { id: "realestate-crm", name: "Real Estate CRM", category: "Industry Plugins", icon: "🏠", description: "Real estate sales CRM", pricing: "₹4,999/mo", rating: 4.7, installs: 1100 },
  { id: "construction-erp", name: "Construction ERP", category: "Industry Plugins", icon: "🏗️", description: "Construction project management", pricing: "₹9,999/mo", rating: 4.8, installs: 650 },
  { id: "manufacturing-erp", name: "Manufacturing ERP", category: "Industry Plugins", icon: "🏭", description: "Manufacturing operations", pricing: "₹12,999/mo", rating: 4.9, installs: 580 },
  { id: "automobile-crm", name: "Automobile CRM", category: "Industry Plugins", icon: "🚗", description: "Auto dealership CRM", pricing: "₹5,999/mo", rating: 4.7, installs: 780 },
  { id: "gym-mgmt", name: "Gym Management", category: "Industry Plugins", icon: "💪", description: "Fitness center management", pricing: "₹2,999/mo", rating: 4.6, installs: 1250 },
  { id: "salon-mgmt", name: "Salon Management", category: "Industry Plugins", icon: "💇", description: "Salon booking and billing", pricing: "₹2,499/mo", rating: 4.7, installs: 1400 },

  // 🧠 AI PRODUCTIVITY
  { id: "meeting-notes-ai", name: "Meeting Notes AI", category: "AI Productivity", icon: "📝", description: "AI meeting transcription", pricing: "₹2,999/mo", rating: 4.8, installs: 1650, aiPowered: true },
  { id: "voice-to-crm", name: "Voice to CRM", category: "AI Productivity", icon: "🎤", description: "Voice notes to CRM", pricing: "₹2,499/mo", rating: 4.7, installs: 890, aiPowered: true },
  { id: "email-assistant", name: "AI Email Assistant", category: "AI Productivity", icon: "📧", description: "AI email drafting", pricing: "₹1,999/mo", rating: 4.8, installs: 2400, aiPowered: true },
  { id: "presentation-maker", name: "AI Presentation Maker", category: "AI Productivity", icon: "📊", description: "Generate presentations", pricing: "₹2,999/mo", rating: 4.7, installs: 1200, aiPowered: true },
  { id: "spreadsheet-assistant", name: "AI Spreadsheet Assistant", category: "AI Productivity", icon: "📈", description: "AI spreadsheet help", pricing: "₹1,999/mo", rating: 4.6, installs: 1500, aiPowered: true },
  { id: "knowledge-base", name: "AI Knowledge Base", category: "AI Productivity", icon: "📚", description: "AI-powered knowledge management", pricing: "₹3,499/mo", rating: 4.8, installs: 980, aiPowered: true },
  { id: "workflow-builder", name: "AI Workflow Builder", category: "AI Productivity", icon: "🔄", description: "Create automated workflows", pricing: "₹3,999/mo", rating: 4.9, installs: 720, aiPowered: true },
  { id: "automation-studio", name: "AI Automation Studio", category: "AI Productivity", icon: "🤖", description: "No-code automation platform", pricing: "₹4,999/mo", rating: 4.9, installs: 850, aiPowered: true },
];

// Plugin categories
export const PLUGIN_CATEGORIES = [
  { id: "all", name: "All Plugins", icon: "🔌", count: ALL_PLUGINS.length },
  { id: "Sales & CRM", name: "Sales & CRM", icon: "🏢", count: ALL_PLUGINS.filter(p => p.category === "Sales & CRM").length },
  { id: "Marketing", name: "Marketing", icon: "📢", count: ALL_PLUGINS.filter(p => p.category === "Marketing").length },
  { id: "Finance", name: "Finance", icon: "💰", count: ALL_PLUGINS.filter(p => p.category === "Finance").length },
  { id: "HR", name: "HR", icon: "👨‍💼", count: ALL_PLUGINS.filter(p => p.category === "HR").length },
  { id: "Inventory", name: "Inventory", icon: "📦", count: ALL_PLUGINS.filter(p => p.category === "Inventory").length },
  { id: "E-Commerce", name: "E-Commerce", icon: "🛒", count: ALL_PLUGINS.filter(p => p.category === "E-Commerce").length },
  { id: "Documents", name: "Documents", icon: "📄", count: ALL_PLUGINS.filter(p => p.category === "Documents").length },
  { id: "Legal", name: "Legal", icon: "⚖️", count: ALL_PLUGINS.filter(p => p.category === "Legal").length },
  { id: "Analytics", name: "Analytics", icon: "📊", count: ALL_PLUGINS.filter(p => p.category === "Analytics").length },
  { id: "AI Agents", name: "AI Agents", icon: "🤖", count: ALL_PLUGINS.filter(p => p.category === "AI Agents").length },
  { id: "Website", name: "Website", icon: "🌐", count: ALL_PLUGINS.filter(p => p.category === "Website").length },
  { id: "Communication", name: "Communication", icon: "📱", count: ALL_PLUGINS.filter(p => p.category === "Communication").length },
  { id: "Education", name: "Education", icon: "🎓", count: ALL_PLUGINS.filter(p => p.category === "Education").length },
  { id: "Industry Plugins", name: "Industry Plugins", icon: "🏥", count: ALL_PLUGINS.filter(p => p.category === "Industry Plugins").length },
  { id: "AI Productivity", name: "AI Productivity", icon: "🧠", count: ALL_PLUGINS.filter(p => p.category === "AI Productivity").length },
];

// Helper function to get plugins by category
export function getPluginsByCategory(category: string): Plugin[] {
  if (category === "all") return ALL_PLUGINS;
  return ALL_PLUGINS.filter(p => p.category === category);
}

// Helper function to search plugins
export function searchPlugins(query: string): Plugin[] {
  const searchTerm = query.toLowerCase();
  return ALL_PLUGINS.filter(p => 
    p.name.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm)
  );
}
