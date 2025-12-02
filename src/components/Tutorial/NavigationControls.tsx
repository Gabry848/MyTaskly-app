import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { tutorialStyles } from './styles';
import { TUTORIAL_CONTENT } from '../../constants/tutorialContent';

export interface NavigationControlsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  showSkip?: boolean;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  onSkip,
  showSkip = true,
}) => {
  return (
    <View style={tutorialStyles.navigationContainer}>
      {/* Back Button */}
      {canGoBack ? (
        <Pressable
          style={({ pressed }) => [
            tutorialStyles.navigationButton,
            tutorialStyles.secondaryButton,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={TUTORIAL_CONTENT.navigation.back}
          accessibilityHint="Torna al passo precedente"
        >
          {({ pressed }) => (
            <Text
              style={[
                tutorialStyles.buttonText,
                tutorialStyles.secondaryButtonText,
                pressed && { opacity: 0.7 },
              ]}
            >
              {TUTORIAL_CONTENT.navigation.back}
            </Text>
          )}
        </Pressable>
      ) : (
        showSkip && (
          <Pressable
            style={({ pressed }) => [
              tutorialStyles.navigationButton,
              tutorialStyles.skipButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={TUTORIAL_CONTENT.navigation.skip}
            accessibilityHint="Salta il tutorial"
          >
            {({ pressed }) => (
              <Text
                style={[
                  tutorialStyles.buttonText,
                  tutorialStyles.skipButtonText,
                  pressed && { opacity: 0.7 },
                ]}
              >
                {TUTORIAL_CONTENT.navigation.skip}
              </Text>
            )}
          </Pressable>
        )
      )}

      {/* Next Button */}
      {canGoNext && (
        <Pressable
          style={({ pressed }) => [
            tutorialStyles.navigationButton,
            tutorialStyles.primaryButton,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={TUTORIAL_CONTENT.navigation.next}
          accessibilityHint="Vai al passo successivo"
        >
          {({ pressed }) => (
            <Text
              style={[
                tutorialStyles.buttonText,
                tutorialStyles.primaryButtonText,
                pressed && { opacity: 0.9 },
              ]}
            >
              {TUTORIAL_CONTENT.navigation.next}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
};
