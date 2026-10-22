import { Container, Text, type Application } from 'pixi.js';

export class StatusScene extends Container {
  private readonly title: Text;
  private readonly action: Text | null;
  private application: Application | null = null;

  constructor(message: string, actionLabel?: string, onAction?: () => void) {
    super();

    this.title = new Text({
      text: message,
      style: {
        fontFamily: 'Manrope Variable, sans-serif',
        fontSize: 30,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
      },
      anchor: 0.5,
    });
    this.addChild(this.title);

    this.action = actionLabel
      ? new Text({
          text: actionLabel,
          style: { fontFamily: 'Manrope Variable, sans-serif', fontSize: 21, fill: 0xc7f36b },
          anchor: 0.5,
        })
      : null;

    if (this.action && onAction) {
      this.action.eventMode = 'static';
      this.action.cursor = 'pointer';
      this.action.on('pointertap', onAction);
      this.addChild(this.action);
    }
  }

  private readonly resizeScene = () => {
    if (!this.application) return;

    const { width, height } = this.application.screen;
    this.title.style.wordWrapWidth = Math.max(120, width - 32);
    this.title.position.set(width / 2, height / 2 - (this.action ? 28 : 0));
    this.action?.position.set(width / 2, height / 2 + 30);
  };

  show(application: Application): this {
    this.application = application;
    application.stage.addChild(this);
    application.renderer.on('resize', this.resizeScene);
    this.resizeScene();
    return this;
  }

  dispose(): void {
    if (!this.application) return;

    this.application.renderer.off('resize', this.resizeScene);
    this.application.stage.removeChild(this);
    this.application = null;
    this.destroy({ children: true });
  }
}
