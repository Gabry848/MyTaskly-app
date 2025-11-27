import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Task } from '../../services/taskService';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  
  // Funzione per sanitizzare le stringhe
  const sanitizeString = (value: any): string => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  };

  const formatTaskTime = (startTime?: string, endTime?: string): string => {
    if (!startTime && !endTime) {
      return 'Nessuna scadenza';
    }

    const now = dayjs();
    const taskDate = dayjs(startTime || endTime);

    let datePrefix = '';
    if (taskDate.isSame(now, 'day')) {
      datePrefix = 'Oggi ';
    } else if (taskDate.isSame(now.add(1, 'day'), 'day')) {
      datePrefix = 'Domani ';
    } else {
      datePrefix = taskDate.format('DD/MM ');
    }

    const timeRange = startTime ? dayjs(startTime).format('HH:mm') : '--:--';
    const endTimeFormatted = endTime ? ' - ' + dayjs(endTime).format('HH:mm') : '';

    return datePrefix + timeRange + endTimeFormatted;
  };

  // Determina il colore in base alla priorità (gradiente di scurezza)
  const priorityColors: Record<string, string> = {
    'Alta': '#000000',     // Nero per alta priorità
    'Media': '#333333',    // Grigio scuro per media priorità
    'Bassa': '#666666',    // Grigio medio per bassa priorità
    'default': '#999999'   // Grigio chiaro per default
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
          {sanitizeString(task.title)}
        </Text>
        
        {(() => {
          const description = sanitizeString(task.description);
          return description && description !== 'null' && description !== '' ? (
            <Text style={styles.taskDescription} numberOfLines={2} ellipsizeMode="tail">
              {description}
            </Text>
          ) : null;
        })()}
        
        <View style={styles.taskMetadata}>
          {(() => {
            const categoryName = sanitizeString(task.category_name);
            return categoryName && categoryName !== 'null' && categoryName !== '' ? (
              <View style={styles.taskCategory}>
                <Text style={styles.taskCategoryText}>
                  {categoryName}
                </Text>
              </View>
            ) : null;
          })()}
          
          <View style={styles.taskStatus}>
            <Text style={[
              styles.taskStatusText, 
              { color: task.status === 'Completato' ? '#000000' : '#666666' }
            ]}>
              {sanitizeString(task.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.taskTimeInfo}>
          {task.start_time || task.end_time ? (
            <Ionicons name="time-outline" size={14} color="#666" />
          ) : (
            <Ionicons name="calendar-clear-outline" size={14} color="#999" />
          )}
          <Text style={[
            styles.taskTimeText,
            { color: task.start_time || task.end_time ? '#666' : '#999' }
          ]}>
            {formatTaskTime(task.start_time, task.end_time)}
          </Text>
        </View>
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