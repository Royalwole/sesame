# Setup Permission Expiration Tasks in Windows Task Scheduler
# Run this script as Administrator to set up scheduled tasks for permission expiration

# Get the full path to the batch file
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$batchFilePath = Join-Path $projectRoot "scripts\run-permission-expirations.bat"

# Task name and description
$taskName = "TopDial - Process Expired Permissions"
$taskDescription = "Daily task to process expired permissions in the TopDial system"

# Check if the task already exists and remove it if it does
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Existing task found. Removing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create a new task action that runs the batch file
$action = New-ScheduledTaskAction -Execute $batchFilePath

# Set up a daily trigger at 1:00 AM
$trigger = New-ScheduledTaskTrigger -Daily -At "01:00"

# Create task settings
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable

# Get the current username for task principal
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Create the task principal (run as the current user)
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType S4U -RunLevel Highest

# Register the scheduled task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description $taskDescription

Write-Host "Successfully created scheduled task '$taskName'" -ForegroundColor Green
Write-Host "Task will run daily at 1:00 AM" -ForegroundColor Green
Write-Host "Task runs the script: $batchFilePath" -ForegroundColor Green

# Add instructions for manual verification
Write-Host "`nTo verify the task was created properly:"
Write-Host "1. Open Task Scheduler (taskschd.msc)"
Write-Host "2. Look for the task named '$taskName'"
Write-Host "3. Verify the trigger, action, and other properties"
Write-Host "`nTo run the task manually for testing:"
Write-Host "1. Right-click the task in Task Scheduler"
Write-Host "2. Select 'Run'"
Write-Host "3. Check the application logs for results"