# Scheduled Tasks in TopDial

This document outlines all scheduled tasks used in the TopDial application, including configuration instructions for different environments.

## Permission Expiration Processor

The permission expiration processor is responsible for identifying and revoking expired temporary permissions from users.

### Task Details

- **Script**: `lib/tasks/process-expired-permissions.js`
- **API Endpoint**: `POST /api/tasks/process-expired-permissions`
- **Recommended Frequency**: Daily (recommended to run during off-peak hours)
- **Security**: Protected by API key authentication via `SCHEDULED_TASKS_API_KEY` environment variable

### Setup Options

#### Option 1: Cloud-based Scheduler (Recommended for Production)

##### Using GitHub Actions

Create a file at `.github/workflows/scheduled-tasks.yml`:

```yaml
name: Scheduled Tasks

on:
  schedule:
    # Run at 2 AM UTC daily
    - cron: '0 2 * * *'
  
  # Allow manual trigger
  workflow_dispatch:

jobs:
  process-expired-permissions:
    runs-on: ubuntu-latest
    steps:
      - name: Process Expired Permissions
        run: |
          curl -X POST ${{ secrets.PROD_API_URL }}/api/tasks/process-expired-permissions \
            -H "Content-Type: application/json" \
            -H "x-api-key: ${{ secrets.SCHEDULED_TASKS_API_KEY }}"
```

##### Using AWS EventBridge and Lambda

1. Create a Lambda function that makes an HTTP request to your API endpoint
2. Create an EventBridge rule that triggers the Lambda on schedule
3. Configure the Lambda with the API key as an environment variable

##### Using Vercel Cron Jobs (if hosting on Vercel)

```json
{
  "crons": [{
    "path": "/api/tasks/process-expired-permissions",
    "schedule": "0 2 * * *"
  }]
}
```

Remember to set up the appropriate environment variables and authorization headers in Vercel dashboard.

#### Option 2: Windows Scheduled Task (On-Premises)

1. Open Task Scheduler
2. Create a new task
3. Set the trigger to daily at your preferred time
4. For the action, use `curl` or PowerShell to make an API request:

PowerShell script example (`run-permissions-expiration.ps1`):
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "YOUR_API_KEY_HERE"
}

$response = Invoke-RestMethod -Uri "https://topdial.ng/api/tasks/process-expired-permissions" `
    -Method Post `
    -Headers $headers

Write-Output "Task completed with status: $($response.success)"
Write-Output "Stats: $($response.stats | ConvertTo-Json)"
```

#### Option 3: Direct Script Execution (Development)

For local development or testing, you can run the script directly:

```bash
# Run with Node.js
node lib/tasks/process-expired-permissions.js

# With environment variables
MONGODB_URI=mongodb://localhost:27017/topdial node lib/tasks/process-expired-permissions.js

```

### Monitoring

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

The task logs its activity through the application's logging system. Monitor these logs for errors or unexpected behavior.

- Successful runs will include stats about processed users and permissions
- Failed runs will log detailed error information

## Role Consistency Checker

Documentation for the role consistency checker will be added soon.