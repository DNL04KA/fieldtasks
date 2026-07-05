import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useTaskStore } from '../store/taskStore';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../utils/datetime';
import type { HistoryAction } from '../types';

const ACTION_ICONS: Record<HistoryAction, keyof typeof Ionicons.glyphMap> = {
  created: 'add-circle-outline',
  edited: 'create-outline',
  status_changed: 'swap-horizontal-outline',
  attachment_added: 'attach-outline',
  attachment_removed: 'close-circle-outline',
  deleted: 'trash-outline',
  sync_success: 'cloud-done-outline',
  sync_failed: 'cloud-offline-outline',
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

function actionColor(
  action: HistoryAction,
  colors: { danger: string; success: string; accent: string; textSecondary: string },
): string {
  if (action === 'sync_failed' || action === 'deleted') return colors.danger;
  if (action === 'sync_success' || action === 'created') return colors.success;
  if (action === 'status_changed') return colors.accent;
  return colors.textSecondary;
}

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
            icon="time-outline"
            title="No activity yet"
            subtitle="Task creation, edits, status changes and sync events will appear here."
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View
              style={[styles.iconCircle, { backgroundColor: `${actionColor(item.action, colors)}18` }]}
            >
              <Ionicons
                name={ACTION_ICONS[item.action]}
                size={17}
                color={actionColor(item.action, colors)}
              />
            </View>
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
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  actionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  description: { fontSize: 14, marginTop: 2 },
  timestamp: { fontSize: 12, marginTop: 4 },
});
