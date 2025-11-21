import { Text } from '@react-navigation/elements';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getValidToken, changePassword, changeEmail, changeUsername } from '../../services/authService';
import axios from '../../services/axiosInstance';
import { sendTestNotification } from '../../services/notificationService';

interface UserInfo {
  username: string;
  email: string;
  registration_date: string;
  two_factor_enabled?: boolean;
}

export default function AccountSettings() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testNotificationLoading, setTestNotificationLoading] = useState(false);

  // Stati per i modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);

  // Stati per i form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  // Stati di loading per le operazioni
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
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
        setError('Token di autenticazione non valido');
        return;
      }

      const response = await axios.get('/auth/current_user_info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('User Info Response:', response.data);
      setUserInfo(response.data);
    } catch (error: any) {
      console.error('Errore nel recupero delle informazioni utente:', error);
      setError('Errore nel caricamento delle informazioni utente');
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
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleRefresh = () => {
    fetchUserInfo();
  };

  const handleTestNotification = async () => {
    setTestNotificationLoading(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        Alert.alert('✅ Successo', 'Notifica di test inviata con successo!');
      } else {
        Alert.alert('❌ Errore', 'Impossibile inviare la notifica di test. Controlla la connessione al server.');
      }
    } catch {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante l\'invio della notifica.');
    } finally {
      setTestNotificationLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Attenzione', 'Compila tutti i campi');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Attenzione', 'Le password non corrispondono');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Attenzione', 'La nuova password deve essere di almeno 8 caratteri');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const result = await changePassword(oldPassword, newPassword);
      if (result.success) {
        Alert.alert('Successo', result.message);
        setPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Errore', result.message);
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il cambio password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert('Attenzione', 'Compila tutti i campi');
      return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Attenzione', 'Inserisci un indirizzo email valido');
      return;
    }

    setChangeEmailLoading(true);
    try {
      const result = await changeEmail(newEmail, emailPassword);
      if (result.success) {
        Alert.alert('Successo', result.message);
        setEmailModalVisible(false);
        setNewEmail('');
        setEmailPassword('');
        // Ricarica le informazioni utente
        fetchUserInfo();
      } else {
        Alert.alert('Errore', result.message);
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il cambio email');
    } finally {
      setChangeEmailLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername) {
      Alert.alert('Attenzione', 'Inserisci il nuovo username');
      return;
    }

    if (newUsername.length < 3) {
      Alert.alert('Attenzione', 'L\'username deve essere di almeno 3 caratteri');
      return;
    }

    setChangeUsernameLoading(true);
    try {
      const result = await changeUsername(newUsername);
      if (result.success) {
        Alert.alert('Successo', result.message);
        setUsernameModalVisible(false);
        setNewUsername('');
        // Ricarica le informazioni utente
        fetchUserInfo();
      } else {
        Alert.alert('Errore', result.message);
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il cambio username');
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
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#000000" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : userInfo ? (
          <>
            {/* User Info Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Informazioni account</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="person-outline" size={24} color="#007bff" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Username</Text>
                    <Text style={styles.infoValue}>{userInfo.username}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="mail-outline" size={24} color="#28a745" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{userInfo.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="calendar-outline" size={24} color="#17a2b8" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Data iscrizione</Text>
                    <Text style={styles.infoValue}>{formatDate(userInfo.registration_date)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="shield-outline" size={24} color="#ffc107" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Autenticazione a due fattori</Text>
                    <View style={styles.statusContainer}>
                      <Text style={styles.infoValue}>Work in progress</Text>
                      <View style={[styles.statusBadge, styles.workInProgressBadge]}>
                        <Text style={styles.statusBadgeText}>WIP</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Account Management Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gestione account</Text>
            </View>

            <View style={styles.infoCard}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => setUsernameModalVisible(true)}
              >
                <View style={styles.actionItemContent}>
                  <Ionicons name="person-outline" size={24} color="#007bff" />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Cambia username</Text>
                    <Text style={styles.actionDescription}>Modifica il tuo nome utente</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </View>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => setEmailModalVisible(true)}
              >
                <View style={styles.actionItemContent}>
                  <Ionicons name="mail-outline" size={24} color="#28a745" />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Cambia email</Text>
                    <Text style={styles.actionDescription}>Aggiorna il tuo indirizzo email</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </View>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => setPasswordModalVisible(true)}
              >
                <View style={styles.actionItemContent}>
                  <Ionicons name="lock-closed-outline" size={24} color="#dc3545" />
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Cambia password</Text>
                    <Text style={styles.actionDescription}>Modifica la tua password</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Test Notifications Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Test notifiche</Text>
            </View>
            
            <View style={styles.infoCard}>
              <TouchableOpacity 
                style={[styles.testNotificationButton, testNotificationLoading && styles.testNotificationButtonDisabled]} 
                onPress={handleTestNotification}
                disabled={testNotificationLoading}
              >
                <View style={styles.testNotificationContent}>
                  <Ionicons name="notifications-outline" size={24} color="#6f42c1" />
                  <View style={styles.testNotificationTextContainer}>
                    <Text style={styles.testNotificationTitle}>
                      {testNotificationLoading ? 'Invio in corso...' : 'Invia notifica di test'}
                    </Text>
                    <Text style={styles.testNotificationDescription}>
                      Verifica il funzionamento delle notifiche push
                    </Text>
                  </View>
                  <Ionicons name="send-outline" size={20} color="#6f42c1" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Future Features Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prossimamente</Text>
            </View>
            
            <View style={styles.futureCard}>
              <View style={styles.futureContent}>
                <Ionicons name="time-outline" size={32} color="#fd7e14" />
                <Text style={styles.futureTitle}>Altre impostazioni in arrivo</Text>
                <Text style={styles.futureDescription}>
                  Stiamo lavorando per aggiungere nuove funzionalità di gestione account.
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambia password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={28} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password attuale</Text>
                <TextInput
                  style={styles.input}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  placeholder="Inserisci la password attuale"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nuova password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Minimo 8 caratteri"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Conferma nuova password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Reinserisci la nuova password"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, changePasswordLoading && styles.modalButtonDisabled]}
                onPress={handleChangePassword}
                disabled={changePasswordLoading}
              >
                {changePasswordLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Aggiorna password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambia email</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)}>
                <Ionicons name="close" size={28} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nuova email</Text>
                <TextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="esempio@email.com"
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password per conferma</Text>
                <TextInput
                  style={styles.input}
                  value={emailPassword}
                  onChangeText={setEmailPassword}
                  secureTextEntry
                  placeholder="Inserisci la tua password"
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
                  <Text style={styles.modalButtonText}>Aggiorna email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Username Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={usernameModalVisible}
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambia username</Text>
              <TouchableOpacity onPress={() => setUsernameModalVisible(false)}>
                <Ionicons name="close" size={28} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nuovo username</Text>
                <TextInput
                  style={styles.input}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  placeholder="Minimo 3 caratteri"
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
                  <Text style={styles.modalButtonText}>Aggiorna username</Text>
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
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#495057',
    marginTop: 16,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'System',
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'System',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workInProgressBadge: {
    backgroundColor: '#ffc107',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'System',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  futureCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  futureContent: {
    alignItems: 'center',
  },
  futureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'System',
    marginTop: 12,
    marginBottom: 8,
  },
  futureDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
  testNotificationButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  testNotificationButtonDisabled: {
    opacity: 0.6,
  },
  testNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testNotificationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  testNotificationTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 4,
  },
  testNotificationDescription: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: 'System',
  },
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
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
    color: '#2c3e50',
    fontFamily: 'System',
  },
  modalButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 8,
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