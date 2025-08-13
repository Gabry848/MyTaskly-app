import { Text } from '@react-navigation/elements';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getValidToken } from '../../services/authService';
import axios from '../../services/axiosInstance';
import { sendTestNotification } from '../../services/notificationService';

interface UserInfo {
  username: string;
  email: string;
  registration_date: string;
  two_factor_enabled?: boolean;
}

export default function AccountSettings() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testNotificationLoading, setTestNotificationLoading] = useState(false);

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
    } catch (error) {
      Alert.alert('❌ Errore', 'Si è verificato un errore durante l\'invio della notifica.');
    } finally {
      setTestNotificationLoading(false);
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
                  <Ionicons name="person-outline" size={24} color="#000000" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Username</Text>
                    <Text style={styles.infoValue}>{userInfo.username}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="mail-outline" size={24} color="#000000" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{userInfo.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="calendar-outline" size={24} color="#000000" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Data iscrizione</Text>
                    <Text style={styles.infoValue}>{formatDate(userInfo.registration_date)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemContent}>
                  <Ionicons name="shield-outline" size={24} color="#000000" />
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
                  <Ionicons name="notifications-outline" size={24} color="#000000" />
                  <View style={styles.testNotificationTextContainer}>
                    <Text style={styles.testNotificationTitle}>
                      {testNotificationLoading ? 'Invio in corso...' : 'Invia notifica di test'}
                    </Text>
                    <Text style={styles.testNotificationDescription}>
                      Verifica il funzionamento delle notifiche push
                    </Text>
                  </View>
                  <Ionicons name="send-outline" size={20} color="#000000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Future Features Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prossimamente</Text>
            </View>
            
            <View style={styles.futureCard}>
              <View style={styles.futureContent}>
                <Ionicons name="time-outline" size={32} color="#000000" />
                <Text style={styles.futureTitle}>Altre impostazioni in arrivo</Text>
                <Text style={styles.futureDescription}>
                  Stiamo lavorando per aggiungere nuove funzionalità di gestione account.
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
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
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
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
    color: '#000000',
    fontFamily: 'System',
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
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
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '400',
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
    backgroundColor: '#000000',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'System',
  },
  separator: {
    height: 1,
    backgroundColor: '#000000',
    marginHorizontal: 16,
  },
  futureCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  futureContent: {
    alignItems: 'center',
  },
  futureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginTop: 12,
    marginBottom: 8,
  },
  futureDescription: {
    fontSize: 14,
    color: '#000000',
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
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 4,
  },
  testNotificationDescription: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'System',
  },
});