import axios from './axiosInterceptor';
import { getValidToken } from './authService';

export interface ChatHistoryResponse {
  chat_id: string;
  user_id: number;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string | null;
}

export interface ChatMessage {
  message_id: number;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  token_count?: number;
  model?: string;
  tool_name?: string;
  tool_input?: Record<string, any>;
  tool_output?: Record<string, any>;
}

export interface ChatWithMessages extends ChatHistoryResponse {
  messages: ChatMessage[];
}

export interface ChatHistoryListResponse {
  total: number;
  chats: ChatHistoryResponse[];
}

export interface FetchChatHistoryOptions {
  skip?: number;
  limit?: number;
  pinned_only?: boolean;
}

/**
 * Creates a new chat session
 * @param customChatId - Optional custom chat ID
 * @returns Promise with created chat data
 */
export const createChat = async (
  customChatId?: string
): Promise<ChatHistoryResponse> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    const response = await axios.post<ChatHistoryResponse>(
      '/chat/history/',
      customChatId ? { chat_id: customChatId } : {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

/**
 * Fetches the chat history list from the API
 * @param options - Pagination and filter options
 * @returns Promise with chat history data
 */
export const fetchChatHistory = async (
  options: FetchChatHistoryOptions = {}
): Promise<ChatHistoryResponse[]> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    const { skip = 0, limit = 50, pinned_only = false } = options;

    const response = await axios.get<ChatHistoryListResponse>(
      '/chat/history/',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          skip,
          limit,
          pinned_only,
        },
      }
    );

    return response.data.chats;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Fetches a specific chat with all its messages
 * @param chatId - The ID of the chat to fetch
 * @returns Promise with chat and messages
 */
export const getChatWithMessages = async (
  chatId: string
): Promise<ChatWithMessages> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    const response = await axios.get<ChatWithMessages>(
      `/chat/history/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Fetched chat with messages:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error fetching chat with messages:', error);
    throw error;
  }
};

/**
 * Updates chat title
 * @param chatId - The ID of the chat to update
 * @param title - New title
 * @returns Promise with updated chat data
 */
export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<ChatHistoryResponse> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    const response = await axios.patch<ChatHistoryResponse>(
      `/chat/history/${chatId}`,
      { title },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};

/**
 * Toggles pin status of a chat
 * @param chatId - The ID of the chat to toggle pin
 * @param isPinned - New pin status
 * @returns Promise with updated chat data
 */
export const toggleChatPin = async (
  chatId: string,
  isPinned: boolean
): Promise<ChatHistoryResponse> => {
  try {
    const token = await getValidToken();

    if (!token) {
      throw new Error('No valid authentication token');
    }

    const response = await axios.patch<ChatHistoryResponse>(
      `/chat/history/${chatId}`,
      { is_pinned: isPinned },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error toggling chat pin:', error);
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

    await axios.delete(`/chat/history/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    throw error;
  }
};
