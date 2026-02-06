import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_POOL = [
  '#007AFF', // App Blue
  '#34A853', // Green
  '#EA4335', // Red
  '#A142F4', // Purple
  '#F4A125', // Orange
  '#00ACC1', // Teal
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#FF7043', // Deep Orange
  '#66BB6A', // Light Green
  '#AB47BC', // Medium Purple
];

const STORAGE_KEY = '@calendar20_category_colors';

class CategoryColorService {
  private static instance: CategoryColorService;
  private colorMap: Record<string, string> = {};
  private loaded = false;

  static getInstance(): CategoryColorService {
    if (!CategoryColorService.instance) {
      CategoryColorService.instance = new CategoryColorService();
    }
    return CategoryColorService.instance;
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.colorMap = JSON.parse(stored);
      }
    } catch {
      this.colorMap = {};
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.colorMap));
    } catch {
      // silent fail
    }
  }

  getColor(categoryName: string): string {
    if (!categoryName) return COLOR_POOL[0];

    const key = categoryName.toLowerCase().trim();
    if (this.colorMap[key]) {
      return this.colorMap[key];
    }

    // Assign next available color from pool
    const usedColors = new Set(Object.values(this.colorMap));
    let color = COLOR_POOL.find(c => !usedColors.has(c));
    if (!color) {
      // All colors used, cycle based on hash
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
      }
      color = COLOR_POOL[Math.abs(hash) % COLOR_POOL.length];
    }

    this.colorMap[key] = color;
    this.save();
    return color;
  }

  assignColors(categoryNames: string[]): void {
    categoryNames.forEach(name => this.getColor(name));
  }
}

export default CategoryColorService;
export { COLOR_POOL };
