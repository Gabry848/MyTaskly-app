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
  HomeTabs: undefined;
  Profile: { user?: string };
  Settings: undefined;
  NotFound: undefined;
  TaskList: { category_name: string};
  Login: undefined;
  Register: undefined;
};