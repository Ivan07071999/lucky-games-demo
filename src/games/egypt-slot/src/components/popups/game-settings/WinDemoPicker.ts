import type { SymbolKey } from '@lucky-games/contracts';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';

const SYMBOL_NAMES: Partial<Record<SymbolKey, string>> = {
  highAnkh: 'ANKH',
  highEye: 'EYE',
  highNecklace: 'NECKLACE',
  defaultA: 'A',
  defaultK: 'K',
  defaultQ: 'Q',
  defaultJ: 'J',
};

type PickerActions = {
  previousSymbol: () => void;
  nextSymbol: () => void;
  previousCount: () => void;
  nextCount: () => void;
};

const makeText = (content: string, size: number, color: number): Text =>
  new Text({
    text: content,
    style: { fontFamily: SCROLL_MODAL_FONT_FAMILY, fontSize: size, fill: color },
  });

export class WinDemoPicker extends Container {
  private readonly symbolLabel = makeText('SYMBOL', 11, SCROLL_MODAL_COLORS.ink);
  private readonly countLabel = makeText('MATCH', 11, SCROLL_MODAL_COLORS.ink);
  private readonly symbolValue = makeText('', 14, SCROLL_MODAL_COLORS.heading);
  private readonly countValue = makeText('', 14, SCROLL_MODAL_COLORS.heading);
  private readonly controls: Container[] = [];

  constructor(actions: PickerActions) {
    super();
    this.label = 'win-demo-picker';

    this.symbolValue.anchor.set(0.5, 0.5);
    this.countValue.anchor.set(0.5, 0.5);

    this.addChild(
      this.symbolLabel,
      this.countLabel,
      this.symbolValue,
      this.countValue,
      this.arrow(0, 19, '‹', actions.previousSymbol),
      this.arrow(169, 19, '›', actions.nextSymbol),
      this.arrow(190, 19, '‹', actions.previousCount),
      this.arrow(325, 19, '›', actions.nextCount),
    );
    this.resize(348);
  }

  resize(width: number): void {
    const gap = 12;
    const groupWidth = (width - gap) / 2;
    const countX = groupWidth + gap;
    this.symbolLabel.x = 0;
    this.countLabel.x = countX;
    this.symbolValue.position.set(groupWidth / 2, 35);
    this.countValue.position.set(countX + groupWidth / 2, 35);
    this.symbolValue.style.fontSize = width < 300 ? 12 : 14;
    this.countValue.style.fontSize = width < 300 ? 12 : 14;
    this.controls[0].x = 0;
    this.controls[1].x = groupWidth - 25;
    this.controls[2].x = countX;
    this.controls[3].x = width - 25;
  }

  setState(symbol: SymbolKey, count: 3 | 4 | 5, enabled: boolean): void {
    this.symbolValue.text = SYMBOL_NAMES[symbol] ?? symbol;
    this.countValue.text = `${count} IN A ROW`;
    this.alpha = enabled ? 1 : 0.55;
    for (const control of this.controls) {
      control.eventMode = enabled ? 'static' : 'none';
      control.cursor = enabled ? 'pointer' : 'default';
    }
  }

  private arrow(x: number, y: number, symbol: string, onClick: () => void): Container {
    const control = new Container();
    const background = new Graphics()
      .roundRect(0, 0, 25, 31, 5)
      .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 1 });
    const label = makeText(symbol, 22, SCROLL_MODAL_COLORS.heading);
    label.anchor.set(0.5, 0.5);
    label.position.set(12.5, 14);
    control.addChild(background, label);
    control.position.set(x, y);
    control.hitArea = new Rectangle(0, 0, 25, 31);
    control.eventMode = 'static';
    control.cursor = 'pointer';
    control.on('pointertap', (event) => {
      event.stopPropagation();
      onClick();
    });
    this.controls.push(control);
    return control;
  }
}
