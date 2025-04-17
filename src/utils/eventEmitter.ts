import { EventEmitter } from 'events';

// Creo un EventEmitter globale per l'intera applicazione
const globalEventEmitter = new EventEmitter();

// Definisco i tipi di eventi disponibili
export const EVENTS = {
  CATEGORY_ADDED: 'CATEGORY_ADDED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  CATEGORY_DELETED: 'CATEGORY_DELETED',
  TASK_ADDED: 'TASK_ADDED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
};

// Funzioni helper per emettere eventi
export const emitCategoryAdded = (category) => {
  globalEventEmitter.emit(EVENTS.CATEGORY_ADDED, category);
};

export const emitCategoryUpdated = (category) => {
  globalEventEmitter.emit(EVENTS.CATEGORY_UPDATED, category);
};

export const emitCategoryDeleted = (categoryName) => {
  globalEventEmitter.emit(EVENTS.CATEGORY_DELETED, categoryName);
};

export const emitTaskAdded = (task) => {
  globalEventEmitter.emit(EVENTS.TASK_ADDED, task);
};

export const emitTaskUpdated = (task) => {
  globalEventEmitter.emit(EVENTS.TASK_UPDATED, task);
};

export const emitTaskDeleted = (taskId) => {
  globalEventEmitter.emit(EVENTS.TASK_DELETED, taskId);
};

// Esporto l'emitter per poter aggiungere listener in vari componenti
export default globalEventEmitter;