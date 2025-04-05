import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  ViewStyle,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Menu, MenuItem } from "react-native-material-menu";
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get("window");

// Componenti piccoli e riutilizzabili
const Checkbox = ({ checked, onPress }) => (
  <TouchableOpacity
    style={[styles.checkbox, checked && styles.checkedBox]}
    onPress={onPress}
  >
    {checked && <MaterialIcons name="check" size={16} color="#fff" />}
  </TouchableOpacity>
);

const DateDisplay = ({ date }) => {
  const formattedDate = new Date(date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  
  return (
    <View style={styles.dateContainer}>
      <Ionicons name="calendar-outline" size={14} color="#666666" />
      <Text style={styles.dateText}>{formattedDate}</Text>
    </View>
  );
};

const DaysRemaining = ({ endDate }) => {
  const daysRemainingText = getDaysRemainingText(endDate);
  const daysRemainingColor = getDaysRemainingColor(endDate);
  
  return (
    <Text style={[styles.daysRemaining, { color: daysRemainingColor }]}>
      {daysRemainingText}
    </Text>
  );
};

const TaskTitle = ({ title, completed, numberOfLines }) => (
  <Text
    style={[styles.title, completed && styles.completedText]}
    numberOfLines={numberOfLines}
  >
    {title}
  </Text>
);

// Funzioni di utility
const getDaysRemainingText = (endDate) => {
  const today = new Date();
  const dueDate = new Date(endDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Scaduto";
  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  return `${diffDays} giorni`;
};

const getDaysRemainingColor = (endDate) => {
  const today = new Date();
  const dueDate = new Date(endDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "#ff4444";
  if (diffDays <= 2) return "#ff8800";
  return "#007AFF";
};

// Colori di priorità per lo sfondo della card
const getPriorityColors = (priority) => {
  switch (priority) {
    case "Alta":
      return "#FFF1F0"; // Sfondo rosso chiaro
    case "Media":
      return "#FFF8E6"; // Sfondo giallo chiaro
    case "Bassa":
    default:
      return "#F0FAFA"; // Sfondo verde chiaro
  }
};

// Componente principale
const Task = ({
  task = {
    id: 1,
    title: "Complete Project Proposal",
    description: "Finish the draft and send it to the client for review",
    priority: "Bassa",
    end_time: "2025-03-25",
    completed: false,
  },
  onTaskComplete,
  onTaskDelete,
  onTaskEdit,
}) => {
  // Stati
  const [menuVisible, setMenuVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);
  const longPressTimeoutRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Nuovo stato per il modal di modifica
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: "",
    description: "",
    end_time: "",
    priority: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');
  
  // Animazioni
  const deleteAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(100)).current;
  const marginVerticalAnim = useRef(new Animated.Value(8)).current;

  // Gestore animazione migliorato
  const toggleExpand = () => {
    // Previeni click multipli durante l'animazione
    if (animationInProgress.current) return;
    
    animationInProgress.current = true;
    const toValue = expanded ? 0 : 1;

    Animated.spring(expandAnim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start(() => {
      // Aggiorna lo stato solo dopo il completamento dell'animazione
      setExpanded(!expanded);
      animationInProgress.current = false;
    });
  };

  // Gestori pressione lunga
  const handlePressIn = () => {
    longPressTimeoutRef.current = setTimeout(() => {
      setShowModal(true);
    }, 500); // 500ms per considerare pressione lunga
  };

  const handlePressOut = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Assicura che il timeout venga rimosso quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Gestori azioni
  const handleComplete = () => {
    if (onTaskComplete) {
      onTaskComplete(task.id);
    } else {
      Alert.alert("Completato", `Task "${task.title}" completato`);
    }
  };

  // Nuovo gestore per l'apertura del modal di modifica
  const openEditModal = () => {
    // Inizializza i campi del form con i valori attuali del task
    setEditedTask({
      title: task.title,
      description: task.description || "",
      end_time: task.end_time,
      priority: task.priority,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (selectedDate) {
      // Estrai la data attuale dall'end_time
      const currentDate = editedTask.end_time 
        ? new Date(editedTask.end_time) 
        : new Date();
      
      if (pickerMode === 'date') {
        // Mantieni l'orario esistente, aggiorna solo la data
        currentDate.setFullYear(selectedDate.getFullYear());
        currentDate.setMonth(selectedDate.getMonth());
        currentDate.setDate(selectedDate.getDate());
      } else {
        // Mantieni la data esistente, aggiorna solo l'orario
        currentDate.setHours(selectedDate.getHours());
        currentDate.setMinutes(selectedDate.getMinutes());
      }
      
      // Aggiorna lo stato con la nuova data e ora combinate
      setEditedTask({
        ...editedTask,
        end_time: currentDate.toISOString()
      });
    }
  };

  const openDatePicker = () => {
    setPickerMode('date');
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPickerMode('time');
    setShowTimePicker(true);
  };

  const handlePrioritySelect = (priority) => {
    setEditedTask({
      ...editedTask,
      priority
    });
  };

  const handleSaveEdit = () => {
    // Verifica che i campi obbligatori siano compilati
    if (!editedTask.title.trim()) {
      Alert.alert("Errore", "Il titolo è obbligatorio");
      return;
    }
    
    // Chiama la funzione di callback per salvare le modifiche
    if (onTaskEdit) {
      const updatedTask = {
        ...task,
        title: editedTask.title,
        description: editedTask.description,
        end_time: editedTask.end_time,
        priority: editedTask.priority,
      };
      
      onTaskEdit(task.id, updatedTask);
      closeEditModal();
    } else {
      Alert.alert("Modifica", `Modifiche salvate per "${editedTask.title}"`);
      closeEditModal();
    }
  };

  const handleEdit = () => {
    closeModal();
    openEditModal();
  };

  // Animazione di eliminazione task
  const animateTaskRemoval = () => {
    setIsRemoving(true);
    
    // Prima esegui le animazioni native (transform e opacity)
    Animated.sequence([
      // Prima scuoti leggermente la card (opzionale)
      Animated.sequence([
        Animated.timing(translateXAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      
      // Poi fai scorrere la card fuori dallo schermo
      Animated.timing(translateXAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }),
      
      // Effetto di fade out
      Animated.timing(deleteAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Dopo che le animazioni native sono completate
      // esegui le animazioni JavaScript (height e margin)
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // Must be false for height
        }),
        Animated.timing(marginVerticalAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // Must be false for margin
        }),
      ]).start(() => {
        // Chiamare la funzione di eliminazione dopo l'animazione
        if (onTaskDelete) {
          console.log("Eliminazione dell'impegno con ID:", task.id);
          onTaskDelete(task.id);
        }
      });
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    Alert.alert(
      "Elimina Task",
      `Sei sicuro di voler eliminare "${task.title}"?`,
      [
        { 
          text: "Annulla", 
          style: "cancel",
          onPress: () => {
            setIsDeleting(false);
            closeModal();
          } 
        },
        { 
          text: "Elimina", 
          style: "destructive", 
          onPress: () => {
            closeModal();
            // Inizia l'animazione di eliminazione
            animateTaskRemoval();
            setIsDeleting(false);
          } 
        },
      ]
    );
  };

  const handleShare = () => {
    closeModal();
    Alert.alert("Condivisione", "Funzionalità di condivisione non ancora implementata");
  };

  // Stili animati
  const descriptionHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80], // Aumentato per più spazio della descrizione
  });

  // Ottieni il colore di priorità per lo sfondo
  const priorityBackgroundColor = getPriorityColors(task.priority);
  
  // Applica il colore di sfondo appropriato in base allo stato del task
  const backgroundColor = task.completed ? "#F5F5F5" : priorityBackgroundColor;

  return (
    <Animated.View style={[
      { height: heightAnim, marginVertical: marginVerticalAnim }
    ]}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor },
          {
            opacity: deleteAnim,
            transform: [
              { translateX: translateXAnim },
              { scale: deleteAnim }
            ],
          }
        ]}
      >
        <View style={styles.topRow}>
          {/* Checkbox */}
          <Checkbox checked={task.completed} onPress={handleComplete} />

          {/* Task Info */}
          <Pressable 
            style={styles.taskInfo} 
            onPress={toggleExpand}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={500}
          >
            <TaskTitle 
              title={task.title} 
              completed={task.completed} 
              numberOfLines={expanded ? undefined : 1} 
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

        {/* Expandable description */}
        <Animated.View style={{ height: descriptionHeight, overflow: "hidden" }}>
          <Text style={styles.description} numberOfLines={expanded ? 4 : 0}>
            {task.description}
          </Text>
        </Animated.View>

        {/* Expansion indicator */}
        <TouchableOpacity 
          style={styles.expandButton} 
          onPress={toggleExpand}
          disabled={animationInProgress.current}
        >
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {/* Modal menu */}
        <Modal
          transparent={true}
          visible={showModal}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={closeModal}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={handleEdit}
              >
                <MaterialIcons name="edit" size={20} color="#333" />
                <Text style={styles.menuText}>Modifica</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={handleDelete}
                disabled={isDeleting}
              >
                <MaterialIcons name="delete" size={20} color="#F44336" />
                <Text style={[styles.menuText, { color: '#F44336' }]}>
                  {isDeleting ? "Eliminazione..." : "Elimina"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={handleShare}
              >
                <MaterialIcons name="share" size={20} color="#333" />
                <Text style={styles.menuText}>Condividi</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal di modifica */}
        <Modal
          transparent={true}
          visible={showEditModal}
          animationType="slide"
          onRequestClose={closeEditModal}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContainer}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Modifica Task</Text>
                <TouchableOpacity onPress={closeEditModal}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.editModalContent}>
                <Text style={styles.inputLabel}>Titolo *</Text>
                <TextInput
                  style={styles.input}
                  value={editedTask.title}
                  onChangeText={(text) => setEditedTask({...editedTask, title: text})}
                  placeholder="Titolo del task"
                />
                
                <Text style={styles.inputLabel}>Descrizione</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedTask.description}
                  onChangeText={(text) => setEditedTask({...editedTask, description: text})}
                  placeholder="Descrizione del task"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                
                <Text style={styles.inputLabel}>Data e ora di scadenza</Text>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity 
                    style={[styles.datePickerButton, styles.dateButton]}
                    onPress={openDatePicker}
                  >
                    <Text style={styles.datePickerText}>
                      {editedTask.end_time 
                        ? new Date(editedTask.end_time).toLocaleDateString('it-IT') 
                        : 'Seleziona data'
                      }
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.datePickerButton, styles.timeButton]}
                    onPress={openTimePicker}
                  >
                    <Text style={styles.datePickerText}>
                      {editedTask.end_time 
                        ? new Date(editedTask.end_time).toLocaleTimeString('it-IT', {
                            hour: '2-digit', 
                            minute: '2-digit'
                          }) 
                        : 'Seleziona ora'
                      }
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={editedTask.end_time ? new Date(editedTask.end_time) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
                
                {showTimePicker && (
                  <DateTimePicker
                    value={editedTask.end_time ? new Date(editedTask.end_time) : new Date()}
                    mode="time"
                    display="default"
                    onChange={handleDateChange}
                    is24Hour={true}
                  />
                )}
                
                <Text style={styles.inputLabel}>Priorità</Text>
                <View style={styles.priorityContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.priorityButton, 
                      styles.priorityButtonLow,
                      editedTask.priority === "Bassa" && styles.priorityButtonActive
                    ]}
                    onPress={() => handlePrioritySelect("Bassa")}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      editedTask.priority === "Bassa" && styles.priorityButtonTextActive
                    ]}>Bassa</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.priorityButton, 
                      styles.priorityButtonMedium,
                      editedTask.priority === "Media" && styles.priorityButtonActive
                    ]}
                    onPress={() => handlePrioritySelect("Media")}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      editedTask.priority === "Media" && styles.priorityButtonTextActive
                    ]}>Media</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.priorityButton, 
                      styles.priorityButtonHigh,
                      editedTask.priority === "Alta" && styles.priorityButtonActive
                    ]}
                    onPress={() => handlePrioritySelect("Alta")}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      editedTask.priority === "Alta" && styles.priorityButtonTextActive
                    ]}>Alta</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              <View style={styles.editModalFooter}>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveButtonText}>Salva Modifiche</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Stili della card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedCard: {
    backgroundColor: "#F5F5F5",
  },
  
  // Layout
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  taskInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  
  // Testo
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8, // Aumentato lo spazio
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#888888",
  },
  description: {
    fontSize: 14, // Dimensione aumentata
    color: "#666666",
    lineHeight: 20, // Aumentato per migliore spaziatura
    marginTop: 10,
    paddingLeft: 34, // Align with title text
  },
  
  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: "#2EC4B6",
    borderColor: "#2EC4B6",
  },
  
  // Data e giorni rimanenti
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12, // Dimensione aumentata
    color: "#666666", // Colore più scuro per miglior contrasto
    marginLeft: 4,
    fontWeight: "500", // Aggiunto il grassetto per far risaltare la data
  },
  daysRemainingContainer: {
    marginLeft: 'auto',
    marginRight: 8,
    justifyContent: 'center',
  },
  daysRemaining: {
    fontSize: 13, // Dimensione aumentata
    fontWeight: "600", // Aumentato il grassetto
    textAlign: 'right',
  },
  
  // Pulsanti e menu
  expandButton: {
    alignSelf: "center",
    marginTop: 4,
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    borderRadius: 8,
    marginTop: 8,
  },
  
  // Stili del modal - aggiornati per uniformità con Category
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  // Voci specifiche per il menu
  deleteItem: {
    color: "#F44336",
  },
  deleteText: {
    color: "#F44336",
  },
  
  // Stili per il modal di modifica
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#10e0e0',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  editModalContent: {
    padding: 16,
  },
  editModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityButtonLow: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  priorityButtonMedium: {
    borderColor: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  priorityButtonHigh: {
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontWeight: '600',
  },
  priorityButtonTextActive: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateButton: {
    flex: 3,
    marginRight: 8,
  },
  timeButton: {
    flex: 2,
  },
});

export default Task;
