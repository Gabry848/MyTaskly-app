import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Task } from '../src/services/taskService';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {  // Determina il colore in base alla priorità (più sobrio e coerente)
  const priorityColors: Record<string, string> = {
    'Alta': '#000000',
    'Media': '#666666',
    'Bassa': '#999999',
    'default': '#cccccc'
  };
  
  const cardColor = task.priority ? 
    priorityColors[task.priority] || priorityColors.default : 
    priorityColors.default;
    
  return (
    <TouchableOpacity
      style={[styles.taskCard, { borderLeftColor: cardColor, borderLeftWidth: 5 }]}
      onPress={() => onPress && onPress(task)}
    >
      <View style={styles.taskCardContent}>
        <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
          {task.title}
        </Text>
        
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
          
          <View style={styles.taskStatus}>            <Text style={[
              styles.taskStatusText, 
              { color: task.status === 'Completato' ? '#000000' : '#666666' }
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  taskCardContent: {
    flexDirection: "column",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    color: "#000000",
    fontFamily: "System",
    letterSpacing: -0.3,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: "System",
    fontWeight: "300",
  },
  taskMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskCategory: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskCategoryText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "400",
    fontFamily: "System",
  },
  taskStatus: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: "400",
    fontFamily: "System",
  },
  taskTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskTimeText: {
    fontSize: 12,
    color: "#999999",
    marginLeft: 6,
    fontFamily: "System",
    fontWeight: "300",
  },
});

export default TaskCard;