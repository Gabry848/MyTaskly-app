import axios from "./axiosInterceptor";
import { checkAndRefreshAuth } from "./authService";
import {
  RecurrenceConfig,
  RecurringTemplate,
  CreateRecurringTaskResponse,
  GetTemplatesResponse,
  GetInstancesResponse,
  RecurringTask,
} from "../types/recurringTask";

/**
 * Task data for creating a recurring task
 */
export interface CreateRecurringTaskData {
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  priority?: string;
  category_id: number;
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

/**
 * Creates a new recurring task with template and instances
 * @param taskData - Task details (title, description, times, priority, category)
 * @param recurrence - Recurrence configuration
 * @returns Response with template and base task IDs
 */
export async function createRecurringTask(
  taskData: CreateRecurringTaskData,
  recurrence: RecurrenceConfig
): Promise<ApiResponse<CreateRecurringTaskResponse>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] createRecurringTask: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    const response = await axios.post<CreateRecurringTaskResponse>(
      "/recurring-tasks/",
      {
        ...taskData,
        recurrence,
      }
    );

    console.log(
      "✅ Recurring task created:",
      response.data.template_id,
      "-",
      response.data.pattern
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error creating recurring task:", error.message);
    return {
      success: false,
      message:
        error.response?.data?.detail || "Error creating recurring task",
      error,
    };
  }
}

/**
 * Gets all recurring task templates for the authenticated user
 * @param activeOnly - If true, returns only active templates (default: true)
 * @returns List of templates
 */
export async function getRecurringTemplates(
  activeOnly: boolean = true
): Promise<ApiResponse<GetTemplatesResponse>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] getRecurringTemplates: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    const response = await axios.get<GetTemplatesResponse>(
      "/recurring-tasks/",
      {
        params: { active_only: activeOnly },
      }
    );

    console.log(
      "✅ Retrieved",
      response.data.total_templates,
      "recurring templates"
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error fetching recurring templates:", error.message);
    return {
      success: false,
      message:
        error.response?.data?.detail || "Error fetching recurring templates",
      error,
    };
  }
}

/**
 * Gets detailed information about a specific recurring task template
 * @param templateId - ID of the template
 * @returns Template details
 */
export async function getTemplateDetails(
  templateId: number
): Promise<ApiResponse<RecurringTemplate>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] getTemplateDetails: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    const response = await axios.get<RecurringTemplate>(
      `/recurring-tasks/${templateId}`
    );

    console.log("✅ Retrieved template details:", templateId);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error fetching template details:", error.message);
    return {
      success: false,
      message:
        error.response?.data?.detail || "Error fetching template details",
      error,
    };
  }
}

/**
 * Gets all task instances generated from a specific template
 * @param templateId - ID of the template
 * @param includeCompleted - If true, includes completed instances (default: false)
 * @returns List of task instances
 */
export async function getTemplateInstances(
  templateId: number,
  includeCompleted: boolean = false
): Promise<ApiResponse<GetInstancesResponse>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] getTemplateInstances: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    const response = await axios.get<GetInstancesResponse>(
      `/recurring-tasks/${templateId}/instances`,
      {
        params: { include_completed: includeCompleted },
      }
    );

    console.log(
      "✅ Retrieved",
      response.data.total_instances,
      "instances for template",
      templateId
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error fetching template instances:", error.message);
    return {
      success: false,
      message:
        error.response?.data?.detail || "Error fetching template instances",
      error,
    };
  }
}

/**
 * Updates a recurring task template
 * Note: This only affects future instances, not already generated ones
 * @param templateId - ID of the template to update
 * @param updates - Partial recurrence configuration updates
 * @returns Updated template confirmation
 */
export async function updateTemplate(
  templateId: number,
  updates: Partial<RecurrenceConfig>
): Promise<ApiResponse<any>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] updateTemplate: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    const response = await axios.put(`/recurring-tasks/${templateId}`, updates);

    console.log("✅ Template updated:", templateId);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error updating template:", error.message);
    return {
      success: false,
      message: error.response?.data?.detail || "Error updating template",
      error,
    };
  }
}

/**
 * Deactivates a template, preventing it from generating new instances
 * Existing instances are NOT deleted
 * @param templateId - ID of the template to deactivate
 * @returns Deactivation confirmation
 */
export async function deactivateTemplate(
  templateId: number
): Promise<ApiResponse<any>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] deactivateTemplate: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    const response = await axios.post(
      `/recurring-tasks/${templateId}/deactivate`
    );

    console.log("✅ Template deactivated:", templateId);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Error deactivating template:", error.message);
    return {
      success: false,
      message: error.response?.data?.detail || "Error deactivating template",
      error,
    };
  }
}

/**
 * Permanently deletes a template and ALL its associated instances (CASCADE delete)
 * WARNING: This action is irreversible
 * @param templateId - ID of the template to delete
 * @returns Deletion confirmation
 */
export async function deleteTemplate(
  templateId: number
): Promise<ApiResponse<void>> {
  try {
    const authStatus = await checkAndRefreshAuth();
    if (!authStatus.isAuthenticated) {
      console.log(
        "[RECURRING_TASK_SERVICE] deleteTemplate: user not authenticated"
      );
      return {
        success: false,
        message: "Authentication token invalid",
      };
    }

    await axios.delete(`/recurring-tasks/${templateId}`);

    console.log("✅ Template deleted:", templateId);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error("❌ Error deleting template:", error.message);
    return {
      success: false,
      message: error.response?.data?.detail || "Error deleting template",
      error,
    };
  }
}
