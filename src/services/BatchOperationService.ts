import eventEmitter, { EVENTS } from '../utils/eventEmitter';

export type BatchOperation = 'delete' | 'complete' | 'incomplete' | 'changePriority' | 'changeCategory';

export interface BatchOperationState {
  isSelectionMode: boolean;
  selectedTaskIds: Set<string>;
  selectedCount: number;
}

/**
 * Servizio per gestire le operazioni batch sui task
 */
export class BatchOperationService {
  private static selectedTasks: Set<string> = new Set();
  private static isSelectionMode = false;

  /**
   * Abilita la modalità di selezione
   */
  static enableSelectionMode(): void {
    this.isSelectionMode = true;
    eventEmitter.emit(EVENTS.BATCH_MODE_CHANGED, {
      isSelectionMode: true,
      selectedCount: this.selectedTasks.size,
    });
  }

  /**
   * Disabilita la modalità di selezione
   */
  static disableSelectionMode(): void {
    this.isSelectionMode = false;
    this.selectedTasks.clear();
    eventEmitter.emit(EVENTS.BATCH_MODE_CHANGED, {
      isSelectionMode: false,
      selectedCount: 0,
    });
  }

  /**
   * Ritorna lo stato della modalità di selezione
   */
  static isInSelectionMode(): boolean {
    return this.isSelectionMode;
  }

  /**
   * Seleziona un task
   */
  static selectTask(taskId: string): void {
    this.selectedTasks.add(taskId);
    this.emitSelectionUpdate();
  }

  /**
   * Deseleziona un task
   */
  static deselectTask(taskId: string): void {
    this.selectedTasks.delete(taskId);
    this.emitSelectionUpdate();
  }

  /**
   * Toggle la selezione di un task
   */
  static toggleTaskSelection(taskId: string): void {
    if (this.selectedTasks.has(taskId)) {
      this.deselectTask(taskId);
    } else {
      this.selectTask(taskId);
    }
  }

  /**
   * Seleziona tutti i task
   */
  static selectAllTasks(taskIds: string[]): void {
    taskIds.forEach(id => this.selectedTasks.add(id));
    this.emitSelectionUpdate();
  }

  /**
   * Deseleziona tutti i task
   */
  static deselectAllTasks(): void {
    this.selectedTasks.clear();
    this.emitSelectionUpdate();
  }

  /**
   * Controlla se un task è selezionato
   */
  static isTaskSelected(taskId: string): boolean {
    return this.selectedTasks.has(taskId);
  }

  /**
   * Ritorna i task selezionati
   */
  static getSelectedTaskIds(): string[] {
    return Array.from(this.selectedTasks);
  }

  /**
   * Ritorna il numero di task selezionati
   */
  static getSelectedCount(): number {
    return this.selectedTasks.size;
  }

  /**
   * Ripristina lo stato di selezione
   */
  static resetSelection(): void {
    this.selectedTasks.clear();
    this.emitSelectionUpdate();
  }

  /**
   * Emette l'evento di aggiornamento della selezione
   */
  private static emitSelectionUpdate(): void {
    eventEmitter.emit(EVENTS.BATCH_SELECTION_CHANGED, {
      selectedTaskIds: Array.from(this.selectedTasks),
      selectedCount: this.selectedTasks.size,
    });
  }

  /**
   * Esegue un'operazione batch su un insieme di task
   */
  static async executeBatchOperation(
    operation: BatchOperation,
    taskIds: string[],
    options?: any,
    taskService?: any
  ): Promise<void> {
    if (!taskIds.length || !taskService) {
      console.warn('Nessun task selezionato o servizio non disponibile');
      return;
    }

    try {
      console.log(`🔄 Esecuzione operazione batch: ${operation} su ${taskIds.length} task`);

      switch (operation) {
        case 'delete':
          for (const taskId of taskIds) {
            await taskService.deleteTask(taskId);
          }
          eventEmitter.emit(EVENTS.BATCH_DELETE_COMPLETED, { count: taskIds.length });
          break;

        case 'complete':
          for (const taskId of taskIds) {
            await taskService.completeTask(taskId);
          }
          eventEmitter.emit(EVENTS.BATCH_COMPLETE_COMPLETED, { count: taskIds.length });
          break;

        case 'incomplete':
          for (const taskId of taskIds) {
            await taskService.disCompleteTask(taskId);
          }
          eventEmitter.emit(EVENTS.BATCH_INCOMPLETE_COMPLETED, { count: taskIds.length });
          break;

        case 'changePriority':
          if (!options?.priority) {
            throw new Error('Priority non specificata');
          }
          for (const taskId of taskIds) {
            await taskService.updateTask(taskId, { priority: options.priority });
          }
          eventEmitter.emit(EVENTS.BATCH_UPDATE_COMPLETED, {
            count: taskIds.length,
            operation: 'changePriority',
          });
          break;

        case 'changeCategory':
          if (!options?.categoryId) {
            throw new Error('Category non specificata');
          }
          for (const taskId of taskIds) {
            await taskService.updateTask(taskId, { category_id: options.categoryId });
          }
          eventEmitter.emit(EVENTS.BATCH_UPDATE_COMPLETED, {
            count: taskIds.length,
            operation: 'changeCategory',
          });
          break;

        default:
          throw new Error(`Operazione batch non riconosciuta: ${operation}`);
      }

      console.log(`✅ Operazione batch completata: ${operation}`);
      this.resetSelection();
    } catch (error) {
      console.error(`❌ Errore durante l'operazione batch:`, error);
      throw error;
    }
  }
}
