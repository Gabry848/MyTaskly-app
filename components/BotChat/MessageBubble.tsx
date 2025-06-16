import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MessageBubbleProps } from './types';
import TaskTableBubble from './TaskTableBubble'; // Importa il nuovo componente

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, style }) => {
  const isBot = message.sender === 'bot';
  
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
  }
  // Altrimenti, visualizza il messaggio di testo normale
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
    paddingHorizontal: 15,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
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
  },  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 8,
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
