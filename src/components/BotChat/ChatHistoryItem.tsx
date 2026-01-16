import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ChatHistoryItemData {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatHistoryItemProps {
  chat: ChatHistoryItemData;
  onPress: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
}

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
  chat,
  onPress,
  onDelete,
}) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(chat.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="chatbubble-outline" size={20} color="#666" />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {chat.title}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(chat.timestamp)}
          </Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {chat.preview}
          </Text>
          <View style={styles.messageCountBadge}>
            <Text style={styles.messageCountText}>{chat.messageCount}</Text>
          </View>
        </View>
      </View>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(chat.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'System',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
    marginRight: 8,
  },
  messageCountBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  messageCountText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
    fontFamily: 'System',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
