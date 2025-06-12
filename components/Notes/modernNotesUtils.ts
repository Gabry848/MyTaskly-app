import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Configurazioni per le animazioni
export const ANIMATION_CONFIGS = {
  spring: {
    fast: {
      damping: 25,
      stiffness: 400,
      mass: 0.8,
    },
    smooth: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
    slow: {
      damping: 15,
      stiffness: 200,
      mass: 1.2,
    },
  },
  timing: {
    fast: { duration: 150 },
    normal: { duration: 200 },
    slow: { duration: 300 },
  },
} as const;

// Physics per il dragging
export const DRAG_PHYSICS = {
  scale: {
    start: 1.08,
    end: 1,
  },
  rotation: {
    max: 6,
    min: -6,
  },
  shadow: {
    normal: 0.15,
    dragging: 0.3,
  },
} as const;

// Limiti per il canvas
export const CANVAS_LIMITS = {
  scale: {
    min: 0.5,
    max: 2,
    threshold: 0.8, // Sotto questo valore torna a 1
  },
  pan: {
    elasticFactor: 0.3,
    maxOffset: 300,
  },
} as const;

// Throttling per eventi ad alta frequenza
let lastHapticTime = 0;
const HAPTIC_THROTTLE_MS = 50;

export const throttledHaptic = (type: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  'worklet';
  const now = Date.now();
  if (now - lastHapticTime > HAPTIC_THROTTLE_MS) {
    lastHapticTime = now;
    runOnJS(() => {
      try {
        Haptics.impactAsync(type);
      } catch (error) {
        // Haptic non disponibile
      }
    })();
  }
};

export const throttledNotificationHaptic = (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Warning) => {
  'worklet';
  const now = Date.now();
  if (now - lastHapticTime > HAPTIC_THROTTLE_MS * 2) { // Più throttling per le notifiche
    lastHapticTime = now;
    runOnJS(() => {
      try {
        Haptics.notificationAsync(type);
      } catch (error) {
        // Haptic non disponibile
      }
    })();
  }
};

// Utility per clamp
export const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

// Utility per interpolazione smooth
export const smoothInterpolate = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  extrapolate: 'clamp' | 'extend' = 'clamp'
): number => {
  'worklet';
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;
  
  let progress = (value - inputMin) / (inputMax - inputMin);
  
  if (extrapolate === 'clamp') {
    progress = clamp(progress, 0, 1);
  }
  
  return outputMin + progress * (outputMax - outputMin);
};

// Utility per calcolare distanza
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
  'worklet';
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

// Utility per generare rotazione randomica
export const randomRotation = (maxDegrees: number = 6): number => {
  'worklet';
  return (Math.random() - 0.5) * maxDegrees;
};

// Debounce per operazioni di salvataggio
export const createDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle per operazioni frequent
export const createThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Validatori per note
export const validateNoteData = (note: any): boolean => {
  if (!note || typeof note !== 'object') return false;
  if (!note.id || typeof note.id !== 'string') return false;
  if (typeof note.text !== 'string') return false;
  if (!note.position || typeof note.position.x !== 'number' || typeof note.position.y !== 'number') return false;
  if (!isFinite(note.position.x) || !isFinite(note.position.y)) return false;
  if (!note.color || typeof note.color !== 'string') return false;
  return true;
};

export const validatePosition = (position: { x: number; y: number }): boolean => {
  return (
    position &&
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    isFinite(position.x) &&
    isFinite(position.y)
  );
};

// Performance helpers
export const isLowEndDevice = (): boolean => {
  // Implementazione semplice - può essere estesa con device detection
  return false;
};

export const getPerformanceConfig = () => {
  const isLowEnd = isLowEndDevice();
  
  return {
    animations: isLowEnd ? ANIMATION_CONFIGS.timing : ANIMATION_CONFIGS.spring,
    haptics: !isLowEnd,
    shadows: !isLowEnd,
    blurIntensity: isLowEnd ? 5 : 20,
  };
};

// Error handling
export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  fallback: T,
  onError?: (error: any) => void
): Promise<T> => {
  try {
    return await asyncFn();
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return fallback;
  }
};
