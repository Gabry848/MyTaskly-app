// Definizione delle interfacce e tipi per i componenti della chat
import { StyleProp, ViewStyle } from "react-native";

// Definizione dell'interfaccia per i messaggi
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  start_time: Date;
  modelType?: 'base' | 'advanced'; // Tipo di modello utilizzato per questo messaggio
  tasks?: TaskItem[]; // Array opzionale di attività
  isStreaming?: boolean; // Indica se il messaggio è ancora in streaming
  isComplete?: boolean; // Indica se il messaggio streaming è completato
}

// Interfaccia per gli elementi delle attività
export interface TaskItem {
  task_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category: string;
  priority: string;
  status: string;
}

// Props per il componente TaskTableBubble
export interface TaskTableBubbleProps {
  message: string; // Il messaggio completo contenente il JSON
  style?: StyleProp<ViewStyle>;
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
  onSendVoiceMessage?: (audioUri: string) => void;
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
