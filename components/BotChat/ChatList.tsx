import React, { useRef, useEffect } from 'react';
import { StyleSheet, FlatList, Keyboard, Platform, Dimensions } from 'react-native';
import { ChatListProps } from './types';
import MessageBubble from './MessageBubble';

const ChatList: React.FC<ChatListProps> = ({ messages, style }) => {
  const flatListRef = useRef<FlatList>(null);

  // Helper per determinare il tipo di dispositivo
  const getDeviceType = () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = height / width;
    
    if (Platform.OS === 'ios') {
      return aspectRatio < 1.6 ? 'ipad' : 'iphone';
    }
    return 'android';
  };

  const deviceType = getDeviceType();

  // Scroll automatico quando arrivano nuovi messaggi o quando il contenuto cambia
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages]);

  // Gestione tastiera per scroll automatico
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Su iPad scrolliamo sempre, su Android solo se necessario, su iPhone lasciamo gestire al KeyboardAvoidingView
      if (deviceType === 'ipad' || deviceType === 'android') {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      keyboardDidShowListener?.remove();
    };
  }, [deviceType]);  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={({ item }) => {
        return <MessageBubble message={item} />;
      }}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.messagesList, 
        style,
        // Su iPad, aggiungiamo meno padding extra dato che ora usiamo KeyboardAvoidingView
        deviceType === 'ipad' && styles.ipadPadding
      ]}
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
    paddingBottom: 80, // Aggiungiamo più spazio per l'input e per visualizzare completamente l'ultimo messaggio
  },
  ipadPadding: {
    paddingBottom: 100, // Più spazio per iPad per l'input
  },
});

export default ChatList;
