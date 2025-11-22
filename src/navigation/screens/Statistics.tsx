import React, { useState, useEffect, useCallback } from 'react';
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
import { getDashboard } from '../../services/statisticsService';
import { useTranslation } from 'react-i18next';

interface DashboardData {
  productivity_overview: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    cancelled_tasks: number;
    completion_rate: number;
    avg_tasks_per_day: number;
    avg_completed_per_day: number;
  };
  priority_distribution: {
    bassa?: { total_count: number; completed_count: number; completion_rate: number };
    media?: { total_count: number; completed_count: number; completion_rate: number };
    alta?: { total_count: number; completed_count: number; completion_rate: number };
  };
  status_distribution: {
    total_tasks: number;
    in_sospeso?: { count: number; percentage: number };
    completato?: { count: number; percentage: number };
    annullato?: { count: number; percentage: number };
  };
  upcoming_deadlines_summary: {
    next_7_days: number;
    next_14_days: number;
    next_30_days: number;
  };
  overdue_count: number;
  current_streak: number;
}

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    try {
      setError(null);
      const result = await getDashboard();

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        setError(result.message || t('statistics.errors.loading'));
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
    loadStatistics();
  }, []);

  // Carica le statistiche quando la schermata viene visualizzata
  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [])
  );

  useEffect(() => {
    loadStatistics();
  }, []);

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
    <View style={styles.priorityCard}>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('statistics.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Text style={styles.mainTitle}>{t('statistics.title')}</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="stats-chart-outline" size={64} color="#cccccc" />
          <Text style={styles.errorText}>{error || t('statistics.noData')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
            <Text style={styles.retryButtonText}>{t('common.buttons.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { productivity_overview, priority_distribution, upcoming_deadlines_summary, overdue_count, current_streak } = dashboardData;

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('statistics.priority.title')}</Text>
          <View style={styles.priorityGrid}>
            {priority_distribution.alta && renderPriorityCard(t('statistics.priority.high'), priority_distribution.alta, '#FF3B30')}
            {priority_distribution.media && renderPriorityCard(t('statistics.priority.medium'), priority_distribution.media, '#FF9500')}
            {priority_distribution.bassa && renderPriorityCard(t('statistics.priority.low'), priority_distribution.bassa, '#34C759')}
          </View>
        </View>

        {/* Upcoming Deadlines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('statistics.deadlines.title')}</Text>
          <View style={styles.deadlinesContainer}>
            <View style={styles.deadlineItem}>
              <Text style={styles.deadlineValue}>{upcoming_deadlines_summary.next_7_days}</Text>
              <Text style={styles.deadlineLabel}>{t('statistics.deadlines.next7Days')}</Text>
            </View>
            <View style={styles.deadlineDivider} />
            <View style={styles.deadlineItem}>
              <Text style={styles.deadlineValue}>{upcoming_deadlines_summary.next_14_days}</Text>
              <Text style={styles.deadlineLabel}>{t('statistics.deadlines.next14Days')}</Text>
            </View>
            <View style={styles.deadlineDivider} />
            <View style={styles.deadlineItem}>
              <Text style={styles.deadlineValue}>{upcoming_deadlines_summary.next_30_days}</Text>
              <Text style={styles.deadlineLabel}>{t('statistics.deadlines.next30Days')}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: '1%',
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
  section: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#000000',
    marginBottom: 15,
    letterSpacing: -0.5,
  },
  priorityGrid: {
    gap: 12,
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
  deadlinesContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  deadlineItem: {
    flex: 1,
    alignItems: 'center',
  },
  deadlineValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  deadlineLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  deadlineDivider: {
    width: 1,
    backgroundColor: '#e1e5e9',
    marginHorizontal: 10,
  },
});
