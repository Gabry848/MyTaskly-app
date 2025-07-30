import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePassword() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.wipContainer}>
          <View style={styles.wipIcon}>
            <Ionicons name="construct" size={64} color="#FF9500" />
          </View>
          
          <Text style={styles.wipTitle}>Work in Progress</Text>
          
          <Text style={styles.wipDescription}>
            La funzionalità di cambio password è attualmente in sviluppo.
          </Text>
          
          <Text style={styles.wipSubDescription}>
            Questa funzione sarà disponibile nei prossimi aggiornamenti dell&apos;app.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <Text style={styles.featureText}>Validazione password sicura</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <Text style={styles.featureText}>Verifica password attuale</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <Text style={styles.featureText}>Notifica email di conferma</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>🚧 In sviluppo</Text>
          </View>
        </View>
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
    paddingTop: 40,
  },
  wipContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  wipIcon: {
    marginBottom: 32,
  },
  wipTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  wipDescription: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'System',
  },
  wipSubDescription: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    fontFamily: 'System',
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
    fontFamily: 'System',
  },
  statusBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'System',
  },
});