import type { SlotState } from '@lucky-games/contracts';
import { Container, Graphics, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS, SCROLL_MODAL_FONT_FAMILY } from '../shared/scroll-modal-theme';

const makeText = (text: string, size: number, bold = false): Text =>
  new Text({
    text,
    style: {
      fontFamily: SCROLL_MODAL_FONT_FAMILY,
      fontSize: size,
      fontWeight: bold ? '800' : '600',
      fill: bold ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.ink,
      align: 'center',
      wordWrap: true,
    },
    anchor: { x: 0.5, y: 0 },
  });

class PaylineDiagram extends Container {
  private readonly background = new Graphics();
  private readonly title = makeText('', 15, true);
  private readonly path = new Graphics();
  private readonly cells = new Graphics();

  constructor() {
    super();
    this.addChild(this.background, this.title, this.cells, this.path);
  }

  layout(rows: readonly number[], lineIndex: number, width: number, compact: boolean): number {
    const cellSize = Math.min(compact ? 15 : 18, (width - 24) / 6);
    const gap = compact ? 2 : 3;
    const gridWidth = cellSize * 5 + gap * 4;
    const gridX = (width - gridWidth) / 2;
    const gridY = compact ? 22 : 25;
    const height = gridY + cellSize * 3 + gap * 2 + 8;

    this.background
      .clear()
      .roundRect(0, 0, width, height, compact ? 8 : 12)
      .fill({ color: SCROLL_MODAL_COLORS.buttonBorder, alpha: 0.08 })
      .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 1, alpha: 0.55 });
    this.title.text = `LINE ${lineIndex + 1}`;
    this.title.style.fontSize = compact ? 11 : 13;
    this.title.position.set(width / 2, 4);

    this.path.clear();
    this.cells.clear();
    rows.forEach((selectedRow, reel) => {
      const centerX = gridX + reel * (cellSize + gap) + cellSize / 2;
      const centerY = gridY + selectedRow * (cellSize + gap) + cellSize / 2;
      if (reel === 0) this.path.moveTo(centerX, centerY);
      else this.path.lineTo(centerX, centerY);

      for (let row = 0; row < 3; row += 1) {
        const selected = row === selectedRow;
        this.cells
          .roundRect(
            gridX + reel * (cellSize + gap),
            gridY + row * (cellSize + gap),
            cellSize,
            cellSize,
            2,
          )
          .fill({
            color: selected ? SCROLL_MODAL_COLORS.buttonBorderSelected : 0xffedc8,
            alpha: selected ? 1 : 0.55,
          })
          .stroke({
            color: selected ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.buttonBorder,
            width: selected ? 1.5 : 0.8,
            alpha: selected ? 0.9 : 0.5,
          });
      }
    });
    this.path.stroke({ color: SCROLL_MODAL_COLORS.heading, width: compact ? 2 : 3 });
    return height;
  }
}

export class GameInfoRulesPage extends Container {
  private readonly rules = [
    makeText('A paid spin costs BET × LEVEL COINS.', 18),
    makeText('3, 4 or 5 matching paying symbols win on adjacent reels from left to right.', 18),
    makeText('', 18),
    makeText('', 18),
  ];
  private readonly linesTitle = makeText('WINNING LINES', 22, true);
  private readonly lineModes = makeText(
    '5 lines: 1-5 (three horizontal, two V paths). 7 lines: add 6-7 (top/middle and bottom/middle zigzags). 9 lines: add 8-9 (middle/top and middle/bottom zigzags).',
    15,
  );
  private readonly lineHint = makeText(
    'Gold squares trace each path. Only the lines selected in Settings can pay.',
    16,
  );
  private readonly diagrams: PaylineDiagram[] = [];
  private paylines: number[][] = [];

  constructor() {
    super();
    this.label = 'game-info-rules-page';
    this.addChild(...this.rules, this.linesTitle, this.lineModes, this.lineHint);
  }

  setData(config: SlotState['config']): void {
    this.rules[2].text =
      'Wins on the selected lines are added to the round win. ' +
      `An expanded Wild multiplies affected lines ×${config.wildMultiplier}.`;
    this.rules[3].text =
      `${config.scatterTriggerCount}+ Scarabs anywhere on a paid spin award ${config.freeSpinsAwarded} Free Spins. ` +
      'They use the triggering bet and cost no coins.';
    this.linesTitle.text = `ALL ${config.paylines.length} WINNING LINES`;
    this.paylines = config.paylines.slice();

    while (this.diagrams.length < this.paylines.length) {
      const diagram = new PaylineDiagram();
      this.diagrams.push(diagram);
      this.addChild(diagram);
    }
    while (this.diagrams.length > this.paylines.length) {
      this.diagrams.pop()?.destroy();
    }
  }

  layout(width: number): number {
    const compact = width < 600;
    const textWidth = Math.max(1, width - (compact ? 4 : 40));
    const ruleGap = compact ? 4 : 7;
    let y = 0;

    for (const rule of this.rules) {
      rule.style.fontSize = compact ? 13 : 16;
      rule.style.wordWrapWidth = textWidth;
      rule.position.set(width / 2, y);
      y += rule.height + ruleGap;
    }

    y += compact ? 4 : 8;
    this.linesTitle.style.fontSize = compact ? 18 : 22;
    this.linesTitle.position.set(width / 2, y);
    y += this.linesTitle.height + (compact ? 4 : 7);

    this.lineModes.style.fontSize = compact ? 12 : 15;
    this.lineModes.style.wordWrapWidth = textWidth;
    this.lineModes.position.set(width / 2, y);
    y += this.lineModes.height + (compact ? 7 : 11);

    const columns = width >= 400 ? 3 : width >= 260 ? 2 : 1;
    const gap = compact ? 7 : 12;
    const cardWidth = (width - gap * (columns - 1)) / columns;
    for (let start = 0; start < this.paylines.length; start += columns) {
      const count = Math.min(columns, this.paylines.length - start);
      const rowWidth = count * cardWidth + (count - 1) * gap;
      const x = (width - rowWidth) / 2;
      let rowHeight = 0;
      for (let column = 0; column < count; column += 1) {
        const index = start + column;
        const diagram = this.diagrams[index];
        diagram.position.set(x + column * (cardWidth + gap), y);
        rowHeight = Math.max(
          rowHeight,
          diagram.layout(this.paylines[index], index, cardWidth, compact),
        );
      }
      y += rowHeight + gap;
    }

    y += compact ? 1 : 4;
    this.lineHint.style.fontSize = compact ? 12 : 15;
    this.lineHint.style.wordWrapWidth = textWidth;
    this.lineHint.position.set(width / 2, y);
    return y + this.lineHint.height + 8;
  }
}
