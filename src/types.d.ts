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
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string; username: string; password: string };
  VerificationSuccess: { email: string; username: string; password: string };
  HomeTabs: undefined;
  Home20: undefined; // Nuova schermata Home2.0
  TaskList: { categoryId: number | string; category_name: string };
  Profile: undefined;
  Settings: undefined;
  Statistics: undefined;
  Updates: undefined;
  NotFound: undefined;
};

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Notes: undefined;
  BotChat: undefined;
};