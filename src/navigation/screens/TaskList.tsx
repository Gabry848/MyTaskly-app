import React from "react";
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { TaskListContainer } from "../../../components/TaskList";
import { addTaskToList } from "../../types";
import Task from "../../../components/Task";
import { getTasks, addTask, deleteTask, updateTask, completeTask, disCompleteTask } from "../../services/taskService";

/**
 * Route prop type for TaskList screen
 */
export type TaskListRouteProp = RouteProp<RootStackParamList, 'TaskList'>;

/**
 * Props for TaskList screen component
 */
export type Props = {
  /** Route prop with task list parameters */
  route: TaskListRouteProp;
};

export function TaskList({ route }: Props) {
  const categoryName = route.params.category_name;
  const categoryId = route.params.categoryId;
  const isOwned = route.params.isOwned ?? true;
  const permissionLevel = route.params.permissionLevel ?? "READ_WRITE";

  return (
    <TaskListContainer
      categoryName={categoryName}
      categoryId={String(categoryId || categoryName)} // Converti in stringa
      isOwned={isOwned}
      permissionLevel={permissionLevel}
      Task={Task}
      taskService={{
        getTasks,
        addTask,
        deleteTask,
        updateTask,
        completeTask,
        disCompleteTask
      }}
    />
  );
}

export default TaskList;

// Re-esporta la funzione addTaskToList per mantenere la compatibilità
export { addTaskToList };
