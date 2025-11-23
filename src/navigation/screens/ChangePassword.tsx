import { Text } from '@react-navigation/elements';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changePassword } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.messages.warning'), t('changePassword.errors.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.messages.warning'), t('changePassword.errors.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.messages.warning'), t('changePassword.errors.minLength'));
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(oldPassword, newPassword);
      if (result.success) {
        Alert.alert(t('common.messages.success'), result.message, [
          {
            text: t('common.buttons.ok'),
            onPress: () => navigation.goBack()
          }
        ]);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert(t('common.messages.error'), result.message);
      }
    } catch (error) {
      Alert.alert(t('common.messages.error'), t('changePassword.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#007bff" />
            <Text style={styles.instructionsText}>
              {t('changePassword.instructions')}
            </Text>
          </View>

          {/* Old Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('changePassword.labels.currentPassword')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
                placeholder={t('changePassword.placeholders.currentPassword')}
                placeholderTextColor="#adb5bd"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowOldPassword(!showOldPassword)}
              >
                <Ionicons
                  name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('changePassword.labels.newPassword')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder={t('changePassword.placeholders.newPassword')}
                placeholderTextColor="#adb5bd"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('changePassword.labels.confirmPassword')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder={t('changePassword.placeholders.confirmPassword')}
                placeholderTextColor="#adb5bd"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>{t('changePassword.updateButton')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>{t('changePassword.tips.title')}</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.tipText}>{t('changePassword.tips.tip1')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.tipText}>{t('changePassword.tips.tip2')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.tipText}>{t('changePassword.tips.tip3')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#28a745" />
              <Text style={styles.tipText}>{t('changePassword.tips.tip4')}</Text>
            </View>
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
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 12,
    fontFamily: 'System',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'System',
  },
  eyeButton: {
    padding: 12,
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tipsTitle: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#495057',
    fontFamily: 'System',
    marginLeft: 8,
  },
});
