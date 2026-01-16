import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatHistoryItem, ChatHistoryItemData } from './ChatHistoryItem';

interface ChatHistoryProps {
  chats: ChatHistoryItemData[];
  onChatPress: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
  onNewChat?: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  chats,
  onChatPress,
  onChatDelete,
  onNewChat,
}) => {
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{chats.length}</Text>
        </View>
      </View>
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
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#cccccc" />
      <Text style={styles.emptyTitle}>No chat history</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation to see it here
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: ChatHistoryItemData }) => (
    <ChatHistoryItem
      chat={item}
      onPress={onChatPress}
      onDelete={onChatDelete}
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
});
