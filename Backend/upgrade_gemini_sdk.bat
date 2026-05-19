@echo off
echo ============================================
echo Upgrading to NEW Google GenAI SDK
echo ============================================
echo.

echo Step 1: Uninstalling OLD google-generativeai...
pip uninstall -y google-generativeai

echo.
echo Step 2: Installing NEW google-genai SDK...
pip install -U google-genai

echo.
echo ============================================
echo ✅ Gemini SDK Upgrade Complete!
echo ============================================
echo.
echo Now restart your backend server:
echo   cd Backend
echo   python main.py
echo.
pause
