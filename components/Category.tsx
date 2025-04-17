import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import { getTasks, Task, addTask, deleteCategory, updateCategory } from '../src/services/taskService';
import CategoryCard from './CategoryCard';
import CategoryMenu from './CategoryMenu';
import EditCategoryModal from './EditCategoryModal';
import AddTask from "./AddTask";
import { emitCategoryDeleted, emitCategoryUpdated, emitTaskAdded } from '../src/utils/eventEmitter';

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
                
                // Emetti un evento per notificare l'eliminazione della categoria
                emitCategoryDeleted(title);
                
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
      const updatedCategory = await updateCategory(title, {
        name: editName.trim(),
        description: editDescription.trim()
      });
      
      // Emetti un evento per notificare la modifica della categoria
      emitCategoryUpdated({
        name: editName.trim(),
        description: editDescription.trim(),
        oldName: title
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
    // Implementazione futura della condivisione
  };

  const handleAddTask = () => {
    setShowAddTask(true);
  };

  const handleTaskAdded = (t, description, dueDate, priority) => {
    const d = {
      title: t,
      description: description || "", // Assicurarsi che description non sia mai null
      end_time: dueDate,
      start_time: new Date().toISOString(),
      priority: priority,
      category_name: title,
      status: "In sospeso",
      user: ""  // Campo richiesto dal server
    };
    console.log("Nuovo task:", d);
    addTask(d).then((addedTask) => {
      // Emetti un evento per notificare l'aggiunta di un nuovo task
      emitTaskAdded(addedTask || d);
      
      fetchTaskCount();
      setShowAddTask(false);  
    }).catch(error => {
      console.error("Errore durante l'aggiunta del task:", error);
      Alert.alert("Errore", "Impossibile aggiungere il task. Riprova più tardi.");
    });
  };
  
  return (
    <>
      <CategoryCard
        title={title}
        imageUrl={imageUrl}
        taskCount={actualTaskCount}
        isLoading={isLoading}
        onAddTask={handleAddTask}
        onLongPress={handleLongPress}
      />

      <CategoryMenu
        visible={showMenu}
        onClose={closeMenu}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShare={handleShare}
        isDeleting={isDeleting}
      />

      <EditCategoryModal
        visible={showEditModal}
        onClose={handleCancelEdit}
        onSave={handleSaveEdit}
        title={editName}
        description={editDescription}
        onTitleChange={setEditName}
        onDescriptionChange={setEditDescription}
        isEditing={isEditing}
      />

      <AddTask
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSave={(t, d, dueDate, p) => handleTaskAdded(t, d, dueDate, p)}
        categoryName={title}
      />
    </>
  );
};

export default Category;