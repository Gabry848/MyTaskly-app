import React, { useRef, useEffect } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { ChatListProps } from './types';
import MessageBubble from './MessageBubble';

const ChatList: React.FC<ChatListProps> = ({ messages, style }) => {
  const flatListRef = useRef<FlatList>(null);

  // Scroll automatico quando arrivano nuovi messaggi
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={({ item }) => <MessageBubble message={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.messagesList, style]}
      showsVerticalScrollIndicator={false}
      onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      keyboardShouldPersistTaps="always"
    />
  );
};

const styles = StyleSheet.create({
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
});

export default ChatList;
