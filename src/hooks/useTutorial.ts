import { useState, useCallback, useEffect, useRef } from 'react';
import { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TUTORIAL_STEPS, TUTORIAL_STORAGE_KEY, TutorialStep } from '../constants/tutorialContent';
import { RootStackParamList, TabParamList } from '../navigation';

export interface ElementMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}

interface UseTutorialProps {
  navigation: NavigationProp<RootStackParamList> | NavigationProp<TabParamList>;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const useTutorial = ({ navigation, onComplete, onSkip }: UseTutorialProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetMeasurement, setTargetMeasurement] = useState<ElementMeasurement | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const elementRefs = useRef<{ [key: string]: any }>({});
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Check if tutorial was already completed
  const checkTutorialStatus = useCallback(async () => {
    try {
      const status = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      return status === 'true' || status === 'skipped';
    } catch (error) {
      console.error('[TUTORIAL] Error checking tutorial status:', error);
      return false;
    }
  }, []);

  // Start tutorial
  const startTutorial = useCallback(async () => {
    const isCompleted = await checkTutorialStatus();
    if (!isCompleted) {
      setCurrentStepIndex(0);
      setIsVisible(true);
    }
  }, [checkTutorialStatus]);

  // Restart tutorial (for "Review Tutorial" option)
  const restartTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsVisible(true);
    setTargetMeasurement(null);
  }, []);

  // Register element ref for spotlight
  const registerElement = useCallback((elementName: string, ref: any) => {
    elementRefs.current[elementName] = ref;
  }, []);

  // Measure element for spotlight
  const measureElement = useCallback((elementName: string): Promise<ElementMeasurement | null> => {
    return new Promise((resolve) => {
      const ref = elementRefs.current[elementName];

      if (!ref || !ref.measure) {
        console.warn(`[TUTORIAL] No ref found for element: ${elementName}`);
        resolve(null);
        return;
      }

      ref.measure(
        (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          if (width === 0 || height === 0) {
            console.warn(`[TUTORIAL] Invalid measurements for ${elementName}`);
            resolve(null);
            return;
          }

          resolve({ x, y, width, height, pageX, pageY });
        }
      );
    });
  }, []);

  // Navigate to target screen and measure element
  const navigateAndMeasure = useCallback(async (step: TutorialStep) => {
    if (!step.targetScreen || !step.targetElement) {
      setTargetMeasurement(null);
      return;
    }

    setIsNavigating(true);

    // Navigate to target screen
    try {
      // @ts-ignore - navigation can be either stack or tab
      navigation.navigate(step.targetScreen as any);

      // Wait for navigation to complete and element to render
      await new Promise(resolve => {
        navigationTimeoutRef.current = setTimeout(resolve, 300);
      });

      // Measure the target element
      const measurement = await measureElement(step.targetElement);
      setTargetMeasurement(measurement);
    } catch (error) {
      console.error('[TUTORIAL] Navigation error:', error);
      setTargetMeasurement(null);
    } finally {
      setIsNavigating(false);
    }
  }, [navigation, measureElement]);

  // Go to next step
  const nextStep = useCallback(async () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStepData = TUTORIAL_STEPS[nextIndex];

      setCurrentStepIndex(nextIndex);

      if (nextStepData.type === 'spotlight') {
        await navigateAndMeasure(nextStepData);
      } else {
        setTargetMeasurement(null);
      }
    }
  }, [currentStepIndex, navigateAndMeasure]);

  // Go to previous step
  const previousStep = useCallback(async () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStepData = TUTORIAL_STEPS[prevIndex];

      setCurrentStepIndex(prevIndex);

      if (prevStepData.type === 'spotlight') {
        await navigateAndMeasure(prevStepData);
      } else {
        setTargetMeasurement(null);
      }
    }
  }, [currentStepIndex, navigateAndMeasure]);

  // Skip tutorial
  const skipTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'skipped');
      setIsVisible(false);
      setTargetMeasurement(null);

      // Navigate back to Home
      // @ts-ignore
      navigation.navigate('Home');

      onSkip?.();
    } catch (error) {
      console.error('[TUTORIAL] Error skipping tutorial:', error);
    }
  }, [navigation, onSkip]);

  // Complete tutorial
  const completeTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      setIsVisible(false);
      setTargetMeasurement(null);

      // Navigate back to Home
      // @ts-ignore
      navigation.navigate('Home');

      onComplete?.();
    } catch (error) {
      console.error('[TUTORIAL] Error completing tutorial:', error);
    }
  }, [navigation, onComplete]);

  // Effect to handle step changes and measurements
  useEffect(() => {
    if (isVisible && currentStep && currentStep.type === 'spotlight') {
      navigateAndMeasure(currentStep);
    }
  }, [currentStep, isVisible, navigateAndMeasure]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isVisible,
    currentStep,
    currentStepIndex,
    totalSteps: TUTORIAL_STEPS.length,
    targetMeasurement,
    isNavigating,

    // Actions
    startTutorial,
    restartTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    registerElement,

    // Helpers
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === TUTORIAL_STEPS.length - 1,
    canGoBack: currentStepIndex > 0,
    canGoNext: currentStepIndex < TUTORIAL_STEPS.length - 1,
  };
};
