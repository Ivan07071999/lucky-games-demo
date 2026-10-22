import { ValueSwitcher, type ValueSwitcherActions } from './value-switcher';

export class LevelSwitcher extends ValueSwitcher {
  constructor(width: number, height: number, value: number, actions: ValueSwitcherActions) {
    super({
      id: 'level',
      title: 'LEVEL',
      width,
      height,
      initialValue: value,
      formatValue: String,
      ...actions,
    });
  }
}
