import { ValueSwitcher } from './value-switcher';

export class CoinValueSwitcher extends ValueSwitcher {
  constructor(width: number, height: number) {
    super({
      id: 'coin-value',
      title: 'COIN VALUE',
      width,
      height,
      initialValue: 2,
      minValue: 1,
      formatValue: (value) => (value / 100).toFixed(2).replace('.', ','),
    });
  }
}
