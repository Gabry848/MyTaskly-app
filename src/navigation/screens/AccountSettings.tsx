import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getValidToken, changeEmail, changeUsername } from '../../services/authService';
import axios from '../../services/axiosInstance';
import { sendTestNotification } from '../../services/notificationService';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';

interface UserInfo {
  username: string;
  email: string;
  registration_date: string;
  two_factor_enabled?: boolean;
}

export default function AccountSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testNotificationLoading, setTestNotificationLoading] = useState(false);

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const [changeUsernameLoading, setChangeUsernameLoading] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidToken();
      if (!token) {
        setError(t('accountSettings.errors.invalidToken'));
        return;
      }

      const response = await axios.get('/auth/current_user_info', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setUserInfo(response.data);
    } catch (err: any) {
      console.error('Errore nel recupero delle informazioni utente:', err);
      setError(t('accountSettings.errors.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleTestNotification = async () => {
    setTestNotificationLoading(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        Alert.alert(t('common.messages.success'), t('accountSettings.testNotification.success'));
      } else {
        Alert.alert(t('common.messages.error'), t('accountSettings.testNotification.failed'));
      }
    } catch {
      Alert.alert(t('common.messages.error'), t('accountSettings.testNotification.error'));
    } finally {
      setTestNotificationLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert(t('common.messages.warning'), t('accountSettings.changeEmail.fillAllFields'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert(t('common.messages.warning'), t('accountSettings.changeEmail.invalidEmail'));
      return;
    }

    setChangeEmailLoading(true);
    try {
      const result = await changeEmail(newEmail, emailPassword);
      if (result.success) {
        Alert.alert(t('common.messages.success'), result.message);
        setEmailModalVisible(false);
        setNewEmail('');
        setEmailPassword('');
        fetchUserInfo();
      } else {
        Alert.alert(t('common.messages.error'), result.message);
      }
    } catch {
      Alert.alert(t('common.messages.error'), t('accountSettings.changeEmail.error'));
    } finally {
      setChangeEmailLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername) {
      Alert.alert(t('common.messages.warning'), t('accountSettings.changeUsername.enterUsername'));
      return;
    }

    if (newUsername.length < 3) {
      Alert.alert(t('common.messages.warning'), t('accountSettings.changeUsername.minLength'));
      return;
    }

    setChangeUsernameLoading(true);
    try {
      const result = await changeUsername(newUsername);
      if (result.success) {
        Alert.alert(t('common.messages.success'), result.message);
        setUsernameModalVisible(false);
        setNewUsername('');
        fetchUserInfo();
      } else {
        Alert.alert(t('common.messages.error'), result.message);
      }
    } catch {
      Alert.alert(t('common.messages.error'), t('accountSettings.changeUsername.error'));
    } finally {
      setChangeUsernameLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t('common.messages.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#000000" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUserInfo}>
              <Text style={styles.retryButtonText}>{t('common.buttons.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : userInfo ? (
          <>
            {/* ───────────────── INFORMAZIONI ACCOUNT ───────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('accountSettings.sections.accountInfo')}</Text>
              <Text style={styles.sectionDescription}>{t('accountSettings.sections.accountInfoDesc')}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.rowLeft}>
                <Ionicons name="person-outline" size={22} color="#000000" />
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowHint}>{t('accountSettings.labels.username')}</Text>
                  <Text style={styles.rowLabel}>{userInfo.username}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.rowLeft}>
                <Ionicons name="mail-outline" size={22} color="#000000" />
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowHint}>{t('accountSettings.labels.email')}</Text>
                  <Text style={styles.rowLabel}>{userInfo.email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.rowLeft}>
                <Ionicons name="calendar-outline" size={22} color="#000000" />
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowHint}>{t('accountSettings.labels.registrationDate')}</Text>
                  <Text style={styles.rowLabel}>{formatDate(userInfo.registration_date)}</Text>
                </View>
              </View>
            </View>

            {/* ───────────────── GESTIONE ACCOUNT ───────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('accountSettings.sections.accountManagement')}</Text>
              <Text style={styles.sectionDescription}>{t('accountSettings.sections.accountManagementDesc')}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setUsernameModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="person-outline" size={22} color="#000000" />
                <Text style={styles.menuItemText}>{t('accountSettings.menu.changeUsername')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setEmailModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="mail-outline" size={22} color="#000000" />
                <Text style={styles.menuItemText}>{t('accountSettings.menu.changeEmail')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="key-outline" size={22} color="#000000" />
                <Text style={styles.menuItemText}>{t('accountSettings.menu.changePassword')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>

            {/* ───────────────── TEST NOTIFICHE ───────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('accountSettings.sections.testNotifications')}</Text>
              <Text style={styles.sectionDescription}>{t('accountSettings.sections.testNotificationsDesc')}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleTestNotification}
              disabled={testNotificationLoading}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="notifications-outline" size={22} color="#000000" />
                <View style={styles.rowTextWrap}>
                  <Text style={styles.menuItemText}>
                    {testNotificationLoading
                      ? t('accountSettings.testNotification.sending')
                      : t('accountSettings.testNotification.send')}
                  </Text>
                  <Text style={styles.rowHint}>
                    {t('accountSettings.testNotification.description')}
                  </Text>
                </View>
              </View>
              {testNotificationLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Ionicons name="send-outline" size={20} color="#000000" />
              )}
            </TouchableOpacity>
          </>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ───────────────── MODAL CAMBIA EMAIL ───────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('accountSettings.changeEmail.title')}</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('accountSettings.changeEmail.newEmail')}</Text>
                <TextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('accountSettings.changeEmail.emailPlaceholder')}
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('accountSettings.changeEmail.passwordConfirm')}</Text>
                <TextInput
                  style={styles.input}
                  value={emailPassword}
                  onChangeText={setEmailPassword}
                  secureTextEntry
                  placeholder={t('accountSettings.changeEmail.passwordPlaceholder')}
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, changeEmailLoading && styles.modalButtonDisabled]}
                onPress={handleChangeEmail}
                disabled={changeEmailLoading}
              >
                {changeEmailLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('accountSettings.changeEmail.updateButton')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───────────────── MODAL CAMBIA USERNAME ───────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={usernameModalVisible}
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('accountSettings.changeUsername.title')}</Text>
              <TouchableOpacity onPress={() => setUsernameModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('accountSettings.changeUsername.newUsername')}</Text>
                <TextInput
                  style={styles.input}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  placeholder={t('accountSettings.changeUsername.placeholder')}
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, changeUsernameLoading && styles.modalButtonDisabled]}
                onPress={handleChangeUsername}
                disabled={changeUsernameLoading}
              >
                {changeUsernameLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('accountSettings.changeUsername.updateButton')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  errorText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  // Section header — identico a NotificationSettings
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
  // Row base — identica a NotificationSettings
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
    marginTop: 1,
    fontFamily: 'System',
  },
  // Info item (sola lettura)
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // Menu item (azione con chevron)
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    fontFamily: 'System',
    marginLeft: 15,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
  },
  modalButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
