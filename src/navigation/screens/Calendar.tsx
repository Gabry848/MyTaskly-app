import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar
} from 'react-native';
import CalendarView from '../../../components/CalendarView';
import { useTranslation } from 'react-i18next';

export default function Calendar() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header con titolo principale - stesso stile di Home20 e Categories */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t('calendar.title')}</Text>
      </View>

      <View style={styles.content}>
        <CalendarView />
      </View>
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
    paddingBottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mainTitle: {
    paddingTop: 10,
    fontSize: 30,
    fontWeight: "200", // Stesso peso di Home20
    color: "#000000",
    textAlign: "left",
    fontFamily: "System",
    letterSpacing: -1.5,
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
});