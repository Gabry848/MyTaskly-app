import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TUTORIAL_STORAGE_KEY } from '../constants/tutorialContent';

/**
 * Tutorial Context Type
 */
export interface TutorialContextType {
  /** Whether tutorial is visible */
  isTutorialVisible: boolean;
  /** Whether tutorial should auto-start */
  shouldAutoStart: boolean;
  /** Start tutorial */
  startTutorial: () => void;
  /** Close tutorial */
  closeTutorial: () => void;
  /** Register element ref */
  registerElementRef: (key: string, ref: any) => void;
  /** Get element ref */
  getElementRef: (key: string) => any;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [shouldAutoStart, setShouldAutoStart] = useState(false);
  const elementRefsMap = useRef<{ [key: string]: any }>({});

  // Log state changes
  React.useEffect(() => {
    console.log('[TUTORIAL_CONTEXT] 📊 State changed - isTutorialVisible:', isTutorialVisible);
  }, [isTutorialVisible]);

  // Check if tutorial should auto-start
  React.useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const status = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
        const hasCompleted = status === 'true' || status === 'skipped';

        if (!hasCompleted) {
          // Auto-start tutorial for first-time users
          setShouldAutoStart(true);
          setIsTutorialVisible(true);
        }
      } catch (error) {
        console.error('[TUTORIAL] Error checking tutorial status:', error);
      }
    };

    checkTutorialStatus();
  }, []);

  const startTutorial = useCallback(() => {
    console.log('[TUTORIAL_CONTEXT] 🎯 startTutorial called - setting isTutorialVisible to true');
    setIsTutorialVisible(true);
  }, []);

  const closeTutorial = useCallback(() => {
    console.log('[TUTORIAL_CONTEXT] 🔴 closeTutorial called - setting isTutorialVisible to false');
    setIsTutorialVisible(false);
  }, []);

  const registerElementRef = useCallback((key: string, ref: any) => {
    elementRefsMap.current[key] = ref;
  }, []);

  const getElementRef = useCallback((key: string) => {
    return elementRefsMap.current[key];
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isTutorialVisible,
        shouldAutoStart,
        startTutorial,
        closeTutorial,
        registerElementRef,
        getElementRef,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    console.warn('[TUTORIAL] useTutorialContext called outside TutorialProvider');
    // Return a default context instead of throwing
    return {
      isTutorialVisible: false,
      shouldAutoStart: false,
      startTutorial: () => console.warn('[TUTORIAL] startTutorial called but context not available'),
      closeTutorial: () => console.warn('[TUTORIAL] closeTutorial called but context not available'),
      registerElementRef: () => {},
      getElementRef: () => null,
    };
  }
  return context;
};
