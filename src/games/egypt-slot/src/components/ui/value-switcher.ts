import 'pixi.js/text-bitmap'
import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js'
import { gsap } from 'gsap'

type Direction = 'left' | 'right'

type ValueSwitcherOptions = {
  id: string
  title: string
  width: number
  height: number
  initialValue: number
  minValue: number
  formatValue: (value: number) => string
}

class ValueSwitcherArrow extends Container {
  constructor(
    id: string,
    direction: Direction,
    size: number,
    hitAreaSize: number,
    onClick: () => void,
  ) {
    super()

    this.label = `${id}-${direction}-arrow`
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.hitArea = new Rectangle(-hitAreaSize, -hitAreaSize, hitAreaSize * 2, hitAreaSize * 2)

    const halfWidth = size * 0.35
    const halfHeight = size * 0.42
    const startX = direction === 'left' ? halfWidth : -halfWidth
    const tipX = direction === 'left' ? -halfWidth : halfWidth
    const icon = new Graphics()
      .moveTo(startX, -halfHeight)
      .lineTo(tipX, 0)
      .lineTo(startX, halfHeight)
      .stroke({ color: 0xffe7b5, width: Math.max(1, size * 0.09), cap: 'round', join: 'round' })
    icon.label = `${this.label}-icon`
    this.addChild(icon)

    this.on('pointertap', onClick)
    this.on('pointerover', this.scaleUp, this)
    this.on('pointerout', this.scaleDown, this)
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.scale)
    super.destroy(options)
  }

  private scaleUp(): void {
    gsap.killTweensOf(this.scale)
    gsap.to(this.scale, { x: 1.2, y: 1.2, duration: 0.14, ease: 'power2.out' })
  }

  private scaleDown(): void {
    gsap.killTweensOf(this.scale)
    gsap.to(this.scale, { x: 1, y: 1, duration: 0.14, ease: 'power2.out' })
  }
}

export class ValueSwitcher extends Container {
  readonly valueText: BitmapText
  private readonly valueMaxWidth: number
  private readonly minValue: number
  private readonly formatValue: (value: number) => string
  private value: number

  constructor({
    id,
    title,
    width,
    height,
    initialValue,
    minValue,
    formatValue,
  }: ValueSwitcherOptions) {
    super()

    this.label = `${id}-switcher`
    this.value = initialValue
    this.minValue = minValue
    this.formatValue = formatValue

    const label = new BitmapText({
      text: title,
      style: {
        fontFamily: 'CasinoGoldBold',
        fontSize: height * 0.12,
        fill: 0xffe3a1,
        align: 'center',
      },
    })
    label.label = `${id}-title`
    label.anchor.set(0.5)
    label.position.set(0, -height * 0.15 - 2)
    label.scale.set(Math.min(1, (width * 0.62) / label.width))

    this.valueText = new BitmapText({
      text: this.formatValue(this.value),
      style: {
        fontFamily: 'CasinoGold',
        fontSize: height * 0.23,
        align: 'center',
      },
    })
    this.valueText.label = `${id}-value`
    this.valueText.anchor.set(0.5)
    this.valueText.position.y = height * 0.05
    this.valueMaxWidth = width * 0.48
    this.fitValueText()

    const arrowSize = height * 0.13
    const arrowHitAreaSize = height * 0.16
    const arrowOffset = width * 0.16
    const decreaseButton = new ValueSwitcherArrow(id, 'left', arrowSize, arrowHitAreaSize, () =>
      this.changeValue(-1),
    )
    const increaseButton = new ValueSwitcherArrow(id, 'right', arrowSize, arrowHitAreaSize, () =>
      this.changeValue(1),
    )
    decreaseButton.position.set(-arrowOffset, this.valueText.position.y + 6)
    increaseButton.position.set(arrowOffset, this.valueText.position.y + 6)

    this.addChild(label, this.valueText, decreaseButton, increaseButton)
  }

  private changeValue(step: number): void {
    this.value = Math.max(this.minValue, this.value + step)
    this.valueText.text = this.formatValue(this.value)
    this.valueText.anchor.set(0.5)
    this.fitValueText()
  }

  private fitValueText(): void {
    this.valueText.scale.set(Math.min(1, this.valueMaxWidth / this.valueText.width))
  }
}
