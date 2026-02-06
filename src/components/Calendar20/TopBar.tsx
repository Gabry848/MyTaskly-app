import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarViewType } from './types';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

interface TopBarProps {
  currentDate: dayjs.Dayjs;
  viewType: CalendarViewType;
  onMenuPress: () => void;
  onSearchPress: () => void;
  onTodayPress: () => void;
  onTitlePress: () => void;
  onClose?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentDate,
  viewType,
  onMenuPress,
  onSearchPress,
  onTodayPress,
  onTitlePress,
  onClose,
}) => {
  const { t } = useTranslation();

  const getTitle = (): string => {
    switch (viewType) {
      case 'month':
        return currentDate.format('MMMM YYYY');
      case 'week':
      case '3day': {
        const start = currentDate.startOf('week');
        const end = start.add(6, 'day');
        if (start.month() === end.month()) {
          return `${start.format('D')} - ${end.format('D MMM YYYY')}`;
        }
        return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
      }
      case 'day':
        return currentDate.format('ddd, D MMMM YYYY');
      case 'agenda':
        return currentDate.format('MMMM YYYY');
      default:
        return currentDate.format('MMMM YYYY');
    }
  };

  const isToday = currentDate.isSame(dayjs(), 'day');

  return (
    <View style={styles.container}>
      {onClose ? (
        <TouchableOpacity onPress={onClose} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={28} color="#000000" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="options-outline" size={26} color="#000000" />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onTitlePress} style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{getTitle()}</Text>
        <Ionicons name="chevron-down" size={18} color="#666666" style={styles.chevron} />
      </TouchableOpacity>

      <View style={styles.rightActions}>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="search-outline" size={24} color="#000000" />
        </TouchableOpacity>
        {!isToday && (
          <TouchableOpacity onPress={onTodayPress} style={styles.todayButton}>
            <Text style={styles.todayText}>{t('calendar20.today')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  iconButton: {
    padding: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '200',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -1,
  },
  chevron: {
    marginLeft: 6,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  todayText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
});

export default React.memo(TopBar);
