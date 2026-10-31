import { Container, Graphics } from 'pixi.js';

type InfoPage = Container & { layout(width: number): number };

export class InfoPageHost extends Container {
  private readonly pages: InfoPage[];
  private readonly content = new Container();
  private readonly clippingArea = new Graphics();
  private contentWidth = 0;
  private contentHeight = 0;

  constructor(pages: InfoPage[]) {
    super();
    this.pages = pages;
    this.content.addChild(...pages);
    this.clippingArea.eventMode = 'none';
    this.addChild(this.content, this.clippingArea);
    this.content.mask = this.clippingArea;
  }

  setViewport(width: number, height: number): void {
    this.contentWidth = width;
    this.contentHeight = height;
    this.clippingArea.clear().rect(0, 0, width, height).fill(0xffffff);
    this.layoutPages();
  }

  layoutPages(): void {
    if (this.contentWidth <= 0 || this.contentHeight <= 0) return;
    for (const page of this.pages) {
      const pageHeight = page.layout(this.contentWidth);
      const scale = Math.min(1, this.contentHeight / Math.max(1, pageHeight));
      page.scale.set(scale);
      page.position.set(
        (this.contentWidth * (1 - scale)) / 2,
        Math.max(0, (this.contentHeight - pageHeight * scale) / 2),
      );
    }
  }

  showPage(index: number): void {
    this.pages.forEach((page, pageIndex) => {
      page.visible = pageIndex === index;
    });
  }
}
