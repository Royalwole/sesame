@echo off
echo Running MongoDB connection diagnostics and fixes...

:: Check if MongoDB URI is configured
if not defined MONGODB_URI (
    echo ERROR: MONGODB_URI environment variable not set
    echo Please check your .env or .env.local file
    pause
    exit /b 1
)

:: Run MongoDB diagnostics
echo Running MongoDB diagnostics...
node scripts/mongodb-diagnostics.js

:: Install/update MongoDB dependencies
echo.
echo Checking and updating MongoDB dependencies...
call npm install mongoose@latest --save

:: Clear MongoDB connection cache
echo.
echo Clearing connection cache...
del /q /s /f "%TEMP%\mongodb-*" 2>nul
del /q /s /f "%APPDATA%\MongoDB\*" 2>nul

:: Clear Node.js cache
echo.
echo Clearing Node.js module cache...
rd /s /q node_modules\.cache 2>nul

:: Run health check
echo.
echo Running API health check...
curl -s http://localhost:3000/api/healthcheck

echo.
echo MongoDB fixes complete. Please restart your application.
pause