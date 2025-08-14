import { useEffect } from 'react';
import { Task } from './taskService';
import { 
  scheduleLocalNotification, 
  cancelLocalNotification, 
  getAllScheduledNotifications 
} from './notificationService';

/**
 * Hook per gestire le notifiche dei task
 */
export function useTaskNotifications() {

  /**
   * Programma una notifica per un task in scadenza
   */
  const scheduleTaskNotification = async (task: Task): Promise<string | null> => {
    if (!task.end_time) {
      console.warn('⚠️ Task senza data di scadenza, notifica non programmata');
      return null;
    }

    try {
      const dueDate = new Date(task.end_time);
      const now = new Date();
      
      // Programma la notifica 1 ora prima della scadenza
      const notificationTime = new Date(dueDate.getTime() - (60 * 60 * 1000));
      
      // Se la notifica dovrebbe essere inviata nel passato, non programmarla
      if (notificationTime <= now) {
        console.warn('⚠️ Task scade troppo presto per programmare la notifica');
        return null;
      }

      const notificationId = await scheduleLocalNotification(
        task.title,
        task.description || 'Ricordati di completare questo task',
        notificationTime,
        {
          action: 'open_task',
          task_id: task.id,
          task_title: task.title,
          notification_type: 'task_due_reminder'
        }
      );

      console.log(`📅 Notifica programmata per task "${task.title}" alle ${notificationTime.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Errore nella programmazione notifica task:', error);
      return null;
    }
  };

  /**
   * Programma notifiche per una lista di task
   */
  const scheduleMultipleTaskNotifications = async (tasks: Task[]): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const task of tasks) {
      const notificationId = await scheduleTaskNotification(task);
      if (notificationId) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`📊 Notifiche programmate: ${success} successi, ${failed} fallimenti`);
    return { success, failed };
  };

  /**
   * Cancella la notifica di un task specifico
   */
  const cancelTaskNotification = async (taskId: string | number): Promise<boolean> => {
    try {
      const scheduledNotifications = await getAllScheduledNotifications();
      
      // Trova la notifica per questo task
      const taskNotification = scheduledNotifications.find(
        notification => 
          notification.content.data?.task_id === taskId &&
          notification.content.data?.notification_type === 'task_due_reminder'
      );

      if (taskNotification) {
        const success = await cancelLocalNotification(taskNotification.identifier);
        if (success) {
          console.log(`🗑️ Notifica cancellata per task ID: ${taskId}`);
        }
        return success;
      } else {
        console.warn(`⚠️ Nessuna notifica trovata per task ID: ${taskId}`);
        return true; // Non è un errore se non c'è notifica da cancellare
      }
    } catch (error) {
      console.error('❌ Errore nella cancellazione notifica task:', error);
      return false;
    }
  };

  /**
   * Aggiorna le notifiche quando i task cambiano
   */
  const updateTaskNotifications = async (tasks: Task[]): Promise<void> => {
    try {
      // Ottieni tutte le notifiche programmate
      const scheduledNotifications = await getAllScheduledNotifications();
      
      // Trova tutte le notifiche di task
      const taskNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.notification_type === 'task_due_reminder'
      );

      console.log(`📋 Trovate ${taskNotifications.length} notifiche di task esistenti`);

      // Cancella tutte le notifiche di task esistenti
      for (const notification of taskNotifications) {
        await cancelLocalNotification(notification.identifier);
      }

      // Riprogramma tutte le notifiche per i task attuali
      const result = await scheduleMultipleTaskNotifications(tasks);
      console.log(`🔄 Notifiche aggiornate: ${result.success} programmate, ${result.failed} fallite`);
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento delle notifiche:', error);
    }
  };

  /**
   * Ottieni statistiche sulle notifiche dei task
   */
  const getTaskNotificationStats = async (): Promise<{
    total: number;
    upcoming: number;
    overdue: number;
  }> => {
    try {
      const scheduledNotifications = await getAllScheduledNotifications();
      const taskNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.notification_type === 'task_due_reminder'
      );

      const now = new Date();
      let upcoming = 0;
      let overdue = 0;

      for (const notification of taskNotifications) {
        if (notification.trigger && 'date' in notification.trigger) {
          const triggerDate = new Date(notification.trigger.date);
          if (triggerDate > now) {
            upcoming++;
          } else {
            overdue++;
          }
        }
      }

      return {
        total: taskNotifications.length,
        upcoming,
        overdue
      };
    } catch (error) {
      console.error('❌ Errore nel calcolo statistiche notifiche:', error);
      return { total: 0, upcoming: 0, overdue: 0 };
    }
  };

  return {
    scheduleTaskNotification,
    scheduleMultipleTaskNotifications,
    cancelTaskNotification,
    updateTaskNotifications,
    getTaskNotificationStats,
  };
}

/**
 * Utility per formattare il tempo rimanente
 */
export function formatTimeUntilDue(dueDate: Date): string {
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Scaduto';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} giorno${diffDays > 1 ? 'i' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} ora${diffHours > 1 ? 'e' : ''}`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minuto${diffMinutes > 1 ? 'i' : ''}`;
  }
}
