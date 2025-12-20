import i18n from '../services/i18n';

// Tutorial content using i18n translations
export const getTutorialContent = () => ({
  welcome: {
    title: i18n.t('tutorial.welcome.title'),
    description: i18n.t('tutorial.welcome.description'),
    startButton: i18n.t('tutorial.welcome.startButton'),
    skipButton: i18n.t('tutorial.welcome.skipButton'),
  },
  step2: {
    title: i18n.t('tutorial.steps.chat.title'),
    description: i18n.t('tutorial.steps.chat.description'),
    icon: "chatbubble-ellipses",
  },
  step3: {
    title: i18n.t('tutorial.steps.categories.title'),
    description: i18n.t('tutorial.steps.categories.description'),
    icon: "grid",
  },
  step4: {
    title: i18n.t('tutorial.steps.tasks.title'),
    description: i18n.t('tutorial.steps.tasks.description'),
    icon: "checkbox",
  },
  step5: {
    title: i18n.t('tutorial.steps.notes.title'),
    description: i18n.t('tutorial.steps.notes.description'),
    icon: "brush",
  },
  step6: {
    title: i18n.t('tutorial.steps.calendar.title'),
    description: i18n.t('tutorial.steps.calendar.description'),
    icon: "calendar",
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
export const TUTORIAL_CONTENT = getTutorialContent();

// Listen for language changes and update content
i18n.on('languageChanged', () => {
  Object.assign(TUTORIAL_CONTENT, getTutorialContent());
});

// Tutorial steps configuration
export interface TutorialStep {
  id: number;
  type: 'welcome' | 'spotlight' | 'completion';
  targetScreen?: 'Home' | 'Categories' | 'TaskList' | 'Notes' | 'Calendar' | 'Statistics';
  targetElement?: string; // ref name for spotlight
  content: {
    title: string;
    description: string;
    icon?: string;
  };
}

export const getTutorialSteps = (): TutorialStep[] => {
  const content = getTutorialContent();

  return [
    {
      id: 1,
      type: 'welcome',
      content: {
        title: content.welcome.title,
        description: content.welcome.description,
      },
    },
    {
      id: 2,
      type: 'spotlight',
      targetScreen: 'Home',
      targetElement: 'chatInput',
      content: {
        title: content.step2.title,
        description: content.step2.description,
        icon: content.step2.icon,
      },
    },
    {
      id: 3,
      type: 'spotlight',
      targetScreen: 'Categories',
      targetElement: 'categoryList',
      content: {
        title: content.step3.title,
        description: content.step3.description,
        icon: content.step3.icon,
      },
    },
    {
      id: 4,
      type: 'spotlight',
      targetScreen: 'Categories',
      targetElement: 'taskItem',
      content: {
        title: content.step4.title,
        description: content.step4.description,
        icon: content.step4.icon,
      },
    },
    {
      id: 5,
      type: 'spotlight',
      targetScreen: 'Notes',
      targetElement: 'whiteboard',
      content: {
        title: content.step5.title,
        description: content.step5.description,
        icon: content.step5.icon,
      },
    },
    {
      id: 6,
      type: 'spotlight',
      targetScreen: 'Calendar',
      targetElement: 'calendar',
      content: {
        title: content.step6.title,
        description: content.step6.description,
        icon: content.step6.icon,
      },
    },
    {
      id: 7,
      type: 'completion',
      content: {
        title: content.completion.title,
        description: content.completion.description,
      },
    },
  ];
};

export const TUTORIAL_STEPS = getTutorialSteps();

// AsyncStorage key for tutorial completion status
export const TUTORIAL_STORAGE_KEY = '@mytaskly:tutorial_completed';
