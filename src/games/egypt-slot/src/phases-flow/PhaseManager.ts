export interface Phase<State extends string> {
  // Return null to remain active until the flow is stopped.
  enter(): State | null | Promise<State | null>
  exit?(): void
}

export class PhaseManager<State extends string> {
  private readonly initial: State
  private readonly phases: Record<State, Phase<State>>
  private readonly cleanup: () => void
  private activePhase: Phase<State> | null = null
  private activeState: State | null = null
  private started = false
  private stopped = false

  constructor(initial: State, phases: Record<State, Phase<State>>, cleanup: () => void) {
    this.initial = initial
    this.phases = phases
    this.cleanup = cleanup
  }

  get currentState(): State | null {
    return this.activeState
  }

  async start(): Promise<void> {
    if (this.started || this.stopped) return
    this.started = true

    let next: State | null = this.initial

    try {
      while (next !== null && !this.stopped) {
        const phase: Phase<State> = this.phases[next]
        this.activePhase = phase
        this.activeState = next

        next = await phase.enter()
        if (this.stopped || next === null) return

        phase.exit?.()
        this.activePhase = null
        this.activeState = null
      }
    } catch (error) {
      this.stop()
      throw error
    }
  }

  stop(): void {
    if (this.stopped) return

    this.stopped = true
    this.activePhase?.exit?.()
    this.activePhase = null
    this.activeState = null
    this.cleanup()
  }
}
