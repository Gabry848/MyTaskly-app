import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Task, getAllTasks, getCategories, completeTask, disCompleteTask } from '../../services/taskService';
import { TaskCacheService } from '../../services/TaskCacheService';
import AppInitializer from '../../services/AppInitializer';
import eventEmitter, { EVENTS } from '../../utils/eventEmitter';
import { useFocusEffect } from '@react-navigation/native';
import CategoryColorService from './categoryColors';
import { CalendarViewType, CalendarTask } from './types';
import TopBar from './TopBar';
import MonthView from './MonthView';
import WeekView from './WeekView';
import ThreeDayView from './ThreeDayView';
import DayView from './DayView';
import AgendaView from './AgendaView';
import MiniCalendar from './MiniCalendar';
import ViewSelector from './ViewSelector';
import SearchOverlay from './SearchOverlay';
import FABMenu from './FABMenu';
import AddTask from '../Task/AddTask';
import AsyncStorage from '@react-native-async-storage/async-storage';

dayjs.extend(isoWeek);

const VIEW_PREF_KEY = '@calendar20_view_pref';

interface Calendar20ViewProps {
  onClose?: () => void;
}

const Calendar20View: React.FC<Calendar20ViewProps> = ({ onClose }) => {
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [rawTasks, setRawTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewSelectorVisible, setViewSelectorVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [miniCalendarVisible, setMiniCalendarVisible] = useState(false);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<dayjs.Dayjs | null>(null);

  const cacheService = useRef(TaskCacheService.getInstance()).current;
  const appInitializer = useRef(AppInitializer.getInstance()).current;
  const colorService = useRef(CategoryColorService.getInstance()).current;

  // Load saved view preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(VIEW_PREF_KEY);
        if (saved) setViewType(saved as CalendarViewType);
      } catch {}
    })();
  }, []);

  // Enrich tasks with colors and dayjs
  const calendarTasks = useMemo((): CalendarTask[] => {
    return rawTasks.map(task => {
      const categoryName = task.category_name || '';
      const displayColor = colorService.getColor(categoryName);

      // In this app, start_time = creation time, end_time = deadline/due date.
      // For calendar display, the task should appear on its end_time (deadline) date.
      // If end_time exists, use it as the reference date for the calendar.
      const rawStartDayjs = task.start_time ? dayjs(task.start_time) : dayjs();
      const rawEndDayjs = task.end_time ? dayjs(task.end_time) : rawStartDayjs;

      // Use server-provided duration_minutes if available
      const serverDuration = (task.duration_minutes && task.duration_minutes > 0)
        ? task.duration_minutes
        : 0;

      // For calendar positioning: 
      // - If duration_minutes is set, the task spans (end_time - duration) to end_time
      // - If no duration, the task is a point-in-time at end_time (default 30 min for display)
      let startDayjs: dayjs.Dayjs;
      let endDayjs: dayjs.Dayjs;
      let durationMinutes: number;

      if (serverDuration > 0) {
        // Task has explicit duration: ends at end_time, starts (duration) before
        endDayjs = rawEndDayjs;
        startDayjs = endDayjs.subtract(serverDuration, 'minute');
        durationMinutes = serverDuration;
      } else if (task.end_time) {
        // Task has deadline but no duration: show at end_time with default 30 min
        endDayjs = rawEndDayjs;
        startDayjs = endDayjs.subtract(30, 'minute');
        durationMinutes = 30;
      } else {
        // No end_time: fall back to start_time
        startDayjs = rawStartDayjs;
        endDayjs = startDayjs.add(30, 'minute');
        durationMinutes = 30;
      }

      // Tasks in this app are never truly "all-day" or "multi-day" events.
      // They are tasks with a deadline. Never mark them as spanning multiple days.
      const isAllDay = false;
      const isMultiDay = false;

      return {
        ...task,
        displayColor,
        startDayjs,
        endDayjs,
        durationMinutes: Math.max(durationMinutes, 30), // min 30 min for display
        isMultiDay,
        isAllDay,
      };
    });
  }, [rawTasks, colorService]);

  // Filtered tasks by enabled categories
  const filteredTasks = useMemo(() => {
    if (enabledCategories.size === 0) return calendarTasks;
    return calendarTasks.filter(t => {
      const cat = (t.category_name || '').toLowerCase().trim();
      return enabledCategories.has(cat);
    });
  }, [calendarTasks, enabledCategories]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load color service
      await colorService.load();

      // Try AppInitializer cache first
      if (appInitializer.isDataReady()) {
        const cachedTasks = await cacheService.getCachedTasks();
        if (cachedTasks.length > 0) {
          setRawTasks(cachedTasks);
          setIsLoading(false);

          // Load categories
          const cats = await cacheService.getCachedCategories();
          setCategories(cats);
          colorService.assignColors(cats.map((c: any) => c.name));
          return;
        }
      }

      // Wait for data
      const dataReady = await appInitializer.waitForDataLoad(3000);
      if (dataReady) {
        const cachedTasks = await cacheService.getCachedTasks();
        if (cachedTasks.length > 0) {
          setRawTasks(cachedTasks);
          setIsLoading(false);
          const cats = await cacheService.getCachedCategories();
          setCategories(cats);
          colorService.assignColors(cats.map((c: any) => c.name));
          return;
        }
      }

      // Fallback to API
      const [tasksData, catsData] = await Promise.all([
        getAllTasks(true),
        getCategories(true),
      ]);
      if (Array.isArray(tasksData)) setRawTasks(tasksData);
      if (Array.isArray(catsData)) {
        setCategories(catsData);
        colorService.assignColors(catsData.map((c: any) => c.name));
      }
    } catch (error) {
      console.error('[CALENDAR20] Error loading tasks:', error);
      const cachedTasks = await cacheService.getCachedTasks();
      if (cachedTasks.length > 0) setRawTasks(cachedTasks);
    } finally {
      setIsLoading(false);
    }
  }, [cacheService, appInitializer, colorService]);

  // Initial load
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  // Event emitter subscriptions
  useEffect(() => {
    const handleTaskAdded = (newTask: Task) => {
      setRawTasks(prev => {
        if (prev.some(t => (t.id === newTask.id) || (t.task_id === newTask.task_id))) return prev;
        return [...prev, newTask];
      });
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setRawTasks(prev =>
        prev.map(t => {
          const isMatch =
            (t.id === updatedTask.id) ||
            (t.task_id === updatedTask.task_id) ||
            (updatedTask.id && t.task_id === updatedTask.id) ||
            (updatedTask.task_id && t.id === updatedTask.task_id);
          return isMatch ? { ...t, ...updatedTask } : t;
        })
      );
    };

    const handleTaskDeleted = (taskId: string | number) => {
      setRawTasks(prev => prev.filter(t => t.id !== taskId && t.task_id !== taskId));
    };

    const handleTasksSynced = ({ tasks }: { tasks: Task[] }) => {
      if (Array.isArray(tasks)) setRawTasks(tasks);
    };

    eventEmitter.on(EVENTS.TASK_ADDED, handleTaskAdded);
    eventEmitter.on(EVENTS.TASK_UPDATED, handleTaskUpdated);
    eventEmitter.on(EVENTS.TASK_DELETED, handleTaskDeleted);
    eventEmitter.on(EVENTS.TASKS_SYNCED, handleTasksSynced);

    return () => {
      eventEmitter.off(EVENTS.TASK_ADDED, handleTaskAdded);
      eventEmitter.off(EVENTS.TASK_UPDATED, handleTaskUpdated);
      eventEmitter.off(EVENTS.TASK_DELETED, handleTaskDeleted);
      eventEmitter.off(EVENTS.TASKS_SYNCED, handleTasksSynced);
    };
  }, []);

  // Navigation
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      switch (viewType) {
        case 'month':
          return direction === 'next' ? prev.add(1, 'month') : prev.subtract(1, 'month');
        case 'week':
          return direction === 'next' ? prev.add(1, 'week') : prev.subtract(1, 'week');
        case '3day':
          return direction === 'next' ? prev.add(1, 'day') : prev.subtract(1, 'day');
        case 'day':
          return direction === 'next' ? prev.add(1, 'day') : prev.subtract(1, 'day');
        case 'agenda':
          return direction === 'next' ? prev.add(1, 'month') : prev.subtract(1, 'month');
        default:
          return prev;
      }
    });
  }, [viewType]);

  const handleViewChange = useCallback(async (newView: CalendarViewType) => {
    setViewType(newView);
    setViewSelectorVisible(false);
    try {
      await AsyncStorage.setItem(VIEW_PREF_KEY, newView);
    } catch {}
  }, []);

  const handleDatePress = useCallback((date: dayjs.Dayjs) => {
    // Apri il modal per creare un task con la data selezionata
    setSelectedDateForTask(date);
    setAddTaskVisible(true);
  }, []);

  const handleTaskPress = useCallback((task: CalendarTask) => {
    // Navigate to day view for the task
    setCurrentDate(task.startDayjs);
    if (viewType === 'month') {
      setViewType('day');
    }
  }, [viewType]);

  const handleToggleComplete = useCallback(async (task: CalendarTask) => {
    const taskId = task.task_id || task.id;
    const isCompleted = task.status?.toLowerCase() === 'completato' || task.status?.toLowerCase() === 'completed';
    try {
      if (isCompleted) {
        await disCompleteTask(taskId);
      } else {
        await completeTask(taskId);
      }
    } catch (error) {
      console.error('[CALENDAR20] Error toggling task completion:', error);
    }
  }, []);

  const handleSaveTask = useCallback(async (
    title: string,
    description: string,
    dueDate: string,
    priority: number,
    categoryNameParam?: string,
    recurrence?: any,
    durationMinutes?: number | null
  ) => {
    const { addTask } = await import('../../services/taskService');
    const priorityString = priority === 1 ? 'Bassa' : priority === 2 ? 'Media' : 'Alta';
    const category = categoryNameParam || 'Calendario';
    // Usa la data selezionata se disponibile, altrimenti usa la data corrente
    const taskDate = selectedDateForTask || currentDate;
    const newTask: Task = {
      title: title.trim(),
      description: description || '',
      start_time: taskDate.toISOString(),
      end_time: new Date(dueDate).toISOString(),
      priority: priorityString,
      status: 'In sospeso',
      category_name: category,
    };
    // Add duration_minutes if provided (API v2.1.0)
    if (durationMinutes !== undefined && durationMinutes !== null) {
      newTask.duration_minutes = durationMinutes;
    }
    try {
      await addTask(newTask);
    } catch (error) {
      console.error('[CALENDAR20] Error adding task:', error);
    }
    setAddTaskVisible(false);
    setSelectedDateForTask(null);
  }, [currentDate, selectedDateForTask]);

  const handleCategoryToggle = useCallback((categoryName: string) => {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      const key = categoryName.toLowerCase().trim();
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      // If all categories are deselected, show all
      if (next.size === categories.length) {
        return new Set();
      }
      return next;
    });
  }, [categories.length]);

  const handleShowAll = useCallback(() => {
    setEnabledCategories(new Set());
  }, []);

  const renderView = () => {
    const commonProps = {
      currentDate,
      tasks: filteredTasks,
      onDatePress: handleDatePress,
      onTaskPress: handleTaskPress,
      onToggleComplete: handleToggleComplete,
      onSwipeLeft: () => navigateDate('next'),
      onSwipeRight: () => navigateDate('prev'),
    };

    switch (viewType) {
      case 'month':
        return <MonthView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case '3day':
        return <ThreeDayView {...commonProps} />;
      case 'day':
        return <DayView {...commonProps} />;
      case 'agenda':
        return <AgendaView {...commonProps} />;
      default:
        return <MonthView {...commonProps} />;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        currentDate={currentDate}
        viewType={viewType}
        onMenuPress={() => setViewSelectorVisible(true)}
        onSearchPress={() => setSearchVisible(true)}
        onTodayPress={() => setCurrentDate(dayjs())}
        onTitlePress={() => setMiniCalendarVisible(true)}
        onClose={onClose}
      />

      {renderView()}

      <FABMenu
        onNewTask={() => {
          setSelectedDateForTask(null);
          setAddTaskVisible(true);
        }}
      />

      <ViewSelector
        visible={viewSelectorVisible}
        currentView={viewType}
        categories={categories}
        enabledCategories={enabledCategories}
        colorService={colorService}
        onViewChange={handleViewChange}
        onCategoryToggle={handleCategoryToggle}
        onShowAll={handleShowAll}
        onClose={() => setViewSelectorVisible(false)}
      />

      <SearchOverlay
        visible={searchVisible}
        tasks={calendarTasks}
        onTaskPress={(task) => {
          setSearchVisible(false);
          setCurrentDate(task.startDayjs);
          setViewType('day');
        }}
        onClose={() => setSearchVisible(false)}
      />

      <MiniCalendar
        visible={miniCalendarVisible}
        currentDate={currentDate}
        onDateSelect={(date) => {
          setCurrentDate(date);
          setMiniCalendarVisible(false);
        }}
        onClose={() => setMiniCalendarVisible(false)}
      />

      <AddTask
        visible={addTaskVisible}
        onClose={() => {
          setAddTaskVisible(false);
          setSelectedDateForTask(null);
        }}
        onSave={handleSaveTask}
        allowCategorySelection={true}
        categoryName="Calendario"
        initialDate={(selectedDateForTask || currentDate).format('YYYY-MM-DD')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default Calendar20View;
