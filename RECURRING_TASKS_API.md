# Recurring Tasks API Documentation

## Overview

The Recurring Tasks API allows you to create and manage recurring tasks in MyTaskly. When you create a recurring task, the system:
1. Creates a **base task** (the template task with all details)
2. Creates a **template** with the recurrence configuration
3. Automatically generates **task instances** for the next 7 days

**Base URL Production:** `https://api.mytasklyapp.com`
**Base URL Development:** `http://localhost:8080`

---

## Authentication

All endpoints require:
- **X-API-Key** header with your API key
- **Authorization** header with Bearer JWT token

```
X-API-Key: your-api-key-here
Authorization: Bearer your-jwt-token-here
```

---

## Endpoints

### 1. Create Recurring Task

**Endpoint:** `POST /recurring-tasks/`
**Status Code:** `201 Created`
**Description:** Creates a new recurring task with a template and generates instances for the next 7 days.

#### Request Body

```json
{
  "title": "Daily Standup Meeting",
  "description": "Team sync meeting",
  "start_time": "2025-12-06T09:00:00Z",
  "end_time": "2025-12-06T09:30:00Z",
  "priority": "MEDIA",
  "category_id": 1,
  "recurrence": {
    "pattern": "daily",
    "interval": 1,
    "end_type": "never"
  }
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title (max 100 characters) |
| `description` | string | No | Task description |
| `start_time` | datetime | Yes | Task start time (ISO 8601) |
| `end_time` | datetime | No | Task end time (ISO 8601) |
| `priority` | string | No | Priority level: `"BASSA"`, `"MEDIA"`, `"ALTA"` (default: `"MEDIA"`) |
| `category_id` | integer | Yes | ID of the category |
| `recurrence` | object | Yes | Recurrence configuration (see below) |

#### Recurrence Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pattern` | string | Yes | Recurrence pattern: `"daily"`, `"weekly"`, `"monthly"` |
| `interval` | integer | No | Repeat every N days/weeks/months (1-365, default: 1) |
| `days_of_week` | array | Conditional | Required for weekly pattern. Array of integers 1-7 (Monday=1, Sunday=7) |
| `day_of_month` | integer | Conditional | Required for monthly pattern. Day of month (1-31) |
| `end_type` | string | No | When to stop: `"never"`, `"after_count"`, `"on_date"` (default: `"never"`) |
| `end_date` | datetime | Conditional | Required if `end_type` is `"on_date"` |
| `end_count` | integer | Conditional | Required if `end_type` is `"after_count"`. Number of occurrences (1-1000) |

#### Recurrence Examples

**Daily Task (every day):**
```json
{
  "recurrence": {
    "pattern": "daily",
    "interval": 1,
    "end_type": "never"
  }
}
```

**Every 2 Days:**
```json
{
  "recurrence": {
    "pattern": "daily",
    "interval": 2,
    "end_type": "after_count",
    "end_count": 10
  }
}
```

**Weekly Task (Monday, Wednesday, Friday):**
```json
{
  "recurrence": {
    "pattern": "weekly",
    "interval": 1,
    "days_of_week": [1, 3, 5],
    "end_type": "never"
  }
}
```

**Bi-Weekly Task (every 2 weeks on Tuesday):**
```json
{
  "recurrence": {
    "pattern": "weekly",
    "interval": 2,
    "days_of_week": [2],
    "end_type": "never"
  }
}
```

**Monthly Task (15th of each month):**
```json
{
  "recurrence": {
    "pattern": "monthly",
    "interval": 1,
    "day_of_month": 15,
    "end_type": "on_date",
    "end_date": "2025-12-31T23:59:59Z"
  }
}
```

**Quarterly Task (every 3 months on the 1st):**
```json
{
  "recurrence": {
    "pattern": "monthly",
    "interval": 3,
    "day_of_month": 1,
    "end_type": "never"
  }
}
```

#### Response (201)

```json
{
  "message": "Recurring task created successfully",
  "base_task_id": 123,
  "template_id": 45,
  "pattern": "daily",
  "interval": 1
}
```

#### Errors

- `400 Bad Request`: Invalid request data (missing required fields, invalid pattern, etc.)
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error during task creation

---

### 2. Get All User Templates

**Endpoint:** `GET /recurring-tasks/`
**Description:** Retrieves all recurring task templates for the authenticated user.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `active_only` | boolean | `true` | If `true`, returns only active templates |

#### Response (200)

```json
{
  "total_templates": 3,
  "templates": [
    {
      "template_id": 1,
      "base_task_id": 100,
      "recurrence_pattern": "daily",
      "interval": 1,
      "occurrence_count": 15,
      "is_active": true,
      "created_at": "2025-12-01T10:00:00Z"
    },
    {
      "template_id": 2,
      "base_task_id": 101,
      "recurrence_pattern": "weekly",
      "interval": 1,
      "occurrence_count": 8,
      "is_active": true,
      "created_at": "2025-12-02T14:30:00Z"
    }
  ]
}
```

---

### 3. Get Template Details

**Endpoint:** `GET /recurring-tasks/{template_id}`
**Description:** Retrieves detailed information about a specific recurring task template.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template_id` | integer | ID of the template |

#### Response (200)

```json
{
  "template_id": 1,
  "base_task_id": 100,
  "recurrence_pattern": "weekly",
  "interval": 1,
  "days_of_week": [1, 3, 5],
  "day_of_month": null,
  "end_type": "never",
  "end_date": null,
  "end_count": null,
  "occurrence_count": 12,
  "is_active": true,
  "created_at": "2025-12-01T10:00:00Z"
}
```

#### Errors

- `404 Not Found`: Template not found or doesn't belong to the user
- `500 Internal Server Error`: Server error

---

### 4. Get Template Instances

**Endpoint:** `GET /recurring-tasks/{template_id}/instances`
**Description:** Retrieves all task instances generated from a specific template.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template_id` | integer | ID of the template |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_completed` | boolean | `false` | If `true`, includes completed task instances |

#### Response (200)

```json
{
  "template_id": 1,
  "total_instances": 5,
  "instances": [
    {
      "task_id": 200,
      "title": "Daily Standup Meeting",
      "description": "Team sync meeting",
      "start_time": "2025-12-06T09:00:00Z",
      "end_time": "2025-12-06T09:30:00Z",
      "priority": "MEDIA",
      "status": "IN_SOSPESO",
      "is_generated_instance": true,
      "parent_template_id": 1
    },
    {
      "task_id": 201,
      "title": "Daily Standup Meeting",
      "description": "Team sync meeting",
      "start_time": "2025-12-07T09:00:00Z",
      "end_time": "2025-12-07T09:30:00Z",
      "priority": "MEDIA",
      "status": "IN_SOSPESO",
      "is_generated_instance": true,
      "parent_template_id": 1
    }
  ]
}
```

#### Errors

- `404 Not Found`: Template not found or doesn't belong to the user
- `500 Internal Server Error`: Server error

---

### 5. Update Template

**Endpoint:** `PUT /recurring-tasks/{template_id}`
**Description:** Updates a recurring task template. **Note:** This does NOT modify already generated instances, only affects future instances.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template_id` | integer | ID of the template |

#### Request Body

You can update any combination of the following fields:

```json
{
  "interval": 2,
  "days_of_week": [1, 2, 3],
  "end_type": "after_count",
  "end_count": 50
}
```

#### Updatable Fields

| Field | Type | Description |
|-------|------|-------------|
| `interval` | integer | Repeat interval (1-365) |
| `days_of_week` | array | Days of week for weekly pattern (1-7) |
| `day_of_month` | integer | Day of month for monthly pattern (1-31) |
| `end_type` | string | `"never"`, `"after_count"`, `"on_date"` |
| `end_date` | datetime | End date if `end_type` is `"on_date"` |
| `end_count` | integer | Number of occurrences if `end_type` is `"after_count"` |

#### Response (200)

```json
{
  "message": "Template updated successfully",
  "template_id": 1,
  "updated_fields": ["interval", "end_type", "end_count"]
}
```

#### Errors

- `404 Not Found`: Template not found or doesn't belong to the user
- `400 Bad Request`: Invalid update data
- `500 Internal Server Error`: Server error

---

### 6. Deactivate Template

**Endpoint:** `POST /recurring-tasks/{template_id}/deactivate`
**Description:** Deactivates a template, preventing it from generating new instances. Existing instances are NOT deleted.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template_id` | integer | ID of the template |

#### Response (200)

```json
{
  "message": "Template deactivated successfully",
  "template_id": 1,
  "is_active": false
}
```

#### Errors

- `404 Not Found`: Template not found or doesn't belong to the user
- `500 Internal Server Error`: Server error

---

### 7. Delete Template

**Endpoint:** `DELETE /recurring-tasks/{template_id}`
**Status Code:** `204 No Content`
**Description:** Permanently deletes a template and ALL its associated instances (CASCADE delete).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template_id` | integer | ID of the template |

#### Response (204)

No content returned on successful deletion.

#### Errors

- `404 Not Found`: Template not found or doesn't belong to the user
- `500 Internal Server Error`: Server error

---

## Important Notes

### Instance Generation

- Instances are automatically generated for the **next 7 days** when a template is created
- A background job continuously generates future instances to maintain the 7-day buffer
- Past instances are not generated retroactively

### Modifying Tasks

- **Template Updates**: Changes to a template only affect future instances, not already generated ones
- **Instance Modifications**: You can modify individual task instances using the standard Tasks API endpoints
- If you modify an instance, it remains linked to the template via `parent_template_id`

### Deleting vs Deactivating

- **Deactivate**: Stops generating new instances but keeps existing ones
  - Use when you want to temporarily pause a recurring task
  - Existing instances remain in the system

- **Delete**: Removes the template AND all associated instances
  - Use when you want to completely remove a recurring task
  - **Warning**: This action is irreversible

### Task Status

Generated instances have:
- `is_generated_instance = true`
- `parent_template_id` pointing to the template
- Initial status of `IN_SOSPESO` (Pending)
- You can complete, cancel, or modify them like regular tasks

### Timezone Handling

- All datetime fields use ISO 8601 format with timezone
- The system respects user timezone settings for notification scheduling
- Make sure to send `start_time` and `end_time` in UTC or with proper timezone offset

---

## Error Codes Summary

| Code | Description |
|------|-------------|
| `200` | Request successful |
| `201` | Resource created successfully |
| `204` | Resource deleted successfully (no content) |
| `400` | Bad request (invalid data, missing required fields) |
| `401` | Unauthorized (missing or invalid authentication) |
| `403` | Forbidden (invalid API key) |
| `404` | Not found (template doesn't exist or doesn't belong to user) |
| `500` | Internal server error |

---

## Client Integration Examples

### Creating a Daily Task

```typescript
const createDailyTask = async () => {
  const response = await fetch('https://api.mytasklyapp.com/recurring-tasks/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: "Morning Exercise",
      description: "30 minutes workout",
      start_time: "2025-12-06T07:00:00Z",
      end_time: "2025-12-06T07:30:00Z",
      priority: "ALTA",
      category_id: 1,
      recurrence: {
        pattern: "daily",
        interval: 1,
        end_type: "never"
      }
    })
  });

  const data = await response.json();
  console.log('Created template:', data.template_id);
};
```

### Fetching All Templates

```typescript
const getTemplates = async () => {
  const response = await fetch('https://api.mytasklyapp.com/recurring-tasks/?active_only=true', {
    method: 'GET',
    headers: {
      'X-API-Key': 'your-api-key',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  console.log(`Found ${data.total_templates} templates`);
  return data.templates;
};
```

### Viewing Instances of a Template

```typescript
const getTemplateInstances = async (templateId: number) => {
  const response = await fetch(
    `https://api.mytasklyapp.com/recurring-tasks/${templateId}/instances?include_completed=false`,
    {
      method: 'GET',
      headers: {
        'X-API-Key': 'your-api-key',
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  console.log(`Template has ${data.total_instances} pending instances`);
  return data.instances;
};
```

### Deactivating a Template

```typescript
const pauseRecurringTask = async (templateId: number) => {
  const response = await fetch(
    `https://api.mytasklyapp.com/recurring-tasks/${templateId}/deactivate`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': 'your-api-key',
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  console.log('Template deactivated:', data.is_active); // false
};
```

### Deleting a Template (and all instances)

```typescript
const deleteRecurringTask = async (templateId: number) => {
  const response = await fetch(
    `https://api.mytasklyapp.com/recurring-tasks/${templateId}`,
    {
      method: 'DELETE',
      headers: {
        'X-API-Key': 'your-api-key',
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 204) {
    console.log('Template and all instances deleted');
  }
};
```

---

## Best Practices

1. **Always validate dates on the client**: Ensure `start_time` is in the future before creating a recurring task

2. **Handle timezone properly**: Convert local time to UTC before sending to the API

3. **Check template ownership**: The API automatically filters templates by user, but always use the authenticated user's token

4. **Use deactivate instead of delete**: When possible, deactivate templates instead of deleting them to preserve history

5. **Fetch instances periodically**: The background job generates instances continuously, so refresh your view periodically

6. **Monitor the 7-day window**: Instances are only generated 7 days in advance, so users will see upcoming tasks appear as time progresses

7. **Handle edge cases for monthly patterns**: Day 31 won't work for all months - the system handles this gracefully by skipping invalid dates

---

## Related Documentation

- [Main API Documentation](./API_DOCUMENTATION.md) - For general API usage and authentication
- [Tasks API](./API_DOCUMENTATION.md#tasks) - For managing individual task instances
- [Categories API](./API_DOCUMENTATION.md#categories) - For managing categories

---

**Last Updated:** 2025-12-06
**API Version:** 2.1.0
