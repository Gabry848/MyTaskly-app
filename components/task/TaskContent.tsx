import React from "react";
import { Text, Animated } from "react-native";
import { styles } from "./TaskStyles";

// Componente per il contenuto espandibile del task (descrizione)
const TaskContent = ({ 
  description, 
  expanded, 
  fadeAnim, 
  slideAnim,
  onLayout,
  descriptionRef 
}) => {
  if (!expanded) return null;
  
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
  
  const cleanDescription = sanitizeString(description);
  
  return (
    <Animated.View
      ref={descriptionRef}
      onLayout={onLayout}
      style={[
        styles.descriptionContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.description}>
        {cleanDescription && cleanDescription !== 'null' && cleanDescription !== '' ? cleanDescription : "Nessuna descrizione disponibile."}
      </Text>
    </Animated.View>
  );
};

export default TaskContent;