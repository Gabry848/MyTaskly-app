import { StyleSheet } from 'react-native';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatList from './ChatList';
import VoiceRecordButton from './VoiceRecordButton';
import MarkdownExample from './MarkdownExample';
import { Message, ChatSession } from './types';

// Esporto tutti i componenti e i tipi per facilitare l'import
export {
  ChatHeader,
  ChatInput,
  ChatList,
  VoiceRecordButton,
  MarkdownExample,
  Message,
  ChatSession
};

// Esporto anche gli stili condivisi per i componenti della chat
export const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});
