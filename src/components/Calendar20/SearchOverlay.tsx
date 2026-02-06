import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarTask } from './types';
import { useTranslation } from 'react-i18next';

interface SearchOverlayProps {
  visible: boolean;
  tasks: CalendarTask[];
  onTaskPress: (task: CalendarTask) => void;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  visible,
  tasks,
  onTaskPress,
  onClose,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return tasks
      .filter(task => {
        const title = (task.title || '').toLowerCase();
        const desc = (task.description || '').toLowerCase();
        const category = (task.category_name || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || category.includes(q);
      })
      .sort((a, b) => a.startDayjs.valueOf() - b.startDayjs.valueOf())
      .slice(0, 50);
  }, [query, tasks]);

  const handleClose = () => {
    setQuery('');
    Keyboard.dismiss();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999999" />
            <TextInput
              style={styles.input}
              placeholder={t('calendar20.search.placeholder')}
              placeholderTextColor="#999999"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#cccccc" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{t('common.buttons.cancel')}</Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {query.trim().length > 0 && results.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search" size={40} color="#cccccc" />
              <Text style={styles.noResultsText}>{t('calendar20.search.noResults')}</Text>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item, i) => (item.task_id || item.id || i).toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => {
                  handleClose();
                  onTaskPress(item);
                }}
              >
                <View style={[styles.colorDot, { backgroundColor: item.displayColor }]} />
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.resultDate}>
                    {item.startDayjs.format('ddd, D MMM YYYY')}
                    {!item.isAllDay && ` ${item.startDayjs.format('HH:mm')}`}
                  </Text>
                </View>
                {item.category_name && (
                  <Text style={[styles.resultCategory, { color: item.displayColor }]} numberOfLines={1}>
                    {item.category_name}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    color: '#000000',
    marginLeft: 8,
    marginRight: 8,
    paddingVertical: 4,
  },
  cancelButton: {
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'System',
  },
  resultsList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
  resultDate: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'System',
    marginTop: 2,
  },
  resultCategory: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'System',
    maxWidth: 80,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 15,
    color: '#999999',
    fontFamily: 'System',
    marginTop: 12,
  },
});

export default React.memo(SearchOverlay);
