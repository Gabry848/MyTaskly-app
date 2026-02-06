import { Task } from '../../services/taskService';
import dayjs from 'dayjs';

export type CalendarViewType = 'month' | 'week' | '3day' | 'day' | 'agenda';

export interface CalendarTask extends Task {
  displayColor: string;
  startDayjs: dayjs.Dayjs;
  endDayjs: dayjs.Dayjs;
  durationMinutes: number;
  isMultiDay: boolean;
  isAllDay: boolean;
}

export interface DayData {
  date: dayjs.Dayjs;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTask[];
}

export interface WeekData {
  days: DayData[];
}

export interface TimeSlot {
  hour: number;
  tasks: CalendarTask[];
}

export interface OverlapColumn {
  task: CalendarTask;
  column: number;
  totalColumns: number;
}

export interface CategoryColor {
  categoryName: string;
  categoryId?: string | number;
  color: string;
}
