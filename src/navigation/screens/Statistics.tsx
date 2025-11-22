import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getDashboard,
  getPriorityDistribution,
  getCategoryPerformance,
  getUpcomingDeadlines,
} from '../../services/statisticsService';

export default function Statistics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [priorityData, setPriorityData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [deadlineData, setDeadlineData] = useState<any>(null);

  const loadAllData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Load all data in parallel
      const [dashboard, priority, category, deadlines] = await Promise.all([
        getDashboard(),
        getPriorityDistribution(),
        getCategoryPerformance(),
        getUpcomingDeadlines(),
      ]);

      if (dashboard.success) setDashboardData(dashboard.data);
      if (priority.success) setPriorityData(priority.data);
      if (category.success) setCategoryData(category.data);
      if (deadlines.success) setDeadlineData(deadlines.data);

      if (!dashboard.success) {
        setError(dashboard.message || t('statistics.errors.loading'));
      }
    } catch (err: any) {
      console.error('Errore nel caricamento delle statistiche:', err);
      setError(t('statistics.errors.connection'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  if (error && !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Text style={styles.mainTitle}>{t('statistics.title')}</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#cccccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAllData}>
            <Text style={styles.retryButtonText}>{t('common.buttons.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Text style={styles.mainTitle}>{t('statistics.title')}</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('statistics.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value >= 80) return { name: 'trending-up' as const, color: '#34C759' };
    if (value >= 50) return { name: 'remove' as const, color: '#FF9500' };
    return { name: 'trending-down' as const, color: '#FF3B30' };
  };

  const renderKPICard = (
    icon: string,
    title: string,
    value: string | number,
    subtitle?: string,
    trend?: { name: any; color: string }
  ) => (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
        {trend && <Ionicons name={trend.name} size={20} color={trend.color} />}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderPriorityCard = (
    priority: string,
    data: { total_count: number; completed_count: number; completion_rate: number },
    color: string
  ) => (
    <View key={priority} style={styles.priorityCard}>
      <View style={styles.priorityHeader}>
        <View style={[styles.priorityDot, { backgroundColor: color }]} />
        <Text style={styles.priorityName}>{priority}</Text>
      </View>
      <View style={styles.priorityStats}>
        <Text style={styles.priorityCount}>{data.total_count}</Text>
        <Text style={styles.priorityLabel}>{t('statistics.priority.totalTasks')}</Text>
      </View>
      <View style={styles.priorityProgress}>
        <View style={styles.priorityProgressBg}>
          <View
            style={[
              styles.priorityProgressFill,
              { width: `${data.completion_rate}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.priorityRate}>{data.completion_rate.toFixed(0)}%</Text>
      </View>
    </View>
  );

  const renderCategoryItem = (category: any) => (
    <View key={category.category_name} style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{category.category_name}</Text>
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor:
                category.completion_rate >= 80
                  ? '#E8F5E9'
                  : category.completion_rate >= 60
                  ? '#FFF3E0'
                  : '#FFEBEE',
            },
          ]}
        >
          <Text
            style={[
              styles.categoryBadgeText,
              {
                color:
                  category.completion_rate >= 80
                    ? '#34C759'
                    : category.completion_rate >= 60
                    ? '#FF9500'
                    : '#FF3B30',
              },
            ]}
          >
            {category.completion_rate.toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.categoryStats}>
        <View style={styles.categoryStatItem}>
          <Text style={styles.categoryStatLabel}>Totali</Text>
          <Text style={styles.categoryStatValue}>{category.total_tasks}</Text>
        </View>
        <View style={styles.categoryStatDivider} />
        <View style={styles.categoryStatItem}>
          <Text style={styles.categoryStatLabel}>Completati</Text>
          <Text style={styles.categoryStatValue}>{category.completed_tasks}</Text>
        </View>
        <View style={styles.categoryStatDivider} />
        <View style={styles.categoryStatItem}>
          <Text style={styles.categoryStatLabel}>In sospeso</Text>
          <Text style={styles.categoryStatValue}>{category.pending_tasks}</Text>
        </View>
      </View>

      <View style={styles.categoryProgressBg}>
        <View
          style={[
            styles.categoryProgressFill,
            { width: `${category.completion_rate}%` },
          ]}
        />
      </View>
    </View>
  );

  const renderDeadlineItem = (task: any, index: number) => {
    const daysUntil = task.days_until_deadline;
    const getUrgencyColor = () => {
      if (daysUntil < 3) return '#FF3B30';
      if (daysUntil < 7) return '#FF9500';
      return '#34C759';
    };

    return (
      <View key={`deadline-${index}`} style={styles.deadlineItemCard}>
        <View style={styles.deadlineItemHeader}>
          <View style={styles.deadlineItemLeft}>
            <View
              style={[styles.deadlineIndicator, { backgroundColor: getUrgencyColor() }]}
            />
            <View style={styles.deadlineItemInfo}>
              <Text style={styles.deadlineItemTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.deadlineItemCategory}>{task.category_name}</Text>
            </View>
          </View>
          <View
            style={[styles.deadlineBadge, { backgroundColor: getUrgencyColor() + '20' }]}
          >
            <Text style={[styles.deadlineBadgeText, { color: getUrgencyColor() }]}>
              {daysUntil}d
            </Text>
          </View>
        </View>
        <View style={styles.deadlineItemPriority}>
          <Ionicons
            name={
              task.priority === 'Alta'
                ? 'alert-circle'
                : task.priority === 'Media'
                ? 'alert'
                : 'checkmark-circle'
            }
            size={16}
            color={
              task.priority === 'Alta'
                ? '#FF3B30'
                : task.priority === 'Media'
                ? '#FF9500'
                : '#34C759'
            }
          />
          <Text style={styles.deadlineItemPriorityText}>{task.priority}</Text>
        </View>
      </View>
    );
  };

  const { productivity_overview, overdue_count, current_streak } = dashboardData || {};
  const upcoming7 = deadlineData?.next_7_days || [];
  const upcoming14 = deadlineData?.next_14_days || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t('statistics.title')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {/* Overdue Alert */}
        {overdue_count > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <Text style={styles.alertText}>
              {t('statistics.overdue.alert', { count: overdue_count })}
            </Text>
          </View>
        )}

        {/* Streak Card */}
        {current_streak > 0 && (
          <View style={styles.streakCard}>
            <View style={styles.streakContent}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View style={styles.streakInfo}>
                <Text style={styles.streakValue}>{current_streak}</Text>
                <Text style={styles.streakLabel}>
                  {t('statistics.streak.days', { count: current_streak })}
                </Text>
              </View>
            </View>
            <Text style={styles.streakSubtext}>{t('statistics.streak.keepGoing')}</Text>
          </View>
        )}

        {/* KPI Cards Grid */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Panoramica</Text>
        </View>
        <View style={styles.kpiGrid}>
          {renderKPICard(
            'checkmark-circle',
            t('statistics.kpi.completed'),
            productivity_overview.completed_tasks,
            t('statistics.kpi.outOf', { total: productivity_overview.total_tasks }),
            getTrendIcon(productivity_overview.completion_rate)
          )}
          {renderKPICard(
            'bar-chart',
            t('statistics.kpi.completionRate'),
            `${productivity_overview.completion_rate.toFixed(1)}%`
          )}
          {renderKPICard(
            'time',
            t('statistics.kpi.pending'),
            productivity_overview.pending_tasks
          )}
          {renderKPICard(
            'calendar',
            t('statistics.kpi.dailyAverage'),
            productivity_overview.avg_completed_per_day.toFixed(1),
            t('statistics.kpi.tasksPerDay')
          )}
        </View>

        {/* Priority Distribution */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>Distribuzione Priorità</Text>
        </View>
        <View style={styles.priorityGrid}>
          {priorityData?.alta && renderPriorityCard(t('statistics.priority.high'), priorityData.alta, '#FF3B30')}
          {priorityData?.media && renderPriorityCard(t('statistics.priority.medium'), priorityData.media, '#FF9500')}
          {priorityData?.bassa && renderPriorityCard(t('statistics.priority.low'), priorityData.bassa, '#34C759')}
        </View>

        {/* Category Performance */}
        {categoryData?.categories && categoryData.categories.length > 0 && (
          <>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Performance per Categoria</Text>
            </View>
            <View style={styles.categoryGrid}>
              {categoryData.categories.map(renderCategoryItem)}
            </View>
          </>
        )}

        {/* Upcoming Deadlines */}
        {(upcoming7.length > 0 || upcoming14.length > 0) && (
          <>
            <View style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Scadenze Imminenti</Text>
            </View>

            {upcoming7.length > 0 && (
              <>
                <Text style={styles.deadlineSectionTitle}>🔴 Prossimi 7 giorni</Text>
                <View style={styles.deadlineGrid}>
                  {upcoming7.map((task: any, idx: number) => renderDeadlineItem(task, idx))}
                </View>
              </>
            )}

            {upcoming14.length > upcoming7.length && (
              <>
                <Text style={styles.deadlineSectionTitle}>🟡 Prossimi 14 giorni</Text>
                <View style={styles.deadlineGrid}>
                  {upcoming14
                    .slice(upcoming7.length)
                    .map((task: any, idx: number) => renderDeadlineItem(task, idx + 100))}
                </View>
              </>
            )}
          </>
        )}

        {upcoming7.length === 0 && upcoming14.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#34C759" />
            <Text style={styles.emptyStateText}>Nessuna scadenza imminente!</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  mainTitle: {
    paddingTop: 10,
    fontSize: 30,
    fontWeight: '200',
    color: '#000000',
    textAlign: 'left',
    fontFamily: 'System',
    letterSpacing: -1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    marginTop: 15,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
  },
  streakCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: 15,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '600',
    color: '#000000',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  streakSubtext: {
    fontSize: 13,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: -0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 2,
  },
  kpiSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
  priorityGrid: {
    gap: 12,
    marginBottom: 10,
  },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  priorityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  priorityStats: {
    marginBottom: 12,
  },
  priorityCount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  priorityLabel: {
    fontSize: 13,
    color: '#666666',
  },
  priorityProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  priorityProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  priorityRate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    width: 45,
    textAlign: 'right',
  },
  categoryGrid: {
    gap: 12,
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  categoryStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  categoryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  categoryStatDivider: {
    width: 1,
    backgroundColor: '#e1e5e9',
    marginHorizontal: 12,
  },
  categoryProgressBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  deadlineGrid: {
    gap: 12,
    marginBottom: 15,
  },
  deadlineItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deadlineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deadlineItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  deadlineItemInfo: {
    flex: 1,
  },
  deadlineItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  deadlineItemCategory: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  deadlineBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deadlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineItemPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineItemPriorityText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
  },
  deadlineSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
});
