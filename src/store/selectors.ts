import { useMemo } from 'react';
import { useTaskStore } from './taskStore';
import { STATUS_ORDER } from '../constants';
import type { SortMode, Task } from '../types';

function compareTasks(a: Task, b: Task, mode: SortMode): number {
  switch (mode) {
    case 'dueDate':
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    case 'status':
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case 'createdAt':
    default:
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

/** Tasks visible in the UI: tombstones hidden, search/filter/sort applied. */
export function useVisibleTasks(): Task[] {
  const tasks = useTaskStore((s) => s.tasks);
  const sortMode = useTaskStore((s) => s.sortMode);
  const searchQuery = useTaskStore((s) => s.searchQuery);
  const statusFilter = useTaskStore((s) => s.statusFilter);

  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks
      .filter((t) => !t.deleted)
      .filter((t) => statusFilter === 'all' || t.status === statusFilter)
      .filter((t) => !query || t.title.toLowerCase().includes(query))
      .sort((a, b) => compareTasks(a, b, sortMode));
  }, [tasks, sortMode, searchQuery, statusFilter]);
}

/** Tasks that can be shown on the map (have coordinates and are not deleted). */
export function useMappableTasks(): Task[] {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(
    () =>
      tasks.filter(
        (t) => !t.deleted && t.location.latitude != null && t.location.longitude != null,
      ),
    [tasks],
  );
}

export function useTaskById(id: string): Task | undefined {
  return useTaskStore((s) => s.tasks.find((t) => t.id === id && !t.deleted));
}

export function usePendingSyncCount(): number {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => tasks.filter((t) => t.syncStatus !== 'synced').length, [tasks]);
}
