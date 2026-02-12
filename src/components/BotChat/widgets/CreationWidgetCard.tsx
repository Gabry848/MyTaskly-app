import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CreationWidgetCardProps } from '../types';
import { Ionicons } from '@expo/vector-icons';

/**
 * Widget inline per creazione task/categoria/nota
 * Stati: loading → success | error
 */
const CreationWidgetCard: React.FC<CreationWidgetCardProps> = ({ widget, onPress }) => {
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
          <ActivityIndicator size="small" color="#000000" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Creazione in corso...</Text>
            <Text style={styles.subtitle}>
              {widget.toolName === 'add_task' && 'Sto creando il task'}
              {widget.toolName === 'create_category' && 'Sto creando la categoria'}
              {widget.toolName === 'create_note' && 'Sto creando la nota'}
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

    // Helper: converte nome tool in titolo leggibile (es: "add_task" → "Add Task")
    const formatToolName = (name: string) =>
      name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (!output) {
      // Nessun output ma success → mostra almeno il nome del tool
      return (
        <View style={styles.contentRow}>
          <Ionicons name="checkmark-circle" size={24} color="#000000" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{formatToolName(widget.toolName)}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Completato</Text>
          </View>
        </View>
      );
    }

    let title = '';
    let subtitle = '';
    let icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';

    // Parse toolArgs per ottenere i dati originali della richiesta
    let toolArgsData: any = {};
    if (widget.toolArgs) {
      try {
        toolArgsData = JSON.parse(widget.toolArgs);
      } catch (e) {
        console.error('[CreationWidgetCard] Error parsing toolArgs:', e);
      }
    }

    if (output.type === 'task_created') {
      // Usa il titolo dai toolArgs (dati originali della richiesta)
      title = toolArgsData.title || 'Task creato';

      // Usa la categoria o end_time per il subtitle
      if (output.category_used) {
        subtitle = `Categoria: ${output.category_used}`;
      } else if (toolArgsData.end_time) {
        subtitle = new Date(toolArgsData.end_time).toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        subtitle = 'Nessuna scadenza';
      }
      icon = 'checkmark-circle';
    } else if (output.type === 'category_created') {
      // Per categoria, usa il nome dai toolArgs o dall'output
      title = output.category?.name || toolArgsData.name || 'Categoria creata';
      subtitle = 'Categoria creata';
      icon = 'folder';
    } else if (output.type === 'note_created') {
      // Per nota, usa il titolo dai toolArgs o dall'output
      title = output.note?.title || toolArgsData.title || 'Nota creata';
      subtitle = 'Nota creata';
      icon = 'document-text';
    } else {
      // Tipo sconosciuto → mostra almeno il nome del tool e il messaggio se presente
      title = output.message || formatToolName(widget.toolName);
      subtitle = output.type
        ? output.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Completato';
      icon = 'checkmark-circle';
    }

    // Per tipi sconosciuti non mostrare la freccia né il TouchableOpacity
    const isKnownType = output.type && ['task_created', 'category_created', 'note_created'].includes(output.type);

    if (!isKnownType) {
      return (
        <View style={styles.contentRow}>
          <Ionicons name={icon} size={24} color="#000000" style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.contentRow}
        onPress={onPress}
      >
        <Ionicons name={icon} size={24} color="#000000" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999999" />
      </TouchableOpacity>
    );
  };

  // Colore bordo in base allo stato
  const borderColor =
    widget.status === 'loading' ? '#666666' :
    widget.status === 'error' ? '#FF3B30' :
    '#000000';

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
    borderRadius: 16,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E1E5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'System',
    fontWeight: '300',
  },
  errorText: {
    color: '#FF3B30',
  },
});

export default CreationWidgetCard;
