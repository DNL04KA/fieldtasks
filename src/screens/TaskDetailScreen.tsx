import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useTaskStore } from '../store/taskStore';
import { useTaskById } from '../store/selectors';
import { StatusBadge } from '../components/StatusBadge';
import { SyncBadge } from '../components/SyncBadge';
import { AppButton } from '../components/AppButton';
import { Chip } from '../components/Chip';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { EmptyState } from '../components/EmptyState';
import { pickDocument, pickImage } from '../services/attachmentService';
import { formatDateTime } from '../utils/datetime';
import { STATUS_LABELS } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import type { TaskStatus } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

const NEXT_STATUSES: TaskStatus[] = ['in_progress', 'completed', 'cancelled'];

export function TaskDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const task = useTaskById(route.params.taskId);
  const history = useTaskStore((s) => s.history);
  const setTaskStatus = useTaskStore((s) => s.setTaskStatus);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const addAttachment = useTaskStore((s) => s.addAttachment);
  const removeAttachment = useTaskStore((s) => s.removeAttachment);
  const [attaching, setAttaching] = useState(false);

  const taskHistory = useMemo(
    () => history.filter((h) => h.taskId === route.params.taskId).slice(0, 20),
    [history, route.params.taskId],
  );

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="trash-outline" title="Task not found" subtitle="It may have been deleted." />
      </View>
    );
  }

  const handleAttach = async (kind: 'image' | 'document') => {
    setAttaching(true);
    try {
      const attachment = kind === 'image' ? await pickImage() : await pickDocument();
      if (attachment) await addAttachment(task.id, attachment);
    } catch (error) {
      Alert.alert('Attachment failed', error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setAttaching(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete task', `Delete "${task.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <StatusBadge status={task.status} />
        <SyncBadge status={task.syncStatus} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{task.description}</Text>

      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <InfoRow label="Due" value={formatDateTime(task.dueDate)} />
        <InfoRow label="Location" value={task.location.address} />
        {task.location.latitude != null && task.location.longitude != null ? (
          <InfoRow
            label="Coordinates"
            value={`${task.location.latitude.toFixed(4)}, ${task.location.longitude.toFixed(4)}`}
          />
        ) : null}
        <InfoRow label="Created" value={formatDateTime(task.createdAt)} />
        <InfoRow label="Updated" value={formatDateTime(task.updatedAt)} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Change status</Text>
      <View style={styles.statusRow}>
        {NEXT_STATUSES.map((status) => (
          <Chip
            key={status}
            label={STATUS_LABELS[status]}
            active={task.status === status}
            onPress={() => setTaskStatus(task.id, status)}
          />
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Attachments</Text>
      <AttachmentGallery attachments={task.attachments} onRemove={(id) => removeAttachment(task.id, id)} />
      <View style={styles.attachRow}>
        <View style={styles.attachButton}>
          <AppButton
            icon="image-outline"
            label="Add image"
            variant="secondary"
            onPress={() => handleAttach('image')}
            loading={attaching}
          />
        </View>
        <View style={styles.attachButton}>
          <AppButton
            icon="document-outline"
            label="Add file"
            variant="secondary"
            onPress={() => handleAttach('document')}
            loading={attaching}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent history</Text>
      {taskHistory.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No history for this task yet.</Text>
      ) : (
        taskHistory.map((entry) => (
          <View key={entry.id} style={[styles.historyItem, { borderColor: colors.border }]}>
            <Text style={[styles.historyText, { color: colors.text }]}>{entry.description}</Text>
            <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
              {formatDateTime(entry.timestamp)}
            </Text>
          </View>
        ))
      )}

      <View style={styles.actions}>
        <AppButton
          icon="create-outline"
          label="Edit task"
          onPress={() => navigation.navigate('TaskForm', { taskId: task.id })}
        />
        <AppButton icon="trash-outline" label="Delete task" variant="danger" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginTop: 12 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  infoCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  infoLabel: { fontSize: 14, fontWeight: '600' },
  infoValue: { fontSize: 14, flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  attachButton: { flex: 1 },
  historyItem: { borderBottomWidth: 1, paddingVertical: 10 },
  historyText: { fontSize: 14 },
  historyTime: { fontSize: 12, marginTop: 2 },
  actions: { marginTop: 32, gap: 12 },
});
