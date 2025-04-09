import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Modal, Alert, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../src/types';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { deleteCategory, updateCategory, getTasks, Task, addTask } from '../src/services/taskService';
import AddTask from "./AddTask";

type CategoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TaskList'
>;

interface CategoryProps {
  title: string;
  description?: string;
  imageUrl?: string;
  taskCount?: number;
  onDelete?: () => void; 
  onEdit?: () => void;
}

const Category: React.FC<CategoryProps> = ({ 
  title,
  description = "",
  imageUrl, 
  taskCount = 0, 
  onDelete,
  onEdit 
}) => {
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [actualTaskCount, setActualTaskCount] = useState(taskCount);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // Funzione per recuperare il conteggio dei task
  const fetchTaskCount = async () => {
    try {
      setIsLoading(true);
      const tasksData = await getTasks(title);
      
      // Filtrare i task per quelli non completati
      const incompleteTasks = tasksData.filter((task: Task) => 
        task.status !== "Completato" && task.status !== "Completed"
      );
      
      setActualTaskCount(incompleteTasks.length);
    } catch (error) {
      console.error("Errore durante il recupero dei task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carica il conteggio dei task all'inizializzazione del componente
  useEffect(() => {
    fetchTaskCount();
  }, [title]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    setShowMenu(true);
  };
  
  const closeMenu = () => {
    setShowMenu(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      Alert.alert(
        "Elimina categoria",
        `Sei sicuro di voler eliminare la categoria "${title}"?`,
        [
          {
            text: "Annulla",
            style: "cancel",
            onPress: () => {
              setIsDeleting(false);
              closeMenu();
            }
          },
          {
            text: "Elimina",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteCategory(title);
                
                closeMenu();
                if (onDelete) {
                  onDelete();
                }
              } catch (error) {
                console.error("Errore durante l'eliminazione della categoria:", error);
                Alert.alert("Errore", "Impossibile eliminare la categoria. Riprova più tardi.");
              } finally {
                setIsDeleting(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Errore durante l'eliminazione della categoria:", error);
      Alert.alert("Errore", "Impossibile eliminare la categoria. Riprova più tardi.");
      setIsDeleting(false);
      closeMenu();
    }
  };

  const handleEdit = () => {
    closeMenu();
    setEditName(title);
    setEditDescription(description);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Errore", "Il titolo della categoria non può essere vuoto");
      return;
    }

    setIsEditing(true);
    try {
      await updateCategory(title, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      
      setShowEditModal(false);
      if (onEdit) {
        onEdit();
      }
    } catch (error) {
      console.error("Errore durante l'aggiornamento della categoria:", error);
      Alert.alert("Errore", "Impossibile aggiornare la categoria. Riprova più tardi.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditName(title);
    setEditDescription(description);
  };

  const handleShare = () => {
    closeMenu();
  };

  const handleAddTask = () => {
    setShowAddTask(true);
  };

  const handleTaskAdded = (t, description, dueDate, priority) => {
    const d = {
      title: t,
      description: description,
      end_time: dueDate,
      priority: priority,
      category_name: title,
      status: "In sospeso"
    };
    console.log("Nuovo task:", d);
    addTask(d).then(() => {
      fetchTaskCount();
      setShowAddTask(false);  
    }).catch(error => {
      console.error("Errore durante l'aggiunta del task:", error);
    });
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.view}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        onPress={() => {
          navigation.navigate("TaskList", { category_name: title });
        }}
      >
        <LinearGradient
          colors={['rgba(11, 148, 153, 0.7)', 'rgba(11, 148, 153, 0.3)']}
          style={styles.imageContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <MaterialIcons name="category" size={24} color="#fff" style={{margin: 8}} />
          )}
        </LinearGradient>

        <View style={styles.categoryContainer}>
          <Text style={styles.add}>{title}</Text>
          <View style={styles.counterRow}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.title}>
              {isLoading ? "Caricamento..." : `${actualTaskCount} cose da fare`}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.controlsContainer}
          onPress={handleAddTask}
        >
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.addButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="add-task" size={22} color="#fff" />
            <Text style={styles.addButtonText}>Aggiungi</Text>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showMenu}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeMenu}
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

      <Modal
        transparent={true}
        visible={showEditModal}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>Modifica Categoria</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Titolo</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Inserisci il titolo della categoria"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Descrizione</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Inserisci una descrizione (opzionale)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancelEdit}
              >
                <Text style={styles.buttonText}>Annulla</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSaveEdit}
                disabled={isEditing}
              >
                <Text style={styles.buttonText}>
                  {isEditing ? "Salvataggio..." : "Salva"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddTask
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSave={(t, d, dueDate, p) => handleTaskAdded(t, d, dueDate, p)}
        categoryName={title}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: 5,
  },
  add: {
    fontSize: 18,
    fontWeight: "700",
    padding: 5,
    color: "#333",
  },
  title: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  categoryContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  controlsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textarea: {
    height: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#DC3545',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Category;