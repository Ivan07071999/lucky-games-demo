import { Container, Graphics, Text } from 'pixi.js';
import { SCROLL_MODAL_COLORS } from './scroll-modal-theme';

const SECTIONS = [
  {
    title: 'BETTING PANEL',
    items: [
      { label: 'BET', description: 'Click the BET number to choose the base stake in coins.' },
      {
        label: 'LEVEL',
        description: 'Use the arrows to change the stake level. Total stake is BET × LEVEL coins.',
      },
      {
        label: 'COINS',
        description:
          'Shows your coin balance. The stake is deducted on SPIN; any win is added after the reels stop.',
      },
    ],
  },
  {
    title: 'PLAY CONTROLS',
    items: [
      {
        label: 'SPIN / STOP',
        description:
          'Press SPIN to start a round. Press again during the spin for Quick Stop; the result stays the same.',
      },
      {
        label: 'MAX BET',
        description:
          'Sets BET and LEVEL to their allowed maximums and immediately starts one spin.',
      },
      {
        label: 'AUTO PLAY',
        description:
          'Opens the automatic play settings. While it runs, press STOP to finish after the current round.',
      },
    ],
  },
  {
    title: 'OTHER CONTROLS',
    items: [
      {
        label: 'SOUND',
        description: 'Click the sound icon below the left panel to turn audio on or off.',
      },
      {
        label: 'INFO',
        description: 'The information icon below the left panel opens these game rules.',
      },
      {
        label: 'SETTINGS',
        description: 'The gear opens Turbo, Anticipation, Cascade and winning-line settings.',
      },
    ],
  },
  {
    title: 'WINNING LINES',
    items: [
      {
        label: '5 LINES',
        description: 'Three horizontal rows and two mirrored V paths. Only selected lines pay.',
      },
      {
        label: '7 / 9 LINES',
        description:
          'Seven adds top/middle and bottom/middle zigzags. Nine also adds middle/top and middle/bottom zigzags.',
      },
    ],
  },
] as const;

const makeText = (text: string, fontSize: number, bold = false, wordWrap = true): Text =>
  new Text({
    text,
    style: {
      fontFamily: 'Manrope Variable, sans-serif',
      fontSize,
      fontWeight: bold ? '800' : '600',
      fill: bold ? SCROLL_MODAL_COLORS.heading : SCROLL_MODAL_COLORS.ink,
      wordWrap,
    },
  });

class ControlRow extends Container {
  private readonly background = new Graphics();
  private readonly labelText: Text;
  private readonly description: Text;

  constructor(label: string, description: string) {
    super();
    this.labelText = makeText(label, 15, true);
    this.description = makeText(description, 16);
    this.addChild(this.background, this.labelText, this.description);
  }

  layout(width: number, compact: boolean): number {
    const padding = compact ? 10 : 12;
    const labelWidth = Math.min(compact ? 98 : 158, width * 0.32);
    const descriptionX = padding + labelWidth + (compact ? 8 : 16);
    this.labelText.style.fontSize = compact ? 12 : 15;
    this.labelText.style.wordWrapWidth = labelWidth;
    this.description.style.fontSize = compact ? 13 : 16;
    this.description.style.wordWrapWidth = Math.max(1, width - descriptionX - padding);
    const height = Math.max(
      compact ? 38 : 44,
      this.labelText.height + padding * 2,
      this.description.height + padding * 2,
    );

    this.background
      .clear()
      .roundRect(0, 0, width, height, compact ? 7 : 9)
      .fill({ color: 0xffedc8, alpha: 0.34 })
      .stroke({ color: SCROLL_MODAL_COLORS.buttonBorder, width: 1, alpha: 0.4 });
    this.labelText.position.set(padding, (height - this.labelText.height) / 2);
    this.description.position.set(descriptionX, (height - this.description.height) / 2);
    return height;
  }
}

type Section = { title: Text; rows: ControlRow[] };

export class GameInfoControlsPage extends Container {
  private readonly heading = makeText('HOW TO PLAY', 25, true, false);
  private readonly sections: Section[];
  private readonly footer = makeText(
    'Free Spins start automatically when triggered. Paid-spin controls return after the bonus ends.',
    15,
  );

  constructor() {
    super();
    this.label = 'game-info-controls-page';
    this.sections = SECTIONS.map(({ title, items }) => {
      const titleText = makeText(title, 20, true, false);
      const rows = items.map(({ label, description }) => new ControlRow(label, description));
      this.addChild(titleText, ...rows);
      return { title: titleText, rows };
    });
    this.addChild(this.heading, this.footer);
  }

  layout(width: number): number {
    const compact = width < 620;
    const rowGap = compact ? 6 : 8;
    let y = 0;

    this.heading.style.fontSize = compact ? 21 : 25;
    this.heading.position.set((width - this.heading.width) / 2, y);
    y += this.heading.height + (compact ? 14 : 20);

    if (width >= 500) {
      const columnGap = compact ? 16 : 28;
      const columnWidth = (width - columnGap) / 2;
      let leftBottom = this.layoutSection(this.sections[0], 0, y, columnWidth, compact, rowGap);
      leftBottom = this.layoutSection(
        this.sections[3],
        0,
        leftBottom + (compact ? 6 : 10),
        columnWidth,
        compact,
        rowGap,
      );
      let rightBottom = this.layoutSection(
        this.sections[1],
        columnWidth + columnGap,
        y,
        columnWidth,
        compact,
        rowGap,
      );
      rightBottom = this.layoutSection(
        this.sections[2],
        columnWidth + columnGap,
        rightBottom + (compact ? 6 : 10),
        columnWidth,
        compact,
        rowGap,
      );
      y = Math.max(leftBottom, rightBottom) + (compact ? 10 : 16);
    } else {
      for (const section of [
        this.sections[0],
        this.sections[3],
        this.sections[1],
        this.sections[2],
      ]) {
        y = this.layoutSection(section, 0, y, width, compact, rowGap) + (compact ? 10 : 16);
      }
    }

    this.footer.style.fontSize = compact ? 12 : 15;
    this.footer.style.wordWrapWidth = Math.max(1, width - 12);
    this.footer.position.set((width - this.footer.width) / 2, y);
    return y + this.footer.height + 12;
  }

  private layoutSection(
    section: Section,
    x: number,
    top: number,
    width: number,
    compact: boolean,
    rowGap: number,
  ): number {
    section.title.style.fontSize = compact ? 16 : 20;
    section.title.position.set(x + (width - section.title.width) / 2, top);
    let y = top + section.title.height + (compact ? 8 : 10);
    for (const row of section.rows) {
      row.position.set(x, y);
      y += row.layout(width, compact) + rowGap;
    }
    return y;
  }
}
