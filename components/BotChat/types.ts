// Definizione delle interfacce e tipi per i componenti della chat
import { StyleProp, ViewStyle } from "react-native";

// Definizione dell'interfaccia per i messaggi
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt: Date;
  modelType?: 'base' | 'advanced'; // Tipo di modello utilizzato per questo messaggio
}

// Interfaccia per la sessione di chat
export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  lastTimestamp?: Date;
  messages: Message[];
  modelType: 'base' | 'advanced';
}

// Props per il componente MessageBubble
export interface MessageBubbleProps {
  message: Message;
  style?: StyleProp<ViewStyle>;
}

// Props per il componente ChatInput
export interface ChatInputProps {
  onSendMessage: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

// Props per il componente ChatHeader
export interface ChatHeaderProps {
  modelType: 'base' | 'advanced';
  onModelChange: (modelType: 'base' | 'advanced') => void;
  onNewChat: () => void;
  style?: StyleProp<ViewStyle>;
}

// Props per il componente ChatList
export interface ChatListProps {
  messages: Message[];
  style?: StyleProp<ViewStyle>;
}
