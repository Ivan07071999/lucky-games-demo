import { makeAutoObservable } from 'mobx';

export class SpinSettingsStore {
  turboEnabled = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  toggleTurbo(): void {
    this.turboEnabled = !this.turboEnabled;
  }
}
