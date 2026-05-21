import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { sendQuickVoiceAdd } from '../../services/quickVoiceAddService';
import { colors } from '../../theme/tokens';

type QuickVoiceAddState = 'idle' | 'recording' | 'sending' | 'success';

interface QuickVoiceAddProps {
  model: 'base' | 'advanced';
  disabled?: boolean;
  showCompactIcon?: boolean;
  variant?: 'pill' | 'fab';
  autoStart?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onStateChange?: (state: QuickVoiceAddState) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BAR_COUNT = 18;

const QuickVoiceAdd: React.FC<QuickVoiceAddProps> = ({
  model,
  disabled = false,
  showCompactIcon = true,
  variant = 'pill',
  autoStart = false,
  containerStyle,
  onStateChange,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<QuickVoiceAddState>('idle');
  const expandAnim = useRef(new Animated.Value(0)).current;
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.25))).current;
  const recordingStartRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const autoStartedRef = useRef(false);

  const isExpanded = state !== 'idle';
  const isFab = variant === 'fab';

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      damping: 18,
      stiffness: 140,
      mass: 0.9,
      useNativeDriver: false,
    }).start();
  }, [expandAnim, isExpanded]);

  useEffect(() => {
    if (state !== 'recording') {
      bars.forEach((bar) => bar.stopAnimation(() => bar.setValue(0.25)));
      return;
    }

    const loops = bars.map((bar, index) => {
      const duration = 520 + (index % 5) * 90;
      const delay = index * 38;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(bar, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.18,
            duration: duration + 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((loop) => loop.stop());
  }, [bars, state]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (isRecordingRef.current) {
        recorder.stop().catch((error) => {
          console.warn('[QuickVoiceAdd] stop error:', error);
        });
      }
    };
  }, [recorder]);

  const startRecording = useCallback(async () => {
    if (disabled || state !== 'idle') return;

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microfono non disponibile', 'Abilita il microfono per usare Quick add.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      recorder.record();
      isRecordingRef.current = true;
      recordingStartRef.current = Date.now();
      setState('recording');
    } catch (error) {
      console.error('[QuickVoiceAdd] startRecording error:', error);
      Alert.alert('Errore registrazione', 'Non sono riuscito ad avviare il microfono.');
      setState('idle');
    }
  }, [disabled, recorder, state]);

  useEffect(() => {
    if (!autoStart) {
      autoStartedRef.current = false;
      return;
    }

    if (autoStartedRef.current || disabled || state !== 'idle') return;
    autoStartedRef.current = true;

    const timer = setTimeout(() => {
      startRecording();
    }, 120);

    return () => clearTimeout(timer);
  }, [autoStart, disabled, startRecording, state]);

  const sendRecording = async () => {
    if (state !== 'recording') return;

    try {
      const elapsedMs = Date.now() - recordingStartRef.current;
      if (elapsedMs < 450) {
        await new Promise((resolve) => setTimeout(resolve, 450 - elapsedMs));
      }

      await recorder.stop();
      isRecordingRef.current = false;
      const uri = recorder.uri;
      if (!uri) {
        throw new Error('File audio non disponibile');
      }

      setState('sending');
      const result = await sendQuickVoiceAdd(uri, model);
      if (!result.received && !result.recivied) {
        throw new Error(result.error || 'Audio non ricevuto dal server');
      }

      setState('success');
      onSuccess?.();
      resetTimerRef.current = setTimeout(() => {
        setState('idle');
      }, 1050);
    } catch (error: any) {
      console.error('[QuickVoiceAdd] sendRecording error:', error);
      Alert.alert('Invio non riuscito', error?.message || 'Riprova tra poco.');
      setState('idle');
      isRecordingRef.current = false;
    } finally {
      setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    }
  };

  const cancelRecording = async () => {
    if (state !== 'recording') return;
    try {
      await recorder.stop();
    } catch {
      // Ignore stop errors while cancelling.
    } finally {
      isRecordingRef.current = false;
      setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      setState('idle');
      onCancel?.();
    }
  };

  const width = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isFab ? 56 : 138, 292],
  });
  const height = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isFab ? 56 : 44, 64],
  });
  const borderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isFab ? 28 : 22, 32],
  });
  const backgroundColor = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isFab ? '#000000' : '#FFFFFF', '#FFFFFF'],
  });
  const borderColor = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isFab ? '#000000' : colors.border, colors.border],
  });
  const compactOpacity = expandAnim.interpolate({
    inputRange: [0, 0.45],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const expandedOpacity = expandAnim.interpolate({
    inputRange: [0.35, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.shell, containerStyle, { width, height, borderRadius, backgroundColor, borderColor }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={startRecording}
        disabled={disabled || state !== 'idle'}
      >
        <Animated.View style={[styles.compactContent, isFab && styles.fabCompactContent, { opacity: compactOpacity }]}>
          {isFab ? (
            <Ionicons name="add" size={28} color={disabled ? '#8E8E93' : '#FFFFFF'} />
          ) : (
            <>
              {showCompactIcon && (
                <Ionicons name="mic-outline" size={17} color={disabled ? colors.textTertiary : colors.textPrimary} />
              )}
              <Text style={[styles.compactLabel, disabled && styles.disabledText]} allowFontScaling={false}>
                {t('home.quickAdd.label')}
              </Text>
            </>
          )}
        </Animated.View>
      </Pressable>

      <Animated.View pointerEvents={state === 'idle' ? 'none' : 'auto'} style={[styles.expandedContent, { opacity: expandedOpacity }]}>
        {state === 'success' ? (
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
            <Text style={styles.successText} allowFontScaling={false}>
              {t('home.quickAdd.sent')}
            </Text>
          </View>
        ) : (
          <>
            <Pressable style={styles.cancelButton} onPress={cancelRecording} disabled={state !== 'recording'}>
              <Ionicons name="close" size={18} color={state === 'recording' ? colors.textSecondary : colors.textTertiary} />
            </Pressable>

            <View style={styles.waveform}>
              {bars.map((bar, index) => {
                const barHeight = bar.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8 + (index % 3) * 2, 34 - (index % 4) * 3],
                });
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        height: barHeight,
                        opacity: state === 'sending' ? 0.35 : 1,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <Pressable
              style={[styles.submitButton, state === 'sending' && styles.submitButtonDisabled]}
              onPress={sendRecording}
              disabled={state !== 'recording'}
            >
              {state === 'sending' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
              )}
            </Pressable>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shell: {
    marginTop: 28,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    overflow: 'hidden',
  },
  compactContent: {
    flex: 1,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fabCompactContent: {
    paddingHorizontal: 0,
  },
  compactLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  expandedContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  cancelButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Platform.OS === 'ios' ? 4 : 3,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.78,
  },
  successContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
});

export default QuickVoiceAdd;
