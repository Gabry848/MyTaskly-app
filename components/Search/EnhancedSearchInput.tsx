import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EnhancedSearchService, SearchHistory } from '../../src/services/EnhancedSearchService';

interface EnhancedSearchInputProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  onSearch,
  onClear,
  placeholder = 'Cerca task, categorie...',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const hist = await EnhancedSearchService.getSearchHistory();
    setHistory(hist);
  };

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
      EnhancedSearchService.saveSearchToHistory(trimmedQuery);
      setShowHistory(false);
      loadSearchHistory();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  const handleHistoryPress = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const handleDeleteHistory = async (historyQuery: string) => {
    await EnhancedSearchService.removeSearchHistoryItem(historyQuery);
    loadSearchHistory();
  };

  const handleClearAllHistory = async () => {
    await EnhancedSearchService.clearSearchHistory();
    setHistory([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setShowHistory(true)}
          onSubmitEditing={() => handleSearch(query)}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        {query && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search History Modal */}
      <Modal
        visible={showHistory && history.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHistory(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowHistory(false)}
        >
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Ricerche recenti</Text>
              <TouchableOpacity onPress={handleClearAllHistory}>
                <Text style={styles.clearAllButton}>Cancella tutto</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={history}
              keyExtractor={(item) => item.query}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => handleHistoryPress(item.query)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyItemContent}>
                    <MaterialIcons
                      name="history"
                      size={18}
                      color="#FF6B35"
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyItemQuery}>{item.query}</Text>
                      {item.resultCount > 0 && (
                        <Text style={styles.historyItemCount}>
                          {item.resultCount} risultati
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteHistory(item.query)}
                    style={styles.deleteHistoryButton}
                  >
                    <MaterialIcons name="close" size={16} color="#999" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    marginRight: -8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  historyContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    maxHeight: '50%',
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clearAllButton: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B35',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemQuery: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  historyItemCount: {
    fontSize: 11,
    color: '#999',
  },
  deleteHistoryButton: {
    padding: 8,
    marginRight: -8,
  },
});

export default EnhancedSearchInput;
