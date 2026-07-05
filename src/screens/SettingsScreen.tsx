import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useTaskStore } from '../store/taskStore';
import { usePendingSyncCount } from '../store/selectors';
import { AppButton } from '../components/AppButton';
import { CANDIDATE_CODE, DEMO_NOTIFICATION_SECONDS } from '../constants';
import { API_BASE_URL } from '../api/config';

export function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const demoNotifications = useTaskStore((s) => s.demoNotifications);
  const setDemoNotifications = useTaskStore((s) => s.setDemoNotifications);
  const isOnline = useTaskStore((s) => s.isOnline);
  const isSyncing = useTaskStore((s) => s.isSyncing);
  const runSync = useTaskStore((s) => s.runSync);
  const pendingCount = usePendingSyncCount();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Section title="Appearance">
        <SettingRow
          label="Dark theme"
          description="Switch between light and dark mode"
          value={theme === 'dark'}
          onValueChange={toggleTheme}
        />
      </Section>

      <Section title="Notifications">
        <SettingRow
          label="Demo notification mode"
          description={`Reminders for newly saved tasks fire in ${DEMO_NOTIFICATION_SECONDS} seconds instead of 30 minutes before the due date. Intended for the review video.`}
          value={demoNotifications}
          onValueChange={setDemoNotifications}
        />
      </Section>

      <Section title="Synchronization">
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Server: {API_BASE_URL}
          {'\n'}Network: {isOnline ? 'online' : 'offline'}
          {'\n'}Pending changes: {pendingCount}
        </Text>
        <AppButton label={isSyncing ? 'Syncing…' : 'Sync now'} onPress={runSync} loading={isSyncing} />
      </Section>

      <Section title="About">
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          FieldTasks — internal productivity tool for field technicians.{'\n'}
          Test assignment build.
        </Text>
        <View style={[styles.codeBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Candidate code</Text>
          <Text style={[styles.code, { color: colors.text }]} accessibilityLabel={`Candidate code ${CANDIDATE_CODE}`}>
            {CANDIDATE_CODE}
          </Text>
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDescription: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  infoText: { fontSize: 14, lineHeight: 20 },
  codeBox: { borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  codeLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  code: { fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
});
