@echo off
echo Running TopDial Permission Expiration Tasks
echo %date% %time%

:: Set the working directory to the project root
cd /d "%~dp0.."

:: Run the regular permissions expiration task
echo Processing regular permission expirations...
node scripts/run-task.js process-expired-permissions
if %ERRORLEVEL% NEQ 0 (
  echo Error processing regular permissions expiration tasks
  exit /b %ERRORLEVEL%
)

:: Wait a moment between tasks
timeout /t 10

:: Run the resource permissions expiration task
echo Processing resource permission expirations...
node scripts/run-task.js process-expired-resource-permissions
if %ERRORLEVEL% NEQ 0 (
  echo Error processing resource permissions expiration tasks
  exit /b %ERRORLEVEL%
)

echo Permission expiration tasks completed successfully
echo %date% %time%