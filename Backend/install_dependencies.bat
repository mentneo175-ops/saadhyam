@echo off
REM Install all Python dependencies for the backend

echo.
echo ========================================
echo Installing Backend Dependencies
echo ========================================
echo.

REM Check if venv exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created.
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo.
echo Installing requirements from requirements.txt...
pip install -r requirements.txt

echo.
echo ========================================
echo ✅ Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Activate venv: venv\Scripts\activate.bat
echo 2. Start backend: python main.py
echo.
pause
