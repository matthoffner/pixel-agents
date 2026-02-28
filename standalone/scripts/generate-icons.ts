/**
 * Generate PWA icons (192×192, 512×512) and favicon (32×32) from the Porch Labs pixel art logo.
 * Uses pngjs (already a dependency) — no canvas needed.
 *
 * Run: npx tsx scripts/generate-icons.ts
 */
import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// Porch Labs house + flask icon (14 cols × 18 rows)
const GRID = [
  '      YY      ',
  '     YYYY     ',
  '    YYYYYY    ',
  '   YYYYYYYY   ',
  '  YYYYYYYYYY  ',
  ' YYYYYYYYYYYY ',
  'YYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYY',
  'YYYYYYWWYYYYYY',
  'YYYYYYWWYYYYYY',
  'YYYYYYWWYYYYYY',
  'YYYYYWWWWYYYYY',
  'YYYYWWWWWWYYYY',
  'YYYWWWWWWWWYYY',
  'YYYWWWWWWWWYYY',
  'YYWWWWWWWWWWYY',
  'YYYYYYYYYYYYYY',
  'YYYYYYYYYYYYYY',
]

const COLORS: Record<string, [number, number, number]> = {
  Y: [232, 168, 56],
  W: [255, 255, 255],
}

const BG: [number, number, number] = [10, 10, 20] // #0a0a14

const BORDER: [number, number, number] = [30, 30, 50] // thin dark border

function renderIcon(size: number): PNG {
  const png = new PNG({ width: size, height: size })
  const gridRows = GRID.length
  const gridCols = 14

  // Thin border: ~3% of icon size on each side
  const borderPx = Math.max(1, Math.round(size * 0.03))
  const inner = size - borderPx * 2
  const scale = Math.floor(inner / Math.max(gridCols, gridRows))
  const offsetX = Math.floor((size - gridCols * scale) / 2)
  const offsetY = Math.floor((size - gridRows * scale) / 2)

  // Fill with border color
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      png.data[idx] = BORDER[0]
      png.data[idx + 1] = BORDER[1]
      png.data[idx + 2] = BORDER[2]
      png.data[idx + 3] = 255
    }
  }

  // Fill inner area with background
  for (let y = borderPx; y < size - borderPx; y++) {
    for (let x = borderPx; x < size - borderPx; x++) {
      const idx = (y * size + x) * 4
      png.data[idx] = BG[0]
      png.data[idx + 1] = BG[1]
      png.data[idx + 2] = BG[2]
      png.data[idx + 3] = 255
    }
  }

  // Draw pixels
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const color = COLORS[GRID[r][c]]
      if (!color) continue

      const px = offsetX + c * scale
      const py = offsetY + r * scale

      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const x = px + dx
          const y = py + dy
          if (x >= 0 && x < size && y >= 0 && y < size) {
            const idx = (y * size + x) * 4
            png.data[idx] = color[0]
            png.data[idx + 1] = color[1]
            png.data[idx + 2] = color[2]
            png.data[idx + 3] = 255
          }
        }
      }
    }
  }

  return png
}

const outDir = join(import.meta.dirname!, '..', 'public')
mkdirSync(outDir, { recursive: true })

for (const size of [32, 192, 512]) {
  const png = renderIcon(size)
  const buf = PNG.sync.write(png)
  const name = size === 32 ? 'favicon.png' : `icon-${size}.png`
  writeFileSync(join(outDir, name), buf)
  console.log(`Generated ${name} (${size}×${size})`)
}
