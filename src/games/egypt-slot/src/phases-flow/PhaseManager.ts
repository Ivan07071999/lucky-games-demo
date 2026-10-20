export interface Phase<Name extends string, Next extends string = string> {
  readonly name: Name
  enter(signal: AbortSignal): Promise<Next>
  exit?(): void
}

export type PhaseRegistry<State extends string, Graph extends Record<State, readonly State[]>> = {
  [Name in State]: Phase<Name, Graph[Name][number]>
}

export class PhaseManager<State extends string, Graph extends Record<State, readonly State[]>> {
  private readonly abortController = new AbortController()
  private readonly initial: State
  private readonly phases: PhaseRegistry<State, Graph>
  private readonly transitions: Graph
  private readonly cleanup: () => void
  private activePhase: Phase<State, State> | null = null
  private activeState: State | null = null
  private started = false
  private stopped = false

  constructor(
    initial: State,
    phases: PhaseRegistry<State, Graph>,
    transitions: Graph,
    cleanup: () => void,
  ) {
    this.initial = initial
    this.phases = phases
    this.transitions = transitions
    this.cleanup = cleanup
  }

  get currentState(): State | null {
    return this.activeState
  }

  async start(): Promise<void> {
    if (this.started || this.stopped) return
    this.started = true

    let next = this.initial

    try {
      while (!this.stopped) {
        if (this.activeState && !this.transitions[this.activeState].includes(next)) {
          throw new Error(`Invalid phase transition: ${this.activeState} -> ${next}`)
        }

        this.leaveActive()

        const phase = this.phases[next]
        if (phase.name !== next) throw new Error(`Phase ${next} has the wrong name`)

        this.activePhase = phase
        this.activeState = next

        next = await phase.enter(this.abortController.signal)
      }
    } catch (error) {
      if (this.stopped) return
      this.stop()
      throw error
    }
  }

  private leaveActive(): void {
    const phase = this.activePhase
    this.activePhase = null
    this.activeState = null
    phase?.exit?.()
  }

  stop(): void {
    if (this.stopped) return

    this.stopped = true
    this.abortController.abort()
    try {
      this.leaveActive()
    } finally {
      this.cleanup()
    }
  }
}
