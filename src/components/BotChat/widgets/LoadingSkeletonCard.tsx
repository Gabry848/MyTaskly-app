import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToolWidget } from '../types';

interface LoadingSkeletonCardProps {
  widget: ToolWidget;
}

/**
 * Loading skeleton card per tool widgets in voice chat
 * Mostra animazioni pulse + shimmer mentre il tool è in esecuzione
 */
const LoadingSkeletonCard: React.FC<LoadingSkeletonCardProps> = React.memo(({ widget }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Animazione di pulsazione
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Animazione shimmer
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [pulseAnim, shimmerAnim]);

  // Determina il tipo di contenuto in base al tool name
  let loadingText = 'Caricamento dati...';
  let icon: keyof typeof Ionicons.glyphMap = 'list';
  let skeletonCount = 2;

  if (widget.toolName === 'show_tasks_to_user') {
    loadingText = 'Recupero task dal server...';
    icon = 'calendar-outline';
    skeletonCount = 3;
  } else if (widget.toolName === 'show_categories_to_user') {
    loadingText = 'Recupero categorie dal server...';
    icon = 'folder-outline';
    skeletonCount = 3;
  }

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.container}>
      {/* Header con icona e testo */}
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, { opacity: pulseAnim }]}>
          <Ionicons name={icon} size={20} color="#666666" />
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.loadingText}>{loadingText}</Text>
          <ActivityIndicator size="small" color="#666666" style={styles.spinner} />
        </View>
      </View>

      {/* Skeleton cards */}
      <View style={styles.skeletonContainer}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <View key={i} style={styles.skeletonCard}>
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
            <View style={styles.skeletonContent}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonSubtitle, { opacity: pulseAnim }]} />
              <View style={styles.skeletonMeta}>
                <Animated.View style={[styles.skeletonBadge, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBadge, { opacity: pulseAnim }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginRight: 8,
  },
  spinner: {
    marginLeft: 4,
  },
  skeletonContainer: {
    gap: 8,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  skeletonContent: {
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  skeletonTitle: {
    width: '70%',
    height: 16,
  },
  skeletonSubtitle: {
    width: '50%',
  },
  skeletonMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
});

export default LoadingSkeletonCard;
