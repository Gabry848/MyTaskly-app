import React from "react";
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { TaskListContainer, addTaskToList } from "../../../components/TaskList";
import Task from "../../../components/Task";
import { getTasks, addTask, deleteTask, updateTask, completeTask, disCompleteTask } from "../../services/taskService";

type TaskListRouteProp = RouteProp<RootStackParamList, 'TaskList'>;

type Props = {
  route: TaskListRouteProp;
};

export function TaskList({ route }: Props) {
  const categoryName = route.params.category_name;
  const categoryId = route.params.categoryId;
  
  return (
    <TaskListContainer 
      categoryName={categoryName}
      categoryId={String(categoryId || categoryName)} // Converti in stringa
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
