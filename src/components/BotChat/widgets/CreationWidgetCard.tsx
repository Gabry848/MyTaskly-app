import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CreationWidgetCardProps } from '../types';
import { Ionicons } from '@expo/vector-icons';

/**
 * Widget inline per creazione task/categoria/nota
 * Stati: loading → success | error
 */
const CreationWidgetCard: React.FC<CreationWidgetCardProps> = ({ widget }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Determina il contenuto in base allo stato
  const renderContent = () => {
    if (widget.status === 'loading') {
      return (
        <View style={styles.contentRow}>
          <ActivityIndicator size="small" color="#007AFF" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Creazione in corso...</Text>
            <Text style={styles.subtitle}>
              {widget.toolName === 'add_task' && 'Sto creando il task'}
              {widget.toolName === 'add_category' && 'Sto creando la categoria'}
              {widget.toolName === 'add_note' && 'Sto creando la nota'}
            </Text>
          </View>
        </View>
      );
    }

    if (widget.status === 'error') {
      return (
        <View style={styles.contentRow}>
          <Ionicons name="alert-circle" size={24} color="#FF3B30" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.errorText]}>Errore</Text>
            <Text style={styles.subtitle}>{widget.errorMessage || 'Si è verificato un errore'}</Text>
          </View>
        </View>
      );
    }

    // Success state
    const output = widget.toolOutput;
    if (!output) return null;

    let title = '';
    let subtitle = '';
    let icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';

    if (output.type === 'task_created' && output.task) {
      title = output.task.title;
      subtitle = output.task.end_time
        ? new Date(output.task.end_time).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Nessuna scadenza';
      icon = 'checkmark-circle';
    } else if (output.type === 'category_created' && output.category) {
      title = output.category.name;
      subtitle = 'Categoria creata';
      icon = 'folder';
    } else if (output.type === 'note_created' && output.note) {
      title = output.note.title;
      subtitle = 'Nota creata';
      icon = 'document-text';
    }

    return (
      <TouchableOpacity activeOpacity={0.7} style={styles.contentRow}>
        <Ionicons name={icon} size={24} color="#34C759" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  // Colore bordo in base allo stato
  const borderColor =
    widget.status === 'loading' ? '#007AFF' :
    widget.status === 'error' ? '#FF3B30' :
    '#34C759';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderLeftColor: borderColor,
        }
      ]}
    >
      {renderContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: '85%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  errorText: {
    color: '#FF3B30',
  },
});

export default CreationWidgetCard;
