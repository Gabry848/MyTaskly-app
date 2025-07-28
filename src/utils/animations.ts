import { Animated, Easing } from "react-native";

// Funzioni di utilità per animazioni comuni

export const createFadeInAnimation = (animatedValue: Animated.Value, duration: number = 800) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.exp),
    useNativeDriver: true,
  });
};

export const createSlideInFromBottomAnimation = (animatedValue: Animated.Value, duration: number = 800) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.back(1.5)),
    useNativeDriver: true,
  });
};

export const createScaleAnimation = (animatedValue: Animated.Value, toValue: number = 1, duration: number = 800) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  });
};

export const createPulseAnimation = (animatedValue: Animated.Value, duration: number = 1000) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ])
  );
};

export const createRotateAnimation = (animatedValue: Animated.Value, duration: number = 2000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

export const createShakeAnimation = (animatedValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }),
  ]);
};

export const createStaggeredAnimations = (animations: Animated.CompositeAnimation[], delay: number = 100) => {
  return Animated.stagger(delay, animations);
};

// Easing personalizzati
export const customEasing = {
  elastic: Easing.elastic(1.3),
  bounce: Easing.bounce,
  smooth: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
};
