import { makeAutoObservable } from 'mobx';
import {
  DEFAULT_PAYLINE_COUNT,
  type PaylineCount,
  type SpinMode,
  type SymbolKey,
  type WinDemoSelection,
  type WinDemoType,
} from '@lucky-games/contracts';

export const WIN_DEMO_SYMBOLS: readonly SymbolKey[] = [
  'highAnkh',
  'highEye',
  'highNecklace',
  'defaultA',
  'defaultK',
  'defaultQ',
  'defaultJ',
];

export class SpinSettingsStore {
  turboEnabled = false;
  anticipationDemoEnabled = false;
  winDemoEnabled = false;
  winDemoSymbol: SymbolKey = 'highAnkh';
  winDemoCount: 3 | 4 | 5 = 3;
  winTypeDemo: WinDemoType | null = null;
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

  toggleAnticipationDemo(): void {
    if (this.cascadeEnabled) return;
    this.anticipationDemoEnabled = !this.anticipationDemoEnabled;
    if (this.anticipationDemoEnabled) {
      this.winDemoEnabled = false;
      this.winTypeDemo = null;
    }
  }

  get winDemoSelection(): WinDemoSelection | undefined {
    return this.winDemoEnabled
      ? { symbol: this.winDemoSymbol, count: this.winDemoCount }
      : undefined;
  }

  toggleWinDemo(): void {
    this.winDemoEnabled = !this.winDemoEnabled;
    if (this.winDemoEnabled) {
      this.anticipationDemoEnabled = false;
      this.winTypeDemo = null;
    }
  }

  selectWinTypeDemo(winType: WinDemoType): void {
    this.winTypeDemo = this.winTypeDemo === winType ? null : winType;
    if (this.winTypeDemo) {
      this.anticipationDemoEnabled = false;
      this.winDemoEnabled = false;
    }
  }

  cycleWinDemoSymbol(direction: -1 | 1): void {
    const index = WIN_DEMO_SYMBOLS.indexOf(this.winDemoSymbol);
    this.winDemoSymbol =
      WIN_DEMO_SYMBOLS[(index + direction + WIN_DEMO_SYMBOLS.length) % WIN_DEMO_SYMBOLS.length];
  }

  cycleWinDemoCount(direction: -1 | 1): void {
    this.winDemoCount = (3 + ((this.winDemoCount - 3 + direction + 3) % 3)) as 3 | 4 | 5;
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
