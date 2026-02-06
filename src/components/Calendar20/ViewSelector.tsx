import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarViewType } from './types';
import CategoryColorService from './categoryColors';
import { useTranslation } from 'react-i18next';

interface ViewSelectorProps {
  visible: boolean;
  currentView: CalendarViewType;
  categories: any[];
  enabledCategories: Set<string>;
  colorService: CategoryColorService;
  onViewChange: (view: CalendarViewType) => void;
  onCategoryToggle: (categoryName: string) => void;
  onShowAll: () => void;
  onClose: () => void;
}

const VIEW_OPTIONS: { key: CalendarViewType; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { key: 'month', icon: 'grid-outline', labelKey: 'calendar20.views.month' },
  { key: 'week', icon: 'calendar-outline', labelKey: 'calendar20.views.week' },
  { key: '3day', icon: 'albums-outline', labelKey: 'calendar20.views.threeDay' },
  { key: 'day', icon: 'today-outline', labelKey: 'calendar20.views.day' },
  { key: 'agenda', icon: 'list-outline', labelKey: 'calendar20.views.agenda' },
];

const ViewSelector: React.FC<ViewSelectorProps> = ({
  visible,
  currentView,
  categories,
  enabledCategories,
  colorService,
  onViewChange,
  onCategoryToggle,
  onShowAll,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('calendar20.drawer.settings')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Views section */}
            <Text style={styles.sectionTitle}>{t('calendar20.drawer.views').toUpperCase()}</Text>
            <View style={styles.viewGrid}>
              {VIEW_OPTIONS.map(opt => {
                const isActive = currentView === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.viewCard, isActive && styles.activeViewCard]}
                    onPress={() => onViewChange(opt.key)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={24}
                      color={isActive ? '#007AFF' : '#666666'}
                    />
                    <Text style={[styles.viewLabel, isActive && styles.activeViewLabel]}>
                      {t(opt.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Categories section */}
            {categories.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>{t('calendar20.drawer.categories').toUpperCase()}</Text>

                <TouchableOpacity style={styles.showAllButton} onPress={onShowAll}>
                  <Text style={[styles.showAllText, enabledCategories.size === 0 && styles.activeShowAll]}>
                    {t('calendar20.drawer.showAll')}
                  </Text>
                  {enabledCategories.size === 0 && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.categoriesGrid}>
                  {categories.map((cat, i) => {
                    const name = cat.name || cat.category_name || '';
                    const color = colorService.getColor(name);
                    const key = name.toLowerCase().trim();
                    const isEnabled = enabledCategories.size === 0 || enabledCategories.has(key);

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.categoryCard, !isEnabled && styles.disabledCategoryCard]}
                        onPress={() => onCategoryToggle(name)}
                      >
                        <View style={[styles.colorDot, { backgroundColor: color }]} />
                        <Text style={[styles.categoryName, !isEnabled && styles.disabledCategory]} numberOfLines={1}>
                          {name}
                        </Text>
                        {isEnabled && (
                          <Ionicons name="checkmark-circle" size={16} color={color} style={styles.categoryCheck} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '200',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',
    fontFamily: 'System',
    letterSpacing: 0.8,
    marginBottom: 16,
    marginTop: 8,
  },
  viewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  viewCard: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    paddingVertical: 12,
    gap: 8,
  },
  activeViewCard: {
    backgroundColor: '#f0f7ff',
    borderColor: '#007AFF',
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  activeViewLabel: {
    color: '#007AFF',
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e1e5e9',
    marginVertical: 24,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
  },
  showAllText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  activeShowAll: {
    color: '#007AFF',
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minWidth: '45%',
    maxWidth: '48%',
  },
  disabledCategoryCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333333',
    fontFamily: 'System',
    flex: 1,
  },
  disabledCategory: {
    color: '#999999',
  },
  categoryCheck: {
    marginLeft: 4,
  },
});

export default React.memo(ViewSelector);
