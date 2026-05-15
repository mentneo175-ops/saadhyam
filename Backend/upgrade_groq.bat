@echo off
echo ========================================
echo Upgrading Groq Package
echo ========================================

cd /d "%~dp0"

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Upgrading groq package to version 0.13.0...
pip install --upgrade groq==0.13.0

echo.
echo ========================================
echo Groq package upgraded successfully!
echo ========================================
echo.
echo Please restart the backend server for changes to take effect.
echo.
pause
