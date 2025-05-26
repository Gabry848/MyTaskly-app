import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TaskTableBubbleProps, TaskItem } from './types';

const TaskTableBubble: React.FC<TaskTableBubbleProps> = ({ message, style }) => {  // Funzione per estrarre il JSON dal messaggio
  const extractTasksFromMessage = (text: string): TaskItem[] => {
    try {
      // Trova l'inizio e la fine del JSON array
      const jsonStartIndex = text.indexOf('[');
      const jsonEndIndex = text.lastIndexOf(']') + 1;
      
      if (jsonStartIndex === -1 || jsonEndIndex === 0) {
        return [];
      }
      
      // Estrae la stringa JSON
      let jsonString = text.substring(jsonStartIndex, jsonEndIndex);
      
      // Pulisce la stringa JSON rimuovendo i caratteri di escape
      // Rimuove i backslash escape per le virgolette
      jsonString = jsonString.replace(/\\"/g, '"');
      // Rimuove i backslash escape per i newline
      jsonString = jsonString.replace(/\\n/g, '\n');
      // Rimuove i backslash escape per i tab
      jsonString = jsonString.replace(/\\t/g, '\t');
      // Rimuove i backslash escape per i backslash
      jsonString = jsonString.replace(/\\\\/g, '\\');
      
      console.log('JSON string dopo pulizia:', jsonString);
      
      // Parse del JSON
      const tasks = JSON.parse(jsonString);
      
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('Errore nell\'estrazione dei task dal messaggio:', error);
      console.error('JSON string problematico:', text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
      
      // Tentativo alternativo: prova a fare un doppio parse se sembra essere una stringa JSON escaped
      try {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        let rawJsonString = text.substring(jsonStart, jsonEnd);
        
        // Se contiene ancora escape, prova JSON.parse doppio
        if (rawJsonString.includes('\\"')) {
          const parsed = JSON.parse('"' + rawJsonString + '"'); // Wrappa in stringhe per fare l'unescape
          const tasks = JSON.parse(parsed);
          return Array.isArray(tasks) ? tasks : [];
        }
      } catch (secondError) {
        console.error('Anche il tentativo alternativo è fallito:', secondError);
      }
      
      return [];
    }
  };

  const tasks = extractTasksFromMessage(message);

  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Elenco Impegni</Text>
      <ScrollView horizontal>
        <View>
          {/* Intestazione Tabella */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, styles.status]}>Stato</Text>
            <Text style={[styles.tableHeader, styles.priority]}>Priorità</Text>
            <Text style={[styles.tableHeader, styles.category]}>Categoria</Text>
            <Text style={[styles.tableHeader, styles.endTime]}>Fine</Text>
            <Text style={[styles.tableHeader, styles.taskTitle]}>Titolo</Text>
          </View>
          {/* Righe Tabella */}
          {tasks.map((task) => (
            <View key={task.task_id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.status]}>{task.status}</Text>
              <Text style={[styles.tableCell, styles.priority]}>{task.priority}</Text>
              <Text style={[styles.tableCell, styles.category]}>{task.category}</Text>
              <Text style={[styles.tableCell, styles.endTime]}>{new Date(task.end_time).toLocaleDateString()}</Text>
              <Text style={[styles.tableCell, styles.taskTitle]}>{task.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    borderColor: '#E8E8E8',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingVertical: 8,
  },
  tableHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555555',
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 14,
    color: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  status: {
    width: 100,
  },
  priority: {
    width: 80,
  },
  category: {
    width: 120,
  },
  endTime: {
    width: 100,
  },
  taskTitle: {
    flex: 1,
    minWidth: 150,
  },
});

export default TaskTableBubble;
