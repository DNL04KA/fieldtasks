import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useTaskStore, type TaskInput } from '../store/taskStore';
import { FormField } from '../components/FormField';
import { AppButton } from '../components/AppButton';
import { Chip } from '../components/Chip';
import { parseCoordinate, validateTaskDraft } from '../utils/validation';
import { formatDateTime } from '../utils/datetime';
import { PRESET_LOCATIONS } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import type { TaskDraft, ValidationErrors } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskForm'>;

type PickerStage = 'none' | 'date' | 'time';

export function TaskFormScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const taskId = route.params.taskId;
  const existing = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);

  const [draft, setDraft] = useState<TaskDraft>(() => ({
    title: existing?.title ?? '',
    description: existing?.description ?? '',
    dueDate: existing ? new Date(existing.dueDate) : null,
    address: existing?.location.address ?? '',
    latitude: existing?.location.latitude?.toString() ?? '',
    longitude: existing?.location.longitude?.toString() ?? '',
  }));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pickerStage, setPickerStage] = useState<PickerStage>('none');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(existing);
  const patch = (partial: Partial<TaskDraft>) => setDraft((d) => ({ ...d, ...partial }));

  const coordsNote = useMemo(
    () =>
      draft.latitude || draft.longitude
        ? 'Task will appear on the map'
        : 'Optional — without coordinates the task is not shown on the map',
    [draft.latitude, draft.longitude],
  );

  const onPickerChange = (event: { type: string }, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setPickerStage('none');
      return;
    }
    if (pickerStage === 'date') {
      const base = draft.dueDate ?? new Date();
      const next = new Date(selected);
      next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      patch({ dueDate: next });
      setPickerStage('time');
    } else {
      patch({ dueDate: selected });
      setPickerStage('none');
    }
  };

  const handleSave = async () => {
    const validationErrors = validateTaskDraft(draft);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const input: TaskInput = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueDate: draft.dueDate!.toISOString(),
      location: {
        address: draft.address.trim(),
        latitude: parseCoordinate(draft.latitude),
        longitude: parseCoordinate(draft.longitude),
      },
    };

    setSaving(true);
    try {
      const note = isEdit
        ? (await updateTask(taskId!, input)).notificationNote
        : (await createTask(input)).notificationNote;
      if (note) Alert.alert('Reminder', note);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not save task', error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="Title *"
          placeholder="e.g. Replace router at client site"
          value={draft.title}
          onChangeText={(title) => patch({ title })}
          error={errors.title}
        />
        <FormField
          label="Description *"
          placeholder="What needs to be done?"
          value={draft.description}
          onChangeText={(description) => patch({ description })}
          error={errors.description}
          multiline
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Due date & time *</Text>
        <AppButton
          icon="calendar-outline"
          label={draft.dueDate ? formatDateTime(draft.dueDate.toISOString()) : 'Pick date and time'}
          variant="secondary"
          onPress={() => setPickerStage('date')}
        />
        {errors.dueDate ? (
          <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
            {errors.dueDate}
          </Text>
        ) : null}
        {pickerStage !== 'none' && (
          <DateTimePicker
            value={draft.dueDate ?? new Date(Date.now() + 60 * 60 * 1000)}
            mode={pickerStage}
            onChange={onPickerChange}
          />
        )}

        <View style={styles.spacer} />
        <FormField
          label="Location address *"
          placeholder="Street, building, city"
          value={draft.address}
          onChangeText={(address) => patch({ address })}
          error={errors.address}
        />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Quick locations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PRESET_LOCATIONS.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              active={draft.address === preset.label}
              onPress={() =>
                patch({
                  address: preset.label,
                  latitude: String(preset.latitude),
                  longitude: String(preset.longitude),
                })
              }
            />
          ))}
        </ScrollView>

        <View style={styles.coordsRow}>
          <View style={styles.coordField}>
            <FormField
              label="Latitude"
              placeholder="40.7128"
              value={draft.latitude}
              onChangeText={(latitude) => patch({ latitude })}
              error={errors.latitude}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.coordField}>
            <FormField
              label="Longitude"
              placeholder="-74.0060"
              value={draft.longitude}
              onChangeText={(longitude) => patch({ longitude })}
              error={errors.longitude}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{coordsNote}</Text>

        <View style={styles.actions}>
          <AppButton
            label={isEdit ? 'Save changes' : 'Create task'}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipRow: { gap: 8, paddingBottom: 16 },
  coordsRow: { flexDirection: 'row', gap: 12 },
  coordField: { flex: 1 },
  hint: { fontSize: 13, marginBottom: 8 },
  error: { marginTop: 6, fontSize: 13 },
  spacer: { height: 16 },
  actions: { marginTop: 16 },
});
