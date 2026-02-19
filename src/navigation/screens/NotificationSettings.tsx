import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import {
  getNotificationSettings,
  updateNotificationSettings,
  syncTimezone,
  NotificationSettings,
  TELEGRAM_REMINDER_OPTIONS,
} from '../../services/notificationSettingsService';
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
} from '../../services/notificationService';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [registeringToken, setRegisteringToken] = useState(false);

  // Animazione spunta
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.5)).current;

  const deviceTimezone = Localization.getCalendars()[0]?.timeZone ?? 'UTC';

  const showSyncCheck = () => {
    setSyncDone(true);
    checkOpacity.setValue(0);
    checkScale.setValue(0.5);
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 180,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Dopo 2s, dissolvenza e reset
      setTimeout(() => {
        Animated.timing(checkOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setSyncDone(false));
      }, 2000);
    });
  };

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('[NotificationSettings] Errore caricamento:', error);
      Alert.alert(
        t('notificationSettings.error.title'),
        t('notificationSettings.error.loadFailed')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = async (
    field: 'push_notifications_enabled' | 'telegram_notifications_enabled',
    value: boolean
  ) => {
    if (!settings) return;

    // Caso speciale: push non ancora registrato e l'utente vuole abilitare
    if (field === 'push_notifications_enabled' && value && !settings.push_enabled) {
      setRegisteringToken(true);
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await sendTokenToBackend(token, true);
          // Ricarica le impostazioni: il backend ora ha il token e push_enabled sarà true
          await loadSettings();
        }
        // Se token non ottenuto (permessi negati), non fare nulla: registerForPushNotificationsAsync mostra già l'Alert
      } catch (error: any) {
        const detail = error?.response?.data?.detail ?? t('notificationSettings.error.saveFailed');
        Alert.alert(t('notificationSettings.error.title'), detail);
      } finally {
        setRegisteringToken(false);
      }
      return;
    }

    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
    setSavingField(field);

    try {
      const updated = await updateNotificationSettings({ [field]: value });
      setSettings(updated);
    } catch (error: any) {
      setSettings((prev) => prev ? { ...prev, [field]: !value } : prev);
      const detail = error?.response?.data?.detail ?? t('notificationSettings.error.saveFailed');
      Alert.alert(t('notificationSettings.error.title'), detail);
    } finally {
      setSavingField(null);
    }
  };

  const handleReminderMinutes = async (minutes: 5 | 10 | 15 | 30 | 60) => {
    if (!settings || settings.telegram_reminder_minutes === minutes) return;

    const previous = settings.telegram_reminder_minutes;
    setSettings((prev) => prev ? { ...prev, telegram_reminder_minutes: minutes } : prev);
    setSavingField('telegram_reminder_minutes');

    try {
      const updated = await updateNotificationSettings({ telegram_reminder_minutes: minutes });
      setSettings(updated);
    } catch (error: any) {
      setSettings((prev) => prev ? { ...prev, telegram_reminder_minutes: previous } : prev);
      const detail = error?.response?.data?.detail ?? t('notificationSettings.error.saveFailed');
      Alert.alert(t('notificationSettings.error.title'), detail);
    } finally {
      setSavingField(null);
    }
  };

  const handleSyncTimezone = async () => {
    setSyncing(true);
    try {
      const updated = await syncTimezone(deviceTimezone);
      setSettings(updated);
      showSyncCheck();
    } catch (error: any) {
      const detail = error?.response?.data?.detail ?? t('notificationSettings.error.saveFailed');
      Alert.alert(t('notificationSettings.error.title'), detail);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t('notificationSettings.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!settings) return null;

  const timezoneIsSynced = settings.timezone === deviceTimezone;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ───────────────── PUSH NOTIFICATIONS ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.sections.push')}</Text>
          <Text style={styles.sectionDescription}>
            {t('notificationSettings.sections.pushDesc')}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="phone-portrait-outline" size={22} color="#000000" />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowLabel}>{t('notificationSettings.push.enable')}</Text>
              {!settings.push_enabled && (
                <Text style={styles.rowHint}>{t('notificationSettings.push.tapToRegister')}</Text>
              )}
            </View>
          </View>
          {registeringToken ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Switch
              value={settings.push_notifications_enabled && settings.push_enabled}
              onValueChange={(v) => handleToggle('push_notifications_enabled', v)}
              disabled={savingField === 'push_notifications_enabled'}
              trackColor={{ false: '#dee2e6', true: '#000000' }}
              thumbColor="#ffffff"
            />
          )}
        </View>

        {!settings.push_enabled && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#6c757d" />
            <Text style={styles.infoBoxText}>{t('notificationSettings.push.notRegistered')}</Text>
          </View>
        )}

        {/* ───────────────── TELEGRAM ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.sections.telegram')}</Text>
          <Text style={styles.sectionDescription}>
            {t('notificationSettings.sections.telegramDesc')}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="paper-plane-outline" size={22} color="#000000" />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowLabel}>{t('notificationSettings.telegram.enable')}</Text>
              {settings.telegram_enabled && settings.telegram_chat_id && (
                <Text style={styles.rowHint}>
                  {t('notificationSettings.telegram.chatId', { id: settings.telegram_chat_id })}
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={settings.telegram_notifications_enabled && settings.telegram_enabled}
            onValueChange={(v) => handleToggle('telegram_notifications_enabled', v)}
            disabled={!settings.telegram_enabled || savingField === 'telegram_notifications_enabled'}
            trackColor={{ false: '#dee2e6', true: '#000000' }}
            thumbColor="#ffffff"
          />
        </View>

        {!settings.telegram_enabled && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#6c757d" />
            <Text style={styles.infoBoxText}>{t('notificationSettings.telegram.notConnected')}</Text>
          </View>
        )}

        {/* Reminder minutes — visibile solo se Telegram è connesso */}
        {settings.telegram_enabled && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('notificationSettings.reminder.title')}</Text>
              <Text style={styles.sectionDescription}>
                {t('notificationSettings.reminder.desc')}
              </Text>
            </View>

            <View style={styles.pillsRow}>
              {TELEGRAM_REMINDER_OPTIONS.map((opt) => {
                const isSelected = settings.telegram_reminder_minutes === opt.value;
                const isSaving = savingField === 'telegram_reminder_minutes';
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => handleReminderMinutes(opt.value)}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ───────────────── TIMEZONE ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.sections.timezone')}</Text>
          <Text style={styles.sectionDescription}>
            {t('notificationSettings.sections.timezoneDesc')}
          </Text>
        </View>

        <View style={styles.timezoneRow}>
          <View style={styles.timezoneItem}>
            <Text style={styles.timezoneLabel}>{t('notificationSettings.timezone.server')}</Text>
            <Text style={styles.timezoneValue}>{settings.timezone}</Text>
          </View>
          <View style={styles.timezoneDivider} />
          <View style={styles.timezoneItem}>
            <Text style={styles.timezoneLabel}>{t('notificationSettings.timezone.device')}</Text>
            <Text style={[styles.timezoneValue, !timezoneIsSynced && styles.timezoneOutOfSync]}>
              {deviceTimezone}
            </Text>
          </View>
        </View>

        {!timezoneIsSynced && (
          <View style={styles.infoBox}>
            <Ionicons name="warning-outline" size={18} color="#6c757d" />
            <Text style={styles.infoBoxText}>{t('notificationSettings.timezone.outOfSync')}</Text>
          </View>
        )}

        {/* Pulsante sincronizza */}
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleSyncTimezone}
          disabled={syncing || syncDone}
          activeOpacity={0.8}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : syncDone ? (
            <Animated.View
              style={{ opacity: checkOpacity, transform: [{ scale: checkScale }] }}
            >
              <Ionicons name="checkmark" size={22} color="#ffffff" />
            </Animated.View>
          ) : (
            <Ionicons name="sync-outline" size={20} color="#ffffff" />
          )}
          <Text style={styles.syncButtonText}>
            {syncing
              ? t('notificationSettings.timezone.syncing')
              : t('notificationSettings.timezone.sync')}
          </Text>
        </TouchableOpacity>

        {/* ───────────────── INFO ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('notificationSettings.sections.info')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('notificationSettings.info.autoSave')}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#000000" />
          <Text style={styles.infoItemText}>{t('notificationSettings.info.telegramCommands')}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#495057',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  // Toggle row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowTextWrap: {
    marginLeft: 15,
    flex: 1,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'System',
  },
  rowHint: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
    fontFamily: 'System',
  },
  // Info box (avvisi / note)
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoBoxText: {
    fontSize: 13,
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
    fontFamily: 'System',
  },
  // Pills per reminder minutes
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
  },
  pillSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  pillText: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
    fontFamily: 'System',
  },
  pillTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Timezone
  timezoneRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timezoneItem: {
    flex: 1,
    alignItems: 'center',
  },
  timezoneDivider: {
    width: 1,
    backgroundColor: '#dee2e6',
    marginHorizontal: 12,
  },
  timezoneLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'System',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timezoneValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    fontFamily: 'System',
    textAlign: 'center',
  },
  timezoneOutOfSync: {
    color: '#dc3545',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000000',
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#495057',
  },
  syncButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Info list
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItemText: {
    fontSize: 15,
    color: '#495057',
    marginLeft: 15,
    flex: 1,
    fontFamily: 'System',
    lineHeight: 20,
  },
});
