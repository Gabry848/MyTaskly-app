import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tutorialStyles } from './styles';
import { TUTORIAL_CONTENT } from '../../constants/tutorialContent';

/**
 * Props for WelcomeScreen component
 */
export interface WelcomeScreenProps {
  /** Callback when tutorial starts */
  onStart: () => void;
  /** Callback when tutorial is skipped */
  onSkip: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onSkip }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
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
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={tutorialStyles.welcomeContainer}>
      <Animated.View
        style={[
          tutorialStyles.welcomeCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Icon */}
        <View
          style={tutorialStyles.welcomeLogo}
          accessibilityLabel="MyTaskly logo"
        >
          <Image
            source={require('../../../assets/icons/adaptive-icon.png')}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={tutorialStyles.welcomeTitle}>
          {TUTORIAL_CONTENT.welcome.title}
        </Text>

        {/* Description */}
        <Text style={tutorialStyles.welcomeDescription}>
          {TUTORIAL_CONTENT.welcome.description}
        </Text>

        {/* Buttons */}
        <View style={tutorialStyles.welcomeButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              tutorialStyles.welcomeButton,
              tutorialStyles.welcomePrimaryButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel={TUTORIAL_CONTENT.welcome.startButton}
            accessibilityHint="Inizia il tour guidato dell'app"
          >
            {({ pressed }) => (
              <Text
                style={[
                  tutorialStyles.welcomeButtonText,
                  tutorialStyles.primaryButtonText,
                  pressed && { opacity: 0.9 },
                ]}
              >
                {TUTORIAL_CONTENT.welcome.startButton}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              tutorialStyles.welcomeButton,
              tutorialStyles.welcomeSecondaryButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={TUTORIAL_CONTENT.welcome.skipButton}
            accessibilityHint="Salta il tour e vai direttamente all'app"
          >
            {({ pressed }) => (
              <Text
                style={[
                  tutorialStyles.welcomeButtonText,
                  tutorialStyles.secondaryButtonText,
                  pressed && { opacity: 0.7 },
                ]}
              >
                {TUTORIAL_CONTENT.welcome.skipButton}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};
