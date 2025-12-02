import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import MessageBubble from './MessageBubble';

// Esempio di messaggi con diversi elementi Markdown
const MarkdownExample: React.FC = () => {
  const exampleMessages = [
    {
      id: '1',
      text: 'Ecco un esempio di messaggio con **testo in grassetto** e *corsivo*.',
      sender: 'bot' as const,
      start_time: new Date(),
    },
    {
      id: '2',
      text: `## 📅 Task per la data 2025-01-15

Ecco i tuoi task per oggi:

### Task Urgenti
- **Riunione team** alle \`10:30\`
- *Review codice* progetto ABC  
- Chiamare cliente ⭐ **Priorità Alta**

### Promemoria
> Non dimenticare di controllare le email prima della riunione

---
**📊 Totale task trovati:** \`3\``,
      sender: 'bot' as const,
      start_time: new Date(),
    },
    {
      id: '3',
      text: `### Codice di esempio

Ecco come utilizzare il servizio:

\`\`\`javascript
const response = await sendMessageToBot(
  "Mostrami i task di oggi",
  "advanced"
);
\`\`\`

Oppure per task specifici:
- Usa \`getTasks("Lavoro")\` per task di lavoro
- Usa \`getTasks("Personale")\` per task personali`,
      sender: 'bot' as const,
      start_time: new Date(),
    },
    {
      id: '4',
      text: 'Messaggio dell\'utente normale senza Markdown',
      sender: 'user' as const,
      start_time: new Date(),
    },
    {
      id: '5',
      text: `### 🎯 Riassunto della giornata

**Task completati:** 5/8  
**Prossimo task urgente:** [Riunione cliente](http://example.com)

---

#### Status task:
1. ✅ **Completato** - Review codice
2. ⏳ **In corso** - Documentazione API
3. 📋 **Da fare** - Test integrazione

> 💡 **Suggerimento**: Ricordati di fare una pausa ogni ora!`,
      sender: 'bot' as const,
      start_time: new Date(),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Esempio supporto Markdown nei messaggi del bot</Text>
      <View style={styles.messagesContainer}>
        {exampleMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    color: '#333',
  },
  messagesContainer: {
    paddingBottom: 20,
  },
});

export default MarkdownExample;
