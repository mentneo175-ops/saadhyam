# Quick Start Guide - Saadhyam AI

Get up and running with Saadhyam AI in under 10 minutes.

## 🚀 Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git

## 📦 Installation

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Sadhyam
```

### Step 2: Backend Setup
```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Database (NeonDB recommended)
DATABASE_URL=postgresql+asyncpg://user:password@host/database

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Instagram API (Optional)
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 4: Start Backend Services

**Terminal 1 - Main Backend:**
```bash
cd Backend
python main.py
```
✅ Main server running on http://localhost:8000

**Terminal 2 - Business Analysis Server:**
```bash
cd Backend
python business_model.py
```
✅ Business AI server running on http://localhost:9001

### Step 5: Frontend Setup

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm install
npm run dev
```
✅ Frontend running on http://localhost:3000

## 🎯 First Steps

### 1. Access the Application
Open your browser and go to: http://localhost:3000

### 2. Create Account
- Click "Sign Up" 
- Enter your email and password
- Complete registration

### 3. Business Onboarding
- Fill out your business information
- Describe your business (minimum 20 characters)
- Wait for AI analysis to complete

### 4. Explore Dashboard
- View business insights
- Check AI recommendations
- Access profile settings

## 🔧 Verification

### Check Backend Health
```bash
curl http://localhost:8000/health
curl http://localhost:9001/health
```

### Check API Documentation
- Main API: http://localhost:8000/docs
- Business API: http://localhost:9001/docs

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000
# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Database connection error:**
- Check DATABASE_URL in .env
- Ensure NeonDB credentials are correct
- System will fallback to SQLite if PostgreSQL fails

**AI model loading slow:**
- First run downloads TinyLlama model (~2GB)
- Subsequent runs are faster
- Model loads in ~30 seconds on CPU

### Frontend Issues

**npm install fails:**
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection error:**
- Ensure backend is running on port 8000
- Check VITE_API_URL in Frontend/.env.local

## 📊 System Requirements

### Minimum Requirements
- **RAM**: 4GB (8GB recommended)
- **Storage**: 5GB free space
- **CPU**: 2 cores (4 cores recommended)

### Recommended for AI Models
- **RAM**: 8GB or more
- **CPU**: 4+ cores
- **Storage**: 10GB free space

## 🔑 Default Credentials

No default credentials - create your own account during first run.

## 📚 Next Steps

1. **Explore Features**: Try business analysis and review reply generation
2. **Configure Instagram**: Set up Instagram integration for social media features
3. **Customize Settings**: Update business profile and preferences
4. **Read Documentation**: Check README.md for detailed information

## 🆘 Need Help?

1. **Check Logs**: Backend logs show detailed error information
2. **API Docs**: Visit /docs endpoints for API reference
3. **Database**: Verify database connection and migrations
4. **Environment**: Ensure all required environment variables are set

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Business server running on port 9001  
- [ ] Frontend running on port 3000
- [ ] Database connected (NeonDB or SQLite)
- [ ] AI models loaded successfully
- [ ] User account created
- [ ] Business profile completed
- [ ] Dashboard accessible

---

**🎉 You're ready to use Saadhyam AI!**

For detailed documentation, see README.md