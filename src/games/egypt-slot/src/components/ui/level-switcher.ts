import { ValueSwitcher } from './value-switcher';

export class LevelSwitcher extends ValueSwitcher {
  constructor(width: number, height: number) {
    super({
      id: 'level',
      title: 'LEVEL',
      width,
      height,
      initialValue: 1,
      minValue: 1,
      formatValue: String,
    });
  }
}
