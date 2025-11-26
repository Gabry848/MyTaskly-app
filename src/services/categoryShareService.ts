import axios from "./axiosInterceptor";

// TypeScript interfaces for category sharing
export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  user_id: number;
  is_shared: boolean;
  owner_id: number | null;
  is_owned: boolean;
  permission_level: "READ_ONLY" | "READ_WRITE";
}

export interface CategoryShare {
  share_id: number;
  category_id: number;
  category_name: string;
  owner_id: number;
  shared_with_user_id: number;
  shared_with_user_name: string;
  shared_with_user_email: string;
  permission_level: "READ_ONLY" | "READ_WRITE";
  shared_at: string; // ISO 8601 datetime
  accepted: boolean;
}

export interface UserShareInfo {
  user_id: number;
  name: string;
  email: string;
  permission_level: "READ_ONLY" | "READ_WRITE" | "OWNER";
  shared_at: string; // ISO 8601 datetime
}

export interface ShareCategoryRequest {
  user_email: string;
  permission: "READ_ONLY" | "READ_WRITE";
}

export interface ShareCategoryResponse {
  message: string;
  share_id: number;
  shared_with: string;
}

export interface SharedWithMeCategory {
  category_id: number;
  name: string;
  description: string | null;
  owner_id: number;
  owner_name: string;
  permission_level: "READ_ONLY" | "READ_WRITE";
  shared_at: string;
}

/**
 * Service for managing category sharing functionality
 */
class CategoryShareService {
  /**
   * Share a category with another user
   * @param categoryId - ID of the category to share
   * @param userEmail - Email of the user to share with
   * @param permission - Permission level (READ_ONLY or READ_WRITE)
   */
  async shareCategory(
    categoryId: number,
    userEmail: string,
    permission: "READ_ONLY" | "READ_WRITE" = "READ_ONLY"
  ): Promise<ShareCategoryResponse> {
    try {
      const response = await axios.post(
        `/categories/${categoryId}/share`,
        { user_email: userEmail, permission },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all shares for a specific category
   * @param categoryId - ID of the category
   */
  async getCategoryShares(categoryId: number): Promise<CategoryShare[]> {
    try {
      const response = await axios.get(`/categories/${categoryId}/shares`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Remove a share from a category
   * @param categoryId - ID of the category
   * @param shareUserId - ID of the user to remove access from
   */
  async removeShare(categoryId: number, shareUserId: number): Promise<{ message: string }> {
    try {
      const response = await axios.delete(
        `/categories/${categoryId}/share/${shareUserId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update permission level for a share
   * @param categoryId - ID of the category
   * @param shareId - ID of the share
   * @param permission - New permission level
   */
  async updateSharePermission(
    categoryId: number,
    shareId: number,
    permission: "READ_ONLY" | "READ_WRITE"
  ): Promise<{ message: string; new_permission: string }> {
    try {
      const response = await axios.put(
        `/categories/${categoryId}/share/${shareId}/permission?permission=${permission}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get categories shared with the current user
   */
  async getSharedWithMe(): Promise<SharedWithMeCategory[]> {
    try {
      const response = await axios.get(`/categories/shared-with-me`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all users who have access to a category
   * @param categoryId - ID of the category
   */
  async getCategoryUsers(categoryId: number): Promise<UserShareInfo[]> {
    try {
      const response = await axios.get(`/categories/${categoryId}/users`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and return user-friendly error object
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data.detail || "Errore sconosciuto";
      const status = error.response.status;

      const customError: any = new Error(message);
      customError.status = status;
      customError.response = error.response;

      return customError;
    }

    const networkError: any = new Error("Errore di connessione");
    networkError.status = 0;
    return networkError;
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate share request
   */
  validateShareRequest(email: string, currentUserEmail: string): { valid: boolean; error?: string } {
    if (!email || email.trim() === "") {
      return { valid: false, error: "Email richiesta" };
    }

    if (!this.validateEmail(email)) {
      return { valid: false, error: "Email non valida" };
    }

    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      return { valid: false, error: "Non puoi condividere con te stesso" };
    }

    return { valid: true };
  }
}

export default new CategoryShareService();
