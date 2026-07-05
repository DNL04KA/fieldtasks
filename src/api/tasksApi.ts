import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import type { Task } from '../types';

/** Task shape stored on the mock server: local-only fields are stripped. */
export type RemoteTask = Omit<Task, 'syncStatus' | 'notificationId'>;

function toRemote(task: Task): RemoteTask {
  const { syncStatus, notificationId, ...remote } = task;
  return remote;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } finally {
    clearTimeout(timer);
  }
}

export const tasksApi = {
  async fetchAll(): Promise<RemoteTask[]> {
    const res = await request('/tasks');
    if (!res.ok) throw new Error(`GET /tasks failed with ${res.status}`);
    return (await res.json()) as RemoteTask[];
  },

  /** Upsert: json-server returns 404 for PUT on unknown ids, so fall back to POST. */
  async upsert(task: Task): Promise<void> {
    const body = JSON.stringify(toRemote(task));
    const put = await request(`/tasks/${task.id}`, { method: 'PUT', body });
    if (put.ok) return;
    if (put.status !== 404) throw new Error(`PUT /tasks/${task.id} failed with ${put.status}`);
    const post = await request('/tasks', { method: 'POST', body });
    if (!post.ok) throw new Error(`POST /tasks failed with ${post.status}`);
  },

  /** Deleting an id the server never saw is treated as success. */
  async remove(taskId: string): Promise<void> {
    const res = await request(`/tasks/${taskId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      throw new Error(`DELETE /tasks/${taskId} failed with ${res.status}`);
    }
  },
};
