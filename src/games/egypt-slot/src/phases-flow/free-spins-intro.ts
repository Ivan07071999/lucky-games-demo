import type { FreeSpinsThemeController } from '../controllers/free-spins-theme-controller/FreeSpinsThemeController';
import type { Phase } from './PhaseManager';
import { PhaseName, type NextPhase } from './types';

export class FreeSpinsIntroPhase implements Phase<
  typeof PhaseName.freeSpinsIntro,
  NextPhase<typeof PhaseName.freeSpinsIntro>
> {
  readonly name = PhaseName.freeSpinsIntro;
  private readonly theme: FreeSpinsThemeController;

  constructor(theme: FreeSpinsThemeController) {
    this.theme = theme;
  }

  async enter(signal: AbortSignal): Promise<NextPhase<typeof PhaseName.freeSpinsIntro>> {
    await this.theme.enter(signal);
    return PhaseName.freeSpins;
  }
}
