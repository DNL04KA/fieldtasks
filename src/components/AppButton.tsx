import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
}: AppButtonProps) {
  const { colors } = useTheme();

  const background =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surfaceAlt;
  const textColor = variant === 'secondary' ? colors.text : colors.accentText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: background,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  label: { fontSize: 16, fontWeight: '600' },
});
