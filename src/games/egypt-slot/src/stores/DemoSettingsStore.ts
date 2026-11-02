import {
  type SpinMode,
  type SpinOptions,
  type SymbolKey,
  type WinDemoType,
} from '@lucky-games/contracts';
import { makeAutoObservable } from 'mobx';

export const WIN_DEMO_SYMBOLS: readonly SymbolKey[] = [
  'highAnkh',
  'highEye',
  'highNecklace',
  'defaultA',
  'defaultK',
  'defaultQ',
  'defaultJ',
];
const WIN_DEMO_COUNTS = [3, 4, 5] as const;

type DemoChoice =
  | { kind: 'none' }
  | { kind: 'anticipation' }
  | { kind: 'combination' }
  | { kind: 'winType'; winType: WinDemoType };

type DemoSpinOptions = Pick<SpinOptions, 'anticipationDemo' | 'winDemo' | 'winTypeDemo'>;

export class DemoSettingsStore {
  choice: DemoChoice = { kind: 'none' };
  winDemoSymbol: SymbolKey = 'highAnkh';
  winDemoCount: 3 | 4 | 5 = 3;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get anticipationEnabled(): boolean {
    return this.choice.kind === 'anticipation';
  }

  get winDemoEnabled(): boolean {
    return this.choice.kind === 'combination';
  }

  get winTypeDemo(): WinDemoType | null {
    return this.choice.kind === 'winType' ? this.choice.winType : null;
  }

  get spinOptions(): DemoSpinOptions {
    switch (this.choice.kind) {
      case 'anticipation':
        return { anticipationDemo: true };
      case 'combination':
        return { winDemo: { symbol: this.winDemoSymbol, count: this.winDemoCount } };
      case 'winType':
        return { winTypeDemo: this.choice.winType };
      default:
        return {};
    }
  }

  toggleAnticipation(spinMode: SpinMode): void {
    if (spinMode === 'CASCADE') return;
    this.choice = this.anticipationEnabled ? { kind: 'none' } : { kind: 'anticipation' };
  }

  toggleWinCombination(): void {
    this.choice = this.winDemoEnabled ? { kind: 'none' } : { kind: 'combination' };
  }

  selectWinType(winType: WinDemoType): void {
    this.choice = this.winTypeDemo === winType ? { kind: 'none' } : { kind: 'winType', winType };
  }

  clearAnticipation(): void {
    if (this.anticipationEnabled) this.choice = { kind: 'none' };
  }

  cycleWinDemoSymbol(direction: -1 | 1): void {
    const index = WIN_DEMO_SYMBOLS.indexOf(this.winDemoSymbol);
    this.winDemoSymbol =
      WIN_DEMO_SYMBOLS[(index + direction + WIN_DEMO_SYMBOLS.length) % WIN_DEMO_SYMBOLS.length];
  }

  cycleWinDemoCount(direction: -1 | 1): void {
    const index = WIN_DEMO_COUNTS.indexOf(this.winDemoCount);
    this.winDemoCount =
      WIN_DEMO_COUNTS[(index + direction + WIN_DEMO_COUNTS.length) % WIN_DEMO_COUNTS.length];
  }
}
