import { Text } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* App Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('help.sections.whatIs.title')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            {t('help.sections.whatIs.description')}
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('help.sections.features.title')}</Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{t('help.sections.features.taskManagement.title')}</Text>
            <Text style={styles.featureDescription}>
              {t('help.sections.features.taskManagement.description')}
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="folder-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{t('help.sections.features.categories.title')}</Text>
            <Text style={styles.featureDescription}>
              {t('help.sections.features.categories.description')}
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="document-text-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{t('help.sections.features.notes.title')}</Text>
            <Text style={styles.featureDescription}>
              {t('help.sections.features.notes.description')}
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="chatbubbles-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{t('help.sections.features.aiAssistant.title')}</Text>
            <Text style={styles.featureDescription}>
              {t('help.sections.features.aiAssistant.description')}
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="notifications-outline" size={24} color="#000000" />
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{t('help.sections.features.notifications.title')}</Text>
            <Text style={styles.featureDescription}>
              {t('help.sections.features.notifications.description')}
            </Text>
          </View>
        </View>

        {/* How to Use Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('help.sections.howToUse.title')}</Text>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('help.sections.howToUse.step1.title')}</Text>
            <Text style={styles.stepDescription}>
              {t('help.sections.howToUse.step1.description')}
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('help.sections.howToUse.step2.title')}</Text>
            <Text style={styles.stepDescription}>
              {t('help.sections.howToUse.step2.description')}
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('help.sections.howToUse.step3.title')}</Text>
            <Text style={styles.stepDescription}>
              {t('help.sections.howToUse.step3.description')}
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('help.sections.howToUse.step4.title')}</Text>
            <Text style={styles.stepDescription}>
              {t('help.sections.howToUse.step4.description')}
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>5</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{t('help.sections.howToUse.step5.title')}</Text>
            <Text style={styles.stepDescription}>
              {t('help.sections.howToUse.step5.description')}
            </Text>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('help.sections.tips.title')}</Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="time-outline" size={20} color="#000000" />
          <Text style={styles.tipText}>
            {t('help.sections.tips.tip1')}
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="calendar-outline" size={20} color="#000000" />
          <Text style={styles.tipText}>
            {t('help.sections.tips.tip2')}
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="sync-outline" size={20} color="#000000" />
          <Text style={styles.tipText}>
            {t('help.sections.tips.tip3')}
          </Text>
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
    paddingTop: 20,
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    fontFamily: 'System',
    fontWeight: '400',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
  },
  stepTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    fontFamily: 'System',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tipText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 20,
    fontFamily: 'System',
    marginLeft: 15,
    flex: 1,
    fontWeight: '400',
  },
});
