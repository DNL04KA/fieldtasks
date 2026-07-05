import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { SyncStatus } from '../types';

const LABELS: Record<SyncStatus, string> = {
  pending: 'Pending sync',
  synced: 'Synced',
  failed: 'Sync failed',
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const { syncColor } = useTheme();
  return (
    <Text
      style={[styles.label, { color: syncColor(status) }]}
      accessibilityLabel={`Sync status: ${LABELS[status]}`}
    >
      {status === 'synced' ? '●' : status === 'pending' ? '◐' : '○'} {LABELS[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600' },
});
