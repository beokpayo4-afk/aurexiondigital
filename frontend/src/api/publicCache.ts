import { readAccessToken } from "@/api/client";

const stored = new Map<string, { at: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();

export function cachedPublic<T>(key: string, load: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  if (readAccessToken()) {
    return load();
  }
  const hit = stored.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return Promise.resolve(hit.data as T);
  }
  const existing = pending.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = load()
    .then((data) => {
      stored.set(key, { at: Date.now(), data });
      pending.delete(key);
      return data;
    })
    .catch((error: unknown) => {
      pending.delete(key);
      throw error;
    });
  pending.set(key, promise);
  return promise;
}

export function publicQueryKey(path: string, params: Record<string, string | undefined>): string {
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .sort(([left], [right]) => left.localeCompare(right));
  return `${path}?${entries.map(([key, value]) => `${key}=${value}`).join("&")}`;
}
