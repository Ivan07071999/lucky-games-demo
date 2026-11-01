import { EventWaiter } from './EventWaiter';

type EventName<Events extends object> = Extract<keyof Events, string>;
type EventListener<Payload> = (payload: Payload) => void;
type StoredListener = (payload: unknown) => void;

type EmitArguments<Payload> = [Payload] extends [void] ? [] : [payload: Payload];

export type EventSubscriptionOptions = {
  signal?: AbortSignal;
};

export type WaitForEventOptions<Payload> = EventSubscriptionOptions & {
  filter?: (payload: Payload) => boolean;
  timeoutMs?: number;
};

export class GameEmitter<Events extends object> {
  private readonly listeners = new Map<EventName<Events>, Set<StoredListener>>();
  private readonly subscriptions = new Set<() => void>();
  private readonly pendingWaiters = new Set<{ cancel(reason: unknown): void }>();
  private destroyed = false;

  emit<Name extends EventName<Events>>(name: Name, ...args: EmitArguments<Events[Name]>): void {
    if (this.destroyed) return;

    const listeners = this.listeners.get(name);
    if (!listeners) return;

    const payload = args[0] as Events[Name];
    const errors: unknown[] = [];

    for (const listener of [...listeners]) {
      try {
        listener(payload);
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, `Listeners for ${name} failed`);
  }

  on<Name extends EventName<Events>>(
    name: Name,
    listener: EventListener<Events[Name]>,
    options: EventSubscriptionOptions = {},
  ): () => void {
    if (this.destroyed) throw new Error('GameEmitter has been destroyed');
    if (options.signal?.aborted) return () => undefined;

    const listeners = this.listeners.get(name) ?? new Set<StoredListener>();
    const storedListener: StoredListener = (payload) => listener(payload as Events[Name]);
    let subscribed = true;

    listeners.add(storedListener);
    this.listeners.set(name, listeners);

    const unsubscribe = (): void => {
      if (!subscribed) return;

      subscribed = false;
      listeners.delete(storedListener);
      options.signal?.removeEventListener('abort', unsubscribe);
      this.subscriptions.delete(unsubscribe);

      if (listeners.size === 0) this.listeners.delete(name);
    };

    this.subscriptions.add(unsubscribe);
    options.signal?.addEventListener('abort', unsubscribe, { once: true });
    if (options.signal?.aborted) unsubscribe();

    return unsubscribe;
  }

  waitFor<Name extends EventName<Events>>(
    name: Name,
    options: WaitForEventOptions<Events[Name]> = {},
  ): Promise<Events[Name]> {
    if (this.destroyed) return Promise.reject(new Error('GameEmitter has been destroyed'));
    if (options.signal?.aborted) return Promise.reject(options.signal.reason);
    if (
      options.timeoutMs !== undefined &&
      (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 0)
    ) {
      return Promise.reject(new RangeError('timeoutMs must be a finite, non-negative number'));
    }

    const waiter = new EventWaiter<Events[Name]>(
      name,
      (listener) => this.on(name, listener),
      options,
      () => this.pendingWaiters.delete(waiter),
    );
    this.pendingWaiters.add(waiter);
    waiter.start();
    return waiter.promise;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    const reason = new Error('GameEmitter has been destroyed');
    for (const waiter of [...this.pendingWaiters]) waiter.cancel(reason);
    for (const unsubscribe of [...this.subscriptions]) unsubscribe();

    this.listeners.clear();
  }
}
