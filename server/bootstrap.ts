/**
 * Node shims so the browser-shaped realm can run headlessly.
 *
 * `src/store/useRealmStore.ts` uses zustand's `persist` middleware, which
 * reaches for `localStorage` at import time. In Node that doesn't exist, so we
 * install an in-memory stand-in BEFORE the store module is ever imported.
 *
 * IMPORTANT: anything that imports the store must be loaded with a dynamic
 * `await import(...)` *after* this module has run — static imports hoist and
 * would beat the shim to the punch. See realm.ts.
 *
 * (This is the same trick the Phase-2 headless harness used; see CLAUDE.md.)
 */

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  key(i: number): string | null {
    return Array.from(this.map.keys())[i] ?? null;
  }
}

const g = globalThis as Record<string, unknown>;
if (!g.localStorage) g.localStorage = new MemoryStorage();
if (!g.sessionStorage) g.sessionStorage = new MemoryStorage();

export const storageReady = true;
