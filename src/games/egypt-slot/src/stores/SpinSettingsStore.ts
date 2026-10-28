import { makeAutoObservable } from 'mobx';

export class SpinSettingsStore {
  turboEnabled = false;
  anticipationDemoEnabled = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleTurbo(): void {
    this.turboEnabled = !this.turboEnabled;
  }

  toggleAnticipationDemo(): void {
    this.anticipationDemoEnabled = !this.anticipationDemoEnabled;
  }
}
