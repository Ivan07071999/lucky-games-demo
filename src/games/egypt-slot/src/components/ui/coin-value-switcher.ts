import { ValueSwitcher, type ValueSwitcherActions } from './value-switcher';

export class CoinValueSwitcher extends ValueSwitcher {
  constructor(width: number, height: number, value: number, actions: ValueSwitcherActions) {
    super({
      id: 'coin-value',
      title: 'COIN VALUE',
      width,
      height,
      initialValue: value,
      formatValue: (value) => (value / 100).toFixed(2).replace('.', ','),
      ...actions,
    });
  }
}
