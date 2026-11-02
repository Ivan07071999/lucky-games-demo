import { makeAutoObservable } from 'mobx';
import { DEFAULT_PAYLINE_COUNT, type PaylineCount, type SpinMode } from '@lucky-games/contracts';

export class SpinSettingsStore {
  turboEnabled = false;
  paylineCount: PaylineCount = DEFAULT_PAYLINE_COUNT;
  spinMode: SpinMode = 'CLASSIC';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleTurbo(): void {
    this.turboEnabled = !this.turboEnabled;
  }

  setPaylineCount(count: PaylineCount): void {
    this.paylineCount = count;
  }

  restorePaylineCount(count: PaylineCount | undefined): void {
    this.paylineCount = count ?? DEFAULT_PAYLINE_COUNT;
  }

  get cascadeEnabled(): boolean {
    return this.spinMode === 'CASCADE';
  }

  get classicEnabled(): boolean {
    return this.spinMode === 'CLASSIC';
  }

  get hybridEnabled(): boolean {
    return this.spinMode === 'HYBRID';
  }

  setSpinMode(mode: SpinMode): void {
    this.spinMode = mode;
  }
}
