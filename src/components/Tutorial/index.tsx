import React from 'react';
import { Modal } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useTutorial } from '../../hooks/useTutorial';
import { useTutorialContext } from '../../contexts/TutorialContext';
import { WelcomeScreen } from './WelcomeScreen';
import { CompletionScreen } from './CompletionScreen';
import { TutorialOverlay } from './TutorialOverlay';
import { RootStackParamList, TabParamList } from '../../navigation';

export interface TutorialManagerProps {
  navigation: NavigationProp<RootStackParamList> | NavigationProp<TabParamList>;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({
  navigation,
  onComplete,
  autoStart = false,
}) => {
  // Get tutorial visibility from context
  const tutorialContext = useTutorialContext();
  const { isTutorialVisible, closeTutorial: closeContextTutorial } = tutorialContext;

  console.log('[TUTORIAL_MANAGER] 📱 Component render - isTutorialVisible:', isTutorialVisible);

  const {
    isVisible,
    currentStep,
    currentStepIndex,
    totalSteps,
    targetMeasurement,
    isNavigating,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    restartTutorial,
    canGoBack,
    canGoNext,
    startTutorial,
  } = useTutorial({
    navigation,
    onComplete,
    onSkip: onComplete,
  });

  // Start tutorial when context says it should be visible
  React.useEffect(() => {
    console.log('[TUTORIAL_MANAGER] isTutorialVisible from context:', isTutorialVisible);
    console.log('[TUTORIAL_MANAGER] isVisible from hook:', isVisible);

    if (isTutorialVisible && !isVisible) {
      console.log('[TUTORIAL_MANAGER] 🚀 Starting tutorial from context trigger (FORCE MODE)');
      startTutorial(true); // Force start when manually triggered
    }
  }, [isTutorialVisible, isVisible, startTutorial]);

  console.log('[TUTORIAL_MANAGER] Rendering - isVisible:', isVisible, 'currentStep:', currentStep?.type);

  if (!isVisible || !currentStep) {
    console.log('[TUTORIAL_MANAGER] Not rendering - isVisible:', isVisible, 'currentStep:', !!currentStep);
    return null;
  }

  const handleWelcomeStart = () => {
    nextStep();
  };

  const handleCompletionReview = () => {
    restartTutorial();
  };

  const handleSkip = () => {
    skipTutorial();
    closeContextTutorial(); // Reset context state
  };

  const handleComplete = () => {
    completeTutorial();
    closeContextTutorial(); // Reset context state
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      {currentStep.type === 'welcome' && (
        <WelcomeScreen
          onStart={handleWelcomeStart}
          onSkip={handleSkip}
        />
      )}

      {currentStep.type === 'spotlight' && !isNavigating && (
        <TutorialOverlay
          targetMeasurement={targetMeasurement}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          title={currentStep.content.title}
          description={currentStep.content.description}
          icon={currentStep.content.icon}
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          onBack={previousStep}
          onNext={nextStep}
          onSkip={handleSkip}
        />
      )}

      {currentStep.type === 'completion' && (
        <CompletionScreen
          onComplete={handleComplete}
          onReview={handleCompletionReview}
        />
      )}
    </Modal>
  );
};

// Export hook for external use
export { useTutorial } from '../../hooks/useTutorial';
