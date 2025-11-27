/**
 * Shared types for TaskList components
 */

/**
 * Task interface
 */
export interface Task {
  /** Task status */
  status: string;
  /** Task start time in ISO format */
  start_time: string;
  /** Task ID */
  id?: number | string;
  /** Task title */
  title: string;
  /** Task image */
  image?: string;
  /** Task description */
  description: string;
  /** Task priority */
  priority: string;
  /** Task end time in ISO format */
  end_time: string;
  /** Whether task is completed */
  completed?: boolean;
  /** Status code from server */
  status_code?: number;
  /** Task ID from server */
  task_id: number;
  /** Category ID */
  category_id?: number | string;
  /** Category name */
  category_name?: string;
  /** Whether this is an optimistic update */
  isOptimistic?: boolean;
}

// Riferimento globale per i task condivisi tra componenti
export let globalTasksRef = {
  addTask: (task: Task, categoryName: string) => {},
  tasks: {} as Record<string, Task[]>, // Task raggruppati per nome categoria
};

/**
 * Add a task to the global task list
 * @param {Task} task - The task to add
 * @param {string} categoryName - The category name for the task
 */
export const addTaskToList = (task: Task, categoryName: string) => {
  console.log("addTaskToList called directly with:", task, "for category:", categoryName);
  globalTasksRef.addTask(task, categoryName);
};
