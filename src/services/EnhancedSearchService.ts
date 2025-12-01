import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_HISTORY = 'search_history';
const MAX_HISTORY_ITEMS = 15;

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  end_time?: string;
  matchType: 'title' | 'description' | 'category' | 'priority' | 'status';
  relevanceScore: number;
}

export interface SearchHistory {
  query: string;
  timestamp: number;
  resultCount: number;
}

/**
 * Servizio per la ricerca avanzata dei task
 */
export class EnhancedSearchService {
  /**
   * Ricerca task con fuzzy matching
   */
  static searchTasks(query: string, tasks: any[]): SearchResult[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];
    const queryWords = lowerQuery.split(/\s+/);

    for (const task of tasks) {
      let relevanceScore = 0;
      let matchType: SearchResult['matchType'] = 'title';

      // Ricerca nel titolo (peso maggiore)
      if (task.title) {
        const titleMatch = this.calculateFuzzyMatch(lowerQuery, task.title.toLowerCase());
        if (titleMatch > 0) {
          relevanceScore += titleMatch * 3; // Peso 3x per il titolo
          matchType = 'title';
        }
      }

      // Ricerca nella descrizione (peso medio)
      if (task.description && relevanceScore < 2) {
        const descMatch = this.calculateFuzzyMatch(lowerQuery, task.description.toLowerCase());
        if (descMatch > 0) {
          relevanceScore += descMatch * 1.5;
          matchType = 'description';
        }
      }

      // Ricerca nella categoria
      if (task.category_name && relevanceScore < 2) {
        const categoryMatch = this.calculateFuzzyMatch(lowerQuery, task.category_name.toLowerCase());
        if (categoryMatch > 0) {
          relevanceScore += categoryMatch * 2;
          matchType = 'category';
        }
      }

      // Ricerca nella priorità
      if (task.priority && relevanceScore < 1) {
        const priorityMatch = this.calculateFuzzyMatch(lowerQuery, task.priority.toLowerCase());
        if (priorityMatch > 0) {
          relevanceScore += priorityMatch;
          matchType = 'priority';
        }
      }

      // Ricerca nello status
      if (task.status && relevanceScore < 1) {
        const statusMatch = this.calculateFuzzyMatch(lowerQuery, task.status.toLowerCase());
        if (statusMatch > 0) {
          relevanceScore += statusMatch;
          matchType = 'status';
        }
      }

      if (relevanceScore > 0) {
        results.push({
          id: task.id || task.task_id,
          title: task.title,
          description: task.description,
          category: task.category_name,
          priority: task.priority,
          status: task.status,
          end_time: task.end_time,
          matchType,
          relevanceScore,
        });
      }
    }

    // Ordina per relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calcola il match fuzzy tra due stringhe
   * Ritorna un valore tra 0 e 1
   */
  private static calculateFuzzyMatch(query: string, text: string): number {
    if (query === text) return 1; // Match esatto
    if (text.includes(query)) return 0.9; // Contiene la query
    if (text.startsWith(query)) return 0.8; // Inizia con la query

    // Levenshtein distance per fuzzy matching
    const maxLen = Math.max(query.length, text.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(query, text);
    const similarity = 1 - distance / maxLen;

    return Math.max(0, similarity * 0.7); // Max 0.7 per fuzzy match
  }

  /**
   * Calcola la distanza di Levenshtein tra due stringhe
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Salva una ricerca nello storico
   */
  static async saveSearchToHistory(query: string, resultCount: number = 0): Promise<void> {
    try {
      const history = await this.getSearchHistory();

      // Rimuovi se esiste già
      const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());

      // Aggiungi in testa
      const newHistory = [
        {
          query,
          timestamp: Date.now(),
          resultCount,
        },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
    } catch (error) {
      console.warn('Errore salvataggio storico ricerca:', error);
    }
  }

  /**
   * Recupera lo storico delle ricerche
   */
  static async getSearchHistory(): Promise<SearchHistory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Errore recupero storico ricerca:', error);
      return [];
    }
  }

  /**
   * Cancella lo storico delle ricerche
   */
  static async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (error) {
      console.warn('Errore cancellazione storico ricerca:', error);
    }
  }

  /**
   * Rimuove una voce dallo storico
   */
  static async removeSearchHistoryItem(query: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Errore rimozione voce storico:', error);
    }
  }

  /**
   * Filtra task per campi specifici
   */
  static filterTasksByFields(
    tasks: any[],
    filters: {
      status?: string;
      priority?: string;
      category?: string;
    }
  ): any[] {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.category && task.category_name !== filters.category) return false;
      return true;
    });
  }

  /**
   * Combina ricerca e filtri
   */
  static searchWithFilters(
    query: string,
    tasks: any[],
    filters?: {
      status?: string;
      priority?: string;
      category?: string;
    }
  ): SearchResult[] {
    const filtered = filters ? this.filterTasksByFields(tasks, filters) : tasks;
    return this.searchTasks(query, filtered);
  }

  /**
   * Ottiene suggerimenti di ricerca basati su task
   */
  static getSearchSuggestions(tasks: any[], limit: number = 10): string[] {
    const suggestions = new Set<string>();

    for (const task of tasks) {
      if (task.title && suggestions.size < limit) {
        suggestions.add(task.title);
      }
      if (task.category_name && suggestions.size < limit) {
        suggestions.add(task.category_name);
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }
}
