// Tutorial content in Italian for MyTaskly onboarding
export const TUTORIAL_CONTENT = {
  welcome: {
    title: "Benvenuto in MyTaskly!",
    description: "Il tuo assistente AI personale per gestire task, note e calendario. Scopri come usare tutte le funzionalità in pochi passaggi.",
    startButton: "Inizia il Tour",
    skipButton: "Salta il tour",
  },
  step2: {
    title: "Chat con l'AI",
    description: "Scrivi un messaggio o tocca il microfono per chattare vocalmente. L'assistente AI ti aiuterà a gestire le tue attività.",
    icon: "chatbubble-ellipses",
  },
  step3: {
    title: "Le tue Categorie",
    description: "Organizza le tue attività in categorie. Tieni premuto su una categoria per modificarla o eliminarla.",
    icon: "grid",
  },
  step4: {
    title: "Gestisci i Task",
    description: "Tocca un task per completarlo. Tieni premuto per modificare, eliminare o impostare promemoria.",
    icon: "checkbox",
  },
  step5: {
    title: "Disegna e Annota",
    description: "Usa la lavagna per disegnare, prendere appunti o creare schizzi. Tocca il pulsante + per aggiungere una nuova nota.",
    icon: "brush",
  },
  step6: {
    title: "Calendario delle Attività",
    description: "Visualizza tutti i tuoi task organizzati per data. Tocca un giorno per vedere le attività programmate.",
    icon: "calendar",
  },
  step7: {
    title: "Le tue Statistiche",
    description: "Monitora il tuo progresso con grafici e analitiche. Visualizza il numero di task completati, la distribuzione per categoria e il tuo andamento nel tempo.",
    icon: "bar-chart",
  },
  completion: {
    title: "Tutto Pronto!",
    description: "Ora sei pronto per utilizzare MyTaskly al meglio! Puoi rivedere questo tutorial in qualsiasi momento dalle Impostazioni.",
    primaryButton: "Inizia Ora",
    secondaryButton: "Rivedi Tutorial",
  },
  navigation: {
    next: "Avanti",
    back: "Indietro",
    skip: "Salta",
  },
};

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

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    type: 'welcome',
    content: {
      title: TUTORIAL_CONTENT.welcome.title,
      description: TUTORIAL_CONTENT.welcome.description,
    },
  },
  {
    id: 2,
    type: 'spotlight',
    targetScreen: 'Home',
    targetElement: 'chatInput',
    content: {
      title: TUTORIAL_CONTENT.step2.title,
      description: TUTORIAL_CONTENT.step2.description,
      icon: TUTORIAL_CONTENT.step2.icon,
    },
  },
  {
    id: 3,
    type: 'spotlight',
    targetScreen: 'Categories',
    targetElement: 'categoryList',
    content: {
      title: TUTORIAL_CONTENT.step3.title,
      description: TUTORIAL_CONTENT.step3.description,
      icon: TUTORIAL_CONTENT.step3.icon,
    },
  },
  {
    id: 4,
    type: 'spotlight',
    targetScreen: 'Categories',
    targetElement: 'taskItem',
    content: {
      title: TUTORIAL_CONTENT.step4.title,
      description: TUTORIAL_CONTENT.step4.description,
      icon: TUTORIAL_CONTENT.step4.icon,
    },
  },
  {
    id: 5,
    type: 'spotlight',
    targetScreen: 'Notes',
    targetElement: 'whiteboard',
    content: {
      title: TUTORIAL_CONTENT.step5.title,
      description: TUTORIAL_CONTENT.step5.description,
      icon: TUTORIAL_CONTENT.step5.icon,
    },
  },
  {
    id: 6,
    type: 'spotlight',
    targetScreen: 'Calendar',
    targetElement: 'calendar',
    content: {
      title: TUTORIAL_CONTENT.step6.title,
      description: TUTORIAL_CONTENT.step6.description,
      icon: TUTORIAL_CONTENT.step6.icon,
    },
  },
  {
    id: 7,
    type: 'spotlight',
    targetScreen: 'Statistics',
    targetElement: 'statisticsContainer',
    content: {
      title: TUTORIAL_CONTENT.step7.title,
      description: TUTORIAL_CONTENT.step7.description,
      icon: TUTORIAL_CONTENT.step7.icon,
    },
  },
  {
    id: 8,
    type: 'completion',
    content: {
      title: TUTORIAL_CONTENT.completion.title,
      description: TUTORIAL_CONTENT.completion.description,
    },
  },
];

// AsyncStorage key for tutorial completion status
export const TUTORIAL_STORAGE_KEY = '@mytaskly:tutorial_completed';
