type EventName<Events extends object> = Extract<keyof Events, string>;
type EventListener<Payload> = (payload: Payload) => void;
type StoredListener = (payload: unknown) => void;

type EmitArguments<Payload> = [Payload] extends [void] ? [] : [payload: Payload];

export type EventSubscriptionOptions = {
  signal?: AbortSignal;
};

export type WaitForEventOptions<Payload> = EventSubscriptionOptions & {
  filter?: (payload: Payload) => boolean;
};

export class GameEmitter<Events extends object> {
  private readonly listeners = new Map<EventName<Events>, Set<StoredListener>>();

  emit<Name extends EventName<Events>>(name: Name, ...args: EmitArguments<Events[Name]>): void {
    const listeners = this.listeners.get(name);
    if (!listeners) return;

    const payload = args[0] as Events[Name];
    [...listeners].forEach((listener) => listener(payload));
  }

  on<Name extends EventName<Events>>(
    name: Name,
    listener: EventListener<Events[Name]>,
    options: EventSubscriptionOptions = {},
  ): () => void {
    if (options.signal?.aborted) return () => undefined;

    const listeners = this.listeners.get(name) ?? new Set<StoredListener>();
    const storedListener = listener as StoredListener;
    let subscribed = true;

    listeners.add(storedListener);
    this.listeners.set(name, listeners);

    const unsubscribe = (): void => {
      if (!subscribed) return;

      subscribed = false;
      listeners.delete(storedListener);
      options.signal?.removeEventListener('abort', unsubscribe);

      if (listeners.size === 0) this.listeners.delete(name);
    };

    options.signal?.addEventListener('abort', unsubscribe, { once: true });

    return unsubscribe;
  }

  waitFor<Name extends EventName<Events>>(
    name: Name,
    options: WaitForEventOptions<Events[Name]> = {},
  ): Promise<Events[Name]> {
    return new Promise((resolve, reject) => {
      const { signal, filter } = options;

      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }

      let unsubscribe = (): void => undefined;

      const handleAbort = (): void => {
        unsubscribe();
        reject(signal?.reason);
      };

      unsubscribe = this.on(name, (payload) => {
        if (filter && !filter(payload)) return;

        signal?.removeEventListener('abort', handleAbort);
        unsubscribe();
        resolve(payload);
      });

      signal?.addEventListener('abort', handleAbort, { once: true });

      if (signal?.aborted) handleAbort();
    });
  }

  destroy(): void {
    this.listeners.clear();
  }
}
