import React, { useEffect, useRef } from 'react';
import { View, Text, Dimensions, Animated, StyleSheet } from 'react-native';
import { AIChatIllustration, TaskManagementIllustration, CalendarIllustration } from '../Illustrations';

const { width } = Dimensions.get('window');

interface CarouselSlideProps {
  headline: string;
  subheadline: string;
  illustration: 'aiChat' | 'taskManagement' | 'calendar';
  isActive: boolean;
}

export const CarouselSlide: React.FC<CarouselSlideProps> = ({
  headline,
  subheadline,
  illustration,
  isActive,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [isActive, fadeAnim, scaleAnim]);

  const IllustrationComponent = {
    aiChat: AIChatIllustration,
    taskManagement: TaskManagementIllustration,
    calendar: CalendarIllustration,
  }[illustration];

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View
        style={[
          styles.illustrationContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <IllustrationComponent />
      </Animated.View>

      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subheadline}>{subheadline}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  illustrationContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System',
    letterSpacing: -0.8,
    lineHeight: 38,
    paddingHorizontal: 16,
  },
  subheadline: {
    fontSize: 17,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    fontFamily: 'System',
    paddingHorizontal: 24,
  },
});
