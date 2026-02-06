import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface FABMenuProps {
  onNewTask: () => void;
}

const FABMenu: React.FC<FABMenuProps> = ({ onNewTask }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animValue, {
        toValue: expanded ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(rotateValue, {
        toValue: expanded ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, [expanded, animValue, rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const handleNewTask = () => {
    setExpanded(false);
    onNewTask();
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {expanded && (
        <Pressable style={styles.backdrop} onPress={() => setExpanded(false)} />
      )}

      <View style={styles.container} pointerEvents="box-none">
        {/* Task option */}
        <Animated.View
          style={[
            styles.optionContainer,
            {
              opacity: animValue,
              transform: [
                {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                  }),
                },
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <TouchableOpacity style={styles.optionButton} onPress={handleNewTask}>
            <View style={styles.optionIcon}>
              <Ionicons name="checkbox-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.optionLabel}>
              <Text style={styles.optionText}>{t('calendar20.fab.newTask')}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={28} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 99,
  },
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  optionContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'System',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default React.memo(FABMenu);
