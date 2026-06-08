@echo off
echo ================================================
echo Cleaning Repository for Render Deployment
echo ================================================
echo.

cd /d "%~dp0"

echo [1/5] Removing venv folders from git...
git rm -r --cached Backend\venv 2>nul
git rm -r --cached Backend\.venv_test 2>nul
git rm -r --cached venv 2>nul
git rm -r --cached .venv 2>nul

echo [2/5] Removing AI model checkpoints from git...
git rm -r --cached Backend\ai_models\content_creator\mistral_adapter\checkpoint-* 2>nul
git rm -r --cached Backend\models 2>nul
git rm -r --cached Backend\checkpoints 2>nul

echo [3/5] Removing node_modules from git...
git rm -r --cached Frontend\node_modules 2>nul
git rm -r --cached node_modules 2>nul

echo [4/5] Removing __pycache__ from git...
for /r %%i in (__pycache__) do @if exist "%%i" git rm -r --cached "%%i" 2>nul

echo [5/5] Adding updated .gitignore...
git add .gitignore

echo.
echo ================================================
echo Cleanup Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Review changes: git status
echo 2. Commit: git commit -m "Remove large files for deployment"
echo 3. Push: git push origin main
echo.
echo After pushing, check repository size:
echo    git count-objects -vH
echo.
pause
