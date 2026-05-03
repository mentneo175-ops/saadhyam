# Project Structure - Saadhyam AI

Clean and organized project structure for the Saadhyam AI platform.

## 📁 Root Directory

```
Sadhyam/
├── .git/                    # Git repository
├── .vscode/                 # VS Code settings
├── Backend/                 # FastAPI backend application
├── Frontend/                # React frontend application
├── .gitignore              # Git ignore rules
├── API.md                  # API documentation
├── QUICK_START.md          # Quick start guide
├── README.md               # Main project documentation
└── PROJECT_STRUCTURE.md    # This file
```

## 🔧 Backend Structure

```
Backend/
├── ai_models/              # AI model implementations
│   ├── business_analysis/  # Business analysis AI
│   │   ├── adapter/        # LoRA adapter files
│   │   ├── generator.py    # Business analysis generator
│   │   ├── model_loader.py # Model loading utilities
│   │   └── model_server.py # Standalone model server
│   └── review_reply_ai/    # Review reply AI
│       ├── adapter/        # LoRA adapter files
│       ├── generator.py    # Review reply generator
│       └── model_loader.py # Model loading utilities
├── config/                 # Configuration files
│   ├── database.py         # Database configuration
│   └── settings.py         # Application settings
├── db/                     # Database models
│   └── models.py           # SQLAlchemy models
├── migrations/             # Database migrations
│   ├── add_business_analysis_table.py
│   ├── add_business_profile_fields.py
│   └── add_name_column.py
├── models/                 # Pydantic models
│   ├── instagram.py        # Instagram models
│   ├── settings.py         # Settings models
│   └── user.py             # User models
├── routes/                 # API route handlers
│   ├── ai.py              # AI endpoints
│   ├── auth.py            # Authentication
│   ├── business.py        # Business analysis
│   ├── crud.py            # CRUD operations
│   ├── instagram.py       # Instagram integration
│   ├── instagram_oauth.py # Instagram OAuth
│   ├── instagram_post.py  # Instagram posting
│   ├── profile.py         # User profile management
│   ├── protected.py       # Protected routes
│   ├── review_reply.py    # Review reply AI
│   └── settings.py        # Settings management
├── schemas/               # Pydantic schemas
│   ├── instagram_schema.py
│   ├── settings_schema.py
│   └── user_schema.py
├── services/              # Business logic services
│   ├── auth_service.py    # Authentication service
│   ├── auth_service_sync.py
│   ├── cloudinary_service.py
│   ├── history_service.py
│   ├── instagram_crud.py
│   ├── instagram_service.py
│   ├── redis_service.py
│   ├── scheduler.py
│   └── settings_service.py
├── templates/             # HTML templates
│   ├── oauth_error.html
│   └── oauth_success.html
├── utils/                 # Utility functions
│   ├── dependencies.py    # FastAPI dependencies
│   └── security.py        # Security utilities
├── venv/                  # Python virtual environment
├── .env                   # Environment variables
├── .env.example           # Environment template
├── .gitignore            # Backend git ignore
├── business_model.py      # Business analysis server
├── celery_worker.py       # Celery worker
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Docker image
├── install_dependencies.bat # Windows setup script
├── main.py               # Main FastAPI application
├── model_server.py       # Legacy model server
├── postman_collection.json # API testing collection
├── requirements.txt      # Python dependencies
├── run_business_model.bat # Business server script
├── run_main_backend.bat  # Main server script
├── run_tinyllama_servers.bat # Both servers script
├── start_backend.bat     # Backend startup script
├── start_business_server.py # Business server starter
└── test.db              # SQLite database file
```

## 🎨 Frontend Structure

```
Frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── dashboard/   # Dashboard components
│   │   └── ui/          # UI components
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.ts   # Authentication hook
│   ├── lib/             # Utilities and libraries
│   │   ├── api.ts       # API client
│   │   ├── AuthContext.tsx # Auth context
│   │   └── utils.ts     # Utility functions
│   ├── routes/          # Page components
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── auth/        # Auth pages
│   │   ├── login.tsx    # Login page
│   │   ├── signup.tsx   # Signup page
│   │   └── onboarding.tsx # Business onboarding
│   ├── styles/          # CSS styles
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── .env                 # Environment variables
├── .env.local           # Local environment
├── .gitignore          # Frontend git ignore
├── index.html          # HTML template
├── package.json        # Node.js dependencies
├── tailwind.config.js  # Tailwind CSS config
├── tsconfig.json       # TypeScript config
└── vite.config.ts      # Vite configuration
```

## 🗂️ Key Directories Explained

### `/ai_models/`
Contains AI model implementations with TinyLlama for:
- Business analysis and SWOT generation
- Professional review reply generation

### `/routes/`
FastAPI route handlers organized by feature:
- Authentication and user management
- Business analysis and insights
- Instagram integration
- Profile management

### `/services/`
Business logic layer containing:
- Database operations
- External API integrations
- Background task processing

### `/migrations/`
Database schema migrations for:
- User profile enhancements
- Business analysis tables
- Feature additions

### `/components/`
Reusable React components:
- Dashboard widgets and charts
- Authentication forms
- UI elements and layouts

## 🔧 Configuration Files

### Backend Configuration
- `.env` - Environment variables (database, API keys)
- `requirements.txt` - Python dependencies
- `main.py` - FastAPI application entry point

### Frontend Configuration
- `package.json` - Node.js dependencies and scripts
- `vite.config.ts` - Build tool configuration
- `tailwind.config.js` - CSS framework setup

## 🚀 Startup Scripts

### Backend Scripts
- `run_tinyllama_servers.bat` - Start both servers
- `run_main_backend.bat` - Main server only
- `run_business_model.bat` - Business analysis server only

### Development Commands
```bash
# Backend
cd Backend && python main.py
cd Backend && python business_model.py

# Frontend  
cd Frontend && npm run dev
```

## 📦 Dependencies

### Backend (Python)
- FastAPI - Web framework
- SQLAlchemy - Database ORM
- Transformers - AI models
- Torch - Machine learning
- Pydantic - Data validation

### Frontend (Node.js)
- React - UI framework
- TypeScript - Type safety
- Vite - Build tool
- Tailwind CSS - Styling
- TanStack Router - Routing

## 🗄️ Database Structure

### Tables
- `users` - User accounts and business profiles
- `business_analysis` - AI analysis results
- `social_accounts` - Instagram connections
- `scheduled_posts` - Post scheduling

## 🔐 Security Structure

### Authentication
- JWT tokens for API access
- Secure password hashing
- Token refresh mechanism

### Environment Variables
- Database credentials
- API keys and secrets
- JWT signing keys

---

This structure provides a clean, maintainable, and scalable foundation for the Saadhyam AI platform.