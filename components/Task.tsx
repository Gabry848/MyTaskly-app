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
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Menu, MenuItem } from "react-native-material-menu";

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

const TaskMenu = ({ visible, onRequestClose, onEdit, onDelete }) => (
  <Menu
    visible={visible}
    anchor={
      <TouchableOpacity onPress={() => onRequestClose(true)} style={styles.menuButton}>
        <MaterialIcons name="more-vert" size={20} color="#888" />
      </TouchableOpacity>
    }
    onRequestClose={() => onRequestClose(false)}
    style={styles.menu}
  >
    <MenuItem onPress={onEdit}>
      <View style={styles.menuItem}>
        <MaterialIcons name="edit" size={16} color="#555" style={styles.menuIcon} />
        <Text>Modifica</Text>
      </View>
    </MenuItem>
    <MenuItem onPress={onDelete}>
      <View style={styles.menuItem}>
        <MaterialIcons name="delete" size={16} color="#ff4444" style={styles.menuIcon} />
        <Text style={styles.deleteText}>Elimina</Text>
      </View>
    </MenuItem>
  </Menu>
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

  // Assicura che l'animazione corrisponda allo stato expanded
  useEffect(() => {
    expandAnim.setValue(expanded ? 1 : 0);
  }, []);

  // Gestori azioni
  const handleComplete = () => {
    if (onTaskComplete) {
      onTaskComplete(task.id);
    } else {
      Alert.alert("Completato", `Task "${task.title}" completato`);
    }
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (onTaskEdit) {
      onTaskEdit(task.id);
    } else {
      Alert.alert("Modifica", `Modifica il task "${task.title}"`);
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    if (onTaskDelete) {
      onTaskDelete(task.id);
    } else {
      Alert.alert(
        "Elimina Task",
        `Sei sicuro di voler eliminare "${task.title}"?`,
        [
          { text: "Annulla", style: "cancel" },
          { text: "Elimina", style: "destructive", onPress: () => Alert.alert("Task eliminato") },
        ]
      );
    }
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
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: backgroundColor }
      ]}
    >
      <View style={styles.topRow}>
        {/* Checkbox */}
        <Checkbox checked={task.completed} onPress={handleComplete} />

        {/* Task Info */}
        <Pressable style={styles.taskInfo} onPress={toggleExpand}>
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

        {/* Menu */}
        <TaskMenu 
          visible={menuVisible}
          onRequestClose={setMenuVisible}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 8,
  },
  deleteItem: {
    color: "#ff4444",
  },
  deleteText: {
    color: "#ff4444",
  },
});

export default Task;
