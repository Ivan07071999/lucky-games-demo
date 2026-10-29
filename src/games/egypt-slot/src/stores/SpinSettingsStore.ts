import { makeAutoObservable } from 'mobx';

export class SpinSettingsStore {
  turboEnabled = false;
  anticipationDemoEnabled = false;
  cascadeEnabled = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleTurbo(): void {
    this.turboEnabled = !this.turboEnabled;
  }

  toggleAnticipationDemo(): void {
    this.anticipationDemoEnabled = !this.anticipationDemoEnabled;
    if (this.anticipationDemoEnabled) this.cascadeEnabled = false;
  }

  toggleCascade(): void {
    this.cascadeEnabled = !this.cascadeEnabled;
    if (this.cascadeEnabled) this.anticipationDemoEnabled = false;
  }
}
