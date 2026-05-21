import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickVoiceAdd from '../BotChat/QuickVoiceAdd';

interface FABMenuProps {
  onNewTask: () => void;
  onVoiceStateChange?: (isActive: boolean) => void;
  onVoiceSuccess?: () => void;
}

const FABMenu: React.FC<FABMenuProps> = ({ onNewTask, onVoiceStateChange, onVoiceSuccess }) => {
  return (
    <View pointerEvents="box-none" style={styles.dock}>
      <TouchableOpacity
        style={styles.manualFab}
        onPress={onNewTask}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Aggiungi manualmente"
      >
        <Ionicons name="create-outline" size={22} color="#000000" />
      </TouchableOpacity>

      <QuickVoiceAdd
        model="base"
        variant="fab"
        onSuccess={onVoiceSuccess}
        onStateChange={(state) => onVoiceStateChange?.(state !== 'idle')}
        containerStyle={styles.voiceFab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 220,
  },
  voiceFab: {
    marginTop: 0,
  },
  manualFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});

export default React.memo(FABMenu);
