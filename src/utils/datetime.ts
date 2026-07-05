const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, DATE_OPTS);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, DATE_OPTS)}, ${d.toLocaleTimeString(undefined, TIME_OPTS)}`;
}

export function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

export function minutesUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 60000;
}
