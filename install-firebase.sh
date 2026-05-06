#!/bin/bash

echo "🚀 Installing Firebase Authentication for Saadhyam AI"
echo "=================================================="

# Frontend dependencies
echo "📦 Installing frontend dependencies..."
cd Frontend
npm install firebase
echo "✅ Frontend dependencies installed"

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd ../Backend
pip install firebase-admin==6.5.0 google-auth==2.23.4
echo "✅ Backend dependencies installed"

# Run database migration
echo "🗄️ Running database migration..."
python migrations/add_firebase_fields.py
echo "✅ Database migration completed"

echo ""
echo "🎉 Firebase Authentication setup completed!"
echo ""
echo "Next steps:"
echo "1. Follow FIREBASE_SETUP.md to configure Firebase Console"
echo "2. Create Frontend/.env with your Firebase config"
echo "3. Download firebase-service-account.json to Backend/"
echo "4. Update Backend/.env with Firebase settings"
echo "5. Test authentication at http://localhost:5173/login"
echo ""
echo "📖 See FIREBASE_SETUP.md for detailed instructions"