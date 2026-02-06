import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

dayjs.extend(isoWeek);

interface MiniCalendarProps {
  visible: boolean;
  currentDate: dayjs.Dayjs;
  onDateSelect: (date: dayjs.Dayjs) => void;
  onClose: () => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  visible,
  currentDate,
  onDateSelect,
  onClose,
}) => {
  const { t } = useTranslation();
  const [displayMonth, setDisplayMonth] = useState(currentDate);

  const weeks = useMemo(() => {
    const startOfMonth = displayMonth.startOf('month');
    const endOfMonth = displayMonth.endOf('month');
    const startDate = startOfMonth.startOf('isoWeek');
    const endDate = endOfMonth.endOf('isoWeek');
    const today = dayjs();

    const result: { date: dayjs.Dayjs; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[][] = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const week: typeof result[0] = [];
      for (let i = 0; i < 7; i++) {
        week.push({
          date: current,
          isCurrentMonth: current.month() === displayMonth.month(),
          isToday: current.isSame(today, 'day'),
          isSelected: current.isSame(currentDate, 'day'),
        });
        current = current.add(1, 'day');
      }
      result.push(week);
    }
    return result;
  }, [displayMonth, currentDate]);

  const dayHeaders = useMemo(() => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(d => t(`calendar.days.${d}`));
  }, [t]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setDisplayMonth(p => p.subtract(1, 'month'))}>
              <Ionicons name="chevron-back" size={20} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{displayMonth.format('MMMM YYYY')}</Text>
            <TouchableOpacity onPress={() => setDisplayMonth(p => p.add(1, 'month'))}>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.headerRow}>
            {dayHeaders.map((d, i) => (
              <Text key={i} style={styles.headerText}>{d.toUpperCase()}</Text>
            ))}
          </View>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => (
                <TouchableOpacity
                  key={di}
                  onPress={() => onDateSelect(day.date)}
                  style={[
                    styles.dayCell,
                    day.isSelected && styles.selectedCell,
                    day.isToday && !day.isSelected && styles.todayCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.otherMonthText,
                      day.isSelected && styles.selectedText,
                      day.isToday && !day.isSelected && styles.todayText,
                    ]}
                  >
                    {day.date.date()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Today button */}
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => {
              setDisplayMonth(dayjs());
              onDateSelect(dayjs());
            }}
          >
            <Text style={styles.todayButtonText}>{t('calendar20.today')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    fontFamily: 'System',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectedCell: {
    backgroundColor: '#000000',
    borderRadius: 14,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 14,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
  otherMonthText: {
    color: '#cccccc',
  },
  selectedText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  todayText: {
    color: '#000000',
    fontWeight: '600',
  },
  todayButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  todayButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
});

export default React.memo(MiniCalendar);
