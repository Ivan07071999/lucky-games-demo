import type { WaitForEventOptions } from './GameEmitter';

type Subscribe<Payload> = (listener: (payload: Payload) => void) => () => void;

export class EventWaiter<Payload> {
  readonly promise: Promise<Payload>;

  private readonly name: string;
  private readonly subscribe: Subscribe<Payload>;
  private readonly options: WaitForEventOptions<Payload>;
  private readonly onSettled: () => void;
  private resolvePromise!: (payload: Payload) => void;
  private rejectPromise!: (reason: unknown) => void;
  private unsubscribe = (): void => undefined;
  private timeoutId?: ReturnType<typeof setTimeout>;
  private settled = false;

  constructor(
    name: string,
    subscribe: Subscribe<Payload>,
    options: WaitForEventOptions<Payload>,
    onSettled: () => void,
  ) {
    this.name = name;
    this.subscribe = subscribe;
    this.options = options;
    this.onSettled = onSettled;
    this.promise = new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });
  }

  start(): void {
    const { signal, timeoutMs } = this.options;

    try {
      this.unsubscribe = this.subscribe(this.handleEvent);
    } catch (error) {
      this.cancel(error);
      return;
    }

    signal?.addEventListener('abort', this.handleAbort, { once: true });
    if (timeoutMs !== undefined) {
      this.timeoutId = setTimeout(() => {
        this.cancel(
          new Error(`waitFor: event "${this.name}" did not arrive within ${timeoutMs} ms`),
        );
      }, timeoutMs);
    }

    if (signal?.aborted) this.handleAbort();
  }

  cancel(reason: unknown): void {
    this.finish(() => this.rejectPromise(reason));
  }

  private readonly handleEvent = (payload: Payload): void => {
    try {
      if (this.options.filter && !this.options.filter(payload)) return;
    } catch (error) {
      this.cancel(error);
      return;
    }

    this.finish(() => this.resolvePromise(payload));
  };

  private readonly handleAbort = (): void => {
    this.cancel(this.options.signal?.reason);
  };

  private finish(settle: () => void): void {
    if (this.settled) return;
    this.settled = true;

    this.unsubscribe();
    this.options.signal?.removeEventListener('abort', this.handleAbort);
    clearTimeout(this.timeoutId);
    this.onSettled();
    settle();
  }
}
