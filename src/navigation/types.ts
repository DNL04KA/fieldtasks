export type RootStackParamList = {
  Tabs: undefined;
  TaskList: undefined;
  TaskForm: { taskId?: string };
  TaskDetail: { taskId: string };
};

export type TabParamList = {
  TasksTab: undefined;
  MapTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};
