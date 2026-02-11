import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolWidget } from '../types';

interface ErrorWidgetCardProps {
  widget: ToolWidget;
}

/**
 * Error card per tool widgets falliti in voice chat
 * Mostra messaggio di errore con icona rossa
 */
const ErrorWidgetCard: React.FC<ErrorWidgetCardProps> = React.memo(({ widget }) => {
  const errorMessage = widget.errorMessage || 'Errore durante l\'esecuzione';

  // Determina il messaggio specifico in base al tool
  let specificMessage = errorMessage;
  if (widget.toolName === 'show_tasks_to_user') {
    specificMessage = 'Impossibile recuperare le task';
  } else if (widget.toolName === 'show_categories_to_user') {
    specificMessage = 'Impossibile recuperare le categorie';
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={24} color="#FF3B30" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.errorTitle}>{specificMessage}</Text>
        {widget.errorMessage && widget.errorMessage !== specificMessage && (
          <Text style={styles.errorDetail}>{widget.errorMessage}</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E1E5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 2,
  },
  errorDetail: {
    fontSize: 12,
    color: '#CC0000',
  },
});

export default ErrorWidgetCard;
