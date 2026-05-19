@echo off
echo ============================================
echo   Installing Advanced Web Scraper
echo ============================================
echo.

REM Check if virtual environment exists
if not exist "Backend\venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at Backend\venv!
    echo Please create virtual environment first: cd Backend && python -m venv venv
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
cd Backend
call venv\Scripts\activate.bat

echo.
echo ============================================
echo   Step 1: Installing Python Dependencies
echo ============================================
echo.

pip install playwright>=1.40.0
pip install beautifulsoup4>=4.12.0
pip install lxml>=4.9.0
pip install requests>=2.31.0
pip install readability-lxml>=0.8.1
pip install python-dateutil>=2.8.2

echo.
echo ============================================
echo   Step 2: Installing Playwright Browsers
echo ============================================
echo.

playwright install chromium
playwright install firefox
playwright install webkit

echo.
echo ============================================
echo   Step 3: Testing Installation
echo ============================================
echo.

python -c "from playwright.sync_api import sync_playwright; print('✅ Playwright installed successfully')"
python -c "from bs4 import BeautifulSoup; print('✅ BeautifulSoup installed successfully')"
python -c "from readability import Document; print('✅ Readability installed successfully')"

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo ✅ Advanced Web Scraper is ready to use!
echo.
echo Next steps:
echo   1. Test the scraper: python services\advanced_scraper_example.py
echo   2. Read the guide: ..\ADVANCED_SCRAPER_GUIDE.md
echo   3. Integrate into your code: ..\SCRAPER_UPGRADE_SUMMARY.md
echo.
pause
