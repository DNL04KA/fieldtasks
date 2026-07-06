import type { TaskStatus } from './types';

/**
 * The assignment mentions a unique candidate code, but the recruiter (Pavel)
 * confirmed by email that no personal code is issued for this task.
 * Candidate identity is shown instead.
 */
export const CANDIDATE_NAME = 'Daniil Nesterovich';
export const CANDIDATE_NOTE = 'No personal candidate code — confirmed by recruiter via email';

export const NOTIFICATION_LEAD_MINUTES = 30;
/** Fallback delay when the due date is closer than the normal lead time */
export const NOTIFICATION_FALLBACK_SECONDS = 10;
/** Demo mode: notification fires this many seconds after scheduling */
export const DEMO_NOTIFICATION_SECONDS = 45;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_ORDER: Record<TaskStatus, number> = {
  new: 0,
  in_progress: 1,
  completed: 2,
  cancelled: 3,
};

/** Predefined locations for quick pick (real geocoding is out of scope) */
export const PRESET_LOCATIONS = [
  { label: 'Head Office — 1 Main St', latitude: 40.7128, longitude: -74.006 },
  { label: 'Warehouse North — 12 Industrial Rd', latitude: 40.7357, longitude: -74.1724 },
  { label: 'Client Site A — 45 Park Ave', latitude: 40.7527, longitude: -73.9772 },
  { label: 'Service Center — 8 River Blvd', latitude: 40.7061, longitude: -74.0087 },
];
