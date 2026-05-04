@echo off
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
pip install -r requirements.txt

echo.
echo Starting Backend Server on Port 8000...
python main.py

pause
