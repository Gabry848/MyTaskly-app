import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Task } from '../src/services/taskService';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  showId?: boolean; // Opzione per mostrare o nascondere l'ID
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, showId = false }) => {
  // Determina il colore in base alla priorità
  const priorityColors: Record<string, string> = {
    'Alta': '#ff6b6b',
    'Media': '#feca57',
    'Bassa': '#1dd1a1',
    'default': '#54a0ff'
  };
  
  const cardColor = task.priority ? 
    priorityColors[task.priority] || priorityColors.default : 
    priorityColors.default;
    
  // Otteniamo l'ID del task
  const taskId = task.id || '';

  // Crea una versione abbreviata dell'ID se necessario
  const shortId = taskId.toString().substring(0, 8);
    
  return (
    <TouchableOpacity
      style={[styles.taskCard, { borderLeftColor: cardColor, borderLeftWidth: 5 }]}
      onPress={() => onPress && onPress(task)}
      // Aggiungiamo l'attributo data-id
      accessibilityLabel={`task-${taskId}`}
      testID={`task-${taskId}`}
    >
      <View style={styles.taskCardContent}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
            {task.title}
          </Text>
          
          {showId && taskId && (
            <Text style={styles.taskId}>#{shortId}</Text>
          )}
        </View>
        
        {task.description ? (
          <Text style={styles.taskDescription} numberOfLines={2} ellipsizeMode="tail">
            {task.description}
          </Text>
        ) : null}
        
        <View style={styles.taskMetadata}>
          {task.category_name ? (
            <View style={styles.taskCategory}>
              <Text style={styles.taskCategoryText}>
                {task.category_name}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.taskStatus}>
            <Text style={[
              styles.taskStatusText, 
              { color: task.status === 'Completato' ? '#1dd1a1' : '#ff6b6b' }
            ]}>
              {task.status}
            </Text>
          </View>
        </View>
        
        {task.start_time || task.end_time ? (
          <View style={styles.taskTimeInfo}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.taskTimeText}>
              {task.start_time ? dayjs(task.start_time).format('HH:mm') : '--:--'}
              {task.end_time ? ' - ' + dayjs(task.end_time).format('HH:mm') : ''}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  taskCardContent: {
    flexDirection: "column",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  taskId: {
    fontSize: 12,
    color: "#999",
    marginLeft: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  taskMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  taskCategory: {
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  taskCategoryText: {
    fontSize: 12,
    color: "#666",
  },
  taskStatus: {
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  taskStatusText: {
    fontSize: 12,
  },
  taskTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskTimeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
});

export default TaskCard;