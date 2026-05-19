@echo off
echo Testing B2B Network API...
echo.
echo Make sure you have a valid token!
echo.
set /p TOKEN="Enter your auth token: "
echo.
echo Calling API...
curl -X GET "http://localhost:8000/api/b2b-network/nearby/me?radius=50000" -H "Authorization: Bearer %TOKEN%"
echo.
echo.
pause
