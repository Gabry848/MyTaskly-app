import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatHistoryItem, ChatHistoryItemData } from './ChatHistoryItem';
import {
  fetchChatHistory,
  deleteChatHistory,
  ChatHistoryResponse,
} from '../../services/chatHistoryService';

interface ChatHistoryProps {
  onChatPress: (chatId: string) => void;
  onNewChat?: () => void;
  onRefresh?: () => void;
}

/**
 * Transforms API response data to ChatHistoryItemData format
 */
const transformChatData = (
  apiChat: ChatHistoryResponse
): ChatHistoryItemData => ({
  id: apiChat.chat_id,
  title: apiChat.title,
  preview: apiChat.last_message_preview,
  timestamp: new Date(apiChat.updated_at),
  messageCount: apiChat.message_count,
  isPinned: apiChat.is_pinned,
});

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  onChatPress,
  onNewChat,
  onRefresh,
}) => {
  const [chats, setChats] = useState<ChatHistoryItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const chatData = await fetchChatHistory();

      // Sort by pinned first, then by updated_at
      const sortedChats = chatData
        .map(transformChatData)
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        });

      setChats(sortedChats);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleChatDelete = async (chatId: string) => {
    try {
      await deleteChatHistory(chatId);
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError('Failed to delete chat');
    }
  };

  const handleRefresh = () => {
    loadChatHistory();
    if (onRefresh) {
      onRefresh();
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{chats.length}</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Ionicons
            name="refresh-outline"
            size={24}
            color={loading ? '#cccccc' : '#007AFF'}
          />
        </TouchableOpacity>
        {onNewChat && (
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={onNewChat}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptySubtitle}>Loading chat history...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#cccccc" />
        <Text style={styles.emptyTitle}>No chat history</Text>
        <Text style={styles.emptySubtitle}>
          Start a conversation to see it here
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatHistoryItemData }) => (
    <ChatHistoryItem
      chat={item}
      onPress={onChatPress}
      onDelete={handleChatDelete}
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
    fontFamily: 'System',
  },
  refreshButton: {
    padding: 4,
  },
  newChatButton: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
    marginTop: 16,
    fontFamily: 'System',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
