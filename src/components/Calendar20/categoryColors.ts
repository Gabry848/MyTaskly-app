import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_POOL = [
  '#3A3A3C', // Charcoal (primary, matches black theme)
  '#636366', // Medium Gray
  '#48484A', // Dark Gray
  '#8E8E93', // System Gray
  '#5E5CE6', // Indigo (muted)
  '#6E6E73', // Warm Gray
  '#007AFF', // App Blue (accent)
  '#A2845E', // Warm Brown
  '#787880', // Cool Gray
  '#98989D', // Light Gray
  '#545456', // Graphite
  '#6C6C70', // Ash Gray
];

const STORAGE_KEY = '@calendar20_category_colors';
// Bump this version when COLOR_POOL changes to force a re-assignment
const COLOR_VERSION_KEY = '@calendar20_color_version';
const CURRENT_COLOR_VERSION = '2';

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
      const version = await AsyncStorage.getItem(COLOR_VERSION_KEY);
      if (version !== CURRENT_COLOR_VERSION) {
        // Color palette changed: clear old cached colors and re-assign
        await AsyncStorage.removeItem(STORAGE_KEY);
        await AsyncStorage.setItem(COLOR_VERSION_KEY, CURRENT_COLOR_VERSION);
        this.colorMap = {};
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.colorMap = JSON.parse(stored);
        }
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
