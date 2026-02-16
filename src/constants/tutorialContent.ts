import i18n from '../services/i18n';
import { ImageSourcePropType } from 'react-native';

// Tutorial step with image support
export interface TutorialStep {
  key: string;
  section: 'home' | 'categories' | 'calendar';
  title: string;
  description: string;
  image: ImageSourcePropType;
}

// Section header data
export interface TutorialSection {
  key: string;
  title: string;
  steps: TutorialStep[];
}

// Tutorial content using i18n translations
export const getTutorialContent = () => ({
  welcome: {
    title: i18n.t('tutorial.welcome.title'),
    description: i18n.t('tutorial.welcome.description'),
    startButton: i18n.t('tutorial.welcome.startButton'),
    skipButton: i18n.t('tutorial.welcome.skipButton'),
  },
  sections: {
    home: i18n.t('tutorial.sections.home'),
    categories: i18n.t('tutorial.sections.categories'),
    calendar: i18n.t('tutorial.sections.calendar'),
  },
  steps: {
    homeTextChat: {
      title: i18n.t('tutorial.steps.home.textChat.title'),
      description: i18n.t('tutorial.steps.home.textChat.description'),
    },
    homeVoiceChat: {
      title: i18n.t('tutorial.steps.home.voiceChat.title'),
      description: i18n.t('tutorial.steps.home.voiceChat.description'),
    },
    homeChatHistory: {
      title: i18n.t('tutorial.steps.home.chatHistory.title'),
      description: i18n.t('tutorial.steps.home.chatHistory.description'),
    },
    categoriesEditCategory: {
      title: i18n.t('tutorial.steps.categories.editCategory.title'),
      description: i18n.t('tutorial.steps.categories.editCategory.description'),
    },
    categoriesEditTask: {
      title: i18n.t('tutorial.steps.categories.editTask.title'),
      description: i18n.t('tutorial.steps.categories.editTask.description'),
    },
    calendarSwitch: {
      title: i18n.t('tutorial.steps.calendar.switch.title'),
      description: i18n.t('tutorial.steps.calendar.switch.description'),
    },
  },
  completion: {
    title: i18n.t('tutorial.completion.title'),
    description: i18n.t('tutorial.completion.description'),
    primaryButton: i18n.t('tutorial.completion.primaryButton'),
    secondaryButton: i18n.t('tutorial.completion.secondaryButton'),
  },
  navigation: {
    next: i18n.t('tutorial.navigation.next'),
    back: i18n.t('tutorial.navigation.back'),
    skip: i18n.t('tutorial.navigation.skip'),
  },
});

// For backward compatibility, export as constant that updates with language
export let TUTORIAL_CONTENT = getTutorialContent();

// Listen for language changes and update content
i18n.on('languageChanged', () => {
  TUTORIAL_CONTENT = getTutorialContent();
});

// Tutorial images - real screenshots
const TUTORIAL_IMAGES = {
  homeTextChat: require('../../assets/tutorial/Text_chat.png'),
  homeVoiceChat: require('../../assets/tutorial/Voice_chat.png'),
  homeChatHistory: require('../../assets/tutorial/Chat_history.png'),
  categoriesEditCategory: require('../../assets/tutorial/Edit_category.png'),
  categoriesEditTask: require('../../assets/tutorial/Edit_task.png'),
  calendarSwitch: require('../../assets/tutorial/Switch_calendar.png'),
};

// Get tutorial steps grouped by section
export const getTutorialSteps = (): TutorialStep[] => {
  const content = getTutorialContent();

  return [
    // Home Section
    {
      key: 'home-text-chat',
      section: 'home',
      title: content.steps.homeTextChat.title,
      description: content.steps.homeTextChat.description,
      image: TUTORIAL_IMAGES.homeTextChat,
    },
    {
      key: 'home-voice-chat',
      section: 'home',
      title: content.steps.homeVoiceChat.title,
      description: content.steps.homeVoiceChat.description,
      image: TUTORIAL_IMAGES.homeVoiceChat,
    },
    {
      key: 'home-chat-history',
      section: 'home',
      title: content.steps.homeChatHistory.title,
      description: content.steps.homeChatHistory.description,
      image: TUTORIAL_IMAGES.homeChatHistory,
    },
    // Categories Section
    {
      key: 'categories-edit-category',
      section: 'categories',
      title: content.steps.categoriesEditCategory.title,
      description: content.steps.categoriesEditCategory.description,
      image: TUTORIAL_IMAGES.categoriesEditCategory,
    },
    {
      key: 'categories-edit-task',
      section: 'categories',
      title: content.steps.categoriesEditTask.title,
      description: content.steps.categoriesEditTask.description,
      image: TUTORIAL_IMAGES.categoriesEditTask,
    },
    // Calendar Section
    {
      key: 'calendar-switch',
      section: 'calendar',
      title: content.steps.calendarSwitch.title,
      description: content.steps.calendarSwitch.description,
      image: TUTORIAL_IMAGES.calendarSwitch,
    },
  ];
};

// Get steps organized by sections (for section headers in the tutorial)
export const getTutorialSections = (): TutorialSection[] => {
  const content = getTutorialContent();
  const steps = getTutorialSteps();

  return [
    {
      key: 'home',
      title: content.sections.home,
      steps: steps.filter(s => s.section === 'home'),
    },
    {
      key: 'categories',
      title: content.sections.categories,
      steps: steps.filter(s => s.section === 'categories'),
    },
    {
      key: 'calendar',
      title: content.sections.calendar,
      steps: steps.filter(s => s.section === 'calendar'),
    },
  ];
};

// AsyncStorage key for tutorial completion status
export const TUTORIAL_STORAGE_KEY = '@mytaskly:tutorial_completed';
