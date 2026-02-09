/**
 * Export all pixel art sprites to PNG files at native resolution.
 *
 * Furniture: individual PNGs.
 * Characters: one sprite sheet per palette containing ALL animations.
 *   Layout (each cell = 16x24 pixels):
 *     Row  0: idle_down      (2 frames)
 *     Row  1: idle_up        (2 frames)
 *     Row  2: idle_right     (2 frames)
 *     Row  3: idle_left      (2 frames)
 *     Row  4: walk_down      (4 frames)
 *     Row  5: walk_up        (4 frames)
 *     Row  6: walk_right     (4 frames)
 *     Row  7: walk_left      (4 frames)
 *     Row  8: typing_down    (2 frames)
 *     Row  9: typing_up      (2 frames)
 *     Row 10: typing_right   (2 frames)
 *     Row 11: typing_left    (2 frames)
 *     Row 12: reading_down   (2 frames)
 *     Row 13: reading_up     (2 frames)
 *     Row 14: reading_right  (2 frames)
 *     Row 15: reading_left   (2 frames)
 *   Sheet size: 64 x 384 pixels (4 cols × 16 rows of 16×24 frames)
 *
 * Run via: node esbuild-run.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { deflateSync } from 'zlib'
import {
  DESK_SQUARE_SPRITE,
  CHAIR_SPRITE,
  PC_SPRITE,
  PLANT_SPRITE,
  BOOKSHELF_SPRITE,
  COOLER_SPRITE,
  WHITEBOARD_SPRITE,
  LAMP_SPRITE,
  getCharacterSprites,
  CHARACTER_PALETTES,
} from '../webview-ui/src/office/sprites'
import { Direction as Dir } from '../webview-ui/src/office/types'
import type { SpriteData } from '../webview-ui/src/office/types'

// ── Minimal PNG encoder using Node zlib ──────────────────────────

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData), 0)
  return Buffer.concat([len, typeAndData, crc])
}

function encodePNG(sprite: SpriteData): Buffer {
  const height = sprite.length
  const width = sprite[0].length

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // Raw pixel data with filter byte per row
  const rawRows: Buffer[] = []
  for (let r = 0; r < height; r++) {
    const row = Buffer.alloc(1 + width * 4)
    row[0] = 0 // no filter
    for (let c = 0; c < width; c++) {
      const hex = sprite[r][c]
      const offset = 1 + c * 4
      if (hex === '' || hex === undefined) {
        // transparent
        row[offset] = 0
        row[offset + 1] = 0
        row[offset + 2] = 0
        row[offset + 3] = 0
      } else {
        // Parse hex color like '#RRGGBB'
        const val = parseInt(hex.slice(1), 16)
        row[offset] = (val >> 16) & 0xff
        row[offset + 1] = (val >> 8) & 0xff
        row[offset + 2] = val & 0xff
        row[offset + 3] = 255
      }
    }
    rawRows.push(row)
  }

  const rawData = Buffer.concat(rawRows)
  const compressed = deflateSync(rawData)

  // Assemble PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function exportSprite(name: string, sprite: SpriteData, outDir: string): void {
  const h = sprite.length
  const w = sprite[0].length
  const png = encodePNG(sprite)
  const path = `${outDir}/${name}.png`
  writeFileSync(path, png)
  console.log(`  ${name}.png (${w}x${h})`)
}

/**
 * Build a sprite sheet by placing frames into a grid.
 * Each frame is frameW x frameH pixels.
 * `rows` is an array of frame arrays (one per animation row).
 * The sheet width = maxFrames * frameW, height = rows.length * frameH.
 * Empty cells are filled with transparent pixels.
 */
function buildSpriteSheet(
  rows: SpriteData[][],
  frameW: number,
  frameH: number,
): SpriteData {
  const maxCols = Math.max(...rows.map((r) => r.length))
  const sheetW = maxCols * frameW
  const sheetH = rows.length * frameH

  // Initialize transparent sheet
  const sheet: string[][] = []
  for (let r = 0; r < sheetH; r++) {
    sheet.push(new Array(sheetW).fill(''))
  }

  // Blit each frame into its grid position
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const frames = rows[rowIdx]
    for (let colIdx = 0; colIdx < frames.length; colIdx++) {
      const frame = frames[colIdx]
      const offsetX = colIdx * frameW
      const offsetY = rowIdx * frameH
      for (let r = 0; r < frame.length && r < frameH; r++) {
        for (let c = 0; c < frame[r].length && c < frameW; c++) {
          sheet[offsetY + r][offsetX + c] = frame[r][c]
        }
      }
    }
  }

  return sheet
}

// ── Main ─────────────────────────────────────────────────────────

const outDir = 'sprites-export'
if (!existsSync(outDir)) mkdirSync(outDir)
if (!existsSync(`${outDir}/furniture`)) mkdirSync(`${outDir}/furniture`)
if (!existsSync(`${outDir}/characters`)) mkdirSync(`${outDir}/characters`)

console.log('Exporting furniture sprites...')
exportSprite('desk', DESK_SQUARE_SPRITE, `${outDir}/furniture`)
exportSprite('chair', CHAIR_SPRITE, `${outDir}/furniture`)
exportSprite('pc', PC_SPRITE, `${outDir}/furniture`)
exportSprite('plant', PLANT_SPRITE, `${outDir}/furniture`)
exportSprite('bookshelf', BOOKSHELF_SPRITE, `${outDir}/furniture`)
exportSprite('water_cooler', COOLER_SPRITE, `${outDir}/furniture`)
exportSprite('whiteboard', WHITEBOARD_SPRITE, `${outDir}/furniture`)
exportSprite('lamp', LAMP_SPRITE, `${outDir}/furniture`)

const DIRS = [Dir.DOWN, Dir.UP, Dir.RIGHT, Dir.LEFT] as const
const DIR_NAMES = ['down', 'up', 'right', 'left']

console.log('\nExporting character sprite sheets...')
for (let p = 0; p < CHARACTER_PALETTES.length; p++) {
  const sprites = getCharacterSprites(p)
  const palette = CHARACTER_PALETTES[p]
  const label = `palette${p}_${palette.shirt.replace('#', '')}`

  console.log(`\n  [Palette ${p}] shirt=${palette.shirt}`)

  // Build rows: 4 states × 4 directions = 16 rows
  // idle (2 frames), walk (4 frames), typing (2 frames), reading (2 frames)
  const sheetRows: SpriteData[][] = []
  const rowLabels: string[] = []

  for (const [di, dir] of DIRS.entries()) {
    sheetRows.push([...sprites.idle[dir]])
    rowLabels.push(`idle_${DIR_NAMES[di]}`)
  }
  for (const [di, dir] of DIRS.entries()) {
    sheetRows.push([...sprites.walk[dir]])
    rowLabels.push(`walk_${DIR_NAMES[di]}`)
  }
  for (const [di, dir] of DIRS.entries()) {
    sheetRows.push([...sprites.typing[dir]])
    rowLabels.push(`typing_${DIR_NAMES[di]}`)
  }
  for (const [di, dir] of DIRS.entries()) {
    sheetRows.push([...sprites.reading[dir]])
    rowLabels.push(`reading_${DIR_NAMES[di]}`)
  }

  const sheet = buildSpriteSheet(sheetRows, 16, 24)
  const sheetW = sheet[0].length
  const sheetH = sheet.length

  const png = encodePNG(sheet)
  const path = `${outDir}/characters/${label}.png`
  writeFileSync(path, png)
  console.log(`  ${label}.png (${sheetW}x${sheetH}) — 16 rows × 4 cols`)
  console.log(`    Rows: ${rowLabels.join(', ')}`)
}

console.log(`\nDone! Exported to ./${outDir}/`)
