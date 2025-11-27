import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { MessageBubbleProps } from './types';
import TaskTableBubble from './TaskTableBubble'; // Importa il nuovo componente
import Markdown from 'react-native-markdown-display'; // Supporto per Markdown

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, style }) => {
  const isBot = message.sender === 'bot';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Animazioni per i punti di streaming
  const streamingDot1 = useRef(new Animated.Value(0.5)).current;
  const streamingDot2 = useRef(new Animated.Value(0.5)).current;
  const streamingDot3 = useRef(new Animated.Value(0.5)).current;

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
  }, [fadeAnim, slideAnim]);

  // Animazione per i punti di streaming
  useEffect(() => {
    if (message.isStreaming) {
      const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.5,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = [
        createPulseAnimation(streamingDot1, 0),
        createPulseAnimation(streamingDot2, 200),
        createPulseAnimation(streamingDot3, 400),
      ];

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // Reset delle animazioni quando lo streaming finisce
      streamingDot1.setValue(0.5);
      streamingDot2.setValue(0.5);
      streamingDot3.setValue(0.5);
    }
  }, [message.isStreaming, streamingDot1, streamingDot2, streamingDot3]);
  
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
    } catch {
      // Se non è un JSON valido, continua con il rendering normale
    }
  }

  // Se il messaggio del bot contiene attività (formato legacy), visualizza TaskTableBubble
  if (isBot && message.tasks && message.tasks.length > 0) {
    const legacyMessage = `Ecco i tuoi impegni:\n📅 TASK:\n${JSON.stringify(message.tasks)}\n📊 Totale task trovati: ${message.tasks.length}`;
    return <TaskTableBubble message={legacyMessage} style={style} />;
  }  // Altrimenti, visualizza il messaggio di testo normale
  
  // Funzione per renderizzare il contenuto del messaggio
  const renderMessageContent = () => {
    if (isBot) {
      // Per i messaggi del bot, usa il rendering Markdown
      // Assicura che il testo non sia vuoto o null
      const textContent = message.text || '';
      return (
        <View>
          <Markdown style={markdownStyles}>
            {textContent}
          </Markdown>
        </View>
      );
    } else {
      // Per i messaggi dell'utente, usa il testo normale
      return (
        <Text style={[
          styles.messageText,
          styles.userText
        ]}>
          {message.text}
        </Text>
      );
    }
  };

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
        {renderMessageContent()}
        {message.isStreaming && isBot && (
          <View style={styles.streamingIndicator}>
            <Animated.View style={[styles.streamingDot, { opacity: streamingDot1 }]} />
            <Animated.View style={[styles.streamingDot, { opacity: streamingDot2 }]} />
            <Animated.View style={[styles.streamingDot, { opacity: streamingDot3 }]} />
          </View>
        )}
        {message.modelType && isBot && !message.isStreaming && (
          <Text style={styles.modelType}>
            {message.modelType === 'advanced' ? 'Modello avanzato' : 'Modello base'}
          </Text>
        )}
      </View>
      <Text style={[
        styles.messageTime,
        isBot ? styles.botTime : styles.userTime
      ]}>
        {formatTime(message.start_time)}
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
  },  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1a1a1a', // Colore più intenso per il testo del bot
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
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'flex-start',
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
    marginHorizontal: 2,
  },
});

// Stili personalizzati per il rendering Markdown
const markdownStyles = {
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400' as const,
    color: '#1a1a1a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400' as const,
    color: '#1a1a1a',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginTop: 10,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: '#000000',
  },
  em: {
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#d63384',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  blockquote: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic' as const,
  },
  list_item: {
    flexDirection: 'row' as const,
    marginVertical: 2,
  },
  bullet_list_icon: {
    color: '#6c757d',
    marginRight: 8,
    fontWeight: 'bold' as const,
  },
  ordered_list_icon: {
    color: '#6c757d',
    marginRight: 8,
    fontWeight: 'bold' as const,
  },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline' as const,
  },
  hr: {
    backgroundColor: '#e9ecef',
    height: 1,
    marginVertical: 16,
  },
};

export default MessageBubble;
