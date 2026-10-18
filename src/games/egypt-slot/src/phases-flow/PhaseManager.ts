export interface Phase<State extends string> {
  // Return null to remain active until the flow is stopped.
  enter(): State | null | Promise<State | null>
  exit?(): void
}

export class PhaseManager<State extends string> {
  private readonly initial: State
  private readonly phases: Record<State, Phase<State>>
  private readonly transitions: Record<State, readonly State[]>
  private readonly cleanup: () => void
  private activePhase: Phase<State> | null = null
  private activeState: State | null = null
  private started = false
  private stopped = false
  private transitioning = false

  constructor(
    initial: State,
    phases: Record<State, Phase<State>>,
    transitions: Record<State, readonly State[]>,
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
    await this.advance(this.initial)
  }

  async transition(next: State): Promise<void> {
    if (!this.started || this.stopped || this.transitioning || !this.activeState) return
    await this.advance(next)
  }

  private async advance(initial: State): Promise<void> {
    if (this.transitioning) return
    this.transitioning = true
    let next: State | null = initial

    try {
      while (next !== null && !this.stopped) {
        if (this.activeState && !this.transitions[this.activeState].includes(next)) {
          throw new Error(`Invalid phase transition: ${this.activeState} -> ${next}`)
        }

        this.leaveActive()
        const phase: Phase<State> = this.phases[next]
        this.activePhase = phase
        this.activeState = next

        next = await phase.enter()
      }
    } catch (error) {
      this.stop()
      throw error
    } finally {
      this.transitioning = false
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
    try {
      this.leaveActive()
    } finally {
      this.cleanup()
    }
  }
}
