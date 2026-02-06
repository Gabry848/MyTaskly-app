import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import Calendar20View from '../../components/Calendar20/Calendar20View';

export default function Calendar20() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
