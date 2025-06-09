// Performance utilities per le note
export const PERFORMANCE_CONFIG = {
  // Configurazione animazioni per dispositivi diversi
  ANIMATION: {
    HIGH_PERFORMANCE: {
      damping: 28,
      stiffness: 600,
      mass: 0.4,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
    STANDARD: {
      damping: 22,
      stiffness: 400,
      mass: 0.6,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
    },
    LOW_PERFORMANCE: {
      damping: 18,
      stiffness: 300,
      mass: 0.8,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 0.5,
    },
  },
  
  // Configurazione gesture
  GESTURE: {
    MOMENTUM_FACTOR: 0.2,
    MAX_MOMENTUM: 120,
    SMOOTH_FACTOR: 0.99,
    ZOOM_COMPENSATION_MIN: 0.1,
  },
  
  // Configurazione haptic feedback
  HAPTIC: {
    LIGHT_FEEDBACK_THROTTLE: 50, // ms
    MEDIUM_FEEDBACK_THROTTLE: 100, // ms
  },
};

// Throttle per haptic feedback
let lastHapticTime = 0;

export const throttledHapticFeedback = (
  intensity: 'light' | 'medium' = 'light',
  callback: () => void
) => {
  const now = Date.now();
  const throttleTime = intensity === 'light' 
    ? PERFORMANCE_CONFIG.HAPTIC.LIGHT_FEEDBACK_THROTTLE
    : PERFORMANCE_CONFIG.HAPTIC.MEDIUM_FEEDBACK_THROTTLE;
    
  if (now - lastHapticTime >= throttleTime) {
    callback();
    lastHapticTime = now;
  }
};

// Configurazione dinamica basata sulle performance del dispositivo
export const getOptimalAnimationConfig = () => {
  // Qui si potrebbe implementare un sistema di rilevamento delle performance
  // Per ora utilizziamo la configurazione standard
  return PERFORMANCE_CONFIG.ANIMATION.STANDARD;
};

// Utility per clampare valori
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Utility per interpolazione smooth
export const smoothInterpolate = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  factor: number = 0.99
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;
  
  const normalizedValue = clamp((value - inputMin) / (inputMax - inputMin), 0, 1);
  const interpolated = outputMin + normalizedValue * (outputMax - outputMin);
  
  return interpolated * factor;
};
