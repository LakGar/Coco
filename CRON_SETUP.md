# Routine Instance Generation - Cron Job Setup

This document explains how to set up the background job that automatically generates routine instances and tasks.

## Overview

The cron job runs daily to:
1. Generate routine instances for active routines based on their recurrence patterns
2. Create tasks automatically if `autoGenerateTasks` is enabled
3. Generate instances for the next 7 days (configurable)

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

If you're deploying to Vercel, the cron job is already configured in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/generate-routine-instances",
    "schedule": "0 0 * * *"
  }]
}
```

This runs daily at midnight UTC.

**Environment Variable Required:**
- `CRON_SECRET`: A secret string to protect the endpoint from unauthorized access

**To test manually:**
```bash
curl -X POST "https://your-domain.com/api/cron/generate-routine-instances?secret=YOUR_CRON_SECRET"
```

### Option 2: External Cron Service

You can use any external cron service (e.g., cron-job.org, EasyCron) to call the endpoint:

**URL:** `https://your-domain.com/api/cron/generate-routine-instances?secret=YOUR_CRON_SECRET`

**Schedule:** Daily at midnight UTC (or your preferred time)

**Method:** POST

**Optional Parameters:**
- `daysAhead`: Number of days ahead to generate (default: 7)
  - Example: `?secret=YOUR_SECRET&daysAhead=14`

### Option 3: Local Development / Manual Trigger

For local development or manual testing:

```bash
# Set the secret in your .env.local
CRON_SECRET=your-secret-here

# Call the endpoint
curl -X POST "http://localhost:3000/api/cron/generate-routine-instances?secret=your-secret-here"
```

## How It Works

1. **Finds Active Routines**: Queries all routines where:
   - `isActive = true`
   - `startDate <= endDate` (or no end date)
   - `endDate >= today` (or no end date)

2. **Generates Dates**: For each routine, calculates which dates should have instances based on:
   - **DAILY**: Every day
   - **WEEKLY**: Specific days of the week
   - **MONTHLY**: Specific day of the month
   - **CUSTOM_WEEKDAYS**: Custom days of the week
   - **SPECIFIC_DATES**: Exact dates specified

3. **Creates Instances**: Creates `RoutineInstance` records for dates that don't already exist

4. **Creates Tasks**: If `autoGenerateTasks = true`, creates `Task` records linked to the instances with:
   - Due date/time based on `timeOfDay` or end of day
   - Same priority, assignment, and team as the routine

## Response Format

Success response:
```json
{
  "success": true,
  "message": "Generated 15 instances and 12 tasks",
  "instancesCreated": 15,
  "tasksCreated": 12,
  "routinesProcessed": 5,
  "errors": [] // Only present if there were errors
}
```

Error response:
```json
{
  "error": "Error generating routine instances",
  "details": "Error message here"
}
```

## Security

The endpoint is protected by a secret query parameter. Make sure to:
1. Set a strong `CRON_SECRET` in your environment variables
2. Never commit the secret to version control
3. Use different secrets for development and production

## Troubleshooting

**Issue: Cron job not running**
- Check that `vercel.json` is in the root directory
- Verify the cron schedule is correct
- Check Vercel dashboard for cron job status

**Issue: Instances not being created**
- Verify routines are active and within their date range
- Check that recurrence patterns are correctly configured
- Review server logs for errors

**Issue: Tasks not being created**
- Verify `autoGenerateTasks` is `true` for the routine
- Check that the routine has required fields (team, createdBy, etc.)

## Testing

You can test the cron job manually by calling the endpoint:

```bash
# With secret
curl -X POST "http://localhost:3000/api/cron/generate-routine-instances?secret=test-secret"

# With custom days ahead
curl -X POST "http://localhost:3000/api/cron/generate-routine-instances?secret=test-secret&daysAhead=14"
```

Check the response to see how many instances and tasks were created.

