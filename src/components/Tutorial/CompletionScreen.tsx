import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tutorialStyles } from './styles';
import { TUTORIAL_CONTENT } from '../../constants/tutorialContent';

/**
 * Props for CompletionScreen component
 */
export interface CompletionScreenProps {
  /** Callback when completion is confirmed */
  onComplete: () => void;
  /** Callback to review tutorial */
  onReview: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  onComplete,
  onReview,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, iconScaleAnim]);

  return (
    <View style={tutorialStyles.completionContainer}>
      <Animated.View
        style={[
          tutorialStyles.completionCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            tutorialStyles.completionIconContainer,
            {
              transform: [{ scale: iconScaleAnim }],
            },
          ]}
          accessibilityLabel="Tutorial completato"
        >
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </Animated.View>

        {/* Title */}
        <Text style={tutorialStyles.completionTitle}>
          {TUTORIAL_CONTENT.completion.title}
        </Text>

        {/* Description */}
        <Text style={tutorialStyles.completionDescription}>
          {TUTORIAL_CONTENT.completion.description}
        </Text>

        {/* Buttons */}
        <View style={tutorialStyles.completionButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              tutorialStyles.welcomeButton,
              tutorialStyles.welcomePrimaryButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel={TUTORIAL_CONTENT.completion.primaryButton}
            accessibilityHint="Completa il tutorial e inizia a usare l'app"
          >
            {({ pressed }) => (
              <Text
                style={[
                  tutorialStyles.welcomeButtonText,
                  tutorialStyles.primaryButtonText,
                  pressed && { opacity: 0.9 },
                ]}
              >
                {TUTORIAL_CONTENT.completion.primaryButton}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              tutorialStyles.welcomeButton,
              tutorialStyles.welcomeSecondaryButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={onReview}
            accessibilityRole="button"
            accessibilityLabel={TUTORIAL_CONTENT.completion.secondaryButton}
            accessibilityHint="Rivedi il tutorial dall'inizio"
          >
            {({ pressed }) => (
              <Text
                style={[
                  tutorialStyles.welcomeButtonText,
                  tutorialStyles.secondaryButtonText,
                  pressed && { opacity: 0.7 },
                ]}
              >
                {TUTORIAL_CONTENT.completion.secondaryButton}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};
