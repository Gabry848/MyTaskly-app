import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { MessageBubbleProps } from './types';
import TaskTableBubble from './TaskTableBubble'; // Importa il nuovo componente

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, style }) => {
  const isBot = message.sender === 'bot';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Animazione di entrata per ogni nuovo messaggio
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Formatta la data per la visualizzazione
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  // Controlla se il messaggio del bot contiene la struttura dei task specificata
  if (isBot && typeof message.text === 'string') {
    // Controlla se il messaggio contiene un JSON array di task o il messaggio "Nessun task trovato"
    if ((message.text.includes('[') && message.text.includes(']') && 
        (message.text.includes('📅 TASK PER LA DATA') || message.text.includes('task_id'))) ||
        message.text.includes('📅 Nessun task trovato') ||
        (message.text.includes('📅') && message.text.includes('TASK PER LA DATA'))) {
      return <TaskTableBubble message={message.text} style={style} />;
    }
      // Controlla il formato JSON legacy
    try {
      const parsedData = JSON.parse(message.text);
      if (parsedData.mode === "view") {
        // Se ha una proprietà message, usa quella per il TaskTableBubble
        if (parsedData.message) {
          return <TaskTableBubble message={parsedData.message} style={style} />;
        }
        // Altrimenti, se ha tasks, converte al nuovo formato
        if (parsedData.tasks) {
          const legacyMessage = `Ecco i tuoi impegni:\n📅 TASK:\n${JSON.stringify(parsedData.tasks)}\n📊 Totale task trovati: ${parsedData.tasks.length}`;
          return <TaskTableBubble message={legacyMessage} style={style} />;
        }
      }
    } catch (e) {
      // Se non è un JSON valido, continua con il rendering normale
    }
  }

  // Se il messaggio del bot contiene attività (formato legacy), visualizza TaskTableBubble
  if (isBot && message.tasks && message.tasks.length > 0) {
    const legacyMessage = `Ecco i tuoi impegni:\n📅 TASK:\n${JSON.stringify(message.tasks)}\n📊 Totale task trovati: ${message.tasks.length}`;
    return <TaskTableBubble message={legacyMessage} style={style} />;
  }  // Altrimenti, visualizza il messaggio di testo normale
  return (
    <Animated.View style={[
      styles.messageContainer,
      isBot ? styles.botMessageContainer : styles.userMessageContainer,
      style,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 20,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#000000', // Nero elegante per coerenza con Home20
    borderBottomRightRadius: 6,
  },
  botBubble: {
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400',
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    marginHorizontal: 12,
    fontFamily: 'System',
    fontWeight: '300',
  },
  userTime: {
    color: '#00000060',
  },
  botTime: {
    color: '#00000050',
  },
  modelType: {
    fontSize: 10,
    color: '#666666',
    marginTop: 6,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
});

export default MessageBubble;
