import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types.d';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/authConstants';
import { CarouselSlide } from './CarouselSlide';
import { DotsIndicator } from './DotsIndicator';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export const WelcomeCarouselScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slides = [
    {
      id: '1',
      headline: t('welcomeCarousel.slide1.headline'),
      subheadline: t('welcomeCarousel.slide1.subheadline'),
      illustration: 'aiChat' as const,
    },
    {
      id: '2',
      headline: t('welcomeCarousel.slide2.headline'),
      subheadline: t('welcomeCarousel.slide2.subheadline'),
      illustration: 'taskManagement' as const,
    },
    {
      id: '3',
      headline: t('welcomeCarousel.slide3.headline'),
      subheadline: t('welcomeCarousel.slide3.subheadline'),
      illustration: 'calendar' as const,
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_CAROUSEL_COMPLETED, 'true');
    navigation.navigate('Login');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_CAROUSEL_COMPLETED, 'true');
    navigation.navigate('Login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>{t('welcomeCarousel.navigation.skip')}</Text>
      </TouchableOpacity>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item, index }) => (
          <CarouselSlide
            headline={item.headline}
            subheadline={item.subheadline}
            illustration={item.illustration}
            isActive={index === currentIndex}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Dots Indicator */}
      <DotsIndicator data={slides} scrollX={scrollX} currentIndex={currentIndex} />

      {/* Next / Get Started Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleNext}
        activeOpacity={0.9}
      >
        <Text style={styles.primaryButtonText}>
          {currentIndex === slides.length - 1
            ? t('welcomeCarousel.navigation.getStarted')
            : t('welcomeCarousel.navigation.next')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'System',
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 28,
    width: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
});
