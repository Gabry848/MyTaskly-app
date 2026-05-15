import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Task } from '../../services/taskService';
import { CardSurface, AppText, StatusChip } from '../UI/foundation';
import { colors, spacing } from '../../theme/tokens';

export interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const { t } = useTranslation();

  const sanitizeString = (value: any): string => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  };

  const formatTaskTime = (startTime?: string, endTime?: string, nextOccurrence?: string): string => {
    const dateToShow = nextOccurrence || endTime || startTime;

    if (!dateToShow) {
      return t('taskCard.noDeadline');
    }

    const now = dayjs();
    const taskDate = dayjs(dateToShow);

    let datePrefix = '';
    if (taskDate.isSame(now, 'day')) {
      datePrefix = t('taskCard.today') + ' ';
    } else if (taskDate.isSame(now.add(1, 'day'), 'day')) {
      datePrefix = t('taskCard.tomorrow') + ' ';
    } else {
      datePrefix = taskDate.format('DD/MM ');
    }

    const timeRange = dayjs(dateToShow).format('HH:mm');

    return datePrefix + timeRange;
  };

  const computeNextOccurrence = (): string | null => {
    const pattern = task.recurrence_pattern;
    if (!pattern) return null;

    const interval = task.recurrence_interval || 1;
    const now = dayjs();

    if (pattern === 'daily') {
      return now.add(interval, 'day').hour(9).minute(0).second(0).toISOString();
    }

    if (pattern === 'weekly') {
      const days = task.recurrence_days_of_week;
      if (days && days.length > 0) {
        const todayDow = now.day() === 0 ? 7 : now.day();
        const sortedDays = [...days].sort((a, b) => a - b);
        const nextDay = sortedDays.find(d => d > todayDow) ?? sortedDays[0];
        const daysUntil = nextDay > todayDow
          ? nextDay - todayDow
          : 7 - todayDow + nextDay;
        return now.add(daysUntil, 'day').hour(9).minute(0).second(0).toISOString();
      }
      return now.add(interval * 7, 'day').hour(9).minute(0).second(0).toISOString();
    }

    if (pattern === 'monthly') {
      const dayOfMonth = task.recurrence_day_of_month || 1;
      let next = now.date(dayOfMonth).hour(9).minute(0).second(0);
      if (next.isBefore(now) || next.isSame(now, 'day')) {
        next = next.add(interval, 'month');
      }
      return next.toISOString();
    }

    return null;
  };

  const getRecurrenceDescription = (): string | null => {
    if (!task.is_recurring || !task.recurrence_pattern) return null;

    const interval = task.recurrence_interval || 1;

    if (task.recurrence_pattern === 'daily') {
      return interval === 1
        ? t('taskCard.recurring.daily')
        : t('taskCard.recurring.daily_plural', { count: interval });
    }

    if (task.recurrence_pattern === 'weekly') {
      const dayNames = [
        t('taskCard.daysOfWeek.monday'),
        t('taskCard.daysOfWeek.tuesday'),
        t('taskCard.daysOfWeek.wednesday'),
        t('taskCard.daysOfWeek.thursday'),
        t('taskCard.daysOfWeek.friday'),
        t('taskCard.daysOfWeek.saturday'),
        t('taskCard.daysOfWeek.sunday')
      ];
      if (task.recurrence_days_of_week && task.recurrence_days_of_week.length > 0) {
        const days = task.recurrence_days_of_week.map(d => dayNames[d - 1]).join(', ');
        return interval === 1
          ? t('taskCard.recurring.weekly_days', { days })
          : t('taskCard.recurring.weekly_days_plural', { count: interval, days });
      }
      return interval === 1
        ? t('taskCard.recurring.weekly')
        : t('taskCard.recurring.weekly_plural', { count: interval });
    }

    if (task.recurrence_pattern === 'monthly') {
      const day = task.recurrence_day_of_month || 1;
      return interval === 1
        ? t('taskCard.recurring.monthly', { day })
        : t('taskCard.recurring.monthly_plural', { count: interval, day });
    }

    return t('taskCard.recurring.label');
  };

  const formatDuration = (minutes?: number | null): string | null => {
    if (!minutes) return null;
    if (minutes < 60) return t('taskCard.duration.minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return hours === 1
        ? t('taskCard.duration.hour')
        : t('taskCard.duration.hours', { count: hours });
    }
    return t('taskCard.duration.hourMinutes', { hours, minutes: remainingMinutes });
  };

  const priorityColors: Record<string, string> = {
    [t('taskCard.priority.high')]: '#000000',
    [t('taskCard.priority.medium')]: '#333333',
    [t('taskCard.priority.low')]: '#666666',
    'default': '#999999'
  };

  const cardColor = task.priority
    ? priorityColors[task.priority] || priorityColors.default
    : priorityColors.default;

  return (
    <CardSurface
      variant="interactive"
      accentColor={cardColor}
      accentWidth={5}
      style={styles.card}
      onPress={() => onPress && onPress(task)}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText variant="body" weight="500" style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {sanitizeString(task.title)}
          </AppText>
          {(task.is_recurring || task.is_generated_instance) && (
            <StatusChip
              label=""
              tone="accent"
              leftIcon={<Ionicons name="repeat" size={14} color={colors.accent} />}
              style={styles.recurringBadge}
            />
          )}
        </View>

        {(() => {
          const description = sanitizeString(task.description);
          return description && description !== 'null' && description !== '' ? (
            <AppText variant="caption" color={colors.textSecondary} style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {description}
            </AppText>
          ) : null;
        })()}

        {task.is_recurring && getRecurrenceDescription() && (
          <AppText variant="caption" color={colors.accent} style={styles.recurrenceDesc}>
            {getRecurrenceDescription()}
          </AppText>
        )}

        {task.is_recurring && task.recurrence_current_count !== undefined && task.recurrence_current_count > 0 && (
          <AppText variant="caption" color={colors.textSecondary} style={styles.completionCount}>
            {task.recurrence_current_count === 1
              ? t('taskCard.completion.single', { count: task.recurrence_current_count })
              : t('taskCard.completion.plural', { count: task.recurrence_current_count })}
          </AppText>
        )}

        <View style={styles.metadata}>
          {(() => {
            const categoryName = sanitizeString(task.category_name);
            return categoryName && categoryName !== 'null' && categoryName !== '' ? (
              <StatusChip label={categoryName} tone="neutral" />
            ) : null;
          })()}

          <StatusChip
            label={sanitizeString(task.status)}
            tone={task.status === 'Completato' ? 'success' : 'neutral'}
          />
        </View>

        {formatDuration(task.duration_minutes) && (
          <View style={styles.durationRow}>
            <AppText variant="label" color={colors.textSecondary}>
              {formatDuration(task.duration_minutes)}
            </AppText>
          </View>
        )}

        {(() => {
          const isRecurring = task.is_recurring || task.is_generated_instance;
          if (isRecurring) {
            const dateString = task.next_occurrence || task.end_time || computeNextOccurrence();
            const label = dateString
              ? formatTaskTime(undefined, dateString, undefined)
              : t('taskCard.recurring.label');
            return (
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={13} color={colors.accent} />
                <AppText variant="label" color={colors.accent}>{label}</AppText>
              </View>
            );
          }
          const dateString = task.end_time;
          const label = dateString
            ? formatTaskTime(task.start_time, task.end_time)
            : t('taskCard.noDeadline');
          return (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
              <AppText variant="label" color={colors.textTertiary}>{label}</AppText>
            </View>
          );
        })()}
      </View>
    </CardSurface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 2,
  },
  content: {
    flexDirection: 'column',
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
  },
  recurringBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  description: {
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurrenceDesc: {
    marginBottom: 6,
  },
  completionCount: {
    marginBottom: 6,
    fontStyle: 'italic',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
});

export default TaskCard;
