import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface VoiceRecordButtonProps {
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animazione pulse durante la registrazione
  useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordingButton,
          disabled && styles.disabledButton,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >        <View style={styles.buttonContent}>
          <MaterialIcons
            name={isRecording ? 'stop' : 'mic'}
            size={24}
            color={disabled ? '#CCC' : isRecording ? '#FF3B30' : '#007bff'}
          />
        </View>
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.durationText}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}
        {isRecording && <View style={styles.recordingIndicator} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  recordButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    position: 'relative',
    alignSelf: 'flex-end', // Assicura l'allineamento in basso
  },  recordingButton: {
    backgroundColor: '#FFF2F2',
    borderColor: '#FF3B30',
    borderWidth: 2, // Bordo più spesso durante la registrazione
  },
  disabledButton: {
    opacity: 0.5,
  },  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerContainer: {
    position: 'absolute',
    bottom: -18,
    left: -22,
    right: -22,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default VoiceRecordButton;
