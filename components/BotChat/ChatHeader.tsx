import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatHeaderProps } from './types';

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  modelType, 
  onModelChange, 
  onNewChat,
  includePreviousMessages,
  onTogglePreviousMessages,
  style 
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.modelSelector}
          onPress={() => onModelChange(modelType === 'base' ? 'advanced' : 'base')}
        >
          <MaterialIcons name="insights" size={18} color="#5B37B7" />
          <Text style={styles.modelText}>
            {modelType === 'advanced' ? 'Avanzato' : 'Base'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, includePreviousMessages && styles.toggleButtonActive]}
          onPress={onTogglePreviousMessages}
        >
          <MaterialIcons 
            name="history" 
            size={18} 
            color={includePreviousMessages ? "#FFFFFF" : "#5B37B7"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={onNewChat}
        >
          <MaterialIcons name="add" size={20} color="#5B37B7" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    padding: 8,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 15,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 8,
  },
  modelText: {
    fontSize: 13,
    color: '#5B37B7',
    marginLeft: 4,
    fontWeight: '500',
  },  newChatButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0EAFA',
  },
  toggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0EAFA',
    marginRight: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#5B37B7',
  }
});

export default ChatHeader;
