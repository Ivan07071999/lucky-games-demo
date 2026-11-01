import { Assets } from 'pixi.js';

type AssetLease<T> = {
  users: number;
  promise: Promise<T>;
  unloading: Promise<void> | null;
};

export class AssetLeasePool<T> {
  private readonly leases = new Map<string, AssetLease<T>>();
  private readonly kind: string;

  constructor(kind: string) {
    this.kind = kind;
  }

  createScope(): AssetLeaseScope<T> {
    return new AssetLeaseScope(this);
  }

  async acquire(alias: string, acquired: Set<string>, isDisposed: () => boolean): Promise<T> {
    if (isDisposed()) throw new Error('Asset loader has been destroyed');

    let lease = this.leases.get(alias);
    while (lease?.unloading) {
      await lease.unloading;
      if (isDisposed()) throw new Error('Asset loader has been destroyed');
      lease = this.leases.get(alias);
    }

    if (!lease) {
      lease = { users: 0, promise: Assets.load<T>(alias), unloading: null };
      this.leases.set(alias, lease);
    }

    if (!acquired.has(alias)) {
      acquired.add(alias);
      lease.users++;
    }

    try {
      const asset = await lease.promise;
      if (isDisposed()) throw new Error('Asset loader has been destroyed');
      return asset;
    } catch (error) {
      this.release(alias, acquired);
      throw error;
    }
  }

  release(alias: string, acquired: Set<string>): void {
    if (!acquired.delete(alias)) return;

    const lease = this.leases.get(alias);
    if (!lease || --lease.users > 0) return;

    lease.unloading = lease.promise
      .then(
        () => Assets.unload(alias),
        () => undefined,
      )
      .catch((error: unknown) => {
        console.warn(`Failed to unload ${this.kind} asset ${alias}`, error);
      })
      .finally(() => {
        if (this.leases.get(alias) === lease) this.leases.delete(alias);
      });
  }
}

export class AssetLeaseScope<T> {
  private readonly pool: AssetLeasePool<T>;
  private readonly acquired = new Set<string>();
  private disposed = false;

  constructor(pool: AssetLeasePool<T>) {
    this.pool = pool;
  }

  load(alias: string): Promise<T> {
    return this.pool.acquire(alias, this.acquired, () => this.disposed);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const alias of this.acquired) this.pool.release(alias, this.acquired);
  }
}
