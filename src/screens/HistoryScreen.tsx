import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTaskStore } from '../store/taskStore';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/datetime';
import type { HistoryAction } from '../types';

const ACTION_ICONS: Record<HistoryAction, string> = {
  created: '✨',
  edited: '✏️',
  status_changed: '🔄',
  attachment_added: '📎',
  attachment_removed: '🗑️',
  deleted: '❌',
  sync_success: '☁️',
  sync_failed: '⚠️',
};

const ACTION_LABELS: Record<HistoryAction, string> = {
  created: 'Created',
  edited: 'Edited',
  status_changed: 'Status change',
  attachment_added: 'Attachment added',
  attachment_removed: 'Attachment removed',
  deleted: 'Deleted',
  sync_success: 'Synced',
  sync_failed: 'Sync failed',
};

export function HistoryScreen() {
  const { colors } = useTheme();
  const history = useTaskStore((s) => s.history);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={history.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="📜"
            title="No activity yet"
            subtitle="Task creation, edits, status changes and sync events will appear here."
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.icon}>{ACTION_ICONS[item.action]}</Text>
            <View style={styles.itemBody}>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {ACTION_LABELS[item.action]} · {item.taskTitle}
              </Text>
              <Text style={[styles.description, { color: colors.text }]}>{item.description}</Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatDateTime(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  item: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  icon: { fontSize: 20 },
  itemBody: { flex: 1 },
  actionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  description: { fontSize: 14, marginTop: 2 },
  timestamp: { fontSize: 12, marginTop: 4 },
});
