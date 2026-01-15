import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Alert } from 'react-native';
import { MessageBubbleProps, ToolWidget, TaskItem } from './types';
import TaskListBubble from './TaskListBubble'; // Nuovo componente card-based
import TaskTableBubble from './TaskTableBubble'; // Mantieni per backward compatibility
import Markdown from 'react-native-markdown-display'; // Supporto per Markdown
import WidgetBubble from './widgets/WidgetBubble';
import VisualizationModal from './widgets/VisualizationModal';
import ItemDetailModal from './widgets/ItemDetailModal';
import TaskEditModal from '../Task/TaskEditModal';
import EditCategoryModal from '../Category/EditCategoryModal';
import CategoryMenu from '../Category/CategoryMenu';
import { Task as TaskType } from '../../services/taskService';
import { updateTask, updateCategory, deleteCategory } from '../../services/taskService';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, style }) => {
  const isBot = message.sender === 'bot';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Stati per le modals
  const [visualizationModalVisible, setVisualizationModalVisible] = useState(false);
  const [selectedVisualizationWidget, setSelectedVisualizationWidget] = useState<ToolWidget | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'task' | 'category' | 'note'>('task');

  // Stato per task list modal (dalla TaskListBubble)
  const [taskListModalVisible, setTaskListModalVisible] = useState(false);
  const [taskListForModal, setTaskListForModal] = useState<TaskItem[]>([]);

  // Stato per task edit modal
  const [taskEditModalVisible, setTaskEditModalVisible] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<TaskType | null>(null);

  // Stato per category edit modal e menu
  const [categoryEditModalVisible, setCategoryEditModalVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Animazioni per i punti di streaming
  const streamingDot1 = useRef(new Animated.Value(0.5)).current;
  const streamingDot2 = useRef(new Animated.Value(0.5)).current;
  const streamingDot3 = useRef(new Animated.Value(0.5)).current;

  // Animazione di entrata per ogni nuovo messaggio
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Animazione per i punti di streaming
  useEffect(() => {
    if (message.isStreaming) {
      const createPulseAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.5,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = [
        createPulseAnimation(streamingDot1, 0),
        createPulseAnimation(streamingDot2, 200),
        createPulseAnimation(streamingDot3, 400),
      ];

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // Reset delle animazioni quando lo streaming finisce
      streamingDot1.setValue(0.5);
      streamingDot2.setValue(0.5);
      streamingDot3.setValue(0.5);
    }
  }, [message.isStreaming, streamingDot1, streamingDot2, streamingDot3]);
  
  // Formatta la data per la visualizzazione
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handler per "View All" dalla TaskListBubble
  const handleViewAllTasks = (tasks: TaskItem[]) => {
    // Converti TaskItem[] a formato compatibile con VisualizationModal
    const taskListItems = tasks.map(task => ({
      id: task.task_id,
      title: task.title,
      endTimeFormatted: task.end_time,
      end_time: task.end_time,
      category: task.category,
      category_name: task.category,
      categoryColor: '#007AFF',
      priority: task.priority,
      priorityEmoji: '',
      priorityColor: '#000000',
      status: task.status,
      completed: task.status === 'Completato',
    }));

    // Crea un widget fittizio per la modal
    const fakeWidget: ToolWidget = {
      id: 'task-list-view-all',
      toolName: 'show_tasks_to_user',
      status: 'success',
      itemIndex: 0,
      toolOutput: {
        type: 'task_list',
        tasks: taskListItems,
        summary: {
          total: tasks.length,
          pending: tasks.filter(t => t.status !== 'Completato').length,
          completed: tasks.filter(t => t.status === 'Completato').length,
        }
      }
    };

    setSelectedVisualizationWidget(fakeWidget);
    setVisualizationModalVisible(true);
  };

  // Controlla se il messaggio del bot contiene la struttura dei task specificata
  if (isBot && typeof message.text === 'string') {
    // Controlla se il messaggio contiene un JSON array di task o il messaggio "Nessun task trovato"
    if ((message.text.includes('[') && message.text.includes(']') &&
        (message.text.includes('📅 TASK PER LA DATA') || message.text.includes('task_id'))) ||
        message.text.includes('📅 Nessun task trovato') ||
        (message.text.includes('📅') && message.text.includes('TASK PER LA DATA'))) {
      return <TaskListBubble message={message.text} style={style} onViewAll={handleViewAllTasks} />;
    }
      // Controlla il formato JSON legacy
    try {
      const parsedData = JSON.parse(message.text);
      if (parsedData.mode === "view") {
        // Se ha una proprietà message, usa quella per il TaskListBubble
        if (parsedData.message) {
          return <TaskListBubble message={parsedData.message} style={style} onViewAll={handleViewAllTasks} />;
        }
        // Altrimenti, se ha tasks, converte al nuovo formato
        if (parsedData.tasks) {
          const legacyMessage = `Ecco i tuoi impegni:\n📅 TASK:\n${JSON.stringify(parsedData.tasks)}\n📊 Totale task trovati: ${parsedData.tasks.length}`;
          return <TaskListBubble message={legacyMessage} style={style} onViewAll={handleViewAllTasks} />;
        }
      }
    } catch {
      // Se non è un JSON valido, continua con il rendering normale
    }
  }

  // Se il messaggio del bot contiene attività (formato legacy), visualizza TaskListBubble
  if (isBot && message.tasks && message.tasks.length > 0) {
    const legacyMessage = `Ecco i tuoi impegni:\n📅 TASK:\n${JSON.stringify(message.tasks)}\n📊 Totale task trovati: ${message.tasks.length}`;
    return <TaskListBubble message={legacyMessage} style={style} onViewAll={handleViewAllTasks} />;
  }  // Altrimenti, visualizza il messaggio di testo normale
  
  // Funzione per renderizzare il contenuto del messaggio
  const renderMessageContent = () => {
    const textContent = message.text || '';

    if (isBot) {
      // Per i messaggi del bot, usa il rendering Markdown solo se contiene markdown
      const hasMarkdown = /[*_`#\[\]()]/g.test(textContent);

      if (hasMarkdown) {
        return (
          <View>
            <Markdown style={markdownStyles}>
              {textContent}
            </Markdown>
          </View>
        );
      } else {
        // Se non c'è markdown, usa Text direttamente per evitare problemi
        return (
          <Text style={[
            styles.messageText,
            styles.botText
          ]}>
            {textContent}
          </Text>
        );
      }
    } else {
      // Per i messaggi dell'utente, usa il testo normale
      return (
        <Text style={[
          styles.messageText,
          styles.userText
        ]}>
          {textContent}
        </Text>
      );
    }
  };

  // Handler per aprire la modal di visualizzazione
  const handleOpenVisualization = (widget: ToolWidget) => {
    setSelectedVisualizationWidget(widget);
    setVisualizationModalVisible(true);
  };

  // Handler per aprire la modal di dettaglio di un item
  const handleOpenItemDetail = (item: any, type: 'task' | 'category' | 'note') => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setDetailModalVisible(true);
  };

  // Handler per aprire la modal di modifica task
  const handleTaskPress = (task: TaskType) => {
    setSelectedTaskForEdit(task);
    setTaskEditModalVisible(true);
  };

  // Handler per salvare le modifiche al task
  const handleSaveTask = async (editedTask: Partial<TaskType>) => {
    if (!selectedTaskForEdit) return;

    try {
      await updateTask(selectedTaskForEdit.task_id, editedTask);
      setTaskEditModalVisible(false);
      setSelectedTaskForEdit(null);
      // Opzionalmente, puoi aggiornare il messaggio nella chat o mostrare una notifica
    } catch (error) {
      console.error('[MessageBubble] Error updating task:', error);
      // Opzionalmente, mostra un messaggio di errore all'utente
    }
  };

  // Handler per aprire il menu della categoria
  const handleCategoryPress = (category: any) => {
    console.log('[MessageBubble] handleCategoryPress called with:', category);
    setSelectedCategoryForEdit(category);
    setCategoryMenuVisible(true);
  };

  // Handler per chiudere il menu della categoria
  const handleCloseCategoryMenu = () => {
    setCategoryMenuVisible(false);
  };

  // Handler per aprire la modal di modifica dalla voce menu
  const handleEditCategory = () => {
    console.log('[MessageBubble] handleEditCategory - selectedCategoryForEdit:', selectedCategoryForEdit);
    console.log('[MessageBubble] handleEditCategory - name:', selectedCategoryForEdit?.name);
    console.log('[MessageBubble] handleEditCategory - description:', selectedCategoryForEdit?.description);
    setCategoryMenuVisible(false);
    setEditCategoryName(selectedCategoryForEdit?.name || '');
    setEditCategoryDescription(selectedCategoryForEdit?.description || '');
    setCategoryEditModalVisible(true);
  };

  // Handler per salvare le modifiche alla categoria
  const handleSaveCategory = async () => {
    if (!selectedCategoryForEdit) return;

    if (editCategoryName.trim() === '') {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto');
      return;
    }

    setIsEditingCategory(true);
    try {
      await updateCategory(selectedCategoryForEdit.name, {
        name: editCategoryName.trim(),
        description: editCategoryDescription.trim()
      });

      Alert.alert('Successo', 'Categoria aggiornata con successo');
      setCategoryEditModalVisible(false);
      setSelectedCategoryForEdit(null);
    } catch (error) {
      console.error('[MessageBubble] Error updating category:', error);
      Alert.alert('Errore', 'Impossibile aggiornare la categoria. Riprova più tardi.');
    } finally {
      setIsEditingCategory(false);
    }
  };

  // Handler per chiudere la modal di modifica categoria
  const handleCancelCategoryEdit = () => {
    setCategoryEditModalVisible(false);
    setEditCategoryName('');
    setEditCategoryDescription('');
  };

  // Handler per eliminare una categoria
  const handleDeleteCategory = async () => {
    if (!selectedCategoryForEdit) return;

    Alert.alert(
      'Conferma eliminazione',
      `Sei sicuro di voler eliminare la categoria "${selectedCategoryForEdit.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingCategory(true);
            try {
              await deleteCategory(selectedCategoryForEdit.name);
              Alert.alert('Successo', 'Categoria eliminata con successo');
              setCategoryMenuVisible(false);
              setSelectedCategoryForEdit(null);
            } catch (error) {
              console.error('[MessageBubble] Error deleting category:', error);
              Alert.alert('Errore', 'Impossibile eliminare la categoria. Riprova più tardi.');
            } finally {
              setIsDeletingCategory(false);
            }
          },
        },
      ]
    );
  };

  // Handler placeholder per condivisione categoria
  const handleShareCategory = () => {
    setCategoryMenuVisible(false);
    Alert.alert('Info', 'Funzionalità di condivisione non ancora disponibile nella chat');
  };

  return (
    <Animated.View style={[
      styles.messageContainer,
      isBot ? styles.botMessageContainer : styles.userMessageContainer,
      style,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      {/* WIDGETS SOPRA AL MESSAGGIO (come richiesto dall'utente) */}
      {isBot && message.toolWidgets && message.toolWidgets.length > 0 && (
        <View style={styles.widgetsContainer}>
          {message.toolWidgets.map((widget) => (
            <WidgetBubble
              key={widget.id}
              widget={widget}
              onOpenVisualization={handleOpenVisualization}
              onOpenItemDetail={handleOpenItemDetail}
              onTaskPress={handleTaskPress}
              onCategoryPress={handleCategoryPress}
            />
          ))}
        </View>
      )}

      {/* BUBBLE DEL MESSAGGIO */}
      <View style={[
        styles.messageBubble,
        isBot ? styles.botBubble : styles.userBubble
      ]}>
        {renderMessageContent()}
        {message.isStreaming && isBot && (
          <View style={styles.streamingIndicator}>
            <Animated.View style={[styles.streamingDot, { opacity: streamingDot1 }]} />
            <Animated.View style={[styles.streamingDot, { opacity: streamingDot2 }]} />
            <Animated.View style={[styles.streamingDot, { opacity: streamingDot3 }]} />
          </View>
        )}
        {message.modelType && isBot && !message.isStreaming && (
          <Text style={styles.modelType}>
            {message.modelType === 'advanced' ? 'Modello avanzato' : 'Modello base'}
          </Text>
        )}
      </View>

      <Text style={[
        styles.messageTime,
        isBot ? styles.botTime : styles.userTime
      ]}>
        {formatTime(message.start_time)}
      </Text>

      {/* MODALS */}
      {selectedVisualizationWidget && (
        <VisualizationModal
          visible={visualizationModalVisible}
          widget={selectedVisualizationWidget}
          onClose={() => setVisualizationModalVisible(false)}
          onItemPress={handleOpenItemDetail}
          onCategoryPress={handleCategoryPress}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          visible={detailModalVisible}
          item={selectedItem}
          itemType={selectedItemType}
          onClose={() => setDetailModalVisible(false)}
        />
      )}

      {selectedTaskForEdit && (
        <TaskEditModal
          visible={taskEditModalVisible}
          task={selectedTaskForEdit}
          onClose={() => {
            setTaskEditModalVisible(false);
            setSelectedTaskForEdit(null);
          }}
          onSave={handleSaveTask}
        />
      )}

      {/* Category Menu */}
      {selectedCategoryForEdit && (
        <CategoryMenu
          visible={categoryMenuVisible}
          onClose={handleCloseCategoryMenu}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          onShare={handleShareCategory}
          isDeleting={isDeletingCategory}
          isOwned={selectedCategoryForEdit.isOwned !== undefined ? selectedCategoryForEdit.isOwned : true}
          permissionLevel={selectedCategoryForEdit.permissionLevel || "READ_WRITE"}
        />
      )}

      {/* Category Edit Modal */}
      {selectedCategoryForEdit && (
        <EditCategoryModal
          visible={categoryEditModalVisible}
          onClose={handleCancelCategoryEdit}
          onSave={handleSaveCategory}
          title={editCategoryName}
          description={editCategoryDescription}
          onTitleChange={setEditCategoryName}
          onDescriptionChange={setEditCategoryDescription}
          isEditing={isEditingCategory}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 20,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  widgetsContainer: {
    marginBottom: 8,
    width: '100%',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#000000', // Nero elegante per coerenza con Home20
    borderBottomRightRadius: 6,
  },
  botBubble: {
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400',
  },  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1a1a1a', // Colore più intenso per il testo del bot
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    marginHorizontal: 12,
    fontFamily: 'System',
    fontWeight: '300',
  },
  userTime: {
    color: '#00000060',
  },
  botTime: {
    color: '#00000050',
  },
  modelType: {
    fontSize: 10,
    color: '#666666',
    marginTop: 6,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'flex-start',
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
    marginHorizontal: 2,
  },
});

// Stili personalizzati per il rendering Markdown
const markdownStyles = {
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400' as const,
    color: '#1a1a1a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400' as const,
    color: '#1a1a1a',
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginTop: 10,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: '#000000',
  },
  em: {
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#d63384',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  blockquote: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    fontStyle: 'italic' as const,
  },
  list_item: {
    flexDirection: 'row' as const,
    marginVertical: 2,
  },
  bullet_list_icon: {
    color: '#6c757d',
    marginRight: 8,
    fontWeight: 'bold' as const,
  },
  ordered_list_icon: {
    color: '#6c757d',
    marginRight: 8,
    fontWeight: 'bold' as const,
  },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline' as const,
  },
  hr: {
    backgroundColor: '#e9ecef',
    height: 1,
    marginVertical: 16,
  },
};

export default MessageBubble;
