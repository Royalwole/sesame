@echo off
echo TopDial Deployment Script
echo ==============================================
echo %date% %time%
echo.

echo Step 1: Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo Error during build process!
  exit /b %ERRORLEVEL%
)
echo Build completed successfully.
echo.

echo Step 2: Running database migrations...
call npm run db:migrate
if %ERRORLEVEL% NEQ 0 (
  echo Error during database migrations!
  exit /b %ERRORLEVEL%
)
echo Database migrations completed successfully.
echo.

echo Step 3: Initializing permission bundles...
node scripts/initialize-permission-bundles.js
if %ERRORLEVEL% NEQ 0 (
  echo Error initializing permission bundles!
  exit /b %ERRORLEVEL%
)
echo Permission bundles initialized successfully.
echo.

echo Step 4: Setting up scheduled tasks...
powershell -ExecutionPolicy Bypass -File scripts\setup-permission-scheduler-tasks.ps1
if %ERRORLEVEL% NEQ 0 (
  echo Warning: Could not set up scheduled tasks. You may need to run as administrator.
  echo Please run scripts\setup-permission-scheduler-tasks.ps1 manually as Administrator.
)
echo.

echo Step 5: Starting application...
call npm run start
if %ERRORLEVEL% NEQ 0 (
  echo Error starting application!
  exit /b %ERRORLEVEL%
)

echo ==============================================
echo Deployment completed successfully!
echo %date% %time%