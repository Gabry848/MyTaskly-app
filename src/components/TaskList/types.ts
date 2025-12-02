// Tipi condivisi per i componenti della TaskList
export interface Task {
  status: string;
  start_time: string;
  id?: number | string;
  title: string;
  image?: string;
  description: string;
  priority: string;
  end_time: string;
  completed?: boolean;
  status_code?: number;
  task_id?: number;
  category_id?: number | string;
  category_name?: string;
  isOptimistic?: boolean;
}

// Riferimento globale per i task condivisi tra componenti
export let globalTasksRef = {
  addTask: (task: Task, categoryName: string) => {},
  tasks: {} as Record<string, Task[]>, // Task raggruppati per nome categoria
};

// Funzione globale per aggiungere task
export const addTaskToList = (task: Task, categoryName: string) => {
  console.log(
    "addTaskToList called directly with:",
    task,
    "for category:",
    categoryName
  );
  globalTasksRef.addTask(task, categoryName);
};
