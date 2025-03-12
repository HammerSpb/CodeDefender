# Scans API

This document describes the security scan endpoints and their authorization requirements.

## Endpoints

### List Scans

```
GET /api/workspaces/:workspaceId/scans
List all scans for a workspace

Query Parameters:
- page (number, default: 1): Page number for pagination
- limit (number, default: 20): Number of items per page
- status (string, optional): Filter by scan status

Response:
{
  "items": [
    {
      "id": "scan-uuid",
      "name": "Weekly Security Scan",
      "status": "completed",
      "createdAt": "2023-05-01T12:00:00Z",
      "completedAt": "2023-05-01T12:05:30Z",
      "repositoryId": "repo-uuid",
      "issues": {
        "critical": 2,
        "high": 5,
        "medium": 10,
        "low": 15
      }
    },
    // ...more scans
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}

Authorization:
- Permission: SCAN:READ
- Plan Feature: None
- Usage Limit: None
```

### Get Scan Details

```
GET /api/workspaces/:workspaceId/scans/:scanId
Get detailed information about a specific scan

Response:
{
  "id": "scan-uuid",
  "name": "Weekly Security Scan",
  "description": "Automated weekly security scan",
  "status": "completed",
  "createdAt": "2023-05-01T12:00:00Z",
  "startedAt": "2023-05-01T12:00:05Z",
  "completedAt": "2023-05-01T12:05:30Z",
  "repositoryId": "repo-uuid",
  "repositoryName": "Main Application",
  "branch": "main",
  "commit": "a1b2c3d4e5f6",
  "createdBy": {
    "id": "user-uuid",
    "name": "John Doe"
  },
  "scanType": "comprehensive",
  "issues": {
    "critical": 2,
    "high": 5,
    "medium": 10,
    "low": 15
  }
}

Authorization:
- Permission: SCAN:READ
- Plan Feature: None
- Usage Limit: None
```

### Create Standard Scan

```
POST /api/workspaces/:workspaceId/scans
Create a new security scan

Request Body:
{
  "name": "Manual Security Scan",
  "description": "Ad-hoc security scan",
  "repositoryId": "repo-uuid",
  "branch": "main",
  "scanType": "standard"
}

Response:
{
  "id": "scan-uuid",
  "name": "Manual Security Scan",
  "status": "pending",
  "createdAt": "2023-05-01T12:00:00Z"
}

Authorization:
- Permission: SCAN:CREATE
- Plan Feature: None
- Usage Limit: SCANS_PER_DAY
```

### Create Advanced Scan

```
POST /api/workspaces/:workspaceId/scans/advanced
Create an advanced security scan with custom options

Request Body:
{
  "name": "Advanced Security Scan",
  "description": "Custom rules and depth",
  "repositoryId": "repo-uuid",
  "branch": "feature/new-auth",
  "scanType": "advanced",
  "options": {
    "depth": "deep",
    "includeDependencies": true,
    "customRuleIds": ["rule-1", "rule-2"],
    "excludePatterns": ["node_modules", "dist"]
  }
}

Response:
{
  "id": "scan-uuid",
  "name": "Advanced Security Scan",
  "status": "pending",
  "createdAt": "2023-05-01T12:00:00Z"
}

Authorization:
- Permission: SCAN:CREATE
- Plan Feature: ADVANCED_SCAN (Pro plan or higher)
- Usage Limit: SCANS_PER_DAY
```

### Cancel Scan

```
POST /api/workspaces/:workspaceId/scans/:scanId/cancel
Cancel an ongoing scan

Response:
{
  "id": "scan-uuid",
  "status": "cancelled",
  "cancelledAt": "2023-05-01T12:02:30Z"
}

Authorization:
- Permission: SCAN:UPDATE
- Plan Feature: None
- Usage Limit: None
```

### Delete Scan

```
DELETE /api/workspaces/:workspaceId/scans/:scanId
Delete a scan and its results

Response:
{
  "success": true
}

Authorization:
- Permission: SCAN:DELETE
- Plan Feature: None
- Usage Limit: None
```

### Get Scan Results

```
GET /api/workspaces/:workspaceId/scans/:scanId/results
Get the results of a completed scan

Query Parameters:
- severity (string, optional): Filter by severity (critical, high, medium, low)
- page (number, default: 1): Page number for pagination
- limit (number, default: 20): Number of items per page

Response:
{
  "scanId": "scan-uuid",
  "issues": [
    {
      "id": "issue-uuid",
      "title": "SQL Injection Vulnerability",
      "description": "Unsanitized user input used in SQL query",
      "severity": "critical",
      "file": "src/database/query.js",
      "line": 42,
      "rule": {
        "id": "rule-uuid",
        "code": "SQLI-001",
        "name": "SQL Injection Detection"
      },
      "codeSnippet": "const query = `SELECT * FROM users WHERE username = '${userInput}'`;",
      "remediation": "Use parameterized queries or prepared statements instead of string concatenation."
    },
    // ...more issues
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 32,
    "pages": 2
  }
}

Authorization:
- Permission: SCAN:READ
- Plan Feature: None
- Usage Limit: None
```

### Schedule Scan

```
POST /api/workspaces/:workspaceId/scans/schedule
Create a scheduled recurring scan

Request Body:
{
  "name": "Weekly Security Scan",
  "description": "Runs every Monday at 2am",
  "repositoryId": "repo-uuid",
  "branch": "main",
  "scanType": "standard",
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": 1, // Monday
    "hour": 2,
    "minute": 0,
    "timezone": "UTC"
  }
}

Response:
{
  "id": "schedule-uuid",
  "name": "Weekly Security Scan",
  "enabled": true,
  "createdAt": "2023-05-01T12:00:00Z",
  "nextRunAt": "2023-05-08T02:00:00Z"
}

Authorization:
- Permission: SCAN:CREATE
- Plan Feature: SCHEDULED_SCANS (Pro plan or higher)
- Usage Limit: None (daily scan limits apply when scans run)
```

### Get Scan History

```
GET /api/workspaces/:workspaceId/repositories/:repositoryId/scan-history
Get historical scan data for a repository

Query Parameters:
- period (string, default: "month"): Time period (week, month, quarter, year)

Response:
{
  "repository": {
    "id": "repo-uuid",
    "name": "Main Application"
  },
  "history": [
    {
      "date": "2023-05-01",
      "scanId": "scan-uuid-1",
      "issues": {
        "critical": 3,
        "high": 7,
        "medium": 12,
        "low": 18
      }
    },
    {
      "date": "2023-04-24",
      "scanId": "scan-uuid-2",
      "issues": {
        "critical": 5,
        "high": 8,
        "medium": 15,
        "low": 20
      }
    },
    // ...more historical data
  ]
}

Authorization:
- Permission: SCAN:READ
- Plan Feature: HISTORICAL_REPORTS (Pro plan or higher)
- Usage Limit: None
```

## Error Responses

### Resource Not Found

```json
{
  "statusCode": 404,
  "message": "Scan not found",
  "error": "Not Found"
}
```

### Plan Feature Not Available

```json
{
  "statusCode": 403,
  "message": "Advanced scanning requires a Pro plan or higher",
  "error": "Forbidden",
  "upgradePath": "/billing/upgrade"
}
```

### Usage Limit Exceeded

```json
{
  "statusCode": 403,
  "message": "You have reached your daily scan limit of 5. Try again tomorrow or upgrade your plan.",
  "error": "Forbidden",
  "upgradePath": "/billing/upgrade"
}
```

## Related Documentation

- [Scan Configuration Options](../development/scan-options.md)
- [Understanding Scan Results](../development/scan-results.md)
- [Scan Policies and Rules](../development/scan-policies.md)
