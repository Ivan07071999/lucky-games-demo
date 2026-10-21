import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const fontsDirectory = new URL('../public/egypt-assets/PNG/fonts/', import.meta.url)
const sourceImageUrl = new URL('casino_gold_bitmap.png', fontsDirectory)
const sourceFontUrl = new URL('casino_gold_bitmap.fnt', fontsDirectory)
const outputImageUrl = new URL('casino_gold_bold_bitmap.png', fontsDirectory)
const outputFontUrl = new URL('casino_gold_bold_bitmap.fnt', fontsDirectory)

const { data: sourceAlpha, info } = await sharp(fileURLToPath(sourceImageUrl))
  .extractChannel('alpha')
  .raw()
  .toBuffer({ resolveWithObject: true })

const boldAlpha = Buffer.alloc(sourceAlpha.length)
const radius = 1

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const alpha = sourceAlpha[y * info.width + x]
    if (alpha === 0) continue

    for (let offsetY = -radius; offsetY <= radius; offsetY++) {
      const targetY = y + offsetY
      if (targetY < 0 || targetY >= info.height) continue

      for (let offsetX = -radius; offsetX <= radius; offsetX++) {
        const targetX = x + offsetX
        if (targetX < 0 || targetX >= info.width) continue

        const targetIndex = targetY * info.width + targetX
        boldAlpha[targetIndex] = Math.max(boldAlpha[targetIndex], alpha)
      }
    }
  }
}

const outputPixels = Buffer.alloc(info.width * info.height * 4)
for (let index = 0; index < boldAlpha.length; index++) {
  const outputIndex = index * 4
  outputPixels[outputIndex] = 255
  outputPixels[outputIndex + 1] = 255
  outputPixels[outputIndex + 2] = 255
  outputPixels[outputIndex + 3] = boldAlpha[index]
}

await sharp(outputPixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile(fileURLToPath(outputImageUrl))

const sourceFont = await readFile(sourceFontUrl, 'utf8')
const boldFont = sourceFont
  .replace('face="CasinoGold"', 'face="CasinoGoldBold"')
  .replace('bold="0"', 'bold="1"')
  .replace('file="casino_gold_bitmap.png"', 'file="casino_gold_bold_bitmap.png"')

await writeFile(outputFontUrl, boldFont)
