import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [skip, setSkip] = useState<number>(0);
  const LIMIT = 20;
  const isLoadingRef = React.useRef<boolean>(false);

  // 3-dot loading animation (same pattern as VoiceChatModal)
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      const animateDots = Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dot1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot1Opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2Opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot3Opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
        ])
      );
      animateDots.start();
      return () => {
        animateDots.stop();
        dot1Opacity.setValue(0.3);
        dot2Opacity.setValue(0.3);
        dot3Opacity.setValue(0.3);
      };
    }
  }, [loading]);

  const loadChatHistory = async (reset: boolean = false) => {
    // Prevent concurrent loads
    if (isLoadingRef.current && !reset) {
      console.log('[ChatHistory] Already loading, skipping...');
      return;
    }

    try {
      isLoadingRef.current = true;

      if (reset) {
        setLoading(true);
        setSkip(0);
      }
      setError(null);

      const currentSkip = reset ? 0 : skip;
      const chatData = await fetchChatHistory({
        skip: currentSkip,
        limit: LIMIT,
      });

      // Sort by pinned first, then by updated_at (API already returns sorted)
      const sortedChats = chatData.map(transformChatData);

      if (reset) {
        setChats(sortedChats);
      } else {
        setChats((prevChats) => [...prevChats, ...sortedChats]);
      }

      setHasMore(chatData.length === LIMIT);
      setSkip(currentSkip + chatData.length);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  };

  const loadMoreChats = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    await loadChatHistory(false);
  };

  const handlePullRefresh = async () => {
    setRefreshing(true);
    isLoadingRef.current = false; // Reset flag to allow refresh
    await loadChatHistory(true);
    if (onRefresh) {
      onRefresh();
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

  const handleTogglePin = async (chatId: string, isPinned: boolean) => {
    try {
      const { toggleChatPin } = await import('../../services/chatHistoryService');
      const updatedChat = await toggleChatPin(chatId, isPinned);

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                isPinned: updatedChat.is_pinned,
              }
            : chat
        )
      );

      // Re-sort after pin change
      setChats((prevChats) =>
        [...prevChats].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.timestamp.getTime() - a.timestamp.getTime();
        })
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      setError('Failed to update chat');
    }
  };

  const handleRefresh = () => {
    isLoadingRef.current = false; // Reset flag to allow refresh
    loadChatHistory(true);
    if (onRefresh) {
      onRefresh();
    }
  };

  useEffect(() => {
    // Load chat history only once on mount
    loadChatHistory(true);
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

  const renderLoadingDots = () => (
    <View style={styles.loadingDots}>
      <Animated.View style={[styles.loadingDot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot3Opacity }]} />
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          {renderLoadingDots()}
          <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>Loading chat history...</Text>
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
      onTogglePin={handleTogglePin}
    />
  );

  const renderFooter = () => {
    return null;
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshing={!loading && refreshing}
        onRefresh={handlePullRefresh}
        onEndReached={loadMoreChats}
        onEndReachedThreshold={0.5}
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 24,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
});
