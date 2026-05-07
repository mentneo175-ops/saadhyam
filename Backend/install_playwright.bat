@echo off
echo Installing Playwright and dependencies...
echo.

REM Install Python packages
venv\Scripts\python.exe -m pip install playwright==1.48.0 readability-lxml==0.8.1

REM Install Playwright browsers
echo.
echo Installing Playwright browsers (Chromium)...
venv\Scripts\playwright.exe install chromium

echo.
echo ✅ Playwright installation complete!
echo.
pause
