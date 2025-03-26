import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // Importa l'icona dell'orologio
import { Entypo } from "@expo/vector-icons"; // Importa l'icona dei tre puntini

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

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleEdit = () => {
    Alert.alert("Modifica", `Modifica il task con ID ${task.id}`);
    setMenuVisible(false);
  };

  const handleDelete = () => {
    Alert.alert("Elimina", `Task con ID ${task.id} eliminato.`);
    setMenuVisible(false);
  };

  const handleShare = () => {
    Alert.alert("Condividi", `Condividi il task con ID ${task.id}`);
    setMenuVisible(false);
  };

  // Formatta la data per visualizzare solo giorno, mese e anno
  const formattedDate = new Date(task.end_time).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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
          
          {menuVisible && (
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <FontAwesome name="edit" size={14} color="#333" />
                <Text style={styles.menuText}>Modifica</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <FontAwesome name="trash" size={14} color="#ff4444" />
                <Text style={styles.menuText}>Elimina</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                <FontAwesome name="share" size={14} color="#333" />
                <Text style={styles.menuText}>Condividi</Text>
              </TouchableOpacity>
            </View>
          )}
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
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 8,
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
});

export default Task;
