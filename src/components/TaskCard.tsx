import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StatusBadge } from './StatusBadge';
import { SyncBadge } from './SyncBadge';
import { formatDateTime, isOverdue } from '../utils/datetime';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const { colors } = useTheme();
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open task ${task.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {task.title}
        </Text>
        <StatusBadge status={task.status} />
      </View>

      <Text style={[styles.due, { color: overdue ? colors.danger : colors.textSecondary }]}>
        {overdue ? '⚠ Overdue · ' : 'Due '}
        {formatDateTime(task.dueDate)}
      </Text>

      <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
        📍 {task.location.address}
      </Text>

      <View style={styles.footer}>
        <SyncBadge status={task.syncStatus} />
        {task.attachments.length > 0 ? (
          <Text style={[styles.attachments, { color: colors.textSecondary }]}>
            📎 {task.attachments.length}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  due: { fontSize: 14, fontWeight: '500' },
  location: { fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  attachments: { fontSize: 12, fontWeight: '600' },
});
