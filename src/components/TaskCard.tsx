import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { colors, statusColor } = useTheme();
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open task ${task.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: statusColor(task.status) }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {task.title}
          </Text>
          <StatusBadge status={task.status} />
        </View>

        <View style={styles.metaRow}>
          <Ionicons
            name={overdue ? 'alert-circle' : 'time-outline'}
            size={15}
            color={overdue ? colors.danger : colors.textSecondary}
          />
          <Text style={[styles.metaText, { color: overdue ? colors.danger : colors.textSecondary }]}>
            {overdue ? 'Overdue · ' : ''}
            {formatDateTime(task.dueDate)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {task.location.address}
          </Text>
        </View>

        <View style={styles.footer}>
          <SyncBadge status={task.syncStatus} />
          {task.attachments.length > 0 ? (
            <View style={styles.metaRow}>
              <Ionicons name="attach" size={15} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {task.attachments.length}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  accentBar: { width: 4 },
  body: { flex: 1, padding: 16, paddingLeft: 14, gap: 7 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 17, fontWeight: '700', flex: 1, letterSpacing: -0.3, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, flexShrink: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});
