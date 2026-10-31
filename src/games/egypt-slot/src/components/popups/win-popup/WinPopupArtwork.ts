import { Container, Sprite, Texture } from 'pixi.js';
import { WIN_POPUP_ASSETS, WIN_POPUP_LAYOUT, type PopupWinType } from './winPopupConfig';

function fitWidth(sprite: Sprite, width: number): void {
  sprite.scale.set(width / sprite.texture.width);
}

export class WinPopupArtwork extends Container {
  private readonly background: Sprite;
  readonly decor: Sprite;
  private readonly title: Sprite;

  constructor() {
    super();

    this.background = new Sprite(Texture.from(WIN_POPUP_ASSETS.BIG_WIN.background));
    this.decor = new Sprite(Texture.from(WIN_POPUP_ASSETS.BIG_WIN.decor));
    this.title = new Sprite(Texture.from(WIN_POPUP_ASSETS.BIG_WIN.title));

    this.background.anchor.set(0.5);
    this.decor.anchor.set(0.5);
    this.title.anchor.set(0.5);
    this.decor.position.y = WIN_POPUP_LAYOUT.decor.y;
    this.title.position.y = WIN_POPUP_LAYOUT.title.y;

    this.addChild(this.background, this.decor, this.title);
    this.setWinType('BIG_WIN');
  }

  setWinType(winType: PopupWinType): void {
    const assets = WIN_POPUP_ASSETS[winType];
    this.background.texture = Texture.from(assets.background);
    this.decor.texture = Texture.from(assets.decor);
    this.title.texture = Texture.from(assets.title);
    fitWidth(this.background, WIN_POPUP_LAYOUT.background.width);
    fitWidth(this.decor, WIN_POPUP_LAYOUT.decor.width);
    fitWidth(this.title, WIN_POPUP_LAYOUT.title.width);
  }
}
