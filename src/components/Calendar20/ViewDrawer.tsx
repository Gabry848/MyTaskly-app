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

interface ViewDrawerProps {
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

const ViewDrawer: React.FC<ViewDrawerProps> = ({
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
        <Pressable style={styles.drawer} onPress={e => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Views section */}
            <Text style={styles.sectionTitle}>{t('calendar20.drawer.views').toUpperCase()}</Text>
            {VIEW_OPTIONS.map(opt => {
              const isActive = currentView === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.viewOption, isActive && styles.activeViewOption]}
                  onPress={() => onViewChange(opt.key)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isActive ? '#000000' : '#333333'}
                  />
                  <Text style={[styles.viewLabel, isActive && styles.activeViewLabel]}>
                    {t(opt.labelKey)}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color="#000000" style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              );
            })}

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
                    <Ionicons name="checkmark" size={16} color="#000000" />
                  )}
                </TouchableOpacity>

                {categories.map((cat, i) => {
                  const name = cat.name || cat.category_name || '';
                  const color = colorService.getColor(name);
                  const key = name.toLowerCase().trim();
                  const isEnabled = enabledCategories.size === 0 || enabledCategories.has(key);

                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.categoryRow}
                      onPress={() => onCategoryToggle(name)}
                    >
                      <View style={[styles.colorSquare, { backgroundColor: color }]}>
                        {isEnabled && (
                          <Ionicons name="checkmark" size={12} color="#ffffff" />
                        )}
                      </View>
                      <Text style={[styles.categoryName, !isEnabled && styles.disabledCategory]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
  },
  drawer: {
    width: 280,
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
    fontFamily: 'System',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  activeViewOption: {
    backgroundColor: '#f0f0f0',
  },
  viewLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333333',
    fontFamily: 'System',
    marginLeft: 14,
    flex: 1,
  },
  activeViewLabel: {
    color: '#000000',
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 'auto',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e1e5e9',
    marginVertical: 16,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  showAllText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'System',
  },
  activeShowAll: {
    color: '#000000',
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colorSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333333',
    fontFamily: 'System',
  },
  disabledCategory: {
    color: '#cccccc',
  },
});

export default React.memo(ViewDrawer);
