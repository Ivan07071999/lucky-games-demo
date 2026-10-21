import 'pixi.js/text-bitmap'
import { BitmapText, Container, Sprite, Texture } from 'pixi.js'
import { gsap } from 'gsap'

export type BetActionButtonOptions = {
  texture: string
  label: string
  textLabel: string
  text: string
}

export class BetActionButton extends Container {
  readonly background: Sprite
  readonly weightLayers: BitmapText[]
  readonly labelText: BitmapText

  constructor(width: number, height: number, options: BetActionButtonOptions) {
    super()

    this.label = options.label
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.background = new Sprite(Texture.from(options.texture))
    this.background.anchor.set(0.5)
    this.background.width = width * 0.1
    this.background.height = height * 0.12

    const style = {
      fontFamily: 'CasinoGold',
      fontSize: this.background.height * 0.25,
      lineHeight: this.background.height * 0.24,
      align: 'center' as const,
    }
    this.labelText = new BitmapText({ text: options.text, style })
    this.labelText.label = options.textLabel
    this.labelText.anchor.set(0.5)
    this.labelText.position.y = -this.background.height * 0.11

    const textScale = Math.min(
      1,
      (this.background.width * 0.75) / this.labelText.width,
      (this.background.height * 0.78) / this.labelText.height,
    )
    this.labelText.scale.set(textScale)

    const weightOffset = 0.6
    this.weightLayers = [
      [-weightOffset, 0],
      [weightOffset, 0],
      [0, -weightOffset],
      [0, weightOffset],
    ].map(([x, y], index) => {
      const weightLayer = new BitmapText({ text: options.text, style })
      weightLayer.label = `${options.textLabel}-weight-${index + 1}`
      weightLayer.anchor.set(0.5)
      weightLayer.scale.set(textScale)
      weightLayer.position.set(x, this.labelText.position.y + y)
      return weightLayer
    })

    this.addChild(this.background, ...this.weightLayers, this.labelText)
    this.on('pointerover', this.scaleUp, this)
    this.on('pointerout', this.scaleDown, this)
  }

  override destroy(options?: Parameters<Container['destroy']>[0]): void {
    gsap.killTweensOf(this.scale)
    super.destroy(options)
  }

  private scaleUp(): void {
    gsap.killTweensOf(this.scale)
    gsap.to(this.scale, {
      x: 1.035,
      y: 1.035,
      duration: 0.16,
      ease: 'power2.out',
    })
  }

  private scaleDown(): void {
    gsap.killTweensOf(this.scale)
    gsap.to(this.scale, {
      x: 1,
      y: 1,
      duration: 0.16,
      ease: 'power2.out',
    })
  }
}
