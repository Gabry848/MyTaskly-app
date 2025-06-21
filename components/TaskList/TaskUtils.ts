import { Task } from './types';

// Funzione per ottenere il colore in base alla priorità (gradiente di scurezza)
export const getPriorityColor = (priority: string): string => {
  switch(priority) {
    case "Alta": return "#000000";   // Nero per alta priorità
    case "Media": return "#333333";  // Grigio scuro per media priorità
    case "Bassa": return "#666666";  // Grigio medio per bassa priorità
    default: return "#999999";       // Grigio chiaro per default
  }
};

// Funzione che ritorna solo "YYYY-MM-DD" da una data
export const getDayString = (value: string | Date): string => {
  return new Date(value).toISOString().split('T')[0];
};

// Funzione per filtrare i task per giorno
export function filterTasksByDay(tasks: Task[], dayFilter: string): Task[] {
  if (dayFilter === "Tutte") {
    return tasks;
  }
  
  const today = new Date();
  let targetDate = new Date();
  let daysToAdd = 0;

  if (dayFilter === "Oggi") {
    targetDate = today;
  } else if (dayFilter === "Domani") {
    daysToAdd = 1;
  } else if (dayFilter === "Dopodomani") {
    daysToAdd = 2;
  } else if (dayFilter.startsWith("Fra")) {
    // Estrai il numero di giorni dal filtro (es. "Fra 3 giorni" -> 3)
    const daysMatch = dayFilter.match(/Fra (\d+) giorni/);
    if (daysMatch && daysMatch[1]) {
      daysToAdd = parseInt(daysMatch[1], 10);
    }
  }

  // Aggiunge il numero di giorni richiesto alla data di oggi
  if (daysToAdd > 0) {
    targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
  }

  // Imposta l'inizio del giorno (00:00:00)
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
  // Imposta la fine del giorno (23:59:59)
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

  return tasks.filter((task) => {
    const dueDate = new Date(task.end_time);
    return dueDate >= startOfDay && dueDate <= endOfDay;
  });
}
