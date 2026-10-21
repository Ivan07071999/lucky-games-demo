import 'pixi.js/text-bitmap'
import { BitmapText, Container } from 'pixi.js'

export class Bet extends Container {
  readonly valueText: BitmapText

  constructor(width: number, height: number) {
    super()

    this.label = 'bet'

    const label = new BitmapText({
      text: 'BET',
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: height * 0.12,
        fill: 0xffe3a1,
        align: 'center',
      },
    })
    label.label = 'bet-title'
    label.anchor.set(0.5)
    label.position.set(0, -height * 0.15 - 2)
    label.scale.set(Math.min(1, (width * 0.32) / label.width))

    this.valueText = new BitmapText({
      text: '15',
      style: {
        fontFamily: 'CasinoGold',
        fontSize: height * 0.23,
        align: 'center',
      },
    })
    this.valueText.label = 'bet-value'
    this.valueText.anchor.set(0.5)
    this.valueText.position.y = height * 0.05
    this.valueText.scale.set(Math.min(1, (width * 0.32) / this.valueText.width))

    this.addChild(label, this.valueText)
  }
}
