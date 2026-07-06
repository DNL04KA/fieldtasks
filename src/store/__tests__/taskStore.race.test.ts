import type { Task } from '../../types';
import type { SyncOutcome } from '../../services/syncService';

jest.mock('../../storage/taskStorage', () => ({
  taskStorage: {
    loadTasks: jest.fn().mockResolvedValue([]),
    loadHistory: jest.fn().mockResolvedValue([]),
    saveTasks: jest.fn().mockResolvedValue(undefined),
    saveHistory: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/notificationService', () => ({
  scheduleDueNotification: jest.fn().mockResolvedValue({ notificationId: 'n1' }),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/attachmentService', () => ({
  deleteAttachmentFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/syncService', () => ({
  syncTasks: jest.fn(),
}));

import { syncTasks } from '../../services/syncService';
import { useTaskStore } from '../taskStore';

const mockedSyncTasks = syncTasks as jest.MockedFunction<typeof syncTasks>;

function makeTask(id: string, title: string): Task {
  const now = new Date().toISOString();
  return {
    id,
    title,
    description: 'desc',
    dueDate: new Date(Date.now() + 3_600_000).toISOString(),
    location: { address: 'Somewhere' },
    status: 'new',
    attachments: [],
    syncStatus: 'pending',
    deleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

describe('taskStore runSync race handling', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      history: [],
      hydrated: true,
      isSyncing: false,
      isOnline: true,
    });
    mockedSyncTasks.mockReset();
  });

  test('local edit made while a sync is in flight is not reverted by the sync result', async () => {
    const taskA = makeTask('a', 'Task A');
    const taskB = makeTask('b', 'Task B');
    useTaskStore.setState({ tasks: [taskA, taskB] });

    // First sync call hangs until we release it; follow-up passes resolve fast
    let releaseFirstSync!: (outcome: SyncOutcome) => void;
    mockedSyncTasks.mockImplementationOnce(
      () => new Promise<SyncOutcome>((resolve) => (releaseFirstSync = resolve)),
    );
    mockedSyncTasks.mockImplementation(async (tasks) => ({
      tasks: tasks.map((t) => ({ ...t, syncStatus: 'synced' as const })),
      events: [],
    }));

    const firstSync = useTaskStore.getState().runSync();

    // While the sync round-trip is pending, the user edits task B
    useTaskStore.getState().updateTask('b', {
      title: 'Task B edited',
      description: taskB.description,
      dueDate: taskB.dueDate,
      location: taskB.location,
    });

    // The in-flight sync now resolves with the PRE-edit snapshot marked synced
    releaseFirstSync({
      tasks: [taskA, taskB].map((t) => ({ ...t, syncStatus: 'synced' as const })),
      events: [],
    });
    await firstSync;
    // Let the follow-up pass (which pushes the pending edit) settle too
    await new Promise((r) => setTimeout(r, 0));

    const b = useTaskStore.getState().tasks.find((t) => t.id === 'b');
    expect(b?.title).toBe('Task B edited');
  });

  test('runSync never rejects even when the sync service throws', async () => {
    useTaskStore.setState({ tasks: [makeTask('a', 'Task A')] });
    mockedSyncTasks.mockRejectedValueOnce(new Error('boom'));

    await expect(useTaskStore.getState().runSync()).resolves.toBeUndefined();
    expect(useTaskStore.getState().isSyncing).toBe(false);
  });
});
