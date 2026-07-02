const PROJECT_START = Date.parse("2026-06-25T01:00:00.000Z");
const PROJECT_END = Date.parse("2026-07-31T10:00:00.000Z");
// Interactive Mock writes stay later than seeded records while remaining inside the project window.
const INTERACTION_START = Date.parse("2026-07-31T09:00:00.000Z");

let interactionSequence = 0;

export const mockProjectPeriod = {
  start: new Date(PROJECT_START).toISOString(),
  end: new Date(PROJECT_END).toISOString(),
} as const;

export function mockTimelineAt(index: number, total: number): string {
  const safeTotal = Math.max(total - 1, 1);
  const ratio = Math.min(Math.max(index, 0), safeTotal) / safeTotal;
  return new Date(PROJECT_START + (PROJECT_END - PROJECT_START) * ratio).toISOString();
}

export function mockBeforeHours(hours: number): string {
  return new Date(Math.max(PROJECT_START, PROJECT_END - hours * 3_600_000)).toISOString();
}

export function mockBeforeDays(days: number): string {
  return mockBeforeHours(days * 24);
}

export function mockNow(): string {
  const timestamp = Math.min(PROJECT_END, INTERACTION_START + interactionSequence * 60_000);
  interactionSequence += 1;
  return new Date(timestamp).toISOString();
}

export function mockTrendDay(daysBeforeEnd: number): string {
  const date = new Date(PROJECT_END);
  date.setUTCDate(date.getUTCDate() - daysBeforeEnd);
  return date.toISOString().slice(0, 10);
}
