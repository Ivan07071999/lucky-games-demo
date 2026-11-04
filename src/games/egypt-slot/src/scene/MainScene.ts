import { Container, Texture } from 'pixi.js';
import type { WinType } from '@lucky-games/contracts';
import { EgyptImageAssetKey } from '../assets';
import type { FreeSpinsTransitionKind } from '../components/free-spins-transition/FreeSpinsTransition';
import type { ReelsCommand } from '../reelsMachine/commands';
import { GameContext, type GameMessages } from '../runtime/GameContext';
import type { SceneTheme } from './sceneTheme';
import { MainSceneActions } from './MainSceneActions';
import { MainSceneLayout, type MainSceneLayoutTargets } from './MainSceneLayout';
import { createMainSceneComponents, type MainSceneComponents } from './createMainSceneComponents';

export class MainScene extends Container {
  readonly context: GameContext;
  private readonly actions: MainSceneActions;
  private readonly layout = new MainSceneLayout();
  private components: MainSceneComponents | null = null;
  private theme: SceneTheme = 'base';

  constructor(canvas: HTMLCanvasElement, messages: GameMessages) {
    super();
    this.eventMode = 'static';
    this.context = new GameContext(canvas, messages);
    this.actions = new MainSceneActions(this.context);
  }

  initialize(): void {
    if (this.components) return;

    const components = createMainSceneComponents(this.context, this.actions);
    this.components = components;
    this.addChild(...components.children);
    this.bindAudioFeedback();

    if (this.context.slotStore.session.isFreeSpin) this.setTheme('freeSpins');
  }

  resize(width: number, height: number): void {
    this.layout.resize(width, height, this.getLayoutTargets());
  }

  executeReels(command: ReelsCommand, signal: AbortSignal): void | Promise<void> {
    return this.getComponents().reelsMachine.execute(command, signal);
  }

  setTheme(theme: SceneTheme): void {
    const components = this.getComponents();
    if (this.theme === theme) return;

    this.theme = theme;
    components.background.texture = Texture.from(
      theme === 'freeSpins'
        ? EgyptImageAssetKey.scene.backgroundFreeSpins
        : EgyptImageAssetKey.scene.background,
    );
    components.reelsMachine.setTheme(theme);
    components.betPanel.setTheme(theme);
    components.freeSpinsStatus.setTheme(theme);
    this.layout.resizeToCurrentViewport(this.getLayoutTargets(components));
  }

  showFreeSpinsTransition(kind: FreeSpinsTransitionKind): void {
    this.getComponents().freeSpinsTransition.show(kind);
  }

  fadeFreeSpinsTransition(alpha: number, duration: number, signal: AbortSignal): Promise<void> {
    return this.getComponents().freeSpinsTransition.fadeTo(alpha, duration, signal);
  }

  hideFreeSpinsTransition(): void {
    this.components?.freeSpinsTransition.hide();
  }

  showWinPopup(winType: WinType | undefined, totalWinCoins: number): boolean {
    if (!this.components || !winType) return false;

    this.components.winPopup.show(winType, totalWinCoins);
    return this.components.winPopup.visible;
  }

  hideWinPopup(): void {
    this.components?.winPopup.hide();
  }

  private getComponents(): MainSceneComponents {
    if (!this.components) throw new Error('MainScene has not been initialized');
    return this.components;
  }

  private getLayoutTargets(components = this.getComponents()): MainSceneLayoutTargets {
    return {
      background: components.background,
      reelsMachine: components.reelsMachine,
      betPanel: components.betPanel,
      resizable: components.resizable,
    };
  }

  private bindAudioFeedback(): void {
    this.on('pointerover', (event) => {
      this.playSoundForInteractiveTarget(event.target as Container, () =>
        this.context.audio.playHover(),
      );
    });
    this.on('pointertapcapture', (event) => {
      this.playSoundForInteractiveTarget(event.target as Container, () =>
        this.context.audio.playClick(),
      );
    });
  }

  private playSoundForInteractiveTarget(target: Container | null, playSound: () => void): void {
    while (target && target !== this) {
      if (target.cursor === 'pointer') {
        playSound();
        return;
      }

      target = target.parent;
    }
  }
}
