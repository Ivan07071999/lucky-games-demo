import { makeAutoObservable } from 'mobx';
import type { SpinMode } from '@lucky-games/contracts';

export class SpinSettingsStore {
  turboEnabled = false;
  anticipationDemoEnabled = false;
  spinMode: SpinMode = 'CLASSIC';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleTurbo(): void {
    this.turboEnabled = !this.turboEnabled;
  }

  toggleAnticipationDemo(): void {
    if (this.cascadeEnabled) return;
    this.anticipationDemoEnabled = !this.anticipationDemoEnabled;
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

  selectClassic(): void {
    this.spinMode = 'CLASSIC';
    this.anticipationDemoEnabled = false;
  }

  toggleCascade(): void {
    this.spinMode = this.cascadeEnabled ? 'CLASSIC' : 'CASCADE';
    if (this.cascadeEnabled) this.anticipationDemoEnabled = false;
  }

  toggleHybrid(): void {
    this.spinMode = this.hybridEnabled ? 'CLASSIC' : 'HYBRID';
  }
}
