import { useState, useEffect } from 'react';
import { TaskCountdownService, TaskCountdown } from '../services/TaskCountdownService';

/**
 * Hook per tracciare il countdown di un task in tempo reale
 */
export function useTaskCountdown(endTime: string | null, updateInterval: number = 60000) {
  const [countdown, setCountdown] = useState<TaskCountdown | null>(null);

  useEffect(() => {
    // Calcola il countdown iniziale
    if (endTime) {
      const newCountdown = TaskCountdownService.calculateCountdown(endTime);
      setCountdown(newCountdown);

      // Aggiorna il countdown periodicamente
      const interval = setInterval(() => {
        setCountdown(TaskCountdownService.calculateCountdown(endTime));
      }, updateInterval);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [endTime, updateInterval]);

  return countdown;
}

/**
 * Hook per verificare se un task è critico (scade entro 24 ore)
 */
export function useIsTaskCritical(endTime: string | null) {
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (endTime) {
      const critical = TaskCountdownService.isTaskCritical(endTime);
      setIsCritical(critical);

      const interval = setInterval(() => {
        setIsCritical(TaskCountdownService.isTaskCritical(endTime));
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setIsCritical(false);
    }
  }, [endTime]);

  return isCritical;
}

/**
 * Hook per ottenere le ore rimanenti fino alla scadenza
 */
export function useHoursRemaining(endTime: string | null) {
  const [hoursRemaining, setHoursRemaining] = useState(-1);

  useEffect(() => {
    if (endTime) {
      const hours = TaskCountdownService.getHoursRemaining(endTime);
      setHoursRemaining(hours);

      const interval = setInterval(() => {
        setHoursRemaining(TaskCountdownService.getHoursRemaining(endTime));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [endTime]);

  return hoursRemaining;
}
