import React, { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { getTasks, Task, addTask, deleteCategory, updateCategory } from '../src/services/taskService';
import CategoryCard from './CategoryCard';
import CategoryMenu from './CategoryMenu';
import EditCategoryModal from './EditCategoryModal';
import AddTask from "./AddTask";
import ShareCategoryDialog from './ShareCategoryDialog';
import ManageCategoryShares from './ManageCategoryShares';
import eventEmitter, { emitCategoryDeleted, emitCategoryUpdated, emitTaskAdded , EVENTS } from '../src/utils/eventEmitter';


interface CategoryProps {
  title: string;
  description?: string;
  imageUrl?: string;
  taskCount?: number;
  categoryId?: string | number;
  isShared?: boolean;
  isOwned?: boolean;
  permissionLevel?: "READ_ONLY" | "READ_WRITE";
  onDelete?: () => void;
  onEdit?: () => void;
}

const Category: React.FC<CategoryProps> = ({
  title,
  description = "",
  imageUrl,
  taskCount = 0,
  categoryId,
  isShared = false,
  isOwned = true,
  permissionLevel = "READ_WRITE",
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
  const fetchTaskCount = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`[CATEGORY] Caricamento task per categoria: "${title}"`);
      
      const tasksData = await getTasks(title);
      console.log(`[CATEGORY] Task ricevuti per "${title}":`, tasksData);
      
      if (!Array.isArray(tasksData)) {
        console.warn(`[CATEGORY] I dati ricevuti per "${title}" non sono un array:`, tasksData);
        setActualTaskCount(0);
        return;
      }
      
      // Log di tutti i task ricevuti
      tasksData.forEach((task: Task, index: number) => {
        console.log(`[CATEGORY] Task ricevuto ${index + 1} per "${title}": titolo="${task.title}", status="${task.status}"`);
      });
      
      // Filtrare i task per quelli non completati (status più permissivo)
      const incompleteTasks = tasksData.filter((task: Task) => {
        const status = task.status?.toLowerCase() || '';
        const isIncomplete = status !== "completato" && status !== "completed" && status !== "archiviato" && status !== "archived";
        console.log(`[CATEGORY] Filtro task "${task.title}": status="${status}", incluso=${isIncomplete}`);
        return isIncomplete;
      });
      
      console.log(`[CATEGORY] Task non completati per "${title}":`, incompleteTasks.length, 'di', tasksData.length);
      setActualTaskCount(incompleteTasks.length);
    } catch (error) {
      console.error(`[CATEGORY] Errore durante il recupero dei task per "${title}":`, error);
      setActualTaskCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [title]);

  // Carica il conteggio dei task all'inizializzazione del componente
  useEffect(() => {
    fetchTaskCount();
  }, [title, fetchTaskCount]);

  // Setup listeners per aggiornamenti task count in tempo reale
  useEffect(() => {
    const handleTaskAdded = (newTask: Task) => {
      // Solo aggiorna se il task appartiene a questa categoria
      if (newTask.category_name === title) {
        console.log('[CATEGORY] Task added event received for category:', title, newTask.title);
        setActualTaskCount(prevCount => prevCount + 1);
      }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      // Ricarica il count per gestire cambi di categoria
      fetchTaskCount();
    };

    const handleTaskDeleted = (taskId: string | number) => {
      // Ricarica il count dopo eliminazione
      fetchTaskCount();
    };

    // Registra i listeners
    eventEmitter.on(EVENTS.TASK_ADDED, handleTaskAdded);
    eventEmitter.on(EVENTS.TASK_UPDATED, handleTaskUpdated);
    eventEmitter.on(EVENTS.TASK_DELETED, handleTaskDeleted);

    return () => {
      // Rimuovi i listeners
      eventEmitter.off(EVENTS.TASK_ADDED, handleTaskAdded);
      eventEmitter.off(EVENTS.TASK_UPDATED, handleTaskUpdated);
      eventEmitter.off(EVENTS.TASK_DELETED, handleTaskDeleted);
    };
  }, [title, fetchTaskCount]);

  const handleLongPress = () => {
    setShowMenu(true);
  };
  
  const closeMenu = () => {
    setShowMenu(false);
  };

  const handleDelete = async () => {
    // Only owners can delete
    if (!isOwned) {
      Alert.alert(
        "Permesso negato",
        "Solo il proprietario può eliminare questa categoria."
      );
      closeMenu();
      return;
    }

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
    // Check permissions - owners and READ_WRITE users can edit
    if (!isOwned && permissionLevel === "READ_ONLY") {
      Alert.alert(
        "Permesso negato",
        "Hai solo permessi di lettura per questa categoria. Non puoi modificarla."
      );
      closeMenu();
      return;
    }

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

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showManageShares, setShowManageShares] = useState(false);

  const handleShare = () => {
    closeMenu();
    if (isOwned) {
      // Se è proprietario, mostra il dialogo per condividere
      setShowShareDialog(true);
    } else {
      Alert.alert(
        "Categoria condivisa",
        `Questa categoria è condivisa da un altro utente. Il tuo permesso: ${permissionLevel === "READ_ONLY" ? "Sola lettura" : "Lettura/Scrittura"}`
      );
    }
  };

  const handleManageShares = () => {
    closeMenu();
    if (!categoryId) {
      Alert.alert("Errore", "ID categoria non disponibile");
      return;
    }
    setShowManageShares(true);
  };

  const handleShareSuccess = (message: string) => {
    Alert.alert("Successo", message);
  };

  const handleAddTask = () => {
    // Check permissions before allowing task creation
    if (!isOwned && permissionLevel === "READ_ONLY") {
      Alert.alert(
        "Permesso negato",
        "Hai solo permessi di lettura per questa categoria. Non puoi aggiungere task."
      );
      return;
    }
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
        isShared={isShared}
        isOwned={isOwned}
        permissionLevel={permissionLevel}
        onAddTask={handleAddTask}
        onLongPress={handleLongPress}
      />

      <CategoryMenu
        visible={showMenu}
        onClose={closeMenu}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShare={handleShare}
        onManageShares={handleManageShares}
        isDeleting={isDeleting}
        isOwned={isOwned}
        permissionLevel={permissionLevel}
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

      {categoryId && (
        <>
          <ShareCategoryDialog
            visible={showShareDialog}
            categoryId={Number(categoryId)}
            categoryName={title}
            onClose={() => setShowShareDialog(false)}
            onSuccess={handleShareSuccess}
          />

          <ManageCategoryShares
            visible={showManageShares}
            categoryId={Number(categoryId)}
            categoryName={title}
            isOwner={isOwned}
            onClose={() => setShowManageShares(false)}
            onAddPerson={() => {
              setShowManageShares(false);
              setShowShareDialog(true);
            }}
          />
        </>
      )}

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