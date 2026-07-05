import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry, Task } from '../types';

const TASKS_KEY = '@fieldtasks/tasks';
const HISTORY_KEY = '@fieldtasks/history';

/**
 * Thin persistence layer over AsyncStorage. The Zustand store is the single
 * writer; this module only serializes/deserializes and never mutates data.
 */

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`[storage] Failed to read ${key}`, error);
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] Failed to write ${key}`, error);
    throw error;
  }
}

export const taskStorage = {
  loadTasks: () => readJson<Task[]>(TASKS_KEY, []),
  saveTasks: (tasks: Task[]) => writeJson(TASKS_KEY, tasks),
  loadHistory: () => readJson<HistoryEntry[]>(HISTORY_KEY, []),
  saveHistory: (history: HistoryEntry[]) => writeJson(HISTORY_KEY, history),
};
