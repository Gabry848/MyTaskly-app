import React from "react";
import { View, Pressable } from "react-native";
import { styles } from "./TaskStyles";
import { Checkbox, TaskTitle, DateDisplay, DaysRemaining } from "./BasicComponents";

// Componente per l'intestazione del task (checkbox, titolo, info)
const TaskHeader = ({ 
  task, 
  isCompleted,
  expanded,
  onCheckboxPress,
  onTaskPress,
  onPressIn,
  onPressOut,
  isOptimistic = false
}) => {
  return (
    <View style={styles.topRow}>
      {/* Checkbox */}
      <Checkbox 
        checked={isCompleted} 
        onPress={onCheckboxPress} 
        isOptimistic={isOptimistic}
      />

      {/* Task Info */}
      <Pressable 
        style={styles.taskInfo} 
        onPress={onTaskPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        delayLongPress={500}
      >        <TaskTitle 
          title={task.title} 
          completed={isCompleted}
          numberOfLines={expanded ? undefined : 1}
          priority={task.priority}
        />

        <View style={styles.infoRow}>
          <DateDisplay date={task.end_time} />
        </View>
      </Pressable>

      {/* Giorni rimanenti (spostato a destra) */}
      <View style={styles.daysRemainingContainer}>
        <DaysRemaining endDate={task.end_time} />
      </View>
    </View>
  );
};

export default TaskHeader;