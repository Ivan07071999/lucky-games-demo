import { Circle, Container } from 'pixi.js';

export class Button extends Container {
  constructor(radius: number, onPress?: () => void) {
    super();

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Circle(0, 0, radius);

    if (onPress) {
      this.on('pointertap', onPress);
    }
  }
}
