import { Container, Sprite, Texture } from 'pixi.js';
import { EgyptImageAssetKey } from '../assets';
import { BetPanel } from '../components/bet-panel';
import { GameContext, type GameMessages } from '../runtime/GameContext';
import {
  calculateGameLayout,
  getGameLayoutMode,
  type LayoutBounds,
  type LayoutPlacement,
} from './gameLayout';

export class MainScene extends Container {
  readonly context: GameContext;
  private background: Sprite | null = null;
  private betPanel: BetPanel | null = null;

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    super();
    this.context = new GameContext(canvas, messages);
  }

  initialize(): void {
    if (this.background) return;

    const background = new Sprite(Texture.from(EgyptImageAssetKey.scene.background));
    background.anchor.set(0.5);
    this.background = background;

    const reelsMachine = this.context.reelsMachine;
    this.betPanel = new BetPanel(reelsMachine.width, reelsMachine.height, this.context.slotStore);

    this.addChild(background, reelsMachine, this.betPanel);
  }

  resize(width: number, height: number): void {
    if (!this.background) throw new Error('MainScene has not been initialized');
    if (width <= 0 || height <= 0) return;

    const texture = this.background.texture;
    const backgroundScale = Math.max(width / texture.width, height / texture.height);
    this.background.scale.set(backgroundScale);
    this.background.position.set(width / 2, height / 2);

    const panel = this.betPanel;
    if (!panel) return;

    const reelsMachine = this.context.reelsMachine;
    const mode = getGameLayoutMode(width, height);
    panel.setLayout(mode === 'wide' ? 'wide' : 'compact');
    const reelsBounds = reelsMachine.getLocalBounds();
    const panelBounds = panel.getLocalBounds();
    const layout = calculateGameLayout(width, height, reelsBounds, panelBounds, mode);

    this.place(reelsMachine, reelsBounds, layout.reels);
    this.place(panel, panelBounds, layout.panel);
  }

  private place(container: Container, bounds: LayoutBounds, placement: LayoutPlacement): void {
    container.scale.set(placement.scale);
    container.position.set(
      placement.left + (container.pivot.x - bounds.x) * placement.scale,
      placement.top + (container.pivot.y - bounds.y) * placement.scale,
    );
  }
}
