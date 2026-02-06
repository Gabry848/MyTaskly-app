import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Calendar20View from './Calendar20View';

interface Calendar20ModalProps {
  visible: boolean;
  onClose: () => void;
}

const Calendar20Modal: React.FC<Calendar20ModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Calendar20View onClose={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default Calendar20Modal;
