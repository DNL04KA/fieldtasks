import type { TaskDraft, ValidationErrors } from '../types';

const MAX_TITLE_LENGTH = 120;

function isCoordinateValid(raw: string, min: number, max: number): boolean {
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Validates the task form. Returns an empty object when the draft is valid.
 * Coordinates are optional, but when one is provided both must be valid.
 */
export function validateTaskDraft(draft: TaskDraft): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!draft.title.trim()) {
    errors.title = 'Title is required';
  } else if (draft.title.trim().length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
  }

  if (!draft.description.trim()) {
    errors.description = 'Description is required';
  }

  if (!draft.dueDate) {
    errors.dueDate = 'Due date and time are required';
  } else if (draft.dueDate.getTime() <= Date.now()) {
    errors.dueDate = 'Due date must be in the future';
  }

  if (!draft.address.trim()) {
    errors.address = 'Location address is required';
  }

  const hasLat = draft.latitude.trim().length > 0;
  const hasLng = draft.longitude.trim().length > 0;
  if (hasLat || hasLng) {
    if (!hasLat || !isCoordinateValid(draft.latitude, -90, 90)) {
      errors.latitude = 'Latitude must be a number between -90 and 90';
    }
    if (!hasLng || !isCoordinateValid(draft.longitude, -180, 180)) {
      errors.longitude = 'Longitude must be a number between -180 and 180';
    }
  }

  return errors;
}

export function parseCoordinate(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) ? value : undefined;
}
