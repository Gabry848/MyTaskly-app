import React from "react";
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { addTaskToList } from "../../../components/TaskList";
import { TaskListContainer } from "../../../components/TaskList";
import Task from "../../../components/Task";
import AddTask from "../../../components/AddTask";
import { getTasks, addTask, deleteTask, updateTask, completeTask, disCompleteTask } from "../../services/taskService";

type TaskListRouteProp = RouteProp<RootStackParamList, 'TaskList'>;

type Props = {
  route: TaskListRouteProp;
};

export function TaskList({ route }: Props) {
  const categoryId = route.params.categoryId;
  
  return (
    <TaskListContainer 
      categoryName={String(categoryId)}
      categoryId={categoryId}
      Task={Task}
      AddTask={AddTask}
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
