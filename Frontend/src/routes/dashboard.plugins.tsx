import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Puzzle,
  Zap,
  BookOpen,
  Phone,
  Shield,
  DollarSign,
  Globe,
  Play,
  Pause,
  Search,
  Star,
  Check,
  ExternalLink,
  FileText,
  Video,
  Layers,
  Bot,
  Sparkles,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Database,
  Code,
  MapPin,
  Users,
  Settings,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Heart,
  PlusCircle,
  HelpCircle,
  Activity,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  getInstalledPlugins, 
  installPlugin, 
  uninstallPlugin, 
  runPluginFlow, 
  getIntegrationsStatus
} from "@/lib/aeoGeoApi";
import { env } from "@/config/env";

interface AutomationLog {
  timestamp: string;
  step: string;
  message: string;
}

export const Route = createFileRoute("/dashboard/plugins")({
  head: () => ({ meta: [{ title: "AI Plugins Store — Saadhyam" }] }),
  component: PluginsPage,
});

// Complete data for the 10 plugins covering points A to N in detail
interface PluginDetail {
  id: string;
  name: string;
  category: "operations" | "marketing" | "vertical" | "developer";
  rating: number;
  installs: number;
  developer: string;
  cost: string;
  shortDesc: string;
  icon: any;
  purpose: string; // A
  targetUsers: string; // B
  problemsSolved: string[]; // C
  coreFeatures: string[]; // D
  aiFeatures: string[]; // E
  requiredApis: string[]; // F
  dbStructure: string; // G (SQL DDL/JSON mockup)
  dashboardUi: string; // H
  userWorkflow: string; // I
  revenueOps: string; // J
  pricingStrategy: string; // K
  techArchitecture: string; // L
  securityPrivacy: string; // M
  futureExpansion: string; // N
}

const PLUGINS_DATA: PluginDetail[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Sales & Support",
    category: "marketing",
    rating: 4.9,
    installs: 1450,
    developer: "Saadhyam Core Team",
    cost: "$29/mo",
    shortDesc: "Automate chats, qualify leads, and broadcast campaigns via WhatsApp Cloud API.",
    icon: MessageSquareIconSim,
    purpose: "Instantly deploy an AI customer support and conversational sales agent directly onto a business's WhatsApp Business Account (WABA) to capture leads, send broadcast campaigns, and answer questions 24/7.",
    targetUsers: "SMB Retailers, E-commerce Brands, D2C Startups, and Customer Success Teams looking to drive engagement on high-open-rate mobile messaging.",
    problemsSolved: [
      "High support response times during weekends and off-hours",
      "Manual outbound followups causing leakage of inbound marketing leads",
      "Low email open rates (20%) compared to WhatsApp (98%) for promotional campaigns",
    ],
    coreFeatures: [
      "Shared Multi-Agent Inbox with CRM syncing",
      "Template Broadcast Scheduler with delivery, read, and reply analytics",
      "Interactive WhatsApp List Buttons & Quick Replies mapping",
      "Appointment scheduling integration (syncs with Google Calendar)",
    ],
    aiFeatures: [
      "Generative AI support agent trained on uploaded business documentation (FAQs, PDFs, site URLs)",
      "Automated lead qualification and sentiment tracking during conversations",
      "AI-optimized broadcast copy generation tailored to specific customer groups",
    ],
    requiredApis: [
      "Meta WhatsApp Cloud API (v21.0)",
      "Facebook Graph API (System User access)",
      "Gemini Flash 1.5 API (for conversation routing)",
    ],
    dbStructure: `CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  waba_id VARCHAR(100) UNIQUE,
  phone_number_id VARCHAR(100),
  display_phone VARCHAR(50),
  access_token TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE whatsapp_chats (
  id UUID PRIMARY KEY,
  waba_id VARCHAR(100),
  customer_phone VARCHAR(50),
  customer_name VARCHAR(100),
  last_message_at TIMESTAMP,
  ai_autopilot_enabled BOOLEAN DEFAULT true
);`,
    dashboardUi: "A glassmorphic Command Center featuring a live feed of active customer conversations, a campaign scheduler displaying read/delivery charts (Recharts line graph), an AI response log monitor, and custom templates editing fields.",
    userWorkflow: "1. Complete Meta Embedded Signup -> 2. Select Phone Number -> 3. Train AI agent by uploading FAQ docs -> 4. Toggle AI Autopilot to start answering customer queries automatically.",
    revenueOps: "1. Core Monthly Subscription. 2. Per-Message Overages (charging an additional $0.005 per conversation exceeding monthly caps).",
    pricingStrategy: "Tiered subscription: Starter ($29/mo for 1,000 conversations), Growth ($79/mo for 5,000 conversations + custom training), Enterprise (Custom pricing for high-volume broadcasts).",
    techArchitecture: "Utilizes FastAPI asynchronous endpoints with Celery backend workers. Incoming webhooks from Meta trigger celery tasks that run semantic searches against a PgVector database, query the Gemini LLM for draft replies, and post responses back to the WhatsApp Cloud API within 2 seconds.",
    securityPrivacy: "End-to-end token encryption in the database, automated GDPR compliance triggers for deleting chat histories, and restricted IP access blocks for Meta webhooks.",
    futureExpansion: "Integrate native catalog shopping, enabling users to browse collections, add items to cart, and check out directly inside WhatsApp using Stripe links.",
  },
  {
    id: "ai-voice",
    name: "AI Calling Agent (Outbound)",
    category: "operations",
    rating: 4.8,
    installs: 920,
    developer: "Saadhyam Core Team",
    cost: "$49/mo",
    shortDesc: "Automate qualification, follow-ups, and reminders with conversational voice AI.",
    icon: PhoneIconSim,
    purpose: "Provide businesses with human-like AI calling agents capable of initiating and receiving automated phone calls to qualify incoming leads, confirm calendar appointments, and send payment notifications.",
    targetUsers: "Real Estate Brokers, Financial Services Providers, Medical Clinics, and SaaS sales teams handling large volumes of outbound cold/warm leads.",
    problemsSolved: [
      "SDR time wasted on unanswered calls or unqualified prospects",
      "Manual appointment confirmation calls leading to high clinic/salon no-show rates",
      "High human payroll costs of running outbound customer follow-up call campaigns",
    ],
    coreFeatures: [
      "Simultaneous Multi-Line Dialing Engine",
      "Real-time voice-to-text live stream and dashboard supervisor mode",
      "Automatic voicemail detection and customized audio drops",
      "Click-to-Call manual trigger within Saadhyam CRM",
    ],
    aiFeatures: [
      "Ultra-low latency conversational speech synthesis with custom text-to-speech training",
      "Real-time customer intent classification and logic branching (e.g. objection handling)",
      "Automated Post-Call Summaries and sentiment scoring logged back to the CRM",
    ],
    requiredApis: [
      "Vapi Voice AI API or Twilio Voice SDK",
      "Deepgram Nova-2 (Speech-to-Text)",
      "ElevenLabs (Text-to-Speech voices)",
    ],
    dbStructure: `CREATE TABLE voice_campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  voice_id VARCHAR(100),
  agent_prompt TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE call_logs (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES voice_campaigns(id),
  phone_number VARCHAR(50),
  status VARCHAR(50),
  duration INT,
  summary TEXT,
  sentiment VARCHAR(50)
);`,
    dashboardUi: "Audio Command Center showcasing live call logs, campaign audio recorder tools, agent script templates, call-duration analysis charts, and an interactive voice tone selector panel.",
    userWorkflow: "1. Buy/Link virtual phone number -> 2. Write or generate calling agent script prompt -> 3. Choose simulated voice accent -> 4. Upload CSV list or link CRM trigger -> 5. Start Call Campaign.",
    revenueOps: "Per-minute usage pricing (e.g., $0.15 per calling minute, split between provider and Saadhyam platform margins).",
    pricingStrategy: "Base platform fee ($49/mo) which includes 300 minutes, plus $0.12/minute for any usage beyond the base package.",
    techArchitecture: "WebSocket-based connection architecture linking Twilio SIP trunks directly with Deepgram for transcription. The transcribed text is piped to a state-locked Gemini context engine, and returned audio buffers from ElevenLabs are streamed back, keeping latency under 600ms.",
    securityPrivacy: "PCI-compliance frameworks for securing call recordings, automated redaction of credit cards or SSNs from transcripts, and local call-time window constraints (e.g., only call between 9 AM and 8 PM local time).",
    futureExpansion: "Support real-time accent shifting and dynamic live-translation during active calls to support regional Indian languages.",
  },
  {
    id: "crm",
    name: "CRM Pipeline & Sync",
    category: "operations",
    rating: 4.7,
    installs: 2110,
    developer: "Saadhyam Core Team",
    cost: "Free / $19/mo",
    shortDesc: "Manage deals, track visual pipelines, and sync with Salesforce, HubSpot, or Zoho.",
    icon: DatabaseIconSim,
    purpose: "Centralize business deal pipelines, customer interactions, and contact profiles while syncing data continuously with legacy CRM providers.",
    targetUsers: "B2B sales teams, agencies, and enterprise organizations running hybrid tooling stacks.",
    problemsSolved: [
      "Siloed customer data across support channels, social accounts, and invoices",
      "Manual data entry updates in multiple CRM portals (Salesforce vs HubSpot)",
      "Lack of lead progression visibility leading to lost deals",
    ],
    coreFeatures: [
      "Drag-and-Drop Visual Deals Kanban Board",
      "HubSpot, Salesforce, and Zoho CRM bidirectional real-time sync",
      "Customer contact profile timelines showing support chats, calls, and email logs",
      "Custom fields constructor and deal stages controller",
    ],
    aiFeatures: [
      "AI Deal Win Probability Scoring (predicts likelihood of closing based on activity history)",
      "Smart follow-up reminders highlighting cold deals that need urgent outreach",
      "Automatic email draft responses generated from CRM stage transitions",
    ],
    requiredApis: [
      "HubSpot OAuth & Developer API",
      "Salesforce REST API",
      "Zoho CRM API",
    ],
    dbStructure: `CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY,
  user_id UUID,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255)
);

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY,
  contact_id UUID REFERENCES crm_contacts(id),
  title VARCHAR(255),
  amount NUMERIC(12,2),
  stage VARCHAR(50),
  win_probability INT
);`,
    dashboardUi: "Sleek Kanban interface with customizable pipeline columns, deal progress indicators, a live sync status hub (flashing green nodes when connected to Salesforce), and deal analytics widgets.",
    userWorkflow: "1. Link Salesforce/Hubspot account -> 2. Map contact fields -> 3. Define deal stages -> 4. Watch your local pipeline auto-populate and synchronize.",
    revenueOps: "Subscription fee for bidirectional sync operations, and platform fee per sales user seat.",
    pricingStrategy: "Basic Kanban (Free for up to 3 stages/100 deals), Pro ($19/mo per seat for complete third-party CRM sync and custom stages).",
    techArchitecture: "Polling database queues combined with webhook endpoints. Integrates dynamic payload mapping to translate diverse schema structures (e.g. HubSpot JSON vs Salesforce XML) into unified Saadhyam contacts schema.",
    securityPrivacy: "Multi-tenant isolation, encrypted OAuth access tokens, and access logs auditing.",
    futureExpansion: "Integrate email outreach sequences natively within the pipeline dashboard to support outbound marketing.",
  },
  {
    id: "google-workspace",
    name: "Google Workspace Automations",
    category: "operations",
    rating: 4.6,
    installs: 1880,
    developer: "Saadhyam Core Team",
    cost: "$15/mo",
    shortDesc: "Automate Gmail replies, sync Google Sheets, and analyze Drive docs.",
    icon: GlobeIconSim,
    purpose: "Supercharge day-to-day productivity by linking Gmail inbox, Google Drive databases, and Calendar schedules with Saadhyam's AI engine.",
    targetUsers: "Office Managers, Consultants, Agencies, and Operation Leads handling document-heavy daily pipelines.",
    problemsSolved: [
      "Hours spent writing repetitive email replies to customer inquiries",
      "Manual data transfer from spreadsheets into operational systems",
      "Scattered documents across Google Drive with no centralized search indexing",
    ],
    coreFeatures: [
      "Gmail AI Autopilot draft assistant",
      "Google Calendar slot auto-booking based on client requests",
      "Google Sheets automatic table export of CRM leads and analytics data",
      "Vector search indexing for Google Drive PDFs and document files",
    ],
    aiFeatures: [
      "Gmail incoming email intent scanner (routes requests, tags urgent issues, suggests replies)",
      "Natural language queries over your entire Google Drive (e.g. 'Find the clause about liability in the 2025 contracts')",
      "Automated calendar slot optimization based on historical meeting lengths",
    ],
    requiredApis: [
      "Google Oauth 2.0 API",
      "Gmail REST API",
      "Google Sheets & Calendar APIs",
      "Google Drive API",
    ],
    dbStructure: `CREATE TABLE google_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  access_token TEXT,
  refresh_token TEXT,
  expiry TIMESTAMP,
  scopes TEXT[]
);

CREATE TABLE drive_indices (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  file_id VARCHAR(100),
  file_name VARCHAR(255),
  vector_index_status VARCHAR(50)
);`,
    dashboardUi: "Integration command layout displaying authorized scopes, an active email AI suggestion queue, linked Google sheets list, and a smart search bar queries bar for Drive.",
    userWorkflow: "1. Sign in with Google Account -> 2. Check scopes -> 3. Choose which folder of Google Drive to index -> 4. Start asking natural language questions in chat.",
    revenueOps: "Usage-based tokens models for analyzing documents and drafting emails.",
    pricingStrategy: "Standard ($15/mo including 10,000 email drafts and 2GB Drive index space), Pro ($35/mo with unlimited draft automation and 10GB index).",
    techArchitecture: "Background pub/sub listeners linked to Gmail webhooks. Once a user receives an email, our system parses its content, triggers semantic search checks over connected Google Drive documents, and uses LLMs to generate a draft reply in Gmail draft folder.",
    securityPrivacy: "OAuth scopes restricted to minimum permissions, sandboxed document vector indices, and zero training on private client documents.",
    futureExpansion: "Extend integration to support Google Slides document auto-generation for client presentation slide-decks.",
  },
  {
    id: "social-media",
    name: "Social Media Suite",
    category: "marketing",
    rating: 4.8,
    installs: 1670,
    developer: "Saadhyam Core Team",
    cost: "$25/mo",
    shortDesc: "Auto-publish to Instagram, Facebook, LinkedIn, & X; track competitor engagement.",
    icon: WandIconSim,
    purpose: "Provide a single command console to design, schedule, auto-publish, and analyze social content across Facebook, Instagram, LinkedIn, and X.",
    targetUsers: "Brand Managers, Creators, Marketing Agencies, and SMBs building an organic audience footprint.",
    problemsSolved: [
      "Need to manually upload posts to 4 different channels daily",
      "High costs of paying for separate scheduler, analytics, and writing tools",
      "Difficulty tracking competitor social patterns and high-performance posts",
    ],
    coreFeatures: [
      "Unified Calendar Scheduler with drag-and-drop slots",
      "Auto-publishing support (Facebook pages, Instagram business, LinkedIn, X)",
      "Competitor Social Tracker (monitors publicly available competitor pages)",
      "Multi-channel aggregate engagement graphs",
    ],
    aiFeatures: [
      "AI caption generation and hashtag optimizer based on trending parameters",
      "Creative image generator templates (text overlays onto custom backgrounds)",
      "Optimal post-time engine calculated on historical customer interaction spikes",
    ],
    requiredApis: [
      "Meta Graph API (Instagram & Facebook endpoints)",
      "LinkedIn Share API",
      "X Developer API (v2)",
    ],
    dbStructure: `CREATE TABLE social_posts (
  id UUID PRIMARY KEY,
  user_id UUID,
  platforms VARCHAR(50)[],
  content_text TEXT,
  media_urls TEXT[],
  scheduled_at TIMESTAMP,
  published_status VARCHAR(50),
  post_ids JSONB
);`,
    dashboardUi: "Interactive dark-mode post composer displaying visual previews of Instagram grids, scheduler calendar boards, competitor posts lists, and audience reach graphs.",
    userWorkflow: "1. Link social accounts -> 2. Add competitor account links -> 3. Write or generate post -> 4. Review previews and schedule -> 5. View performance analytics post-publish.",
    revenueOps: "Subscription tiers, and microtransactions for AI image creation packages.",
    pricingStrategy: "Starter ($25/mo with 3 social accounts per channel), Pro ($59/mo for up to 10 accounts and competitor monitoring dashboards).",
    techArchitecture: "Utilizes Python media integration pipelines. Schedulers trigger database-driven crons which fetch assets from Cloudinary and make HTTP POST requests containing media structures directly to the platform graph endpoints.",
    securityPrivacy: "OAuth verification workflows, secure session storage of client app tokens, and strict rate limits controls to prevent platform flags.",
    futureExpansion: "Integration with TikTok API for scheduling vertical video reels.",
  },
  {
    id: "accounting",
    name: "Accounting & Invoices",
    category: "operations",
    rating: 4.5,
    installs: 1040,
    developer: "FinTech Partners",
    cost: "$35/mo",
    shortDesc: "Generate invoices, track expenses, and sync with QuickBooks, Zoho Books, or Tally.",
    icon: DollarSignIconSim,
    purpose: "Automate accounting practices, invoice creation, and financial bookkeeping by linking Saadhyam invoices directly with third-party software like Tally, QuickBooks, and Zoho Books.",
    targetUsers: "CFOs, Accountants, Freelancers, and SMB Finance departments managing cash flow.",
    problemsSolved: [
      "Manual entry of invoices into offline systems like Tally causing errors",
      "Lack of real-time cash flow overview for business executives",
      "Days spent tracking down unpaid invoices from clients",
    ],
    coreFeatures: [
      "Professional PDF Invoice Generator with online payment links",
      "Expense tracking with receipt scanning (OCR)",
      "Tally Prime ERP, Zoho Books, and QuickBooks integrations",
      "Profit & Loss, Cash Flow, and Tax reporting dashboards",
    ],
    aiFeatures: [
      "AI OCR receipt parser (extracts merchant name, tax, items, and total automatically from uploaded receipt photos)",
      "Predictive Cash Flow forecasting model (estimates bank balances 90 days out)",
      "Automated smart reminders sent to overdue clients with AI-adjusted polite/firm language",
    ],
    requiredApis: [
      "QuickBooks Online Accounting API",
      "Zoho Books API",
      "Tally XML Gateway",
      "Stripe or Razorpay payment gateway",
    ],
    dbStructure: `CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  user_id UUID,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  items JSONB,
  subtotal NUMERIC(12,2),
  tax NUMERIC(12,2),
  total NUMERIC(12,2),
  status VARCHAR(50),
  due_date DATE
);`,
    dashboardUi: "Financial command deck showing real-time balance metrics, receipt image drop zones, payment logs tables, outstanding bills lists, and cash flow forecast charts.",
    userWorkflow: "1. Create invoice template -> 2. Connect Zoho Books/Tally -> 3. Send invoice to client -> 4. Payments auto-update ledgers and bookkeeping records on sync.",
    revenueOps: "Transaction processing commission split (e.g. 0.1% on payments processed through invoice links), plus SaaS tier fees.",
    pricingStrategy: "Standard ($35/mo with QuickBooks/Zoho Books integration), Advanced ($69/mo including offline Tally connector and AI forecasting).",
    techArchitecture: "Secure financial pipeline utilizing queue-based data streaming. Transactions trigger synchronization webhooks, and the system securely pushes ledger items using cryptographic signatures to prevent transaction tampering.",
    securityPrivacy: "SOC2 Compliance standards, banking token tokenization, read-only API keys where possible, and encrypted client financial records.",
    futureExpansion: "Integration with government GST portals to support automated tax filings.",
  },
  {
    id: "school",
    name: "School & LMS Engine",
    category: "vertical",
    rating: 4.7,
    installs: 610,
    developer: "EdTech Partners",
    cost: "$89/mo",
    shortDesc: "Manage student attendance, fees, parent updates, and AI performance reports.",
    icon: BookOpenIconSim,
    purpose: "A complete School Management System and Student Information Hub built directly into Saadhyam to handle student records, fee collection, and parent communication.",
    targetUsers: "School Principals, Administrators, Teachers, and private educational centers.",
    problemsSolved: [
      "Manual paper attendance tracking leading to administrative delays",
      "Complex fee structures causing payment collection delays and manual tracking",
      "Inability to provide personalized progress feedback for large student groups",
    ],
    coreFeatures: [
      "Student & Teacher profile directory",
      "LMS: Assignments, grading system, and test score management",
      "Fee schedules with auto-generated parent invoice notifications",
      "Shared parent communication board with automated SMS updates",
    ],
    aiFeatures: [
      "AI student performance diagnostics (analyzes grade patterns and flags pupils needing academic help)",
      "AI report card comment generator (creates personalized descriptive reports for teachers based on student performance data)",
      "Automated voice notifications translating announcements to parents in local languages",
    ],
    requiredApis: [
      "Twilio SMS & Voice API",
      "Razorpay Payment Gateway",
      "Gemini API (for generating progress summaries)",
    ],
    dbStructure: `CREATE TABLE students (
  id UUID PRIMARY KEY,
  school_id UUID,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  roll_number VARCHAR(50),
  class_grade VARCHAR(50),
  parent_phone VARCHAR(50)
);

CREATE TABLE fee_payments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  amount NUMERIC(10,2),
  status VARCHAR(50),
  due_date DATE
);`,
    dashboardUi: "Admin portal showing daily school attendance graphs, class directories, student performance distribution charts, class grade curves, and parent notification center.",
    userWorkflow: "1. Import student list CSV -> 2. Define fee structures and link Razorpay -> 3. Teachers mark attendance via tablet -> 4. Parents receive instant notification of absence.",
    revenueOps: "Base institutional pricing ($89/mo), plus $0.50/student per month fee for school sizes above 500.",
    pricingStrategy: "Tiered by school size: Small School ($89/mo up to 300 students), Medium ($179/mo up to 1000 students), Large Academy (Custom enterprise quote).",
    techArchitecture: "Lightweight multi-tenant structure running on PostgreSQL. Optimized for mobile network conditions, enabling teachers to log attendance offline, which syncs once internet is available.",
    securityPrivacy: "COPPA compliance features (Child Online Privacy Protection), strict data access isolation (only verified teachers can view student grades), and encrypted parent contact lists.",
    futureExpansion: "Integrate camera-based facial recognition for automated classroom attendance.",
  },
  {
    id: "hospital",
    name: "Hospital & Clinic Hub",
    category: "vertical",
    rating: 4.8,
    installs: 530,
    developer: "Saadhyam MedTech",
    cost: "$99/mo",
    shortDesc: "Manage patient records, appointment bookings, and automated prescription reminders.",
    icon: HeartIconSim,
    purpose: "Streamline healthcare facility operations by integrating patient bookings, electronic health records (EHR), and automated followup tracks into Saadhyam.",
    targetUsers: "Clinic Owners, Private Practice Doctors, Dentists, and Hospital Administrators.",
    problemsSolved: [
      "High booking friction leading to unbooked doctor schedules",
      "Patients forgetting prescription details or follow-up timelines",
      "Messy paper records causing slower clinical workflows and diagnostic delays",
    ],
    coreFeatures: [
      "Doctor appointment scheduling portal with slot optimization",
      "Electronic Health Records (EHR) directory with file uploads (X-rays, PDFs)",
      "Automated patient prescription reminders (via WhatsApp or SMS)",
      "Billing & Insurance processing integrations",
    ],
    aiFeatures: [
      "AI Patient assistant chatbot (helps patients pre-screen symptoms and schedules matching specialist appointments)",
      "OCR script analyzer (digitizes hand-written doctor prescriptions into database structures)",
      "Patient health trend anomaly detection (flags vital metrics that require immediate clinical attention)",
    ],
    requiredApis: [
      "AWS Textract (for OCR handwriting analysis)",
      "Meta WhatsApp Cloud API (v21.0)",
      "Razorpay Payment Links API",
    ],
    dbStructure: `CREATE TABLE patients (
  id UUID PRIMARY KEY,
  clinic_id UUID,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  dob DATE,
  gender VARCHAR(20),
  phone VARCHAR(50)
);

CREATE TABLE clinical_records (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID,
  symptoms TEXT,
  diagnosis TEXT,
  prescription JSONB,
  recorded_at TIMESTAMP
);`,
    dashboardUi: "HIPAA-compliant interface showing daily patient scheduling streams, Doctor availability tables, patient vital history graphs, and medication tracking panels.",
    userWorkflow: "1. Customize EHR template -> 2. Set doctor schedules -> 3. Embed booking widget -> 4. Diagnose patients and upload prescriptions -> 5. AI automatically tracks followups.",
    revenueOps: "Base licensing model ($99/mo) and per-appointment convenience fees.",
    pricingStrategy: "Clinic Pack ($99/mo for up to 3 doctors), Care Pack ($199/mo for up to 10 doctors), Custom hospital integrations.",
    techArchitecture: "HIPAA-aligned encrypted DB clusters. Standard HL7/FHIR interface framework to connect patient records directly with national health records servers.",
    securityPrivacy: "HIPAA and GDPR compliance frameworks. Encrypted databases (AES-256), fine-grained doctor-only authorization guards, and automated audit logs for all medical record access.",
    futureExpansion: "Integrate video-telehealth consult rooms directly into the patient appointment dashboard.",
  },
  {
    id: "competitor",
    name: "Competitor Intelligence Hub",
    category: "marketing",
    rating: 4.9,
    installs: 1220,
    developer: "Saadhyam Core Team",
    cost: "$39/mo",
    shortDesc: "Track competitor pricing, social posts, ads, and maps reviews automatically.",
    icon: TrendingUpIconSim,
    purpose: "Instantly deploy automated web monitors to track competitor price drops, social media posts, target ad campaigns, and maps reviews in real time.",
    targetUsers: "Product Managers, Sales Directors, Business Owners, and E-commerce store managers operating in highly competitive markets.",
    problemsSolved: [
      "Undercutting by competitors on product pricing without real-time detection",
      "Difficulty keeping track of competitor marketing campaigns and promotions",
      "Lack of visibility into competitor product issues or review weaknesses",
    ],
    coreFeatures: [
      "Real-time e-commerce price monitoring with automated price scraper alerts",
      "Social media post trackers and ad archive monitor",
      "Competitor Google Maps review analysis tracker",
      "Market trend dashboard",
    ],
    aiFeatures: [
      "AI SWOT Competitor matrix (auto-generates SWOT analysis by reading competitor customer complaints)",
      "Dynamic Pricing engine (auto-suggests business price adjustments based on competitor rates)",
      "AI-designed product counter-recommendations to win over clients",
    ],
    requiredApis: [
      "ScraperAPI / Web Scraping proxies",
      "Meta Ad Library API",
      "Google Maps Reviews API",
    ],
    dbStructure: `CREATE TABLE monitored_competitors (
  id UUID PRIMARY KEY,
  user_id UUID,
  business_name VARCHAR(255),
  website_url VARCHAR(255),
  instagram_handle VARCHAR(100)
);

CREATE TABLE competitor_scrapes (
  id UUID PRIMARY KEY,
  competitor_id UUID REFERENCES monitored_competitors(id),
  item_name VARCHAR(255),
  price NUMERIC(10,2),
  scraped_at TIMESTAMP
);`,
    dashboardUi: "Sleek market battle-room layout featuring pricing comparative line charts, live competitor social grids, review word-cloud analysis, and dynamic pricing suggestions widgets.",
    userWorkflow: "1. Input competitor URLs -> 2. Set alert triggers (e.g. price drops > 5%) -> 3. AI generates product comparisons -> 4. Review pricing changes weekly.",
    revenueOps: "Base platform tier, plus microtransaction fees for custom domain scrape crawls.",
    pricingStrategy: "Competitor Basic ($39/mo for up to 3 competitors), Pro ($89/mo for up to 10 competitors and hourly scraping alerts).",
    techArchitecture: "Proxied web scraping services routed through rotating proxies to prevent IP blocks. HTML pages are crawled, parsed via regex/BeautifulSoup, and structured product data is stored in the database.",
    securityPrivacy: "Strict compliance with public data scraping frameworks, anonymous proxies utilization, and no collection of private competitor backend data.",
    futureExpansion: "Integrate email newsletter monitoring to track competitor private marketing outreach campaigns.",
  },
  {
    id: "gov-compliance",
    name: "Gov & Compliance Guard",
    category: "operations",
    rating: 4.6,
    installs: 410,
    developer: "LegalTech Partners",
    cost: "$49/mo",
    shortDesc: "Automate form filings, analyze contracts, monitor tenders, and track regulatory alerts.",
    icon: ShieldIconSim,
    purpose: "Help business operations departments stay compliant with government protocols by indexing tenders, verifying forms, and tracking regulatory alerts.",
    targetUsers: "Operations Directors, Legal Advisors, Government Contractors, and corporate compliance officers.",
    problemsSolved: [
      "Missing municipal, national, or tax filing deadlines leading to penalties",
      "Spent hours scanning lengthy government documents for tender requirements",
      "Inability to keep track of changing state regulations and industry policies",
    ],
    coreFeatures: [
      "Government Tender notification system matching business keywords",
      "Automated business license and tax document expiration trackers",
      "Regulatory policy updates feed based on operating state",
      "Contracts compliance checklists constructor",
    ],
    aiFeatures: [
      "AI Document Scanner (scans municipal docs, business contracts, or compliance terms and highlights key risks and deadlines)",
      "Automated Form Pre-filler (fills out government application forms by extracting data from the business profile)",
      "AI tender criteria checker (evaluates if the company qualifies for active bids)",
    ],
    requiredApis: [
      "OpenGovernment Data APIs (e.g. Indian e-Procurement API)",
      "Adobe PDF Extract API",
      "Gemini Flash 1.5 API (for document summarizing)",
    ],
    dbStructure: `CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY,
  user_id UUID,
  document_name VARCHAR(255),
  file_url TEXT,
  analyzed_risks JSONB,
  expires_at DATE
);

CREATE TABLE matched_tenders (
  id UUID PRIMARY KEY,
  tender_id VARCHAR(100),
  title TEXT,
  agency VARCHAR(255),
  amount NUMERIC(15,2),
  deadline DATE,
  ai_match_score INT
);`,
    dashboardUi: "Compliance control center featuring document deadlines countdown calendar widgets, risk alert logs list, matched tenders table, and legal AI assistant chat interface.",
    userWorkflow: "1. Upload company registration details -> 2. Load active contracts -> 3. System builds compliance calendar -> 4. Receive alerts when new bids match profile.",
    revenueOps: "Base monthly model ($49/mo), plus $5/document analyzed beyond the tier allotment.",
    pricingStrategy: "Standard ($49/mo with 10 doc scans and tender monitoring), Pro ($129/mo with unlimited doc scans and legal compliance checklist audits).",
    techArchitecture: "Runs on Python-based PDF parser engines coupled with PgVector database. User profiles are vectorized and matched using cosine similarity indexes against daily scraped government tenders lists.",
    securityPrivacy: "Zero retention of scanned PDFs on third-party servers, local document encryption keys, and automatic secure file purging capabilities.",
    futureExpansion: "Integrate automated filing directly with national tax or company registration portals.",
  },
];

// Helper components simulating Lucide icons because of React context imports
function MessageSquareIconSim(props: any) { return <Puzzle {...props} className="text-emerald-500" />; }
function PhoneIconSim(props: any) { return <Phone {...props} className="text-blue-500" />; }
function DatabaseIconSim(props: any) { return <Layers {...props} className="text-indigo-500" />; }
function GlobeIconSim(props: any) { return <Globe {...props} className="text-amber-500" />; }
function WandIconSim(props: any) { return <Bot {...props} className="text-pink-500" />; }
function DollarSignIconSim(props: any) { return <DollarSign {...props} className="text-rose-500" />; }
function BookOpenIconSim(props: any) { return <BookOpen {...props} className="text-violet-500" />; }
function HeartIconSim(props: any) { return <Activity {...props} className="text-red-500" />; }
function TrendingUpIconSim(props: any) { return <TrendingUp {...props} className="text-cyan-500" />; }
function ShieldIconSim(props: any) { return <Shield {...props} className="text-teal-500" />; }

function PluginsPage() {
  const [activeTab, setActiveTab] = useState<"store" | "active" | "developer">("store");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "operations" | "marketing" | "vertical" | "developer">("all");
  const [businessType, setBusinessType] = useState<string>("");
  const [installedPluginIds, setInstalledPluginIds] = useState<string[]>(["crm", "social-media", "google-workspace"]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginDetail | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  // Video State
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Live Integrations Check States
  const [pluginStatuses, setPluginStatuses] = useState<Record<string, { connected: boolean; detail: string }>>({
    crm: { connected: true, detail: "Core Customer Sync Active" },
    "gov-compliance": { connected: true, detail: "Compliance System Verified" }
  });
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [flowLogs, setFlowLogs] = useState<AutomationLog[]>([]);
  const [isFlowRunning, setIsFlowRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Automation Flow Builder State
  const [automationSteps, setAutomationSteps] = useState<string[]>([
    "whatsapp",
    "crm",
    "ai-voice",
    "google-workspace"
  ]);

  // Developer Key State
  const [devApiKey, setDevApiKey] = useState("");

  useEffect(() => {
    loadEcosystemData();
  }, [businessType]);

  const loadEcosystemData = async () => {
    setIsLoadingStatuses(true);
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (!token) return;

      // 1. Fetch installed plugin IDs from backend
      const installedRes = await getInstalledPlugins(token);
      if (installedRes && installedRes.installed) {
        setInstalledPluginIds(installedRes.installed);
      }

      // 2. Fetch AEO/GEO integration statuses
      const integrationsRes = await getIntegrationsStatus(token);
      const ints = integrationsRes.integrations;

      // 3. Fetch WhatsApp connection status
      let waConnected = false;
      let waDetail = "Not linked";
      try {
        const waRes = await fetch(`${env.apiBaseUrl}/api/whatsapp/connection-status`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (waRes.ok) {
          const waData = await waRes.json();
          waConnected = waData.is_connected;
          waDetail = waConnected 
            ? `Connected: ${waData.phone_number || "WABA Live"}` 
            : "Not linked";
        }
      } catch (e) {
        console.error("WhatsApp status check failed:", e);
      }

      // 4. Fetch Competitor Intelligence status
      let compConnected = false;
      let compDetail = "No competitors tracked";
      try {
        const compRes = await fetch(`${env.apiBaseUrl}/api/competitor-intelligence/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (compRes.ok) {
          const compData = await compRes.json();
          compConnected = compData.total > 0;
          compDetail = compConnected 
            ? `${compData.total} competitor(s) monitored` 
            : "No competitors tracked";
        }
      } catch (e) {
        console.error("Competitor status check failed:", e);
      }

      // 5. Fetch Calling Agent status
      let voiceConnected = false;
      let voiceDetail = "No active campaign";
      try {
        const voiceRes = await fetch(`${env.apiBaseUrl}/api/voice-agent/campaigns`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (voiceRes.ok) {
          const voiceData = await voiceRes.json();
          const campaigns = voiceData.campaigns || voiceData;
          voiceConnected = Array.isArray(campaigns) && campaigns.length > 0;
          voiceDetail = voiceConnected 
            ? `${campaigns.length} outbound campaign(s)` 
            : "No active campaigns";
        }
      } catch (e) {
        console.error("Voice campaigns status check failed:", e);
      }

      // Build list of connected platforms for social media
      const socialPlatforms = [];
      if (ints.instagram.connected) socialPlatforms.push("Instagram");
      if (ints.facebook.connected) socialPlatforms.push("Facebook");
      if (ints.youtube.connected) socialPlatforms.push("YouTube");
      const socialDetail = socialPlatforms.length > 0 
        ? `Synced: ${socialPlatforms.join(", ")}` 
        : "Not linked";

      setPluginStatuses({
        crm: { connected: true, detail: "Core Customer Sync Active" },
        whatsapp: { connected: waConnected, detail: waDetail },
        "ai-voice": { connected: voiceConnected, detail: voiceDetail },
        "google-workspace": { connected: ints.google.connected, detail: ints.google.connected ? `Linked: ${ints.google.detail || "Google API Suite"}` : "Not linked" },
        "social-media": { connected: socialPlatforms.length > 0, detail: socialDetail },
        accounting: { connected: true, detail: "Zoho & QuickBooks Sandbox Active" },
        "school-management": { connected: businessType === "school", detail: businessType === "school" ? "Active Educational Hub" : "Ready to Configure" },
        "hospital-management": { connected: businessType === "hospital", detail: businessType === "hospital" ? "Active Clinical Hub" : "Ready to Configure" },
        "competitor-intelligence": { connected: compConnected, detail: compDetail },
        "gov-compliance": { connected: true, detail: "GST & IEC Compliance Verified" }
      });

    } catch (err) {
      console.error("Error loading ecosystem integrations:", err);
    } finally {
      setIsLoadingStatuses(false);
    }
  };

  const handleRunFlowTest = async () => {
    setIsFlowRunning(true);
    setFlowLogs([]);
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      
      const res = await runPluginFlow(token, automationSteps);
      if (res && res.status === "success") {
        const fullLogs = res.logs;
        for (let i = 0; i < fullLogs.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setFlowLogs((prev) => [...prev, fullLogs[i]]);
        }
        toast.success("Autopilot Workflow test completed successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to run automation flow test");
    } finally {
      setIsFlowRunning(false);
    }
  };

  const handleRunFlowPrompt = async (customPrompt?: string) => {
    const activePrompt = customPrompt || aiPrompt;
    if (!activePrompt.trim()) {
      toast.error("Please enter an AI prompt");
      return;
    }
    
    setIsFlowRunning(true);
    setFlowLogs([]);
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      
      const res = await runPluginFlow(token, null, activePrompt);
      if (res && res.status === "success") {
        const fullLogs = res.logs;
        for (let i = 0; i < fullLogs.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setFlowLogs((prev) => [...prev, fullLogs[i]]);
        }
        toast.success("AI Orchestrator workflow execution completed!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to execute AI Orchestrator flow");
    } finally {
      setIsFlowRunning(false);
    }
  };

  const generateDevKey = () => {
    const key = "saadhyam_pub_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setDevApiKey(key);
    toast.success("Public API Key generated successfully!");
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        setIsVideoLoading(true);
        videoRef.current.play()
          .then(() => {
            setIsVideoPlaying(true);
            setIsVideoLoading(false);
          })
          .catch(e => {
            console.log("Video play failed:", e);
            // Fallback: try muting and playing
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play()
                .then(() => {
                  setIsVideoPlaying(true);
                  setIsVideoLoading(false);
                })
                .catch(err => {
                  console.log("Muted video play failed:", err);
                  setIsVideoLoading(false);
                });
            }
          });
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleInstallPlugin = async (pluginId: string) => {
    setIsInstalling(true);
    setInstallProgress(0);
    const interval = setInterval(() => {
      setInstallProgress((prev) => (prev >= 90 ? 90 : prev + 30));
    }, 150);

    try {
      const token = localStorage.getItem("saadhyam_token");
      if (token) {
        await installPlugin(token, pluginId);
        clearInterval(interval);
        setInstallProgress(100);
        setTimeout(() => {
          setIsInstalling(false);
          loadEcosystemData();
          toast.success("Plugin installed successfully! Connected to Saadhyam backend.");
        }, 200);
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsInstalling(false);
      toast.error(err.message || "Plugin installation failed");
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      const token = localStorage.getItem("saadhyam_token");
      if (token) {
        await uninstallPlugin(token, pluginId);
        loadEcosystemData();
        toast.info("Plugin uninstalled. Settings cleared from Saadhyam backend.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to uninstall plugin");
    }
  };

  // AI recommendations map based on business type
  const aiRecommendations = useMemo(() => {
    if (!businessType) return [];
    if (businessType === "hospital") return ["hospital", "whatsapp", "ai-voice", "google-workspace"];
    if (businessType === "school") return ["school", "whatsapp", "google-workspace", "accounting"];
    if (businessType === "ecommerce") return ["whatsapp", "crm", "social-media", "competitor"];
    if (businessType === "agency") return ["crm", "google-workspace", "social-media", "gov-compliance"];
    if (businessType === "retail") return ["whatsapp", "accounting", "social-media", "competitor"];
    return [];
  }, [businessType]);

  // Filtered plugins list
  const filteredPlugins = useMemo(() => {
    return PLUGINS_DATA.filter((plugin) => {
      const matchesSearch =
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ? true : plugin.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Sort plugins: recommended plugins at the top
  const sortedPlugins = useMemo(() => {
    if (aiRecommendations.length === 0) return filteredPlugins;
    return [...filteredPlugins].sort((a, b) => {
      const aRec = aiRecommendations.includes(a.id);
      const bRec = aiRecommendations.includes(b.id);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return 0;
    });
  }, [filteredPlugins, aiRecommendations]);

  return (
    <div className="p-4 md:p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6 dark:bg-slate-900">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-5 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Cpu size={14} className="animate-spin-slow" />
            App Store for Business AI
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Saadhyam Plugins</h1>
          <p className="text-slate-400 text-sm mt-1">
            Install integrations, trigger automations, and expand your business operations command deck.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start dark:bg-slate-900 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("store")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "store"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Plugin Store
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "active"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Active Hub ({installedPluginIds.length})
          </button>
          <button
            onClick={() => setActiveTab("developer")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "developer"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Developer Portal
          </button>
        </div>
      </div>

      {activeTab === "store" && (
        <>
          {/* Onboarding & Video Introduction Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between backdrop-blur-md dark:border-slate-700">
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs px-3 py-1 rounded-full w-fit">
                  <Video size={12} />
                  Introduction to Saadhyam Plugins
                </div>
                <h2 className="text-xl font-bold text-white">How Plugins Automate Your Business</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                  Watch our 60-second walkthrough to see how adding native plugins links your databases, CRM pipelines, accounting records, and AI calling agents together automatically.
                </p>
              </div>

              {/* Video Player */}
              <div className="relative mt-5 rounded-xl border border-slate-800 bg-black/80 aspect-video overflow-hidden group dark:border-slate-700">
                <video
                  ref={videoRef}
                  src="https://vjs.zencdn.net/v/oceans.mp4"
                  loop
                  muted={isMuted}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnded}
                  onWaiting={() => setIsVideoLoading(true)}
                  onPlaying={() => setIsVideoLoading(false)}
                  onCanPlay={() => setIsVideoLoading(false)}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoPlaying ? "opacity-100" : "opacity-40"}`}
                  onClick={handlePlayPause}
                />

                {/* Loading Spinner */}
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none z-10">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {/* Visual Overlay Graphic */}
                {!isVideoPlaying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md pointer-events-none z-10">
                    {/* Glowing Grid Background Mock */}
                    <div className="absolute inset-0 opacity-15" style={{
                      backgroundImage: `radial-gradient(circle, #8B5CF6 1px, transparent 1px)`,
                      backgroundSize: '16px 16px'
                    }} />
                    
                    {/* Dynamic connected node diagram representation */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                      <svg width="100%" height="100%" className="absolute inset-0">
                        <motion.line x1="30%" y1="30%" x2="50%" y2="50%" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
                        <motion.line x1="70%" y1="30%" x2="50%" y2="50%" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [0, 20] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
                        <motion.line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="5,5" animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
                      </svg>
                      
                      <div className="absolute left-[30%] top-[30%] -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-slate-900 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.2)] dark:bg-slate-900">
                        <Puzzle size={14} />
                      </div>
                      <div className="absolute right-[30%] top-[30%] translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-slate-900 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)] dark:bg-slate-900">
                        <Sparkles size={14} />
                      </div>
                      <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-slate-900 border border-purple-500 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(139,92,246,0.4)] dark:bg-slate-900">
                        <Cpu size={20} className="animate-spin-slow" />
                      </div>
                      <div className="absolute left-[50%] top-[80%] -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-slate-900 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:bg-slate-900">
                        <Zap size={14} />
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white shadow-glow pointer-events-auto cursor-pointer transition-transform duration-200 active:scale-95 hover:scale-105" onClick={handlePlayPause}>
                        <Play size={28} className="ml-1" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 mt-4 tracking-wider uppercase drop-shadow">Play Video Walkthrough</span>
                      <span className="text-[10px] text-slate-400 mt-1 max-w-xs text-center">See how autonomous AI plugins sync and automate your business operations</span>
                    </div>
                  </div>
                )}

                {/* Video controls */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <button onClick={handlePlayPause} className="text-white hover:text-purple-400 transition-colors pointer-events-auto">
                      {isVideoPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={handleMuteToggle} className="text-white hover:text-purple-400 transition-colors pointer-events-auto">
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span className="text-[10px] font-mono text-slate-300">
                      {formatTime(currentTime)} / {formatTime(duration || 46)}
                    </span>
                  </div>
                  
                  {/* Timeline bar */}
                  <div 
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="flex-1 mx-4 h-1.5 bg-slate-800 hover:bg-slate-700 rounded-full overflow-hidden relative cursor-pointer pointer-events-auto group/timeline dark:bg-slate-900"
                  >
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-75" 
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <HelpCircle size={16} className="text-slate-400 pointer-events-auto cursor-pointer hover:text-white" />
                </div>
              </div>
            </div>

            {/* AI Recommendation Engine Panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden backdrop-blur-md flex flex-col justify-between dark:border-slate-700">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles size={14} className="animate-pulse" />
                  AI Recommendation Engine
                </div>
                <h3 className="text-lg font-bold text-white">Smart Match Setup</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Select your current industry. The Saadhyam AI engine will automatically scan and recommend plugins that maximize automation for your specific workflow.
                </p>

                <div className="space-y-2 pt-2">
                  <label className="text-xs text-slate-400 font-semibold block">Your Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="">-- Choose Business Type --</option>
                    <option value="hospital">Healthcare / Clinic / Hospital</option>
                    <option value="school">Educational School / LMS Academy</option>
                    <option value="ecommerce">E-commerce / D2C Brand</option>
                    <option value="agency">Agency / Marketing Firm</option>
                    <option value="retail">Local Retail / Shop Owner</option>
                  </select>
                </div>
              </div>

              {businessType ? (
                <div className="mt-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">AI Recommended Plugins:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {PLUGINS_DATA.filter((p) => aiRecommendations.includes(p.id)).map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5 text-slate-200">
                        <Check size={12} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{p.name.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 dark:border-slate-700">
                  Select a business type above to generate tailored recommendations.
                </div>
              )}
            </div>
          </div>

          {/* Plugin Marketplace Storefront */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-900/40 p-4 border border-slate-900 rounded-2xl dark:border-slate-700">
              {/* Category filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Plugins" },
                  { id: "operations", label: "Operations" },
                  { id: "marketing", label: "Marketing & Growth" },
                  { id: "vertical", label: "Vertical SaaS" },
                  { id: "developer", label: "Developer Tools" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedCategory === cat.id
                        ? "bg-purple-600 text-white border-purple-500/20"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-200 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPlugins.map((plugin) => {
                const Icon = plugin.icon;
                const isInstalled = installedPluginIds.includes(plugin.id);
                const isRecommended = aiRecommendations.includes(plugin.id);

                return (
                  <motion.div
                    key={plugin.id}
                    whileHover={{ y: -4 }}
                    className={`bg-slate-900/60 border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-md transition-all duration-300 ${
                      isRecommended
                        ? "border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Glowing highlight for recommended plugins */}
                    {isRecommended && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-[9px] font-extrabold uppercase px-3 py-1 rounded-bl-lg text-white flex items-center gap-1 shadow-md">
                        <Sparkles size={8} className="animate-pulse" />
                        AI Recommended
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Icon & Title */}
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform dark:bg-slate-900 dark:border-slate-700">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                            {plugin.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">{plugin.developer}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-700 dark:bg-slate-900" />
                            <span className="text-[10px] text-purple-400 font-semibold">{plugin.cost}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                        {plugin.shortDesc}
                      </p>

                      {/* Store stats */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-900 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span className="text-slate-300 font-medium">{plugin.rating}</span>
                          <span>({plugin.installs}+ reviews)</span>
                        </div>
                        <span>{(plugin.installs * 7.5).toLocaleString()}+ active integrations</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 flex gap-2">
                      <Button
                        onClick={() => setSelectedPlugin(plugin)}
                        className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs py-2 rounded-xl dark:bg-slate-900 dark:border-slate-700"
                      >
                        Specs & DDL
                      </Button>
                      
                      {isInstalled ? (
                        <Button
                          onClick={() => handleUninstallPlugin(plugin.id)}
                          className="px-3 bg-emerald-500/10 hover:bg-red-500/10 border border-emerald-500/20 text-emerald-400 hover:text-red-400 text-xs py-2 rounded-xl flex items-center gap-1"
                        >
                          <Check size={14} className="shrink-0" />
                          Installed
                        </Button>
                      ) : (
                        <Button
                          disabled={isInstalling}
                          onClick={() => handleInstallPlugin(plugin.id)}
                          className="px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 rounded-xl shadow-glow active:scale-95"
                        >
                          {isInstalling ? "Installing..." : "Install"}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "active" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Installed Plugins list */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              My Integrations
            </h2>
            <div className="space-y-3">
              {isLoadingStatuses ? (
                <div className="p-8 border border-dashed border-slate-800 bg-slate-900/20 rounded-xl text-center dark:border-slate-700">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-500">Checking connection statuses...</span>
                </div>
              ) : (
                PLUGINS_DATA.map((plugin) => {
                  const isInstalled = installedPluginIds.includes(plugin.id);
                  const Icon = plugin.icon;
                  if (!isInstalled) return null;

                  const statusInfo = pluginStatuses[plugin.id] || { connected: false, detail: "Not configured" };

                  // Helper function mapping plugin id to its corresponding configuration page
                  const getPluginConfigRoute = (id: string) => {
                    switch (id) {
                      case "whatsapp": return "/dashboard/whatsapp";
                      case "ai-voice": return "/dashboard/voice-agent";
                      case "crm": return "/dashboard/customers";
                      case "google-workspace": return "/dashboard/seo-google-maps";
                      case "social-media": return "/dashboard/instagram";
                      case "accounting": return "/dashboard/pricing";
                      case "school-management": return "/dashboard/agents/partnership";
                      case "hospital-management": return "/dashboard/agents/customer-retention";
                      case "competitor-intelligence": return "/dashboard/competitor-analysis";
                      case "gov-compliance": return "/dashboard/settings";
                      default: return "/dashboard/settings";
                    }
                  };

                  return (
                    <div
                      key={plugin.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all relative overflow-hidden group/item dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white">{plugin.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] flex items-center gap-1 font-semibold ${statusInfo.connected ? "text-emerald-400" : "text-amber-400"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                              {statusInfo.connected ? "Connected" : "Requires Setup"}
                            </span>
                            <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                              · {statusInfo.detail}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
                        <Link
                          to={getPluginConfigRoute(plugin.id)}
                          className="px-2.5 py-1 text-[10px] font-semibold text-slate-350 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md transition-all flex items-center gap-1 dark:bg-slate-900 dark:border-slate-700"
                        >
                          <Settings size={10} />
                          Configure
                        </Link>
                        <button
                          onClick={() => handleUninstallPlugin(plugin.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-950 transition-colors"
                          title="Uninstall plugin"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Flow Orchestration Canvas */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden backdrop-blur-md flex flex-col justify-between dark:border-slate-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider block">Cross-Plugin Automations</span>
                  <h3 className="text-lg font-bold text-white">Autopilot Workflow Builder</h3>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-full">
                  Active
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Connect your active plugins to build end-to-end automations. Trigger outbound calls, log deals, file invoicing ledgers, and prompt follow-up tasks without manual intervention.
              </p>

              {/* AI Autonomous Orchestrator Prompt Box */}
              <div className="bg-slate-950/65 border border-slate-850 rounded-xl p-5 space-y-4 relative overflow-hidden group dark:border-slate-700">
                <div className="absolute top-0 right-0 p-3 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
                  <Bot size={36} className="text-purple-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={13} className="text-purple-400" />
                    AI Autonomous Orchestrator (Zero-Config)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Type a natural language instruction. Saadhyam AI will automatically discover, sequence, and execute the correct plugins.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isFlowRunning) {
                        handleRunFlowPrompt();
                      }
                    }}
                    placeholder="e.g., Send WABA fee reminders to class 10 and log in CRM..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 min-w-0 dark:bg-slate-900 dark:border-slate-700"
                    disabled={isFlowRunning}
                  />
                  <button
                    onClick={() => handleRunFlowPrompt()}
                    disabled={isFlowRunning || !aiPrompt.trim()}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all select-none ${
                      isFlowRunning || !aiPrompt.trim()
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-550/30 active:scale-98 border border-purple-500/30 cursor-pointer"
                    }`}
                  >
                    <Bot size={13} className={isFlowRunning ? "animate-spin text-purple-400" : ""} />
                    {isFlowRunning ? "Executing..." : "Execute"}
                  </button>
                </div>

                {/* Quick Prompts Suggestions */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <span className="text-[9px] text-slate-500 font-semibold self-center">Try:</span>
                  {[
                    "Send due fee reminders on WhatsApp to all students",
                    "Qualify retail store leads and sync contacts to CRM",
                    "File compliance tax ledger invoice records to GBP and CRM",
                    "Scrape competitor rates and post social campaign post"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiPrompt(p);
                        handleRunFlowPrompt(p);
                      }}
                      disabled={isFlowRunning}
                      className="px-2 py-1 bg-slate-900/60 border border-slate-850 hover:border-slate-700 rounded-lg text-[9px] text-slate-400 hover:text-slate-200 transition-all select-none cursor-pointer dark:border-slate-700"
                    >
                      {p.length > 40 ? p.substring(0, 40) + "..." : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Node graph builder visual representation */}
              <div className="relative py-10 bg-slate-950 border border-slate-850 rounded-xl px-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 overflow-x-auto min-h-[220px] dark:bg-slate-900 dark:border-slate-700">
                {automationSteps.length === 0 ? (
                  <div className="text-center text-xs text-slate-500">
                    No steps in workflow. Add plugins below to configure your automation path.
                  </div>
                ) : (
                  automationSteps.map((stepId, idx) => {
                    const plugin = PLUGINS_DATA.find((p) => p.id === stepId);
                    if (!plugin) return null;
                    const Icon = plugin.icon;

                    return (
                      <div key={stepId} className="flex flex-col md:flex-row items-center shrink-0">
                        {/* Node block */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 w-40 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative group hover:border-purple-500/40 transition-all duration-200 dark:bg-slate-900 dark:border-slate-700">
                          <div className="h-7 w-7 rounded bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
                            <Icon size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Step {idx + 1}</span>
                            <span className="text-xs font-bold text-slate-200 block truncate">{plugin.name.split(" ")[0]}</span>
                          </div>

                          {/* Remove node button */}
                          <button
                            onClick={() => setAutomationSteps((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold border border-slate-950 dark:border-slate-700"
                            title="Remove from flow"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Connection arrow */}
                        {idx < automationSteps.length - 1 && (
                          <div className="my-2 md:my-0 md:mx-2 flex flex-col items-center">
                            <ArrowRight size={14} className="text-purple-500 animate-pulse rotate-90 md:rotate-0" />
                            <span className="text-[8px] font-mono text-purple-400 mt-1 uppercase hidden md:inline">triggers</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Interactive Controls */}
              <div className="flex flex-wrap gap-2 items-center border-t border-slate-800/80 pt-4 mt-2">
                <div className="text-xs text-slate-400 font-medium mr-2">Customize Workflow:</div>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !automationSteps.includes(val)) {
                      setAutomationSteps((prev) => [...prev, val]);
                    }
                    e.target.value = "";
                  }}
                  className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="">+ Add Automation Step</option>
                  {installedPluginIds
                    .filter((id) => !automationSteps.includes(id))
                    .map((id) => {
                      const pl = PLUGINS_DATA.find((p) => p.id === id);
                      return <option key={id} value={id}>{pl?.name || id}</option>;
                    })}
                </select>
                
                <button
                  onClick={() => setAutomationSteps(["whatsapp", "crm", "ai-voice", "google-workspace"])}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors dark:bg-slate-900 dark:border-slate-700"
                >
                  Reset Flow
                </button>
                
                <button
                  onClick={handleRunFlowTest}
                  disabled={isFlowRunning || automationSteps.length === 0}
                  className={`ml-auto px-4 py-1.5 text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 ${
                    isFlowRunning || automationSteps.length === 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-98"
                  }`}
                >
                  <Zap size={13} className={isFlowRunning ? "animate-spin text-purple-400" : "text-amber-400 animate-pulse"} />
                  {isFlowRunning ? "Running Test..." : "Run Live Trigger Test"}
                </button>
              </div>

              {/* Dynamic Automation Output Logs */}
              {(flowLogs.length > 0 || isFlowRunning) && (
                <div className="mt-4 border border-slate-850 bg-slate-950 rounded-xl p-4 font-mono text-[10px] space-y-2 max-h-[220px] overflow-y-auto shadow-inner relative dark:border-slate-700 dark:bg-slate-900">
                  <div className="sticky top-0 right-0 flex items-center justify-between pb-2 bg-slate-950 border-b border-slate-900/60 text-slate-400 select-none dark:bg-slate-900">
                    <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
                      Live Autopilot Trigger Log
                    </span>
                    <button 
                      onClick={() => setFlowLogs([])}
                      className="hover:text-white transition-colors text-[9px]"
                    >
                      Clear Console
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    {flowLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex gap-2 leading-relaxed">
                        <span className="text-slate-550 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`font-semibold shrink-0 select-none ${
                          log.step === "Initialization" ? "text-purple-400" :
                          log.step === "Complete" ? "text-emerald-400" : "text-slate-350"
                        }`}>{log.step}:</span>
                        <span className={
                          log.step === "Complete" ? "text-emerald-350 font-bold" :
                          log.message.includes("Error") ? "text-red-400" : "text-slate-200"
                        }>{log.message}</span>
                      </div>
                    ))}
                    {isFlowRunning && (
                      <div className="flex gap-2 text-slate-400 animate-pulse">
                        <span>[--:--:--]</span>
                        <span>Executing next trigger step in pipeline...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Automation flow templates */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-2">Automation Templates:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <button
                    onClick={() => setAutomationSteps(["whatsapp", "crm", "ai-voice", "google-workspace"])}
                    className="p-3 bg-slate-950 border border-slate-850 hover:border-purple-500/20 text-left rounded-xl hover:bg-slate-950/80 transition-all text-slate-300 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <span className="font-bold text-slate-200 block">WhatsApp Inbound Lead Automation</span>
                    <span className="text-slate-500 text-[10px] mt-0.5 block">New Whatsapp lead → Add to CRM → Outbound calling agents followup → Email calendar confirmations.</span>
                  </button>
                  <button
                    onClick={() => setAutomationSteps(["hospital-management", "whatsapp", "accounting", "google-workspace"])}
                    className="p-3 bg-slate-950 border border-slate-850 hover:border-purple-500/20 text-left rounded-xl hover:bg-slate-950/80 transition-all text-slate-300 dark:bg-slate-900 dark:border-slate-700"
                  >
                    <span className="font-bold text-slate-200 block">Healthcare Patient Checkout Automation</span>
                    <span className="text-slate-500 text-[10px] mt-0.5 block">New record in Hospital hub → Generate invoice in Accounting → Send invoice on Whatsapp.</span>
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={() => toast.success("Automation flow saved and deployed successfully!")}
              className="mt-6 w-full bg-purple-650 hover:bg-purple-755 text-white font-bold py-2 rounded-xl shadow-glow active:scale-98"
            >
              Deploy Automation Flow
            </Button>
          </div>
        </div>
      )}

      {activeTab === "developer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SDK & Documentation */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden backdrop-blur-md space-y-6 dark:border-slate-700">
            <div className="space-y-2">
              <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider block">SDK & Developer Ecosystem</span>
              <h3 className="text-xl font-bold text-white">Build for Saadhyam Platform</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect your SaaS applications or custom internal workflows directly into the Saadhyam business dashboard. Build customized plugins and release them on the marketplace with our developer framework.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 dark:bg-slate-900 dark:border-slate-700">
                <Code className="text-purple-400 mb-1" size={20} />
                <h4 className="text-xs font-bold text-white">Saadhyam SDK v1.0</h4>
                <p className="text-slate-500 text-[11px]">
                  Fully typed Typescript and Python client packages facilitating integration, authentication, and layout rendering within our grid systems.
                </p>
                <Button className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 text-xs text-slate-300 py-1.5 rounded-lg mt-2 dark:bg-slate-900 dark:border-slate-700">
                  Download SDK
                </Button>
              </div>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 dark:bg-slate-900 dark:border-slate-700">
                <Database className="text-purple-400 mb-1" size={20} />
                <h4 className="text-xs font-bold text-white">Developer API Keys</h4>
                <p className="text-slate-500 text-[11px]">
                  Generate secret public API keys to call CRM contacts, messaging channels, and calendar endpoints directly from your code.
                </p>
                <Button onClick={generateDevKey} className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 text-xs text-slate-300 py-1.5 rounded-lg mt-2 dark:bg-slate-900 dark:border-slate-700">
                  Generate Key
                </Button>
              </div>
            </div>

            {devApiKey && (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 dark:bg-slate-900 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Your API Key:</span>
                <code className="text-xs text-slate-200 block select-all break-all bg-black/40 p-2 rounded border border-slate-900 font-mono dark:border-slate-700">{devApiKey}</code>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Revenue Sharing Model</h4>
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between dark:bg-slate-900 dark:border-slate-700">
                <div>
                  <span className="text-xl font-extrabold text-white">80% / 20%</span>
                  <span className="text-slate-500 text-xs block mt-1">Developers keep 80% of subscription revenue generated by installed plugins.</span>
                </div>
                <div className="bg-purple-600/10 border border-purple-600/30 text-purple-400 text-xs px-3 py-1 rounded-full">
                  Industry Leading Split
                </div>
              </div>
            </div>
          </div>

          {/* Validation checklist */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden backdrop-blur-md flex flex-col justify-between dark:border-slate-700">
            <div className="space-y-4">
              <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider block">Verification Guidelines</span>
              <h3 className="text-lg font-bold text-white">Submit Your Plugin</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                All submitted marketplace modules must satisfy security guidelines before they are published to public users.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "OAuth 2.0 implementation verification",
                  "Encrypted customer database parameters",
                  "Data isolation guidelines validation",
                  "FastAPI Webhook timeout under 2s",
                  "Rate limits mapping for Meta endpoints",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => toast.success("Submission form is loaded. Upload your manifest.json to proceed.")}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl shadow-glow"
            >
              Submit Manifest For Review
            </Button>
          </div>
        </div>
      )}

      {/* Roadmap Timeline */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden backdrop-blur-md space-y-6 dark:border-slate-700">
        <div>
          <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider block">Vision & Expansion Roadmap</span>
          <h3 className="text-xl font-bold text-white">Saadhyam Plugins Evolution</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { phase: "Phase 1 (MVP)", title: "Core Channels Integrations", desc: "Build out WhatsApp CRM channels, social scheduling integrations, and Twilio calling interfaces.", status: "Complete" },
            { phase: "Phase 2 (Growth)", title: "Accounting & OCR Integration", desc: "Deploy OCR receipt scrapers, tax compliance notifications, and QuickBooks synchronization.", status: "In Progress" },
            { phase: "Phase 3 (Enterprise)", title: "Vertical Industry SaaS Modules", desc: "Deploy full clinic management portals, school class schedules, and automated medical followup remap tracks.", status: "Q3 2026" },
            { phase: "Phase 4 (Global Expansion)", title: "Cross-Plugin Automation API", desc: "Release developer API SDKs and enable global payment processing loops for regional builders.", status: "Q4 2026" },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-4 relative flex flex-col justify-between min-h-[140px] hover:border-purple-500/20 transition-colors dark:bg-slate-900 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">{item.phase}</span>
                <h4 className="text-xs font-bold text-slate-200 mt-1">{item.title}</h4>
                <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[9px] font-semibold">
                <span className={item.status === "Complete" ? "text-emerald-400" : item.status === "In Progress" ? "text-purple-400 animate-pulse" : "text-slate-500"}>
                  {item.status}
                </span>
                <span className="text-slate-600 font-mono">#{idx+1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Plugin Drawer Modal */}
      <AnimatePresence>
        {selectedPlugin && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlugin(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-slate-900 border-l border-slate-800 z-[60] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto dark:bg-slate-900 dark:border-slate-700"
            >
              <div className="p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-5 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center dark:bg-slate-900 dark:border-slate-700">
                      <Puzzle size={22} className="text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedPlugin.name}</h2>
                      <span className="text-xs text-purple-400 font-bold">{selectedPlugin.cost}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlugin(null)}
                    className="text-slate-400 hover:text-white px-3 py-1.5 border border-slate-800 rounded-lg text-xs dark:border-slate-700"
                  >
                    Close
                  </button>
                </div>

                {/* Subsections list (A-N structure details) */}
                <div className="space-y-6">
                  {/* A. Purpose */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">A. Purpose</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.purpose}</p>
                  </div>

                  {/* B. Target Users */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">B. Target Users</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.targetUsers}</p>
                  </div>

                  {/* C. Business Problems Solved */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">C. Business Problems Solved</span>
                    <ul className="list-disc pl-4 space-y-1 mt-1.5 text-xs text-slate-400">
                      {selectedPlugin.problemsSolved.map((prob, i) => (
                        <li key={i}>{prob}</li>
                      ))}
                    </ul>
                  </div>

                  {/* D. Core Features */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">D. Core Features</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                      {selectedPlugin.coreFeatures.map((feat, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-850 dark:bg-slate-900 dark:border-slate-700">
                          <Check size={12} className="text-purple-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* E. AI Features */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">E. AI Features</span>
                    <div className="space-y-2 mt-1.5">
                      {selectedPlugin.aiFeatures.map((aifeat, i) => (
                        <div key={i} className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-start gap-2 dark:bg-slate-900 dark:border-slate-700">
                          <Sparkles size={12} className="text-purple-400 mt-0.5 shrink-0" />
                          <span>{aifeat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* F. Required APIs */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">F. Required APIs</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedPlugin.requiredApis.map((api, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-400 rounded-md dark:bg-slate-900 dark:border-slate-700">
                          {api}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* G. Database Structure */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">G. Database Structure (Schema)</span>
                    <pre className="text-[10px] text-slate-300 bg-black/40 border border-slate-950 rounded-xl p-3.5 font-mono overflow-x-auto mt-1.5 select-all dark:border-slate-700">
                      {selectedPlugin.dbStructure}
                    </pre>
                  </div>

                  {/* H. Dashboard UI Design */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">H. Dashboard UI Design Mockup</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.dashboardUi}</p>
                  </div>

                  {/* I. User Workflow */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">I. User Installation & Config Workflow</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.userWorkflow}</p>
                  </div>

                  {/* J. Revenue Opportunities */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">J. Revenue Opportunities</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.revenueOps}</p>
                  </div>

                  {/* K. Subscription Pricing Strategy */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">K. Subscription Pricing Strategy</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.pricingStrategy}</p>
                  </div>

                  {/* L. Technical Architecture */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">L. Technical Architecture Stack</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.techArchitecture}</p>
                  </div>

                  {/* M. Security & Privacy Measures */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">M. Security & Privacy Measures</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.securityPrivacy}</p>
                  </div>

                  {/* N. Future Expansion Possibilities */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">N. Future Expansion Possibilities</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPlugin.futureExpansion}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
