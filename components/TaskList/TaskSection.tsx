import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Assicurati di avere questa dipendenza
import { styles } from './styles';
import { Task as TaskType } from './types';

interface TaskSectionProps {
  title: string;
  isExpanded: boolean;
  tasks: TaskType[];
  animatedHeight: Animated.Value;
  onToggle: () => void;
  renderTask: (item: TaskType, index: number) => JSX.Element;
  emptyMessage?: string;
}

export const TaskSection = ({
  title,
  isExpanded,
  tasks,
  animatedHeight,
  onToggle,
  renderTask,
  emptyMessage = "Non ci sono task in questa sezione"
}: TaskSectionProps) => {
  return (
    <>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={onToggle}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialIcons
          name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={24}
          color="#10e0e0"
        />
      </TouchableOpacity>
      
      <Animated.View 
        style={{ 
          height: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 'auto']
          }),
          overflow: 'hidden',
          opacity: animatedHeight // Animazione dell'opacità in base all'altezza
        }}
      >
        {isExpanded && tasks.length > 0 ? (
          tasks.map((item, index) => renderTask(item, index))
        ) : isExpanded ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>{emptyMessage}</Text>
          </View>
        ) : null}
      </Animated.View>
    </>
  );
};
