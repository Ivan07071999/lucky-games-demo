import type { FreeSpinsThemeController } from '../controllers/free-spins-theme-controller/FreeSpinsThemeController';
import type { Phase } from '../fsm/PhaseManager';
import { PhaseName, type NextPhase } from '../fsm/transitions';

export class FreeSpinsOutroPhase implements Phase<
  typeof PhaseName.freeSpinsOutro,
  NextPhase<typeof PhaseName.freeSpinsOutro>
> {
  readonly name = PhaseName.freeSpinsOutro;
  private readonly theme: FreeSpinsThemeController;

  constructor(theme: FreeSpinsThemeController) {
    this.theme = theme;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.freeSpinsOutro>> {
    await this.theme.leave(signal);
    return PhaseName.idle;
  }
}
