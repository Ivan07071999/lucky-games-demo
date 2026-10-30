import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import type { CascadeSequence, ReelAnticipationHint, Win } from '@lucky-games/contracts';
import { EgyptImageAssetKey } from '../assets';
import type { ReelsAnimationCue } from '../events/GameEvents';
import { ReelsBoard } from '../reels/ReelsBoard';
import type { ReelsMatrix } from '../reels/reelsConfig';
import type { ReelsCommand } from './commands';
import type { SceneTheme } from '../scene/sceneTheme';

const FRAME_SCALE = 0.55;
const BASE_FRAME_SCALE_X = 0.535;
const BASE_FRAME_SCALE_Y = 0.515; //54
const FRAME_TRANSPARENT_LEFT = 96;
const FRAME_TRANSPARENT_RIGHT = 69;
const FREE_FRAME_SCALE = 0.678;
const FREE_FRAME_SCALE_X = 0.705;
const FREE_FRAME_TRANSPARENT_SIDE = 30;
const FREE_FRAME_Y = 42;
const REELS_WINDOW_LEFT = 320;
const REELS_WINDOW_RIGHT = 1705;

export class ReelsMachine extends Container {
  readonly reelsBoard: ReelsBoard;
  private readonly frameTextures: Record<SceneTheme, Texture>;
  private readonly frameBackground: Sprite;
  private readonly logo: Sprite;
  private readonly layoutBounds: Rectangle;
  private theme: SceneTheme = 'base';

  constructor(
    initialReels: ReelsMatrix,
    onReelStopped?: (index: number) => void,
    onAnimationCue?: (cue: ReelsAnimationCue) => void,
  ) {
    super();

    const frameTexture = Texture.from(EgyptImageAssetKey.scene.reelFrameFilled);
    const freeFrameTexture = Texture.from(EgyptImageAssetKey.scene.reelFrameFreeSpins);
    const baseFrame = new Texture({
      source: frameTexture.source,
      frame: new Rectangle(
        FRAME_TRANSPARENT_LEFT,
        0,
        frameTexture.width - FRAME_TRANSPARENT_LEFT - FRAME_TRANSPARENT_RIGHT,
        frameTexture.height,
      ),
    });
    const freeFrame = new Texture({
      source: freeFrameTexture.source,
      frame: new Rectangle(
        FREE_FRAME_TRANSPARENT_SIDE,
        0,
        freeFrameTexture.width - FREE_FRAME_TRANSPARENT_SIDE * 2,
        freeFrameTexture.height,
      ),
    });
    this.frameTextures = { base: baseFrame, freeSpins: freeFrame };

    this.frameBackground = this.addBackground();
    this.positionBaseFrame();
    this.logo = this.addLogo();

    // Координаты игрового поля рассчитаны по исходному PNG; обрезанный спрайт начинается после левого отступа.
    const boardWidth = frameTexture.width * FRAME_SCALE * 0.65;
    const windowCenterX =
      ((REELS_WINDOW_LEFT + REELS_WINDOW_RIGHT) / 2 - FRAME_TRANSPARENT_LEFT) * FRAME_SCALE;
    this.reelsBoard = new ReelsBoard(
      boardWidth,
      frameTexture.height * FRAME_SCALE * 0.57,
      initialReels,
      onReelStopped,
      onAnimationCue,
    );
    this.reelsBoard.position.set(
      windowCenterX - boardWidth / 2,
      frameTexture.height * FRAME_SCALE * 0.23,
    );

    this.logo.anchor.set(0.5, 0);
    this.logo.position.x = (frameTexture.width / 2 - FRAME_TRANSPARENT_LEFT) * FRAME_SCALE;
    this.logo.position.y = this.frameBackground.position.y;

    this.addChild(this.frameBackground, this.reelsBoard, this.logo);

    const bounds = this.getLocalBounds();
    const left = Math.min(0, bounds.x);
    const top = Math.min(0, bounds.y);
    this.layoutBounds = new Rectangle(
      left,
      top,
      Math.max(baseFrame.width * FRAME_SCALE, bounds.x + bounds.width) - left,
      Math.max(baseFrame.height * FRAME_SCALE, bounds.y + bounds.height) - top,
    );
    this.pivot.set(
      this.layoutBounds.x + this.layoutBounds.width / 2,
      this.layoutBounds.y + this.layoutBounds.height / 2.2,
    );
  }

  getLayoutBounds(): Rectangle {
    return this.layoutBounds;
  }

  setTheme(theme: SceneTheme): void {
    if (this.theme === theme) return;
    this.theme = theme;
    this.frameBackground.texture = this.frameTextures[theme];
    if (theme === 'freeSpins') {
      this.frameBackground.scale.set(FREE_FRAME_SCALE_X, FREE_FRAME_SCALE);
      this.frameBackground.position.set(
        (this.frameTextures.base.width * FRAME_SCALE -
          this.frameTextures.freeSpins.width * FREE_FRAME_SCALE_X) /
          2,
        FREE_FRAME_Y,
      );
    } else {
      this.positionBaseFrame();
    }
    this.logo.visible = theme === 'base';
  }

  setSymbols(reels: ReelsMatrix): void {
    this.reelsBoard.setSymbols(reels);
  }

  execute(command: ReelsCommand, signal: AbortSignal): void | Promise<void> {
    signal.throwIfAborted();
    return command.execute(this, signal);
  }

  spin(signal: AbortSignal, turbo = false): void {
    this.reelsBoard.spin(signal, turbo);
  }

  startCascade(reels: ReelsMatrix, signal: AbortSignal, turbo = false): void {
    this.reelsBoard.startCascade(reels, signal, turbo);
  }

  playCascade(
    sequence: CascadeSequence,
    finalReels: ReelsMatrix,
    signal: AbortSignal,
    turbo = false,
    quickStop = false,
    hybrid = false,
  ): Promise<void> {
    return this.reelsBoard.playCascade(sequence, finalReels, signal, turbo, quickStop, hybrid);
  }

  quickStopCascade(finalReels: ReelsMatrix): void {
    this.reelsBoard.quickStopCascade(finalReels);
  }

  land(
    reels: ReelsMatrix,
    signal: AbortSignal,
    quickStop = false,
    anticipation: ReelAnticipationHint | null = null,
  ): Promise<void> {
    return this.reelsBoard.land(reels, signal, quickStop, anticipation);
  }

  requestQuickStop(reels: ReelsMatrix, signal: AbortSignal): void {
    this.reelsBoard.requestQuickStop(reels, signal);
  }

  showWins(wins: readonly Win[], signal: AbortSignal): Promise<void> {
    return this.reelsBoard.showWins(wins, signal);
  }

  showWild(expandedReels: readonly number[], signal: AbortSignal): Promise<void> {
    return this.reelsBoard.showWild(expandedReels, signal);
  }

  showFreeSpinsTrigger(reels: ReelsMatrix, signal: AbortSignal): Promise<void> {
    return this.reelsBoard.showFreeSpinsTrigger(reels, signal);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    super.destroy(options);
    this.frameTextures.base.destroy();
    this.frameTextures.freeSpins.destroy();
  }

  private addBackground(): Sprite {
    const frameBackground = new Sprite(this.frameTextures.base);
    frameBackground.label = 'reel-frame-filled-background';
    frameBackground.scale.set(FRAME_SCALE);

    return frameBackground;
  }

  private positionBaseFrame(): void {
    const baseFrame = this.frameTextures.base;
    this.frameBackground.scale.set(BASE_FRAME_SCALE_X, BASE_FRAME_SCALE_Y);
    this.frameBackground.position.set(
      (baseFrame.width * (FRAME_SCALE - BASE_FRAME_SCALE_X)) / 2,
      (baseFrame.height * (FRAME_SCALE - BASE_FRAME_SCALE_Y)) / 2,
    );
  }

  private addLogo(): Sprite {
    const logoFrameTexture = Texture.from(EgyptImageAssetKey.scene.logoLong);
    const frameLogo = new Sprite(logoFrameTexture);
    frameLogo.label = 'logo-frame';
    frameLogo.scale.set(0.25);
    return frameLogo;
  }
}
