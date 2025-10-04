import React from 'react';
import { View } from 'react-native';
import { tutorialStyles } from './styles';

interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  totalSteps,
  currentStep
}) => {
  return (
    <View
      style={tutorialStyles.progressContainer}
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${currentStep} di ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={
            index === currentStep
              ? tutorialStyles.progressDotActive
              : tutorialStyles.progressDot
          }
          accessibilityElementsHidden={true}
        />
      ))}
    </View>
  );
};
