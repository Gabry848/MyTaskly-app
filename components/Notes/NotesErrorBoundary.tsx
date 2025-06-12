import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface NotesErrorBoundaryProps {
  error: string | null;
  onClearError: () => void;
  children: React.ReactNode;
}

export const NotesErrorBoundary: React.FC<NotesErrorBoundaryProps> = ({
  error,
  onClearError,
  children,
}) => {
  const errorOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (error) {
      errorOpacity.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      errorOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [error]);

  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: errorOpacity.value,
      transform: [
        {
          translateY: errorOpacity.value === 0 ? -50 : 0,
        },
      ],
    };
  });

  const handleDismiss = () => {
    errorOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClearError, 200);
  };

  return (
    <View style={styles.container}>
      {children}
      
      {error && (
        <Animated.View style={[styles.errorContainer, errorAnimatedStyle]}>
          <BlurView
            intensity={20}
            tint="systemMaterialLight"
            style={styles.errorBlur}
          >
            <View style={styles.errorContent}>
              <FontAwesome name="exclamation-triangle" size={20} color="#FF3B30" />
              
              <View style={styles.errorTextContainer}>
                <Text style={styles.errorTitle}>Errore</Text>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                hitSlop={8}
              >
                <FontAwesome name="times" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 2000,
  },
  errorBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
