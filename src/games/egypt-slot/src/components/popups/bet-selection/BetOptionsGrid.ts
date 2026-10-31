import { Container } from 'pixi.js';
import { BetOptionButton } from './BetOptionButton';
import { BET_OPTION_GAP, BET_OPTION_HEIGHT } from './bet-selection-layout';

export class BetOptionsGrid extends Container {
  private readonly onSelect: (value: number) => void;
  private buttons: BetOptionButton[] = [];

  constructor(onSelect: (value: number) => void) {
    super();
    this.onSelect = onSelect;
  }

  get optionCount(): number {
    return this.buttons.length;
  }

  setOptions(values: readonly number[], selectedValue: number): void {
    this.buttons.forEach((button) => button.destroy({ children: true }));
    this.buttons = values.map((value) => {
      const button = new BetOptionButton(value, this.onSelect);
      button.setSelected(value === selectedValue);
      this.addChild(button);
      return button;
    });
  }

  layout(columns: number, buttonWidth: number): void {
    this.buttons.forEach((button, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      button.resize(buttonWidth);
      button.position.set(
        buttonWidth / 2 + column * (buttonWidth + BET_OPTION_GAP),
        BET_OPTION_HEIGHT / 2 + row * (BET_OPTION_HEIGHT + BET_OPTION_GAP),
      );
    });
  }
}
