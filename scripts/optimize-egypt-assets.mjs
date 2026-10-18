import { access, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const source = join(projectRoot, 'design-assets', 'egypt-slot', 'background.png')
const target = join(projectRoot, 'public', 'egypt-assets', 'PNG', 'background', 'background.webp')

await access(source)
await mkdir(dirname(target), { recursive: true })

const result = await sharp(source).webp({ quality: 88, effort: 6 }).toFile(target)
console.log(`Optimized Egypt background: ${result.size} bytes → ${target}`)
