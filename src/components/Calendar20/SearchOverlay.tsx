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
import TaskCard from '../Task/TaskCard';
import { Task } from '../../services/taskService';

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
              <TaskCard
                task={item as Task}
                onPress={() => {
                  handleClose();
                  onTaskPress(item);
                }}
              />
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    fontSize: 17,
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
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999999',
    fontFamily: 'System',
    marginTop: 12,
  },
});

export default React.memo(SearchOverlay);
