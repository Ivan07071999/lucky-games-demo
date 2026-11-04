import { Container, Sprite } from 'pixi.js';
import { BetPanel } from '../components/ui/panel/BetPanel';
import { ReelsMachine } from '../reelsMachine/ReelsMachine';
import { calculateGameLayout, type LayoutBounds } from './gameLayout';
import { BET_PANEL_COMPACT_WIDTH } from './layoutConfig';

export type ViewportResizable = {
  resize(width: number, height: number): void;
};

export type MainSceneLayoutTargets = {
  background: Sprite;
  reelsMachine: ReelsMachine;
  betPanel: BetPanel;
  resizable: readonly ViewportResizable[];
};

export class MainSceneLayout {
  private viewportWidth = 0;
  private viewportHeight = 0;

  resize(width: number, height: number, targets: MainSceneLayoutTargets): void {
    if (width <= 0 || height <= 0) return;

    this.viewportWidth = width;
    this.viewportHeight = height;

    this.resizeBackground(targets.background, width, height);
    targets.resizable.forEach((component) => component.resize(width, height));
    this.placeGameElements(width, height, targets);
  }

  resizeToCurrentViewport(targets: MainSceneLayoutTargets): void {
    this.resize(this.viewportWidth, this.viewportHeight, targets);
  }

  private resizeBackground(background: Sprite, width: number, height: number): void {
    const scale = Math.max(width / background.texture.width, height / background.texture.height);
    background.scale.set(scale);
    background.position.set(width / 2, height / 2);
  }

  private placeGameElements(
    width: number,
    height: number,
    { reelsMachine, betPanel }: MainSceneLayoutTargets,
  ): void {
    const compactPanel = width <= BET_PANEL_COMPACT_WIDTH;
    betPanel.setLayout(compactPanel ? 'compact' : 'wide');
    betPanel.resize(width);

    const reelsBounds = reelsMachine.getLayoutBounds();
    const panelBounds = betPanel.getLocalBounds();
    const panelHeightForReels = compactPanel ? betPanel.getControlsHeight() : panelBounds.height;
    const layout = calculateGameLayout(width, height, reelsBounds, panelBounds, {
      compactPanel,
      panelHeightForReels,
    });

    this.place(reelsMachine, reelsBounds, layout.reels);
    this.place(betPanel, panelBounds, layout.panel);
  }

  private place(
    container: Container,
    bounds: LayoutBounds,
    placement: { left: number; top: number; scale: number },
  ): void {
    container.scale.set(placement.scale);
    container.position.set(
      placement.left + (container.pivot.x - bounds.x) * placement.scale,
      placement.top + (container.pivot.y - bounds.y) * placement.scale,
    );
  }
}
