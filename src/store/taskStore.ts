import { create } from 'zustand';
import { taskStorage } from '../storage/taskStorage';
import { syncTasks } from '../services/syncService';
import { cancelNotification, scheduleDueNotification } from '../services/notificationService';
import { deleteAttachmentFile } from '../services/attachmentService';
import { generateId } from '../utils/id';
import { STATUS_LABELS } from '../constants';
import type {
  Attachment,
  HistoryAction,
  HistoryEntry,
  SortMode,
  Task,
  TaskLocation,
  TaskStatus,
} from '../types';

const HISTORY_LIMIT = 300;

export interface TaskInput {
  title: string;
  description: string;
  dueDate: string;
  location: TaskLocation;
}

interface TaskStoreState {
  tasks: Task[];
  history: HistoryEntry[];
  hydrated: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  demoNotifications: boolean;
  sortMode: SortMode;
  searchQuery: string;
  statusFilter: TaskStatus | 'all';

  hydrate: () => Promise<void>;
  createTask: (input: TaskInput) => Promise<{ task: Task; notificationNote?: string }>;
  updateTask: (id: string, input: TaskInput) => Promise<{ notificationNote?: string }>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addAttachment: (taskId: string, attachment: Attachment) => Promise<void>;
  removeAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  runSync: () => Promise<void>;
  setOnline: (online: boolean) => void;
  setDemoNotifications: (enabled: boolean) => void;
  setSortMode: (mode: SortMode) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: TaskStatus | 'all') => void;
}

function historyEntry(
  task: Pick<Task, 'id' | 'title'>,
  action: HistoryAction,
  description: string,
): HistoryEntry {
  return {
    id: generateId(),
    taskId: task.id,
    taskTitle: task.title,
    action,
    description,
    timestamp: new Date().toISOString(),
  };
}

export const useTaskStore = create<TaskStoreState>((set, get) => {
  /** Applies a state patch and persists tasks/history in the background. */
  const commit = (tasks: Task[], newEntries: HistoryEntry[]) => {
    const history = [...newEntries.reverse(), ...get().history].slice(0, HISTORY_LIMIT);
    set({ tasks, history });
    taskStorage
      .saveTasks(tasks)
      .catch((error) => console.warn('[store] persisting tasks failed', error));
    taskStorage
      .saveHistory(history)
      .catch((error) => console.warn('[store] persisting history failed', error));
  };

  return {
    tasks: [],
    history: [],
    hydrated: false,
    isSyncing: false,
    isOnline: true,
    demoNotifications: false,
    sortMode: 'createdAt',
    searchQuery: '',
    statusFilter: 'all',

    hydrate: async () => {
      const [tasks, history] = await Promise.all([
        taskStorage.loadTasks(),
        taskStorage.loadHistory(),
      ]);
      set({ tasks, history, hydrated: true });
    },

    createTask: async (input) => {
      const now = new Date().toISOString();
      const task: Task = {
        id: generateId(),
        ...input,
        status: 'new',
        attachments: [],
        syncStatus: 'pending',
        deleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const { notificationId, note } = await scheduleDueNotification(
        task,
        get().demoNotifications,
      );
      const withNotification = { ...task, notificationId };

      commit(
        [withNotification, ...get().tasks],
        [historyEntry(task, 'created', `Task "${task.title}" created`)],
      );
      void get().runSync();
      return { task: withNotification, notificationNote: note };
    },

    updateTask: async (id, input) => {
      const existing = get().tasks.find((t) => t.id === id);
      if (!existing) throw new Error('Task not found');

      let notificationId = existing.notificationId;
      let note: string | undefined;
      if (existing.dueDate !== input.dueDate) {
        await cancelNotification(existing.notificationId);
        const result = await scheduleDueNotification(
          { id, title: input.title, dueDate: input.dueDate },
          get().demoNotifications,
        );
        notificationId = result.notificationId;
        note = result.note;
      }

      const updated: Task = {
        ...existing,
        ...input,
        notificationId,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };
      commit(
        get().tasks.map((t) => (t.id === id ? updated : t)),
        [historyEntry(updated, 'edited', `Task "${updated.title}" edited`)],
      );
      void get().runSync();
      return { notificationNote: note };
    },

    setTaskStatus: async (id, status) => {
      const existing = get().tasks.find((t) => t.id === id);
      if (!existing || existing.status === status) return;

      // A finished or cancelled task no longer needs its reminder
      if (status === 'completed' || status === 'cancelled') {
        await cancelNotification(existing.notificationId);
      }

      const updated: Task = {
        ...existing,
        status,
        notificationId:
          status === 'completed' || status === 'cancelled' ? undefined : existing.notificationId,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };
      commit(
        get().tasks.map((t) => (t.id === id ? updated : t)),
        [
          historyEntry(
            updated,
            'status_changed',
            `Status changed: ${STATUS_LABELS[existing.status]} → ${STATUS_LABELS[status]}`,
          ),
        ],
      );
      void get().runSync();
    },

    deleteTask: async (id) => {
      const existing = get().tasks.find((t) => t.id === id);
      if (!existing) return;

      await cancelNotification(existing.notificationId);
      await Promise.all(existing.attachments.map((a) => deleteAttachmentFile(a.uri)));

      // Keep a tombstone so the deletion reaches the server on next sync
      const tombstone: Task = {
        ...existing,
        deleted: true,
        attachments: [],
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };
      commit(
        get().tasks.map((t) => (t.id === id ? tombstone : t)),
        [historyEntry(existing, 'deleted', `Task "${existing.title}" deleted`)],
      );
      void get().runSync();
    },

    addAttachment: async (taskId, attachment) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      if (!existing) return;

      const updated: Task = {
        ...existing,
        attachments: [...existing.attachments, attachment],
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };
      commit(
        get().tasks.map((t) => (t.id === taskId ? updated : t)),
        [historyEntry(updated, 'attachment_added', `Attachment "${attachment.name}" added`)],
      );
      void get().runSync();
    },

    removeAttachment: async (taskId, attachmentId) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      const attachment = existing?.attachments.find((a) => a.id === attachmentId);
      if (!existing || !attachment) return;

      await deleteAttachmentFile(attachment.uri);
      const updated: Task = {
        ...existing,
        attachments: existing.attachments.filter((a) => a.id !== attachmentId),
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };
      commit(
        get().tasks.map((t) => (t.id === taskId ? updated : t)),
        [historyEntry(updated, 'attachment_removed', `Attachment "${attachment.name}" removed`)],
      );
      void get().runSync();
    },

    runSync: async () => {
      const { isSyncing, isOnline, tasks: snapshot } = get();
      if (isSyncing || !isOnline) return;

      set({ isSyncing: true });
      let needsAnotherPass = false;
      try {
        const outcome = await syncTasks(snapshot);

        // Merge against the *current* state, not the snapshot: the user may
        // have edited tasks while the sync round-trip was in flight, and those
        // edits must survive (they are pushed by the follow-up pass below).
        const snapshotById = new Map(snapshot.map((t) => [t.id, t]));
        const outcomeById = new Map(outcome.tasks.map((t) => [t.id, t]));
        const current = get().tasks;

        const merged: Task[] = [];
        for (const task of current) {
          const before = snapshotById.get(task.id);
          // Reference equality is reliable because the store is immutable:
          // any mutation during the sync round-trip produced a new object
          const mutatedDuringSync = before !== task;
          if (mutatedDuringSync) {
            merged.push(task);
            continue;
          }
          const fromSync = outcomeById.get(task.id);
          // Absent from the outcome means the tombstone reached the server
          if (fromSync) merged.push(fromSync);
        }
        const currentIds = new Set(current.map((t) => t.id));
        for (const task of outcome.tasks) {
          if (!currentIds.has(task.id)) merged.push(task);
        }

        const entries = outcome.events.map((e) =>
          historyEntry(
            { id: e.taskId, title: e.taskTitle },
            e.ok ? 'sync_success' : 'sync_failed',
            e.description,
          ),
        );
        commit(merged, entries);
        needsAnotherPass = merged.some((t) => t.syncStatus === 'pending');
      } catch (error) {
        // Sync must never crash the app: failures stay local and retriable
        console.warn('[sync] unexpected failure', error);
      } finally {
        set({ isSyncing: false });
      }
      if (needsAnotherPass) void get().runSync();
    },

    setOnline: (online) => {
      const wasOffline = !get().isOnline;
      set({ isOnline: online });
      // Coming back online is the moment to flush pending changes
      if (online && wasOffline) void get().runSync();
    },

    setDemoNotifications: (enabled) => set({ demoNotifications: enabled }),
    setSortMode: (mode) => set({ sortMode: mode }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setStatusFilter: (filter) => set({ statusFilter: filter }),
  };
});
