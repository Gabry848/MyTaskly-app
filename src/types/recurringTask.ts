import { Task } from "../services/taskService";

/**
 * Recurrence pattern types
 */
export type RecurrencePattern = "daily" | "weekly" | "monthly";

/**
 * End type for recurring tasks
 */
export type RecurrenceEndType = "never" | "after_count" | "on_date";

/**
 * Configuration for task recurrence
 */
export interface RecurrenceConfig {
  /** Recurrence pattern: daily, weekly, or monthly */
  pattern: RecurrencePattern;

  /** Interval: repeat every N days/weeks/months (default: 1) */
  interval: number;

  /** Days of week for weekly pattern (1=Monday, 7=Sunday) */
  days_of_week?: number[];

  /** Day of month for monthly pattern (1-31) */
  day_of_month?: number;

  /** When to stop: never, after_count, or on_date */
  end_type: RecurrenceEndType;

  /** End date if end_type is 'on_date' (ISO 8601) */
  end_date?: string;

  /** Number of occurrences if end_type is 'after_count' (1-1000) */
  end_count?: number;
}

/**
 * Recurring task template from server
 */
export interface RecurringTemplate {
  template_id: number;
  base_task_id: number;
  recurrence_pattern: string;
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  end_type: string;
  end_date?: string;
  end_count?: number;
  occurrence_count: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Extended Task interface for recurring tasks
 */
export interface RecurringTask extends Task {
  /** Indicates if this task is a generated instance from a template */
  is_generated_instance?: boolean;

  /** ID of the parent template (if this is an instance) */
  parent_template_id?: number;

  /** Recurrence pattern (for display purposes) */
  recurrence_pattern?: string;
}

/**
 * Response from creating a recurring task
 */
export interface CreateRecurringTaskResponse {
  message: string;
  base_task_id: number;
  template_id: number;
  pattern: string;
  interval: number;
}

/**
 * Response from getting all templates
 */
export interface GetTemplatesResponse {
  total_templates: number;
  templates: RecurringTemplate[];
}

/**
 * Response from getting template instances
 */
export interface GetInstancesResponse {
  template_id: number;
  total_instances: number;
  instances: RecurringTask[];
}
