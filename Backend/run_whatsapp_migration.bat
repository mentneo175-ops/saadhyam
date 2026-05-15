@echo off
echo.
echo ========================================
echo WhatsApp System User Migration
echo ========================================
echo.

cd /d "%~dp0"

echo Running migration script...
echo.

python migrations/run_whatsapp_migration.py

echo.
echo Press any key to exit...
pause > nul
