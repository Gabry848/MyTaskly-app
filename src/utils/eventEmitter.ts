// Custom EventEmitter per React Native (senza dipendenza dal modulo Node.js 'events')
export class CustomEventEmitter {
  listeners: Record<string, Function[]>;

  constructor() {
    this.listeners = {};
  }

  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(
        (listener) => listener !== callback
      );
    } else {
      delete this.listeners[event];
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach((callback) => {
      callback(...args);
    });
  }

  // Alias per 'on' per compatibilità con EventEmitter
  addListener(event: string, callback: Function): void {
    this.on(event, callback);
  }

  // Alias per 'off' per compatibilità con EventEmitter
  removeListener(event: string, callback: Function): void {
    this.off(event, callback);
  }
}

// Creo un EventEmitter globale per l'intera applicazione
const globalEventEmitter = new CustomEventEmitter();

// Definisco i tipi di eventi disponibili
export const EVENTS = {
  CATEGORY_ADDED: "CATEGORY_ADDED",
  CATEGORY_UPDATED: "CATEGORY_UPDATED",
  CATEGORY_DELETED: "CATEGORY_DELETED",
  TASK_ADDED: "TASK_ADDED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
  TASKS_SYNCED: "TASKS_SYNCED",
  SCREEN_CHANGE: "SCREEN_CHANGE",
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

export const emitTasksSynced = (tasks, categories) => {
  globalEventEmitter.emit(EVENTS.TASKS_SYNCED, { tasks, categories });
};

export const emitScreenChange = (screenName, params) => {
  globalEventEmitter.emit(EVENTS.SCREEN_CHANGE, { screenName, params });
};

// Esporto l'emitter per poter aggiungere listener in vari componenti
export default globalEventEmitter;
