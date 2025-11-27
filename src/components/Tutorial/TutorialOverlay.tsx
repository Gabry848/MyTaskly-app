import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, Easing } from 'react-native';
import { tutorialStyles } from './styles';
import { TooltipCard } from './TooltipCard';
import { NavigationControls } from './NavigationControls';
import { ProgressIndicator } from './ProgressIndicator';
import { ElementMeasurement } from '../../hooks/useTutorial';

/**
 * Props for TutorialOverlay component
 */
export interface TutorialOverlayProps {
  /** Measurement of target element */
  targetMeasurement: ElementMeasurement | null;
  /** Current step index */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Icon name to display */
  icon?: string;
  /** Whether back navigation is allowed */
  canGoBack: boolean;
  /** Whether next navigation is allowed */
  canGoNext: boolean;
  /** Callback for back button */
  onBack: () => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback for skip button */
  onSkip: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  targetMeasurement,
  currentStepIndex,
  totalSteps,
  title,
  description,
  icon,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  onSkip,
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in overlay
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity]);

  useEffect(() => {
    // Pulse animation for spotlight
    if (targetMeasurement) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
      };
    }
  }, [pulseAnim, targetMeasurement]);

  // Calculate spotlight style
  const getSpotlightStyle = () => {
    if (!targetMeasurement) {
      return {
        display: 'none' as const,
      };
    }

    const { pageX, pageY, width, height } = targetMeasurement;

    // Add padding around the element
    const padding = 8;
    const borderRadius = Math.min(width, height) > 100 ? 16 : 24;

    return {
      left: pageX - padding,
      top: pageY - padding,
      width: width + padding * 2,
      height: height + padding * 2,
      borderRadius,
    };
  };

  const spotlightStyle = getSpotlightStyle();

  return (
    <Animated.View
      style={[
        tutorialStyles.overlay,
        { opacity: overlayOpacity },
      ]}
      accessibilityViewIsModal={true}
    >
      {/* Spotlight */}
      {targetMeasurement && spotlightStyle.display !== 'none' && (
        <Animated.View
          style={[
            tutorialStyles.spotlight,
            spotlightStyle,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
          accessibilityElementsHidden={true}
        />
      )}

      {/* Tooltip Card */}
      <TooltipCard
        title={title}
        description={description}
        icon={icon}
        targetMeasurement={targetMeasurement}
      />

      {/* Progress Indicator */}
      <View
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <ProgressIndicator
          totalSteps={totalSteps}
          currentStep={currentStepIndex}
        />
      </View>

      {/* Navigation Controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          left: 32,
          right: 32,
        }}
      >
        <NavigationControls
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
        />
      </View>
    </Animated.View>
  );
};
