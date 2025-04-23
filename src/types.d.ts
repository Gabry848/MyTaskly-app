declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

export interface TaskListRouteParams {
  category_name: string;
}

export type RootStackParamList = {
  HomeTabs: undefined; // Aggiunto per il TabNavigator
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Categories: undefined;
  TaskList: { categoryId: number | string };
  Notes: undefined;
  Profile: undefined;
  Settings: undefined;
  Updates: undefined;
  Statistics: undefined; // Aggiunta nuova schermata
  BotChat: undefined; // rimosso BotChat
  NotFound: undefined;
};