import React, { useRef, useEffect } from 'react';
import { StyleSheet, FlatList, Keyboard, Platform } from 'react-native';
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

  // Gestione tastiera per scroll automatico su Android
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (Platform.OS === 'android') {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      keyboardDidShowListener?.remove();
    };
  }, []);  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={({ item }) => {
        return <MessageBubble message={item} />;
      }}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.messagesList, style]}
      showsVerticalScrollIndicator={false}
      onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="interactive"
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  );
};

const styles = StyleSheet.create({
  messagesList: {
    paddingVertical: 15,
  },
});

export default ChatList;
