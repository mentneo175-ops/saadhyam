@echo off
echo ========================================
echo Business Input Engine - Optional Dependencies
echo ========================================
echo.

echo This script will install optional dependencies for:
echo - Voice Transcription (faster-whisper)
echo - OCR Support (pytesseract, pdf2image)
echo - JavaScript Website Scraping (playwright)
echo.

set /p INSTALL_ALL="Install all optional dependencies? (y/n): "

if /i "%INSTALL_ALL%"=="y" (
    echo.
    echo Installing all optional dependencies...
    echo.
    
    echo [1/3] Installing Voice Transcription (faster-whisper)...
    venv\Scripts\python.exe -m pip install faster-whisper==1.0.3 pydub==0.25.1
    
    echo.
    echo [2/3] Installing OCR Support (pytesseract, pdf2image)...
    venv\Scripts\python.exe -m pip install pytesseract==0.3.10 pdf2image==1.17.0
    
    echo.
    echo [3/3] Installing Playwright for JavaScript websites...
    venv\Scripts\python.exe -m pip install playwright==1.40.0
    venv\Scripts\python.exe -m playwright install chromium
    
    echo.
    echo ========================================
    echo Installation Complete!
    echo ========================================
    echo.
    echo IMPORTANT: For OCR support, you also need to install:
    echo 1. Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
    echo 2. Poppler: https://github.com/oschwartz10612/poppler-windows/releases
    echo.
    echo Add both to your system PATH after installation.
    echo.
    
) else (
    echo.
    echo Select which dependencies to install:
    echo.
    
    set /p INSTALL_WHISPER="Install Voice Transcription (faster-whisper)? (y/n): "
    if /i "%INSTALL_WHISPER%"=="y" (
        echo Installing faster-whisper...
        venv\Scripts\python.exe -m pip install faster-whisper==1.0.3 pydub==0.25.1
    )
    
    echo.
    set /p INSTALL_OCR="Install OCR Support (pytesseract, pdf2image)? (y/n): "
    if /i "%INSTALL_OCR%"=="y" (
        echo Installing OCR packages...
        venv\Scripts\python.exe -m pip install pytesseract==0.3.10 pdf2image==1.17.0
        echo.
        echo IMPORTANT: You also need to install:
        echo 1. Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
        echo 2. Poppler: https://github.com/oschwartz10612/poppler-windows/releases
    )
    
    echo.
    set /p INSTALL_PLAYWRIGHT="Install Playwright for JavaScript websites? (y/n): "
    if /i "%INSTALL_PLAYWRIGHT%"=="y" (
        echo Installing Playwright...
        venv\Scripts\python.exe -m pip install playwright==1.40.0
        venv\Scripts\python.exe -m playwright install chromium
    )
    
    echo.
    echo Installation Complete!
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Add GROQ_API_KEY to .env for faster voice transcription (optional)
echo 2. Start the backend server: python main.py
echo 3. Test the Business Input Engine in the onboarding page
echo.
pause
