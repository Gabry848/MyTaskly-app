import axiosInstance from './axiosInstance';
import { getValidToken } from './authService';

export interface ChatHistoryResponse {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string;
  is_pinned: boolean;
}

export interface ChatHistoryAPIResponse {
  success: boolean;
  data: {
    chats: ChatHistoryResponse[];
    total_count: number;
  };
}

/**
 * Fetches the chat history from the API
 * @returns Promise with chat history data
 */
export const fetchChatHistory = async (): Promise<ChatHistoryResponse[]> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    const response = await axiosInstance.get<ChatHistoryAPIResponse>(
      '/chat/history',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data.chats;
    } else {
      throw new Error('Failed to fetch chat history');
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Deletes a specific chat from history
 * @param chatId - The ID of the chat to delete
 */
export const deleteChatHistory = async (chatId: string): Promise<void> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    await axiosInstance.delete(`/chat/history/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    throw error;
  }
};
