/**
 * Tiny in-process TTL cache.
 *
 * Deliberately not Redis: the cached data here is either identical for every
 * user (the seeded catalogs, the curated templates) or trivially small
 * (a user's own custom items), so per-instance caching with a short TTL gives
 * nearly all of the benefit with none of the operational cost. Staleness is
 * bounded by the TTL, and the mutation paths evict explicitly.
 */
export class TtlCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private ttlMs: number,
    private maxEntries = 1000,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldest = this.store.keys().next();
      if (!oldest.done) this.store.delete(oldest.value);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Resolve from cache, or run `load` and cache the result. */
  async getOrLoad(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await load();
    this.set(key, value);
    return value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
