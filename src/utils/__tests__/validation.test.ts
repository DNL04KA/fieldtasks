import { parseCoordinate, validateTaskDraft } from '../validation';
import type { TaskDraft } from '../../types';

function validDraft(): TaskDraft {
  return {
    title: 'Replace router',
    description: 'Swap the failing unit in rack B3',
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    address: '12 Industrial Rd',
    latitude: '40.7357',
    longitude: '-74.1724',
  };
}

describe('validateTaskDraft', () => {
  test('accepts a fully valid draft', () => {
    expect(validateTaskDraft(validDraft())).toEqual({});
  });

  test('requires title, description, due date and address', () => {
    const errors = validateTaskDraft({
      ...validDraft(),
      title: '   ',
      description: '',
      dueDate: null,
      address: '',
    });
    expect(errors.title).toBeDefined();
    expect(errors.description).toBeDefined();
    expect(errors.dueDate).toBeDefined();
    expect(errors.address).toBeDefined();
  });

  test('rejects a due date in the past', () => {
    const errors = validateTaskDraft({
      ...validDraft(),
      dueDate: new Date(Date.now() - 60 * 1000),
    });
    expect(errors.dueDate).toBe('Due date must be in the future');
  });

  test('coordinates are optional when both are empty', () => {
    const errors = validateTaskDraft({ ...validDraft(), latitude: '', longitude: '' });
    expect(errors.latitude).toBeUndefined();
    expect(errors.longitude).toBeUndefined();
  });

  test('rejects latitude outside -90..90', () => {
    const errors = validateTaskDraft({ ...validDraft(), latitude: '120' });
    expect(errors.latitude).toBeDefined();
  });

  test('rejects one coordinate without the other', () => {
    const errors = validateTaskDraft({ ...validDraft(), longitude: '' });
    expect(errors.longitude).toBeDefined();
  });

  test('accepts comma as decimal separator', () => {
    const errors = validateTaskDraft({ ...validDraft(), latitude: '40,7357' });
    expect(errors.latitude).toBeUndefined();
  });
});

describe('parseCoordinate', () => {
  test('parses numeric strings', () => {
    expect(parseCoordinate('40.7')).toBe(40.7);
    expect(parseCoordinate('40,7')).toBe(40.7);
  });

  test('returns undefined for empty or invalid input', () => {
    expect(parseCoordinate('')).toBeUndefined();
    expect(parseCoordinate('abc')).toBeUndefined();
  });
});
