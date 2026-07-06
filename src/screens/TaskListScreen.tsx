import React, { useCallback } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View, type ListRenderItem } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useTaskStore } from '../store/taskStore';
import { usePendingSyncCount, useVisibleTasks } from '../store/selectors';
import { TaskCard } from '../components/TaskCard';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { AppButton } from '../components/AppButton';
import { STATUS_LABELS } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import type { SortMode, Task, TaskStatus } from '../types';

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'createdAt', label: 'Date added' },
  { mode: 'dueDate', label: 'Due date' },
  { mode: 'status', label: 'Status' },
];

const FILTER_OPTIONS: (TaskStatus | 'all')[] = ['all', 'new', 'in_progress', 'completed', 'cancelled'];

type Props = NativeStackScreenProps<RootStackParamList, 'TaskList'>;

export function TaskListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const tasks = useVisibleTasks();
  const totalTasks = useTaskStore((s) => s.tasks.filter((t) => !t.deleted).length);
  const sortMode = useTaskStore((s) => s.sortMode);
  const setSortMode = useTaskStore((s) => s.setSortMode);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const setSearchQuery = useTaskStore((s) => s.setSearchQuery);
  const statusFilter = useTaskStore((s) => s.statusFilter);
  const setStatusFilter = useTaskStore((s) => s.setStatusFilter);
  const isSyncing = useTaskStore((s) => s.isSyncing);
  const isOnline = useTaskStore((s) => s.isOnline);
  const runSync = useTaskStore((s) => s.runSync);
  const pendingCount = usePendingSyncCount();

  const handleOpenTask = useCallback(
    (taskId: string) => navigation.navigate('TaskDetail', { taskId }),
    [navigation],
  );
  const renderItem = useCallback<ListRenderItem<Task>>(
    ({ item }) => <TaskCard task={item} onOpen={handleOpenTask} />,
    [handleOpenTask],
  );

  const syncLabel = !isOnline
    ? 'Offline — changes are saved locally'
    : isSyncing
      ? 'Syncing…'
      : pendingCount > 0
        ? `${pendingCount} change(s) waiting for sync`
        : 'All changes synced';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.syncBar, { backgroundColor: isOnline ? colors.surface : colors.surfaceAlt }]}
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.syncText, { color: colors.textSecondary }]}>{syncLabel}</Text>
      </View>

      <TextInput
        accessibilityLabel="Search tasks by title"
        placeholder="Search by title…"
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={[
          styles.search,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
      />

      <View style={styles.controls}>
        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Sort by</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Sort tasks by"
        >
          {SORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.mode}
              label={opt.label}
              active={sortMode === opt.mode}
              onPress={() => setSortMode(opt.mode)}
            />
          ))}
        </ScrollView>
        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Filter</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Filter tasks by status"
        >
          {FILTER_OPTIONS.map((f) => (
            <Chip
              key={f}
              label={f === 'all' ? 'All' : STATUS_LABELS[f]}
              active={statusFilter === f}
              onPress={() => setStatusFilter(f)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={tasks.length === 0 && styles.emptyList}
        refreshing={isSyncing}
        onRefresh={runSync}
        ListEmptyComponent={
          totalTasks === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title="No tasks yet"
              subtitle="Create your first field task with the button below."
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Nothing found"
              subtitle="Try a different search or filter."
            />
          )
        }
      />

      <View style={styles.fabWrapper}>
        <AppButton icon="add" label="New Task" onPress={() => navigation.navigate('TaskForm', {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  syncBar: { paddingHorizontal: 16, paddingVertical: 8 },
  syncText: { fontSize: 13, fontWeight: '500' },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    fontSize: 15,
  },
  controls: { paddingVertical: 8 },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  chipRow: { gap: 8, paddingHorizontal: 16 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  fabWrapper: { padding: 16 },
});
