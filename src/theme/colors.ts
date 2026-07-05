import type { TaskStatus, SyncStatus } from '../types';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  warning: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEEF2',
  border: '#DDDFE4',
  text: '#17181C',
  textSecondary: '#5F6470',
  accent: '#2456E6',
  accentText: '#FFFFFF',
  danger: '#D23B3B',
  success: '#1E9E5A',
  warning: '#C77E14',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ThemeColors = {
  background: '#101216',
  surface: '#1A1D23',
  surfaceAlt: '#23272F',
  border: '#31353E',
  text: '#F1F2F5',
  textSecondary: '#9BA1AD',
  accent: '#5B85F5',
  accentText: '#FFFFFF',
  danger: '#E66060',
  success: '#3BBF7A',
  warning: '#E0A33C',
  overlay: 'rgba(0,0,0,0.6)',
};

export const statusColors: Record<TaskStatus, { light: string; dark: string }> = {
  new: { light: '#2456E6', dark: '#5B85F5' },
  in_progress: { light: '#C77E14', dark: '#E0A33C' },
  completed: { light: '#1E9E5A', dark: '#3BBF7A' },
  cancelled: { light: '#8A8F9A', dark: '#7C818C' },
};

export const syncColors: Record<SyncStatus, { light: string; dark: string }> = {
  pending: { light: '#C77E14', dark: '#E0A33C' },
  synced: { light: '#1E9E5A', dark: '#3BBF7A' },
  failed: { light: '#D23B3B', dark: '#E66060' },
};
