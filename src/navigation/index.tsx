import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTabs from './screens/Home';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import { NotFound } from './screens/NotFound';
import TaskList from './screens/TaskList';
import Login from './screens/Login';
import Register from './screens/Register';

const Stack = createNativeStackNavigator();

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['https://taskly.com', 'taskly://'],
  config: {
    screens: {
      HomeTabs: 'home',
      Profile: {
        path: ':user(@[a-zA-Z0-9-_]+)',
        parse: {
          user: (value) => value.replace(/^@/, ''),
        },
        stringify: {
          user: (value) => `@${value}`,
        },
      },
      Settings: 'settings',
      NotFound: '*',
      TaskList: 'tasks',
      Login: 'login',
      Register: 'register',
    },
  },
};

export default function RootStack() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator id={undefined}>
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{ title: 'Taskly', headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="NotFound"
          component={NotFound}
          options={{ title: '404' }}
        />
        <Stack.Screen
          name="TaskList"
          component={TaskList}
          options={{ title: 'ToDo' }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: 'Login' }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ title: 'Register' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
