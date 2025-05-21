import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MessageBubbleProps } from './types';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, style }) => {
  const isBot = message.sender === 'bot';
  
  // Formatta la data per la visualizzazione
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <View style={[
      styles.messageContainer,
      isBot ? styles.botMessageContainer : styles.userMessageContainer,
      style
    ]}>
      <View style={[
        styles.messageBubble,
        isBot ? styles.botBubble : styles.userBubble
      ]}>
        <Text style={[
          styles.messageText,
          isBot ? styles.botText : styles.userText
        ]}>
          {message.text}
        </Text>
        {message.modelType && isBot && (
          <Text style={styles.modelType}>
            {message.modelType === 'advanced' ? 'Modello avanzato' : 'Modello base'}
          </Text>
        )}
      </View>
      <Text style={[
        styles.messageTime,
        isBot ? styles.botTime : styles.userTime
      ]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#5B37B7', // Viola primario dell'app
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  userTime: {
    color: '#FFFFFF80',
  },
  botTime: {
    color: '#33333380',
  },
  modelType: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default MessageBubble;
