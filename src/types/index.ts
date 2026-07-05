export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export type SortMode = 'createdAt' | 'dueDate' | 'status';

export interface TaskLocation {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Attachment {
  id: string;
  /** Local file URI inside the app's document directory */
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  addedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string
  location: TaskLocation;
  status: TaskStatus;
  attachments: Attachment[];
  notificationId?: string;
  syncStatus: SyncStatus;
  /** Soft-delete tombstone so deletions can be pushed to the server */
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HistoryAction =
  | 'created'
  | 'edited'
  | 'status_changed'
  | 'attachment_added'
  | 'attachment_removed'
  | 'deleted'
  | 'sync_success'
  | 'sync_failed';

export interface HistoryEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  action: HistoryAction;
  description: string;
  timestamp: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  dueDate: Date | null;
  address: string;
  latitude: string;
  longitude: string;
}

export type ValidationErrors = Partial<Record<keyof TaskDraft, string>>;
