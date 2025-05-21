import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChatHeaderProps } from './types';

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title, 
  modelType, 
  onModelChange, 
  onNewChat,
  style 
}) => {
  return (
    <View style={[styles.header, style]}>
      <Text style={styles.headerText}>{title}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.modelSelector}
          onPress={() => onModelChange(modelType === 'base' ? 'advanced' : 'base')}
        >
          <MaterialIcons name="insights" size={20} color="#5B37B7" />
          <Text style={styles.modelText}>
            {modelType === 'advanced' ? 'Avanzato' : 'Base'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={onNewChat}
        >
          <MaterialIcons name="add" size={24} color="#5B37B7" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 15,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EAFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  modelText: {
    fontSize: 14,
    color: '#5B37B7',
    marginLeft: 4,
    fontWeight: '500',
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0EAFA',
  }
});

export default ChatHeader;
