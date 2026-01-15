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
  toolWidgets?: ToolWidget[]; // Array di widget tool per visualizzare risultati chiamate MCP
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
  onViewAll?: (tasks: TaskItem[]) => void; // Callback per visualizzare tutti i task
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

// ========== WIDGET INTERFACES ==========

// Widget singolo che rappresenta una chiamata tool MCP
export interface ToolWidget {
  id: string;                    // Identificatore univoco: tool_name + item_index
  toolName: string;              // Nome del tool (es: "add_task", "show_tasks_to_user")
  status: 'loading' | 'success' | 'error';
  itemIndex: number;             // Indice del tool nell'ordine di esecuzione

  // Dati da evento tool_call
  toolArgs?: any;                // Argomenti passati al tool

  // Dati da evento tool_output (JSON parsato)
  toolOutput?: ToolOutputData;   // Output del tool parsato
  errorMessage?: string;         // Messaggio di errore se status === 'error'
}

// Output parsato dal tool MCP
export interface ToolOutputData {
  type?: 'task_created' | 'category_created' | 'note_created' |
         'task_list' | 'category_list' | 'note_list';
  success?: boolean;
  message?: string;

  // Dati per tool di creazione
  task?: {
    task_id: number;
    title: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    priority?: string;
    status?: string;
    category_id?: number;
    category_name?: string;
  };
  category?: {
    category_id: number;
    name: string;
    description?: string;
    color?: string;
  };
  note?: {
    note_id: number;
    title: string;
    color: string;
    position_x?: string;
    position_y?: string;
  };

  // Dati per tool di visualizzazione
  tasks?: TaskListItem[];
  categories?: CategoryListItem[];
  notes?: NoteListItem[];

  // Metadati per visualizzazione
  summary?: {
    total: number;
    pending?: number;
    completed?: number;
    high_priority?: number;
    categories_with_tasks?: number;
    total_tasks?: number;
  };
  voice_summary?: string;
  ui_hints?: {
    display_mode?: 'list' | 'grid' | 'calendar';
    group_by?: string;
    enable_swipe_actions?: boolean;
    enable_drag_and_drop?: boolean;
    enable_color_picker?: boolean;
  };
}

// Task da lista visualizzazione
export interface TaskListItem {
  id: number;
  title: string;
  endTimeFormatted: string;      // Data formattata (es: "Oggi, 10:00")
  end_time?: string;             // Data ISO originale per filtraggio calendario
  category: string;
  category_name?: string;        // Nome categoria (alternativo a category)
  categoryColor: string;
  priority: string;
  priorityEmoji: string;
  priorityColor: string;
  status: string;
  completed?: boolean;
  actions?: {
    complete?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

// Categoria da lista visualizzazione
export interface CategoryListItem {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  taskCount?: number;
  task_count?: number; // Backward compatibility
  imageUrl?: string; // Alternative to icon
  isShared?: boolean;
  isOwned?: boolean;
  ownerName?: string;
  permissionLevel?: "READ_ONLY" | "READ_WRITE";
}

// Nota da lista visualizzazione
export interface NoteListItem {
  id: number;
  title: string;
  color: string;
  positionX?: string;
  positionY?: string;
  actions?: {
    edit?: boolean;
    delete?: boolean;
    changeColor?: boolean;
  };
}

// Props per WidgetBubble
export interface WidgetBubbleProps {
  widget: ToolWidget;
  onOpenVisualization?: (widget: ToolWidget) => void;
  onOpenItemDetail?: (item: any, type: 'task' | 'category' | 'note') => void;
  onTaskPress?: (task: any) => void;
  onCategoryPress?: (category: any) => void;
}

// Props per CreationWidgetCard
export interface CreationWidgetCardProps {
  widget: ToolWidget;
  onPress?: () => void;
}

// Props per VisualizationModal
export interface VisualizationModalProps {
  visible: boolean;
  widget: ToolWidget;
  onClose: () => void;
  onItemPress?: (item: any, type: 'task' | 'category' | 'note') => void;
  onCategoryPress?: (category: any) => void;
}

// Props per ItemDetailModal
export interface ItemDetailModalProps {
  visible: boolean;
  item: any;
  itemType: 'task' | 'category' | 'note';
  onClose: () => void;
  onAction?: (action: string, item: any) => void;
}
