import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePassword() {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.wipContainer}>
          <View style={styles.wipIcon}>
            <Ionicons name="construct" size={64} color="#fd7e14" />
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
              <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
              <Text style={styles.featureText}>Validazione password sicura</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
              <Text style={styles.featureText}>Verifica password attuale</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
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
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  wipIcon: {
    marginBottom: 32,
  },
  wipTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2c3e50',
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  wipDescription: {
    fontSize: 18,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: 'System',
  },
  wipSubDescription: {
    fontSize: 16,
    color: '#6c757d',
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
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  featureText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    fontFamily: 'System',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#fd7e14',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'System',
  },
});