import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface ModernNoteInputProps {
  onAddNote: (text: string) => Promise<void>;
  isLoading?: boolean;
}

export const ModernNoteInput: React.FC<ModernNoteInputProps> = ({
  onAddNote,
  isLoading = false,
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const focusScale = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0.95);

  const handleFocus = () => {
    setIsFocused(true);
    focusScale.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
    backgroundOpacity.value = withTiming(0.98, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusScale.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
    backgroundOpacity.value = withTiming(0.95, { duration: 200 });
  };

  const handleSubmit = async () => {
    if (!text.trim() || isLoading) return;

    const noteText = text.trim();
    setText('');
    Keyboard.dismiss();
    
    try {
      await onAddNote(noteText);
    } catch (error) {
      // L'errore viene gestito dal hook useNotes
      console.error('Errore nell\'aggiunta della nota:', error);
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(focusScale.value, [0, 1], [1, 1.02]);
    
    return {
      transform: [{ scale }],
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <Animated.View style={[styles.backgroundWrapper, backgroundAnimatedStyle]}>
          <BlurView
            intensity={20}
            tint="systemChromeMaterialLight"
            style={styles.blurContainer}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  isFocused && styles.inputFocused,
                ]}
                value={text}
                onChangeText={setText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onSubmitEditing={handleSubmit}
                placeholder="Aggiungi una nuova nota..."
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={500}
                returnKeyType="done"
                blurOnSubmit
                editable={!isLoading}
              />
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!text.trim() || isLoading) && styles.addButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!text.trim() || isLoading}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={isLoading ? "spinner" : "plus"}
                  size={18}
                  color="#FFFFFF"
                  style={isLoading && styles.spinningIcon}
                />
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backgroundWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  blurContainer: {
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    fontSize: 16,
    color: '#1C1C1E',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0.1,
  },
  spinningIcon: {
    // Qui si potrebbe aggiungere un'animazione di rotazione
    opacity: 0.8,
  },
});
