import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // Importa l'icona dell'orologio
import { Entypo } from "@expo/vector-icons"; // Importa l'icona dei tre puntini
import { Dropdown } from 'react-native-element-dropdown';

const Task = ({
  task = {
    id: 1,
    title: "Complete Project Proposal",
    description: "Finish the draft and send it to the client for review",
    priority: "Bassa",
    end_time: "2025-03-25",
    completed: false,
  },
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  
  // Opzioni per il dropdown menu
  const dropdownData = [
    { label: 'Modifica', value: 'edit', icon: 'edit' },
    { label: 'Elimina', value: 'delete', icon: 'trash' },
    { label: 'Condividi', value: 'share', icon: 'share' },
  ];

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Gestione delle azioni del dropdown
  const handleActionSelect = (item) => {
    switch (item.value) {
      case 'edit':
        handleEdit();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'share':
        handleShare();
        break;
    }
    setSelectedAction(null);
    setMenuVisible(false);
  };

  const handleEdit = () => {
    Alert.alert("Modifica", `Modifica il task con ID ${task.id}`);
  };

  const handleDelete = () => {
    Alert.alert("Elimina", `Task con ID ${task.id} eliminato.`);
  };

  const handleShare = () => {
    Alert.alert("Condividi", `Condividi il task con ID ${task.id}`);
  };

  // Formatta la data per visualizzare solo giorno, mese e anno
  const formattedDate = new Date(task.end_time).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Renderizzazione della icona per ogni voce del dropdown
  const renderDropdownIcon = (icon) => {
    const color = icon === 'trash' ? '#ff4444' : '#333';
    return <FontAwesome name={icon} size={14} color={color} style={styles.dropdownIcon} />;
  };

  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View
          style={[
            styles.priorityBadge,
            task.priority === "Alta"
              ? styles.highPriority
              : task.priority === "Media"
              ? styles.mediumPriority
              : styles.lowPriority,
          ]}
        >
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={toggleMenu}>
            <Entypo name="dots-three-vertical" size={16} color="#888888" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.description}>{task.description}</Text>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <FontAwesome name="clock-o" size={14} color="#888888" />
          <Text style={styles.end_time}>{formattedDate}</Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            task.completed ? styles.completed : styles.pending,
          ]}
        >
          <Text style={styles.statusText}>
            {task.completed ? "Completed" : "Pending"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  highPriority: {
    backgroundColor: "rgb(255, 171, 145)",
  },
  mediumPriority: {
    backgroundColor: "rgb(255, 204, 128)",
  },
  lowPriority: {
    backgroundColor: "#e8f5e9",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  end_time: {
    fontSize: 12,
    color: "#888888",
    marginLeft: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completed: {
    backgroundColor: "#e8f5e9",
  },
  pending: {
    backgroundColor: "#e3f2fd",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  controls: {
    marginLeft: 8,
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: 20,
    right: 0,
    width: 120,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  dropdownContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdownItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  menuText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownIcon: {
    marginRight: 8,
  }
});

export default Task;
