import { tasksApi, type RemoteTask } from '../api/tasksApi';
import type { Task } from '../types';

export interface SyncEvent {
  taskId: string;
  taskTitle: string;
  ok: boolean;
  description: string;
}

export interface SyncOutcome {
  tasks: Task[];
  events: SyncEvent[];
}

function fromRemote(remote: RemoteTask): Task {
  return { ...remote, attachments: remote.attachments ?? [], syncStatus: 'synced' };
}

/**
 * Two-phase sync with a last-write-wins policy (documented in README):
 * 1. Push — every locally pending/failed change is sent to the server;
 *    tombstoned tasks are DELETEd and dropped locally on success.
 * 2. Pull — server tasks unknown locally are added; for tasks that are clean
 *    locally ("synced") a newer server updatedAt wins. Tasks with local
 *    pending changes are never overwritten by the pull.
 */
export async function syncTasks(localTasks: Task[]): Promise<SyncOutcome> {
  const events: SyncEvent[] = [];
  const working: Task[] = [];

  // Phase 1: push local changes
  for (const task of localTasks) {
    if (task.syncStatus === 'synced') {
      working.push(task);
      continue;
    }
    try {
      if (task.deleted) {
        await tasksApi.remove(task.id);
        events.push({
          taskId: task.id,
          taskTitle: task.title,
          ok: true,
          description: 'Deletion synced to server',
        });
        // Tombstone fulfilled its purpose — drop it locally
      } else {
        await tasksApi.upsert(task);
        working.push({ ...task, syncStatus: 'synced' });
        events.push({
          taskId: task.id,
          taskTitle: task.title,
          ok: true,
          description: 'Changes synced to server',
        });
      }
    } catch (error) {
      working.push({ ...task, syncStatus: 'failed' });
      events.push({
        taskId: task.id,
        taskTitle: task.title,
        ok: false,
        description: `Sync failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      });
    }
  }

  // Phase 2: pull server state and merge (last-write-wins on updatedAt)
  try {
    const remoteTasks = await tasksApi.fetchAll();
    const byId = new Map(working.map((t) => [t.id, t]));

    for (const remote of remoteTasks) {
      const local = byId.get(remote.id);
      if (!local) {
        if (!remote.deleted) byId.set(remote.id, fromRemote(remote));
        continue;
      }
      const remoteIsNewer = new Date(remote.updatedAt) > new Date(local.updatedAt);
      if (local.syncStatus === 'synced' && remoteIsNewer) {
        // Keep local-only fields (notification id) while accepting server data
        byId.set(remote.id, { ...fromRemote(remote), notificationId: local.notificationId });
      }
    }

    return { tasks: [...byId.values()], events };
  } catch {
    // Pull failure is non-fatal: pushed statuses above are still valid
    return { tasks: working, events };
  }
}
