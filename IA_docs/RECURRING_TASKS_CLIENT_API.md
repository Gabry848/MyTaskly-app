# Recurring Tasks API - Client Documentation

**Version:** 2.2.0
**Last Updated:** 2025-12-07

## Overview

The new recurring tasks system allows you to create tasks that repeat automatically. When you create a recurring task, the system:
1. Creates **1 single task** (not multiple copies)
2. Calculates the **next occurrence** date automatically
3. Auto-advances to the next occurrence when you complete the task
4. Tracks how many times the task has been completed

---

## Table of Contents

1. [Authentication](#authentication)
2. [Create Recurring Task](#create-recurring-task)
3. [Get Tasks (Including Recurring)](#get-tasks)
4. [Get Single Task Details](#get-single-task)
5. [Complete Recurring Task](#complete-recurring-task)
6. [Update Recurring Task](#update-recurring-task)
7. [Delete Recurring Task](#delete-recurring-task)
8. [Recurrence Patterns](#recurrence-patterns)
9. [Response Fields](#response-fields)
10. [Error Handling](#error-handling)
11. [Client Integration Examples](#client-integration-examples)

---

## Authentication

All endpoints require:
- **X-API-Key** header with your API key
- **Authorization** header with Bearer JWT token

```http
X-API-Key: your-api-key-here
Authorization: Bearer your-jwt-token-here
```

---

## Create Recurring Task

Creates a new recurring task that will automatically advance to the next occurrence when completed.

### Endpoint

```http
POST /tasks/
```

### Request Headers

```http
Content-Type: application/json
X-API-Key: your-api-key
Authorization: Bearer {access_token}
```

### Request Body

```json
{
  "title": "Morning Exercise",
  "description": "30 minutes workout",
  "end_time": "2025-12-09T07:00:00Z",
  "priority": "ALTA",
  "category_id": 1,
  "user": "username",
  "is_recurring": true,
  "recurrence": {
    "pattern": "daily",
    "interval": 1,
    "end_type": "never"
  }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title (max 100 characters) |
| `description` | string | No | Task description |
| `end_time` | datetime (ISO 8601) | No | Task deadline/notification time |
| `priority` | string | No | `"BASSA"`, `"MEDIA"`, `"ALTA"` (default: `"MEDIA"`) |
| `category_id` | integer | Yes | ID of the category |
| `user` | string | Yes | Username |
| `is_recurring` | boolean | Yes | Must be `true` for recurring tasks |
| `recurrence` | object | Yes (if `is_recurring=true`) | Recurrence configuration |

### Recurrence Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pattern` | string | Yes | `"daily"`, `"weekly"`, or `"monthly"` |
| `interval` | integer | No | Repeat every N days/weeks/months (1-365, default: 1) |
| `days_of_week` | array | Conditional | Required for weekly. [1-7] where 1=Monday, 7=Sunday |
| `day_of_month` | integer | Conditional | Required for monthly. Day of month (1-31) |
| `end_type` | string | No | `"never"`, `"after_count"`, `"on_date"` (default: `"never"`) |
| `end_date` | datetime | Conditional | Required if `end_type="on_date"` |
| `end_count` | integer | Conditional | Required if `end_type="after_count"` (1-1000) |

### Response (201 Created)

```json
{
  "task_id": 123,
  "user_id": 1,
  "title": "Morning Exercise",
  "description": "30 minutes workout",
  "start_time": "2025-12-07T10:00:00Z",
  "end_time": "2025-12-09T07:00:00Z",
  "notification_sent": false,
  "category_id": 1,
  "priority": "Alta",
  "status": "In sospeso",
  "is_recurring": true,
  "recurrence_pattern": "daily",
  "recurrence_interval": 1,
  "recurrence_days_of_week": null,
  "recurrence_day_of_month": null,
  "recurrence_end_type": "never",
  "recurrence_end_date": null,
  "recurrence_end_count": null,
  "recurrence_current_count": 0,
  "next_occurrence": "2025-12-10T07:00:00Z",
  "last_completed_at": null
}
```

### Example Patterns

**Daily (every day):**
```json
{
  "pattern": "daily",
  "interval": 1,
  "end_type": "never"
}
```

**Every 3 days:**
```json
{
  "pattern": "daily",
  "interval": 3,
  "end_type": "never"
}
```

**Weekly (Monday, Wednesday, Friday):**
```json
{
  "pattern": "weekly",
  "interval": 1,
  "days_of_week": [1, 3, 5],
  "end_type": "never"
}
```

**Every 2 weeks on Tuesday:**
```json
{
  "pattern": "weekly",
  "interval": 2,
  "days_of_week": [2],
  "end_type": "never"
}
```

**Monthly (15th of each month):**
```json
{
  "pattern": "monthly",
  "interval": 1,
  "day_of_month": 15,
  "end_type": "never"
}
```

**Quarterly (every 3 months on the 1st):**
```json
{
  "pattern": "monthly",
  "interval": 3,
  "day_of_month": 1,
  "end_type": "never"
}
```

**Limited to 10 occurrences:**
```json
{
  "pattern": "weekly",
  "interval": 1,
  "days_of_week": [1],
  "end_type": "after_count",
  "end_count": 10
}
```

**Until a specific date:**
```json
{
  "pattern": "daily",
  "interval": 1,
  "end_type": "on_date",
  "end_date": "2025-12-31T23:59:59Z"
}
```

---

## Get Tasks

Retrieves all tasks (both normal and recurring) for the authenticated user.

### Endpoint

```http
GET /tasks/
```

### Response (200 OK)

```json
[
  {
    "task_id": 123,
    "title": "Morning Exercise",
    "is_recurring": true,
    "recurrence_pattern": "daily",
    "next_occurrence": "2025-12-10T07:00:00Z",
    "recurrence_current_count": 5,
    "status": "In sospeso",
    ...
  },
  {
    "task_id": 124,
    "title": "Regular Task",
    "is_recurring": false,
    ...
  }
]
```

### Filtering Recurring Tasks

To show only recurring tasks in your UI:

```javascript
const recurringTasks = tasks.filter(task => task.is_recurring === true);
```

To show only regular tasks:

```javascript
const regularTasks = tasks.filter(task => task.is_recurring === false);
```

---

## Get Single Task

Retrieves detailed information about a specific task.

### Endpoint

```http
GET /tasks/{task_id}
```

### Response (200 OK)

```json
{
  "task_id": 123,
  "user_id": 1,
  "title": "Morning Exercise",
  "description": "30 minutes workout",
  "start_time": "2025-12-07T10:00:00Z",
  "end_time": "2025-12-09T07:00:00Z",
  "priority": "Alta",
  "status": "In sospeso",
  "is_recurring": true,
  "recurrence_pattern": "daily",
  "recurrence_interval": 1,
  "recurrence_days_of_week": null,
  "recurrence_day_of_month": null,
  "recurrence_end_type": "never",
  "recurrence_end_date": null,
  "recurrence_end_count": null,
  "recurrence_current_count": 5,
  "next_occurrence": "2025-12-12T07:00:00Z",
  "last_completed_at": "2025-12-11T07:30:00Z"
}
```

---

## Complete Recurring Task

When you complete a recurring task, the system automatically:
1. Marks the task as completed
2. Increments the completion counter
3. Calculates the **next occurrence** date
4. Resets the status to "In sospeso" (Pending)
5. Updates `last_completed_at` timestamp

### Endpoint

```http
PUT /tasks/{task_id}
```

### Request Body

```json
{
  "status": "Completato"
}
```

### Response (200 OK)

```json
{
  "task_id": 123,
  "title": "Morning Exercise",
  "status": "In sospeso",
  "is_recurring": true,
  "recurrence_current_count": 6,
  "next_occurrence": "2025-12-13T07:00:00Z",
  "last_completed_at": "2025-12-12T07:30:00Z",
  ...
}
```

### Important Notes

- **Automatic advancement**: You don't need to do anything else. The task automatically moves to the next occurrence.
- **Status reset**: The task returns to `"In sospeso"` status automatically.
- **Counter increment**: `recurrence_current_count` is automatically incremented.
- **History tracking**: `last_completed_at` records when you last completed the task.

### What Happens

**Before completion:**
```json
{
  "task_id": 123,
  "status": "In sospeso",
  "next_occurrence": "2025-12-12T07:00:00Z",
  "recurrence_current_count": 5,
  "last_completed_at": "2025-12-11T07:30:00Z"
}
```

**After completion:**
```json
{
  "task_id": 123,
  "status": "In sospeso",
  "next_occurrence": "2025-12-13T07:00:00Z",
  "recurrence_current_count": 6,
  "last_completed_at": "2025-12-12T08:15:00Z"
}
```

---

## Update Recurring Task

You can update any field of a recurring task, including title, description, priority, etc.

### Endpoint

```http
PUT /tasks/{task_id}
```

### Request Body

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "priority": "BASSA"
}
```

### Response (200 OK)

Returns the updated task with all fields.

### Notes

- You can update any field except the recurrence configuration (pattern, interval, etc.)
- To change recurrence settings, you need to delete and recreate the task
- Updating `end_time` will recalculate the next occurrence

---

## Delete Recurring Task

Deletes a recurring task. Since there's only 1 task (not multiple copies), this is a simple delete operation.

### Endpoint

```http
DELETE /tasks/{task_id}
```

### Response (204 No Content)

No content returned on successful deletion.

### Notes

- This permanently deletes the recurring task
- All history is lost
- There are no "instances" to clean up (unlike the old system)

---

## Recurrence Patterns

### Daily Pattern

Repeats every N days from the `end_time` (or `start_time` if `end_time` is not set).

**Logic:**
- Start from: `end_time` or `start_time`
- Next occurrence: current date + `interval` days

**Examples:**
- Every day: `interval: 1`
- Every 3 days: `interval: 3`
- Every week (7 days): `interval: 7`

```json
{
  "pattern": "daily",
  "interval": 3
}
```

---

### Weekly Pattern

Repeats on specific days of the week, regardless of when the task was created.

**Logic:**
- Repeats on the specified weekdays
- Independent of creation date
- 1 = Monday, 2 = Tuesday, ..., 7 = Sunday

**Examples:**
- Every Monday: `days_of_week: [1]`
- Monday, Wednesday, Friday: `days_of_week: [1, 3, 5]`
- Weekend: `days_of_week: [6, 7]`

```json
{
  "pattern": "weekly",
  "interval": 1,
  "days_of_week": [1, 3, 5]
}
```

**Every 2 weeks on Tuesday:**
```json
{
  "pattern": "weekly",
  "interval": 2,
  "days_of_week": [2]
}
```

---

### Monthly Pattern

Repeats on a specific day of each month, regardless of when the task was created.

**Logic:**
- Repeats on the specified day of the month
- Independent of creation date
- If the day doesn't exist (e.g., 31st in February), uses the last day of the month

**Examples:**
- 1st of each month: `day_of_month: 1`
- 15th of each month: `day_of_month: 15`
- Last day (31): `day_of_month: 31`

```json
{
  "pattern": "monthly",
  "interval": 1,
  "day_of_month": 15
}
```

**Quarterly (every 3 months on the 1st):**
```json
{
  "pattern": "monthly",
  "interval": 3,
  "day_of_month": 1
}
```

**Handling invalid dates:**
- If you set `day_of_month: 31` for February, the system will use February 28th (or 29th in leap years)

---

## Response Fields

### Recurring Task Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_recurring` | boolean | Whether this is a recurring task |
| `recurrence_pattern` | string | `"daily"`, `"weekly"`, or `"monthly"` |
| `recurrence_interval` | integer | Repeat every N days/weeks/months |
| `recurrence_days_of_week` | array | Days of week for weekly pattern [1-7] |
| `recurrence_day_of_month` | integer | Day of month for monthly pattern (1-31) |
| `recurrence_end_type` | string | `"never"`, `"after_count"`, or `"on_date"` |
| `recurrence_end_date` | datetime | End date if `end_type="on_date"` |
| `recurrence_end_count` | integer | Max occurrences if `end_type="after_count"` |
| `recurrence_current_count` | integer | How many times task has been completed |
| `next_occurrence` | datetime | When the task is next due |
| `last_completed_at` | datetime | When the task was last completed |

### Field Details

**`next_occurrence`:**
- Automatically calculated based on recurrence pattern
- Updated when task is completed
- Use this to display "Next due: Monday, Dec 16"

**`recurrence_current_count`:**
- Increments each time task is completed
- Use this to show "Completed 5 times"

**`last_completed_at`:**
- Timestamp of last completion
- Use this to show "Last completed: 2 hours ago"

---

## Error Handling

### Validation Errors (400 Bad Request)

**Missing required fields:**
```json
{
  "detail": "recurrence configuration is required for recurring tasks"
}
```

**Invalid pattern:**
```json
{
  "detail": "days_of_week is required for weekly pattern"
}
```

**Invalid values:**
```json
{
  "detail": "interval must be between 1 and 365"
}
```

### Common Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 400 | `is_recurring=true` but `recurrence` is missing | Provide `recurrence` object |
| 400 | Weekly pattern without `days_of_week` | Add `days_of_week` array |
| 400 | Monthly pattern without `day_of_month` | Add `day_of_month` field |
| 400 | `end_type="after_count"` without `end_count` | Add `end_count` field |
| 400 | `end_type="on_date"` without `end_date` | Add `end_date` field |
| 401 | Missing or invalid token | Check authentication headers |
| 404 | Task not found | Verify task ID exists |

---

## Client Integration Examples

### React/TypeScript

```typescript
import axios from 'axios';

const API_URL = 'https://api.mytasklyapp.com';
const API_KEY = 'your-api-key';

interface RecurringTask {
  title: string;
  description?: string;
  end_time?: string;
  priority?: 'BASSA' | 'MEDIA' | 'ALTA';
  category_id: number;
  user: string;
  is_recurring: boolean;
  recurrence: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    days_of_week?: number[];
    day_of_month?: number;
    end_type?: 'never' | 'after_count' | 'on_date';
    end_date?: string;
    end_count?: number;
  };
}

// Create recurring task
async function createRecurringTask(
  accessToken: string,
  taskData: RecurringTask
) {
  const response = await axios.post(
    `${API_URL}/tasks/`,
    taskData,
    {
      headers: {
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Complete recurring task
async function completeRecurringTask(
  accessToken: string,
  taskId: number
) {
  const response = await axios.put(
    `${API_URL}/tasks/${taskId}`,
    { status: 'Completato' },
    {
      headers: {
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return response.data;
}

// Example usage
const task = await createRecurringTask(accessToken, {
  title: 'Daily Exercise',
  description: '30 min workout',
  end_time: '2025-12-09T07:00:00Z',
  priority: 'ALTA',
  category_id: 1,
  user: 'john_doe',
  is_recurring: true,
  recurrence: {
    pattern: 'daily',
    interval: 1,
    end_type: 'never'
  }
});

console.log(`Next occurrence: ${task.next_occurrence}`);

// Complete it
const completed = await completeRecurringTask(accessToken, task.task_id);
console.log(`New next occurrence: ${completed.next_occurrence}`);
```

### React Native

```javascript
import { useState } from 'react';

function RecurringTaskCard({ task, onComplete }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(task.task_id);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{task.title}</Text>

      {task.is_recurring && (
        <View style={styles.recurringBadge}>
          <Text style={styles.badgeText}>🔄 Recurring</Text>
        </View>
      )}

      <Text style={styles.nextOccurrence}>
        Next: {formatDate(task.next_occurrence)}
      </Text>

      <Text style={styles.completionCount}>
        Completed {task.recurrence_current_count} times
      </Text>

      <Button
        title="Complete"
        onPress={handleComplete}
        disabled={isCompleting}
      />
    </View>
  );
}
```

### Display Next Occurrence

```javascript
function formatNextOccurrence(task) {
  if (!task.is_recurring || !task.next_occurrence) {
    return null;
  }

  const nextDate = new Date(task.next_occurrence);
  const now = new Date();
  const diffMs = nextDate - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;

  return nextDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

// Usage
<Text>
  {formatNextOccurrence(task)}
  {/* Output: "Tomorrow" or "Monday, Dec 16" */}
</Text>
```

### Show Recurrence Pattern

```javascript
function getRecurrenceDescription(task) {
  if (!task.is_recurring) return null;

  const { recurrence_pattern, recurrence_interval, recurrence_days_of_week, recurrence_day_of_month } = task;

  if (recurrence_pattern === 'daily') {
    return recurrence_interval === 1
      ? 'Every day'
      : `Every ${recurrence_interval} days`;
  }

  if (recurrence_pattern === 'weekly') {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = recurrence_days_of_week.map(d => dayNames[d - 1]).join(', ');
    return recurrence_interval === 1
      ? `Every ${days}`
      : `Every ${recurrence_interval} weeks on ${days}`;
  }

  if (recurrence_pattern === 'monthly') {
    const day = recurrence_day_of_month;
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    return recurrence_interval === 1
      ? `${day}${suffix} of every month`
      : `${day}${suffix} of every ${recurrence_interval} months`;
  }

  return 'Recurring';
}

// Usage
<Text>
  {getRecurrenceDescription(task)}
  {/* Output: "Every Mon, Wed, Fri" */}
</Text>
```

---

## Best Practices

### 1. Display Recurring Tasks Clearly

- Show a badge or icon to distinguish recurring tasks
- Display the next occurrence date prominently
- Show how many times the task has been completed

### 2. Handle Completion Feedback

```javascript
const handleComplete = async (taskId) => {
  // Show loading state
  setIsCompleting(true);

  try {
    const updatedTask = await completeTask(taskId);

    // Show success message with next occurrence
    toast.success(
      `Task completed! Next occurrence: ${formatDate(updatedTask.next_occurrence)}`
    );

    // Update UI
    updateTaskInList(updatedTask);
  } catch (error) {
    toast.error('Failed to complete task');
  } finally {
    setIsCompleting(false);
  }
};
```

### 3. Validate Before Creating

```javascript
function validateRecurringTask(data) {
  if (!data.is_recurring) return true;

  if (!data.recurrence) {
    throw new Error('Recurrence configuration is required');
  }

  if (data.recurrence.pattern === 'weekly' && !data.recurrence.days_of_week) {
    throw new Error('Please select at least one day of the week');
  }

  if (data.recurrence.pattern === 'monthly' && !data.recurrence.day_of_month) {
    throw new Error('Please select a day of the month');
  }

  return true;
}
```

### 4. Show Appropriate UI for End Types

```javascript
// For "never" - show infinity symbol
{task.recurrence_end_type === 'never' && <Text>∞ No end date</Text>}

// For "after_count" - show progress
{task.recurrence_end_type === 'after_count' && (
  <Text>
    {task.recurrence_current_count} / {task.recurrence_end_count} completed
  </Text>
)}

// For "on_date" - show countdown
{task.recurrence_end_type === 'on_date' && (
  <Text>
    Ends on {formatDate(task.recurrence_end_date)}
  </Text>
)}
```

### 5. Filter and Sort

```javascript
// Get all recurring tasks
const recurringTasks = tasks.filter(t => t.is_recurring);

// Sort by next occurrence
const sorted = recurringTasks.sort((a, b) =>
  new Date(a.next_occurrence) - new Date(b.next_occurrence)
);

// Get tasks due today
const dueToday = recurringTasks.filter(t => {
  const next = new Date(t.next_occurrence);
  const today = new Date();
  return next.toDateString() === today.toDateString();
});
```

---

## Migration from Old System

If you were using the old recurring tasks system (`RecurringTaskTemplates`), note these key differences:

### Old System
- Created 100 separate task records
- Had a template + instances
- Completing a task just marked it as completed
- Had to manually manage instances

### New System
- Creates 1 single task record
- No template/instances separation
- Completing auto-advances to next occurrence
- Automatic management

### Migration Steps

1. **Identify old recurring tasks**: Look for tasks with `is_generated_instance=true`
2. **Create new recurring tasks**: Use the new API format
3. **Delete old instances**: Clean up the old duplicate tasks
4. **Update your UI**: Show recurring badge and next occurrence

---

## FAQ

**Q: What happens when I complete a recurring task?**
A: The task automatically advances to the next occurrence, increments the counter, and resets to "In sospeso" status.

**Q: How do I stop a recurring task?**
A: Simply delete the task using `DELETE /tasks/{task_id}`.

**Q: Can I modify the recurrence pattern after creation?**
A: Currently no. You need to delete and recreate the task with new settings.

**Q: What happens if I set monthly recurrence on day 31 for February?**
A: The system will use the last day of February (28th or 29th).

**Q: Can I see the history of all completions?**
A: The `recurrence_current_count` and `last_completed_at` fields track this. A full history endpoint may be added in the future.

**Q: What timezone is used for next_occurrence?**
A: All dates are in UTC. Convert to user's local timezone in your client.

---

## Support

For issues or questions:
- GitHub: https://github.com/your-repo/issues
- Email: support@mytasklyapp.com
- Documentation: https://docs.mytasklyapp.com

---

**Last Updated:** 2025-12-07
**API Version:** 2.2.0
