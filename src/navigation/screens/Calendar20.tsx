import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Calendar20View from '../../components/Calendar20/Calendar20View';

export default function Calendar20() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Calendar20View />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
