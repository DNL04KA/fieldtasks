import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { TaskListScreen } from '../screens/TaskListScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { MapScreen } from '../screens/MapScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<
  keyof TabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  TasksTab: { active: 'list', inactive: 'list-outline' },
  MapTab: { active: 'map', inactive: 'map-outline' },
  HistoryTab: { active: 'time', inactive: 'time-outline' },
  SettingsTab: { active: 'settings', inactive: 'settings-outline' },
};

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name !== 'TasksTab',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={size}
            color={color}
          />
        ),
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      })}
    >
      <Tabs.Screen name="TasksTab" component={TaskStack} options={{ title: 'Tasks' }} />
      <Tabs.Screen name="MapTab" component={MapScreen} options={{ title: 'Map' }} />
      <Tabs.Screen name="HistoryTab" component={HistoryScreen} options={{ title: 'History' }} />
      <Tabs.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tabs.Navigator>
  );
}

function TaskStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TaskList" component={TaskListScreen} options={{ title: 'Field Tasks' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { theme, colors } = useTheme();
  const base = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }}
    >
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="TaskForm"
          component={TaskFormScreen}
          options={({ route }) => ({ title: route.params.taskId ? 'Edit Task' : 'New Task' })}
        />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
