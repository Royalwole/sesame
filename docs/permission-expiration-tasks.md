# Permission Expiration Tasks

This document explains how to set up scheduled tasks to automatically process expired permissions in the TopDial application.

## Overview

The permission system in TopDial allows for temporary permissions that expire after a set time. Two types of expired permissions need to be processed:

1. **Regular Permissions**: Individual permissions granted directly to users
2. **Resource-Based Permissions**: Permissions granted to users for specific resources

## Task Scripts

The following scripts handle permission expiration:

- `lib/tasks/process-expired-permissions.js`: Processes expired regular permissions
- `lib/tasks/process-expired-resource-permissions.js`: Processes expired resource-specific permissions

## Setting Up Scheduled Tasks

### For Production Environments

#### Using Cron (Linux/macOS)

Add the following entries to your crontab:

```bash
# Run permission expiration task daily at 1:00 AM
0 1 * * * cd /path/to/topdial && node scripts/run-task.js process-expired-permissions

# Run resource permission expiration task daily at 1:30 AM
30 1 * * * cd /path/to/topdial && node scripts/run-task.js process-expired-resource-permissions
```

#### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task:
   - Name: "TopDial - Process Expired Permissions"
   - Trigger: Daily at 1:00 AM
   - Action: Start a program
     - Program/script: `node`
     - Arguments: `scripts/run-task.js process-expired-permissions`
     - Start in: `C:\path\to\topdial`
3. Create a second task for resource permissions:
   - Name: "TopDial - Process Expired Resource Permissions"
   - Trigger: Daily at 1:30 AM
   - Action: Start a program
     - Program/script: `node`
     - Arguments: `scripts/run-task.js process-expired-resource-permissions`
     - Start in: `C:\path\to\topdial`

### For Cloud Environments

#### Using AWS CloudWatch Events

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ProcessExpiredPermissionsRule:
    Type: AWS::Events::Rule
    Properties:
      Name: process-expired-permissions
      ScheduleExpression: cron(0 1 * * ? *)
      State: ENABLED
      Targets:
        - Arn: !GetAtt LambdaFunction.Arn
          Id: ProcessExpiredPermissionsTarget
          Input: '{"task": "process-expired-permissions"}'
          
  ProcessExpiredResourcePermissionsRule:
    Type: AWS::Events::Rule
    Properties:
      Name: process-expired-resource-permissions
      ScheduleExpression: cron(30 1 * * ? *)
      State: ENABLED
      Targets:
        - Arn: !GetAtt LambdaFunction.Arn
          Id: ProcessExpiredResourcePermissionsTarget
          Input: '{"task": "process-expired-resource-permissions"}'
```

#### Using Heroku Scheduler

If using Heroku, add the following scheduled tasks:

1. `node scripts/run-task.js process-expired-permissions` - Daily at 01:00 UTC
2. `node scripts/run-task.js process-expired-resource-permissions` - Daily at 01:30 UTC

## Monitoring and Logs

Each task writes logs with the following information:
- Number of permissions processed
- Number of expired permissions found and revoked
- Any errors encountered

Logs are written to:
- Console output
- Application logs via the logging system
- (Optional) A dedicated log file if configured

## Manual Execution

You can manually execute these tasks using:

```bash
node lib/tasks/process-expired-permissions.js
node lib/tasks/process-expired-resource-permissions.js
```

## Error Handling

If a task fails, it will:
1. Log the error details
2. Exit with a non-zero status code
3. Not affect subsequent runs (they will retry failed items)

## Implementation Notes

- Tasks are idempotent and can be safely run multiple times
- Tasks process permissions in batches to handle large numbers efficiently
- Connection timeouts are handled gracefully with reconnection logic