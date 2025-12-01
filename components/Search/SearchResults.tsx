import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SearchResult } from '../../src/services/EnhancedSearchService';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultPress?: (result: SearchResult) => void;
  emptyMessage?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading = false,
  onResultPress,
  emptyMessage = 'Nessun risultato trovato',
}) => {
  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.loadingText}>Ricerca in corso...</Text>
      </View>
    );
  }

  if (!results || results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="search-off" size={48} color="#ccc" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const getMatchIcon = (matchType: SearchResult['matchType']) => {
    const icons: Record<SearchResult['matchType'], string> = {
      title: 'task-alt',
      description: 'description',
      category: 'category',
      priority: 'priority-high',
      status: 'info',
    };
    return icons[matchType];
  };

  const getMatchLabel = (matchType: SearchResult['matchType']) => {
    const labels: Record<SearchResult['matchType'], string> = {
      title: 'Titolo',
      description: 'Descrizione',
      category: 'Categoria',
      priority: 'Priorità',
      status: 'Stato',
    };
    return labels[matchType];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.resultCountText}>
        {results.length} {results.length === 1 ? 'risultato' : 'risultati'}
      </Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => onResultPress?.(item)}
            activeOpacity={0.7}
          >
            <View style={styles.resultContent}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.matchBadge,
                    { backgroundColor: this.getRelevanceColor(item.relevanceScore) },
                  ]}
                >
                  <MaterialIcons
                    name={getMatchIcon(item.matchType)}
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.matchLabel}>{getMatchLabel(item.matchType)}</Text>
                </View>
              </View>

              {item.description && (
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              <View style={styles.resultMetadata}>
                {item.category && (
                  <View style={styles.metadataItem}>
                    <MaterialIcons name="label" size={12} color="#FF6B35" />
                    <Text style={styles.metadataText}>{item.category}</Text>
                  </View>
                )}
                {item.priority && (
                  <View style={styles.metadataItem}>
                    <MaterialIcons name="flag" size={12} color="#FF6B35" />
                    <Text style={styles.metadataText}>{item.priority}</Text>
                  </View>
                )}
                {item.status && (
                  <View style={styles.metadataItem}>
                    <MaterialIcons name="info" size={12} color="#FF6B35" />
                    <Text style={styles.metadataText}>{item.status}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Helper function to get color based on relevance
const getRelevanceColor = (score: number): string => {
  if (score >= 2.5) return '#4CAF50'; // Alta relevance
  if (score >= 1.5) return '#FFC107'; // Media relevance
  return '#FF9800'; // Bassa relevance
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  resultCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultItem: {
    marginHorizontal: 8,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  resultDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  resultMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#fff',
    borderRadius: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metadataText: {
    fontSize: 11,
    color: '#666',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});

// Helper function - needs to be exported separately
export const getRelevanceColor = getRelevanceColor;

export default SearchResults;
