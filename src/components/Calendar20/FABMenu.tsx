import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FABMenuProps {
  onNewTask: () => void;
}

const FABMenu: React.FC<FABMenuProps> = ({ onNewTask }) => {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onNewTask}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={30} color="#ffffff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    zIndex: 100,
  },
});

export default React.memo(FABMenu);
