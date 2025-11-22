import { Text } from '@react-navigation/elements';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getValidToken } from '../../services/authService';
import axios from '../../services/axiosInstance';

export default function BugReport() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('bugReport.errors.title'), t('bugReport.errors.emptyFields'));
      return;
    }

    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert(t('bugReport.errors.title'), t('bugReport.errors.invalidToken'));
        return;
      }

      const response = await axios.post('/support/bug-report', {
        title: title.trim(),
        description: description.trim(),
        severity: 'medium',
        steps_to_reproduce: '',
        expected_behavior: '',
        actual_behavior: '',
        device_info: {
          platform: Platform.OS === 'ios' ? 'iPhone' : 'Android'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          t('bugReport.success.title'),
          t('bugReport.success.message'),
          [
            {
              text: 'OK',
              onPress: () => {
                setTitle('');
                setDescription('');
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Errore nell\'invio del bug report:', error);
      Alert.alert(
        t('bugReport.errors.title'),
        t('bugReport.errors.submitError')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Ionicons name="bug-outline" size={48} color="#FF3B30" />
          <Text style={styles.headerTitle}>{t('bugReport.header.title')}</Text>
          <Text style={styles.headerDescription}>
            {t('bugReport.header.description')}
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('bugReport.form.titleLabel')}</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={t('bugReport.form.titlePlaceholder')}
              placeholderTextColor="#999999"
              maxLength={100}
              multiline={false}
              editable={!loading}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('bugReport.form.descriptionLabel')}</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder={t('bugReport.form.descriptionPlaceholder')}
              placeholderTextColor="#999999"
              maxLength={1000}
              multiline={true}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.characterCount}>{description.length}/1000</Text>
          </View>

          <View style={styles.tipsSection}>
            <View style={styles.tipsHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.tipsTitle}>{t('bugReport.tips.title')}</Text>
            </View>
            <Text style={styles.tipsText}>
              {t('bugReport.tips.content')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="send-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>{t('bugReport.form.submitButton')}</Text>
              </View>
            )}
          </TouchableOpacity>
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
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    marginTop: 16,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'System',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    backgroundColor: '#ffffff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'System',
  },
  tipsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'System',
    marginLeft: 6,
  },
  tipsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'System',
  },
  submitButton: {
    backgroundColor: '#000000ff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    marginLeft: 8,
  },
});