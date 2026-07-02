export function readMockSession<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeMockSession(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Mock persistence is best-effort so restricted storage never breaks the demo.
  }
}
