import { ChatHistoryItemData } from '../components/BotChat/ChatHistoryItem';

/**
 * Demo chat history data for testing and development
 */
export const demoChatHistory: ChatHistoryItemData[] = [
  {
    id: 'chat-1',
    title: 'Planning my week',
    preview: 'Can you help me organize my tasks for this week?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    messageCount: 12,
  },
  {
    id: 'chat-2',
    title: 'Project brainstorming',
    preview: 'I need ideas for the new mobile app design',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    messageCount: 8,
  },
  {
    id: 'chat-3',
    title: 'Task priority discussion',
    preview: 'Which tasks should I focus on today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    messageCount: 15,
  },
  {
    id: 'chat-4',
    title: 'Meeting preparation',
    preview: 'Help me prepare for tomorrow\'s team meeting',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    messageCount: 6,
  },
  {
    id: 'chat-5',
    title: 'Goal setting for Q2',
    preview: 'Let\'s define my quarterly objectives',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    messageCount: 20,
  },
  {
    id: 'chat-6',
    title: 'Weekend plans',
    preview: 'What activities should I schedule for the weekend?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    messageCount: 4,
  },
  {
    id: 'chat-7',
    title: 'Learning roadmap',
    preview: 'Create a learning plan for React Native',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    messageCount: 18,
  },
  {
    id: 'chat-8',
    title: 'Budget planning',
    preview: 'Help me organize my monthly expenses',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    messageCount: 9,
  },
];
