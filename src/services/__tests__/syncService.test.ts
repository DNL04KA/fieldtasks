import { syncTasks } from '../syncService';
import { tasksApi } from '../../api/tasksApi';
import type { Task } from '../../types';

jest.mock('../../api/tasksApi', () => ({
  tasksApi: {
    fetchAll: jest.fn(),
    upsert: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockedApi = tasksApi as jest.Mocked<typeof tasksApi>;

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    title: 'Task',
    description: 'Desc',
    dueDate: '2026-07-10T14:00:00.000Z',
    location: { address: 'Somewhere' },
    status: 'new',
    attachments: [],
    syncStatus: 'pending',
    deleted: false,
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockedApi.fetchAll.mockResolvedValue([]);
});

describe('syncTasks', () => {
  test('pushes pending tasks and marks them synced', async () => {
    mockedApi.upsert.mockResolvedValue();
    const outcome = await syncTasks([makeTask({ syncStatus: 'pending' })]);

    expect(mockedApi.upsert).toHaveBeenCalledTimes(1);
    expect(outcome.tasks[0].syncStatus).toBe('synced');
    expect(outcome.events[0]).toMatchObject({ ok: true });
  });

  test('marks tasks failed when the server is unreachable', async () => {
    mockedApi.upsert.mockRejectedValue(new Error('network down'));
    mockedApi.fetchAll.mockRejectedValue(new Error('network down'));
    const outcome = await syncTasks([makeTask({ syncStatus: 'pending' })]);

    expect(outcome.tasks[0].syncStatus).toBe('failed');
    expect(outcome.events[0]).toMatchObject({ ok: false });
  });

  test('drops tombstones after the deletion reaches the server', async () => {
    mockedApi.remove.mockResolvedValue();
    const outcome = await syncTasks([makeTask({ deleted: true, syncStatus: 'pending' })]);

    expect(mockedApi.remove).toHaveBeenCalledWith('t1');
    expect(outcome.tasks).toHaveLength(0);
  });

  test('pull applies last-write-wins only to clean local tasks', async () => {
    const local = makeTask({ syncStatus: 'synced', title: 'Local', updatedAt: '2026-07-01T09:00:00.000Z' });
    const { syncStatus, notificationId, ...remoteBase } = makeTask({
      title: 'Remote newer',
      updatedAt: '2026-07-02T09:00:00.000Z',
    });
    mockedApi.fetchAll.mockResolvedValue([remoteBase]);

    const outcome = await syncTasks([local]);
    expect(outcome.tasks[0].title).toBe('Remote newer');
    expect(outcome.tasks[0].syncStatus).toBe('synced');
  });

  test('pull never overwrites local pending changes', async () => {
    mockedApi.upsert.mockRejectedValue(new Error('offline'));
    const local = makeTask({ syncStatus: 'pending', title: 'Local pending' });
    const { syncStatus, notificationId, ...remoteBase } = makeTask({
      title: 'Remote',
      updatedAt: '2026-07-09T09:00:00.000Z',
    });
    mockedApi.fetchAll.mockResolvedValue([remoteBase]);

    const outcome = await syncTasks([local]);
    expect(outcome.tasks[0].title).toBe('Local pending');
  });

  test('adds tasks that exist only on the server', async () => {
    const { syncStatus, notificationId, ...remoteBase } = makeTask({ id: 'server-only' });
    mockedApi.fetchAll.mockResolvedValue([remoteBase]);

    const outcome = await syncTasks([]);
    expect(outcome.tasks).toHaveLength(1);
    expect(outcome.tasks[0]).toMatchObject({ id: 'server-only', syncStatus: 'synced' });
  });
});
