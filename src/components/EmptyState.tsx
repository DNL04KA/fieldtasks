import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.accent}14` }]}>
        <Ionicons name={icon} size={34} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 19, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});
