import { gsap } from 'gsap';
import type { WinType } from '@lucky-games/contracts';
import { Container } from 'pixi.js';
import { calculateModalScale } from '../shared/modal-layout';
import { WinPopupAmount } from './WinPopupAmount';
import { WinPopupArtwork } from './WinPopupArtwork';
import { WinPopupBackdrop } from './WinPopupBackdrop';
import { isPopupWinType, WIN_POPUP_LAYOUT } from './winPopupConfig';

export class WinPopup extends Container {
  private readonly backdrop = new WinPopupBackdrop();
  private readonly layoutRoot = new Container();
  private readonly artwork = new Container();
  private readonly images = new WinPopupArtwork();
  private readonly amount = new WinPopupAmount();
  private animation: ReturnType<typeof gsap.timeline> | null = null;

  constructor() {
    super();

    this.label = 'win-popup';
    this.visible = false;
    this.eventMode = 'none';

    this.artwork.addChild(this.images, this.amount);
    this.layoutRoot.addChild(this.artwork);
    this.addChild(this.backdrop, this.layoutRoot);
  }

  show(winType: WinType, totalWinCoins: number): void {
    if (!isPopupWinType(winType) || !Number.isSafeInteger(totalWinCoins) || totalWinCoins <= 0) {
      this.hide();
      return;
    }

    this.animation?.kill();
    this.images.setWinType(winType);
    this.amount.setAmount(totalWinCoins);

    this.visible = true;
    this.eventMode = 'none';
    this.backdrop.alpha = 0;
    this.artwork.alpha = 0;
    this.artwork.position.y = 12;
    this.artwork.scale.set(0.96);
    this.images.decor.alpha = 0;

    this.animation = gsap.timeline({ onComplete: () => (this.animation = null) });
    this.animation
      .to(this.backdrop, { alpha: 1, duration: 0.22, ease: 'power1.out' }, 0)
      .to(this.artwork, { alpha: 1, y: 0, duration: 0.34, ease: 'power2.out' }, 0.04)
      .to(this.artwork.scale, { x: 1, y: 1, duration: 0.34, ease: 'power2.out' }, 0.04)
      .to(this.images.decor, { alpha: 1, duration: 0.26, ease: 'power1.out' }, 0.14);
  }

  hide(): void {
    this.animation?.kill();
    this.animation = null;
    this.visible = false;
    this.eventMode = 'none';
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    this.backdrop.setViewport(width, height);

    const scale = calculateModalScale(
      width,
      height,
      WIN_POPUP_LAYOUT.width,
      WIN_POPUP_LAYOUT.height,
      WIN_POPUP_LAYOUT.viewportMargin,
    );
    this.layoutRoot.scale.set(Math.max(0, scale));
    this.layoutRoot.position.set(width / 2, height / 2);
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    this.animation?.kill();
    this.animation = null;
    super.destroy(options);
  }
}
