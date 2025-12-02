import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tutorialStyles } from './styles';
import { ElementMeasurement } from '../../hooks/useTutorial';

export interface TooltipCardProps {
  title: string;
  description: string;
  icon?: string;
  targetMeasurement?: ElementMeasurement | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TooltipCard: React.FC<TooltipCardProps> = ({
  title,
  description,
  icon,
  targetMeasurement,
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations when target changes
    slideAnim.setValue(50);
    fadeAnim.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, targetMeasurement]);

  // Calculate position based on spotlight location
  const getTooltipPosition = () => {
    if (!targetMeasurement) {
      // Default center position if no target
      return {
        top: SCREEN_HEIGHT / 2 - 150,
        left: 32,
        right: 32,
      };
    }

    const { pageY, height } = targetMeasurement;
    const spotlightBottom = pageY + height;
    const isInTopThird = pageY < SCREEN_HEIGHT / 3;
    const isInBottomThird = spotlightBottom > (SCREEN_HEIGHT * 2) / 3;

    if (isInBottomThird) {
      // Position above the spotlight
      return {
        bottom: SCREEN_HEIGHT - pageY + 24,
        left: 32,
        right: 32,
      };
    } else if (isInTopThird) {
      // Position below the spotlight
      return {
        top: spotlightBottom + 24,
        left: 32,
        right: 32,
      };
    } else {
      // Position below the spotlight (default)
      return {
        top: spotlightBottom + 24,
        left: 32,
        right: 32,
      };
    }
  };

  const position = getTooltipPosition();

  return (
    <Animated.View
      style={[
        tutorialStyles.tooltipCard,
        position,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* Icon */}
      {icon && (
        <View
          style={tutorialStyles.tooltipIconContainer}
          accessibilityElementsHidden={true}
        >
          <Ionicons
            name={icon as any}
            size={32}
            color="#000000"
          />
        </View>
      )}

      {/* Title */}
      <Text
        style={tutorialStyles.tooltipTitle}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Description */}
      <Text style={tutorialStyles.tooltipDescription}>
        {description}
      </Text>
    </Animated.View>
  );
};
