import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TUTORIAL_STORAGE_KEY } from "../constants/tutorialContent";
import {
  trackTutorialCompleted,
  trackTutorialSkipped,
} from "../services/analyticsService";

export interface TutorialContextType {
  isTutorialVisible: boolean;
  startTutorial: () => void;
  closeTutorial: () => void;
  skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);

  // Check if tutorial should auto-start on first launch
  React.useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const status = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
        const hasCompleted = status === "true" || status === "skipped";

        if (!hasCompleted) {
          setIsTutorialVisible(true);
        }
      } catch (error) {
        console.error("[TUTORIAL] Error checking tutorial status:", error);
      }
    };

    checkTutorialStatus();
  }, []);

  const startTutorial = useCallback(() => {
    setIsTutorialVisible(true);
  }, []);

  const closeTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
      trackTutorialCompleted();
      setIsTutorialVisible(false);
    } catch (error) {
      console.error("[TUTORIAL] Error saving tutorial completion status:", error);
      setIsTutorialVisible(false);
    }
  }, []);

  const skipTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, "skipped");
      trackTutorialSkipped();
      setIsTutorialVisible(false);
    } catch (error) {
      console.error("[TUTORIAL] Error saving skip status:", error);
    }
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isTutorialVisible,
        startTutorial,
        closeTutorial,
        skipTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    console.warn(
      "[TUTORIAL] useTutorialContext called outside TutorialProvider"
    );
    return {
      isTutorialVisible: false,
      startTutorial: () =>
        console.warn("[TUTORIAL] startTutorial called but context not available"),
      closeTutorial: () =>
        console.warn("[TUTORIAL] closeTutorial called but context not available"),
      skipTutorial: () =>
        console.warn("[TUTORIAL] skipTutorial called but context not available"),
    };
  }
  return context;
};
