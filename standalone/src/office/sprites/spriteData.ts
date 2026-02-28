import type { Direction, SpriteData, FloorColor } from '../types'
import { Direction as Dir } from '../types'
import { adjustSprite } from '../colorize'

// ── Color Palettes ──────────────────────────────────────────────
const _ = '' // transparent

// ── Furniture Sprites ───────────────────────────────────────────

/** Square desk: 32x32 pixels (2x2 tiles) — top-down wood surface */
export const DESK_SQUARE_SPRITE: SpriteData = (() => {
  const W = '#8B6914' // wood edge
  const L = '#A07828' // lighter wood
  const S = '#B8922E' // surface
  const D = '#6B4E0A' // dark edge
  const rows: string[][] = []
  // Row 0: empty
  rows.push(new Array(32).fill(_))
  // Row 1: top edge
  rows.push([_, ...new Array(30).fill(W), _])
  // Rows 2-5: top surface
  for (let r = 0; r < 4; r++) {
    rows.push([_, W, ...new Array(28).fill(r < 1 ? L : S), W, _])
  }
  // Row 6: horizontal divider
  rows.push([_, D, ...new Array(28).fill(W), D, _])
  // Rows 7-12: middle surface area
  for (let r = 0; r < 6; r++) {
    rows.push([_, W, ...new Array(28).fill(S), W, _])
  }
  // Row 13: center line
  rows.push([_, W, ...new Array(28).fill(L), W, _])
  // Rows 14-19: lower surface
  for (let r = 0; r < 6; r++) {
    rows.push([_, W, ...new Array(28).fill(S), W, _])
  }
  // Row 20: horizontal divider
  rows.push([_, D, ...new Array(28).fill(W), D, _])
  // Rows 21-24: bottom surface
  for (let r = 0; r < 4; r++) {
    rows.push([_, W, ...new Array(28).fill(r > 2 ? L : S), W, _])
  }
  // Row 25: bottom edge
  rows.push([_, ...new Array(30).fill(W), _])
  // Rows 26-31: legs/shadow
  for (let r = 0; r < 4; r++) {
    const row = new Array(32).fill(_) as string[]
    row[1] = D; row[2] = D; row[29] = D; row[30] = D
    rows.push(row)
  }
  rows.push(new Array(32).fill(_))
  rows.push(new Array(32).fill(_))
  return rows
})()

/** Plant in pot: 16x24 */
export const PLANT_SPRITE: SpriteData = (() => {
  const G = '#3D8B37'
  const D = '#2D6B27'
  const T = '#6B4E0A'
  const P = '#B85C3A'
  const R = '#8B4422'
  return [
    [_, _, _, _, _, _, G, G, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, G, G, G, G, _, _, _, _, _, _, _],
    [_, _, _, _, G, G, D, G, G, G, _, _, _, _, _, _],
    [_, _, _, G, G, D, G, G, D, G, G, _, _, _, _, _],
    [_, _, G, G, G, G, G, G, G, G, G, G, _, _, _, _],
    [_, G, G, D, G, G, G, G, G, G, D, G, G, _, _, _],
    [_, G, G, G, G, D, G, G, D, G, G, G, G, _, _, _],
    [_, _, G, G, G, G, G, G, G, G, G, G, _, _, _, _],
    [_, _, _, G, G, G, D, G, G, G, G, _, _, _, _, _],
    [_, _, _, _, G, G, G, G, G, G, _, _, _, _, _, _],
    [_, _, _, _, _, G, G, G, G, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, T, T, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, T, T, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, T, T, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, R, R, R, R, R, _, _, _, _, _, _],
    [_, _, _, _, R, P, P, P, P, P, R, _, _, _, _, _],
    [_, _, _, _, R, P, P, P, P, P, R, _, _, _, _, _],
    [_, _, _, _, R, P, P, P, P, P, R, _, _, _, _, _],
    [_, _, _, _, R, P, P, P, P, P, R, _, _, _, _, _],
    [_, _, _, _, R, P, P, P, P, P, R, _, _, _, _, _],
    [_, _, _, _, R, P, P, P, P, P, R, _, _, _, _, _],
    [_, _, _, _, _, R, P, P, P, R, _, _, _, _, _, _],
    [_, _, _, _, _, _, R, R, R, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Bookshelf: 16x32 (1 tile wide, 2 tiles tall) */
export const BOOKSHELF_SPRITE: SpriteData = (() => {
  const W = '#8B6914'
  const D = '#6B4E0A'
  const R = '#CC4444'
  const B = '#4477AA'
  const G = '#44AA66'
  const Y = '#CCAA33'
  const P = '#9955AA'
  return [
    [_, W, W, W, W, W, W, W, W, W, W, W, W, W, W, _],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, R, R, B, B, G, G, Y, Y, R, R, B, B, D, W],
    [W, D, R, R, B, B, G, G, Y, Y, R, R, B, B, D, W],
    [W, D, R, R, B, B, G, G, Y, Y, R, R, B, B, D, W],
    [W, D, R, R, B, B, G, G, Y, Y, R, R, B, B, D, W],
    [W, D, R, R, B, B, G, G, Y, Y, R, R, B, B, D, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, P, P, Y, Y, B, B, G, G, P, P, R, R, D, W],
    [W, D, P, P, Y, Y, B, B, G, G, P, P, R, R, D, W],
    [W, D, P, P, Y, Y, B, B, G, G, P, P, R, R, D, W],
    [W, D, P, P, Y, Y, B, B, G, G, P, P, R, R, D, W],
    [W, D, P, P, Y, Y, B, B, G, G, P, P, R, R, D, W],
    [W, D, P, P, Y, Y, B, B, G, G, P, P, R, R, D, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, G, G, R, R, P, P, B, B, Y, Y, G, G, D, W],
    [W, D, G, G, R, R, P, P, B, B, Y, Y, G, G, D, W],
    [W, D, G, G, R, R, P, P, B, B, Y, Y, G, G, D, W],
    [W, D, G, G, R, R, P, P, B, B, Y, Y, G, G, D, W],
    [W, D, G, G, R, R, P, P, B, B, Y, Y, G, G, D, W],
    [W, D, G, G, R, R, P, P, B, B, Y, Y, G, G, D, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, D, D, D, D, D, D, D, D, D, D, D, D, D, D, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [_, W, W, W, W, W, W, W, W, W, W, W, W, W, W, _],
  ]
})()

/** Water cooler: 16x24 */
export const COOLER_SPRITE: SpriteData = (() => {
  const W = '#CCDDEE'
  const L = '#88BBDD'
  const D = '#999999'
  const B = '#666666'
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, D, L, L, L, L, L, L, D, _, _, _, _],
    [_, _, _, _, D, L, L, L, L, L, L, D, _, _, _, _],
    [_, _, _, _, D, L, L, L, L, L, L, D, _, _, _, _],
    [_, _, _, _, D, L, L, L, L, L, L, D, _, _, _, _],
    [_, _, _, _, D, L, L, L, L, L, L, D, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, D, W, W, W, W, D, _, _, _, _, _],
    [_, _, _, _, _, D, W, W, W, W, D, _, _, _, _, _],
    [_, _, _, _, _, D, W, W, W, W, D, _, _, _, _, _],
    [_, _, _, _, _, D, W, W, W, W, D, _, _, _, _, _],
    [_, _, _, _, _, D, W, W, W, W, D, _, _, _, _, _],
    [_, _, _, _, D, D, W, W, W, W, D, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, _, _, D, B, B, B, B, D, _, _, _, _, _],
    [_, _, _, _, _, D, B, B, B, B, D, _, _, _, _, _],
    [_, _, _, _, _, D, B, B, B, B, D, _, _, _, _, _],
    [_, _, _, _, D, D, B, B, B, B, D, D, _, _, _, _],
    [_, _, _, _, D, B, B, B, B, B, B, D, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Whiteboard: 32x16 (2 tiles wide, 1 tile tall) — hangs on wall */
export const WHITEBOARD_SPRITE: SpriteData = (() => {
  const F = '#AAAAAA'
  const W = '#EEEEFF'
  const M = '#CC4444'
  const B = '#4477AA'
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, _],
    [_, F, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, F, _],
    [_, F, W, W, M, M, M, W, W, W, W, W, B, B, B, B, W, W, W, W, W, W, W, M, W, W, W, W, W, W, F, _],
    [_, F, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, B, B, W, W, M, W, W, W, W, W, W, F, _],
    [_, F, W, W, W, W, M, M, M, M, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, B, B, W, W, F, _],
    [_, F, W, W, W, W, W, W, W, W, W, W, W, B, B, B, W, W, W, W, W, W, W, W, W, W, W, W, W, W, F, _],
    [_, F, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, M, M, M, W, W, W, W, W, W, W, F, _],
    [_, F, W, M, M, W, W, W, W, W, W, W, W, W, W, W, B, B, W, W, W, W, W, W, W, W, W, W, W, W, F, _],
    [_, F, W, W, W, W, W, W, B, B, B, W, W, W, W, W, W, W, W, W, W, W, W, W, M, M, M, M, W, W, F, _],
    [_, F, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, F, _],
    [_, F, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, F, _],
    [_, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Chair: 16x16 — top-down desk chair */
export const CHAIR_SPRITE: SpriteData = (() => {
  const W = '#8B6914'
  const D = '#6B4E0A'
  const B = '#5C3D0A'
  const S = '#A07828'
  return [
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, D, B, B, B, B, B, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, S, S, S, S, B, D, _, _, _, _],
    [_, _, _, _, D, B, B, B, B, B, B, D, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, _, D, W, W, D, _, _, _, _, _, _],
    [_, _, _, _, _, _, D, W, W, D, _, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, D, _, _, _, _, D, _, _, _, _, _],
    [_, _, _, _, _, D, _, _, _, _, D, _, _, _, _, _],
  ]
})()

/** PC monitor: 16x16 — top-down monitor on stand */
export const PC_SPRITE: SpriteData = (() => {
  const F = '#555555'
  const S = '#3A3A5C'
  const B = '#6688CC'
  const D = '#444444'
  return [
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, F, S, S, S, S, S, S, S, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, B, B, B, B, B, B, S, F, _, _, _],
    [_, _, _, F, S, S, S, S, S, S, S, S, F, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Desk lamp: 16x16 — top-down lamp with light cone */
export const LAMP_SPRITE: SpriteData = (() => {
  const Y = '#FFDD55'
  const L = '#FFEE88'
  const D = '#888888'
  const B = '#555555'
  const G = '#FFFFCC'
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, G, G, G, G, _, _, _, _, _, _],
    [_, _, _, _, _, G, Y, Y, Y, Y, G, _, _, _, _, _],
    [_, _, _, _, G, Y, Y, L, L, Y, Y, G, _, _, _, _],
    [_, _, _, _, Y, Y, L, L, L, L, Y, Y, _, _, _, _],
    [_, _, _, _, Y, Y, L, L, L, L, Y, Y, _, _, _, _],
    [_, _, _, _, _, Y, Y, Y, Y, Y, Y, _, _, _, _, _],
    [_, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _],
    [_, _, _, _, _, B, B, B, B, B, B, _, _, _, _, _],
    [_, _, _, _, _, B, B, B, B, B, B, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

// ── Additional Furniture Sprites ──────────────────────────────────

/** Big screen TV: 32x32 pixels (2x2 tiles) — flat panel on thin stand */
export const TV_BIG_SPRITE: SpriteData = (() => {
  const F = '#1a1a1a' // frame (near-black)
  const B = '#111111' // bezel
  const S = '#1e2d3d' // screen dark
  const G = '#2a4060' // screen glow
  const H = '#3a5a80' // screen highlight
  const R = '#0a0a0a' // screen reflection band
  const D = '#333333' // stand neck
  const P = '#444444' // stand base
  const L = '#555555' // stand base light
  const I = '#222222' // logo indicator
  return [
    // Row 0: top bezel
    [_, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, _],
    // Row 1: bezel top inner
    [_, F, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, F, _],
    // Rows 2-5: screen top section (dark blue gradient)
    [_, F, B, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, B, F, _],
    [_, F, B, S, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, S, B, F, _],
    [_, F, B, S, G, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, G, G, S, B, F, _],
    [_, F, B, S, G, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, G, G, S, B, F, _],
    // Rows 6-9: screen mid (main glow area)
    [_, F, B, S, G, G, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, G, G, G, S, B, F, _],
    [_, F, B, S, G, G, G, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, G, G, G, G, S, B, F, _],
    [_, F, B, S, G, G, G, G, G, H, H, H, H, H, H, H, H, H, H, H, H, H, G, G, G, G, G, G, S, B, F, _],
    [_, F, B, S, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, S, B, F, _],
    // Rows 10-13: screen lower (darker)
    [_, F, B, S, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, S, B, F, _],
    [_, F, B, S, S, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, S, S, B, F, _],
    [_, F, B, S, S, S, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, S, S, S, B, F, _],
    [_, F, B, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, B, F, _],
    // Row 14: reflection band
    [_, F, B, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, R, B, F, _],
    // Rows 15-17: screen bottom section
    [_, F, B, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, B, F, _],
    [_, F, B, S, S, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, S, S, B, F, _],
    [_, F, B, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, B, F, _],
    // Row 18: bezel bottom inner
    [_, F, B, B, B, B, B, B, B, B, B, B, B, B, B, I, I, B, B, B, B, B, B, B, B, B, B, B, B, B, F, _],
    // Row 19: bottom bezel
    [_, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, _],
    // Row 20: gap
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    // Rows 21-23: thin stand neck
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _, _, _, _, _, _, _, _, _],
    // Rows 24-26: stand base
    [_, _, _, _, _, _, _, _, _, _, _, P, P, P, P, P, P, P, P, P, P, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, P, P, L, L, L, L, L, L, L, L, P, P, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, P, P, P, P, P, P, P, P, P, P, P, P, _, _, _, _, _, _, _, _, _, _],
    // Rows 27-31: empty
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Coffee mug: 16x16 — small surface item for desks */
export const MUG_SPRITE: SpriteData = (() => {
  const W = '#EEEEEE' // mug white
  const D = '#CCCCCC' // mug shadow
  const C = '#6B3A1E' // coffee
  const H = '#DDDDDD' // handle
  const S = '#BBBBBB' // handle shadow
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, W, W, W, W, _, _, _, _, _, _],
    [_, _, _, _, _, W, C, C, C, C, W, _, _, _, _, _],
    [_, _, _, _, _, W, C, C, C, C, W, H, H, _, _, _],
    [_, _, _, _, _, W, C, C, C, C, W, _, H, _, _, _],
    [_, _, _, _, _, W, C, C, C, C, W, _, H, _, _, _],
    [_, _, _, _, _, W, C, C, C, C, W, H, S, _, _, _],
    [_, _, _, _, _, D, W, W, W, W, D, _, _, _, _, _],
    [_, _, _, _, _, _, D, D, D, D, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Server rack: 16x32 (1x2 tiles) — blinking lights data center feel */
export const SERVER_RACK_SPRITE: SpriteData = (() => {
  const F = '#2a2a2a' // frame
  const P = '#3a3a3a' // panel
  const D = '#222222' // dark
  const G = '#00CC44' // green LED
  const Y = '#CCAA00' // yellow LED
  const R = '#CC3333' // red LED
  const V = '#1a1a1a' // vent
  const B = '#333333' // base
  return [
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, P, G, P, P, P, P, G, P, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, P, G, P, Y, P, P, G, P, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, P, G, P, P, R, P, G, P, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, V, V, V, V, V, V, V, V, F, _, _, _],
    [_, _, _, F, V, V, V, V, V, V, V, V, F, _, _, _],
    [_, _, _, F, V, V, V, V, V, V, V, V, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, P, G, P, P, P, Y, G, P, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, P, G, P, G, P, P, G, P, F, _, _, _],
    [_, _, _, F, P, P, P, P, P, P, P, P, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, V, V, V, V, V, V, V, V, F, _, _, _],
    [_, _, _, F, V, V, V, V, V, V, V, V, F, _, _, _],
    [_, _, _, F, V, V, V, V, V, V, V, V, F, _, _, _],
    [_, _, _, F, D, D, D, D, D, D, D, D, F, _, _, _],
    [_, _, _, F, B, B, B, B, B, B, B, B, F, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, _, B, _, _, _, _, _, _, B, _, _, _, _],
  ]
})()

/** Wall clock: 16x16 — round clock for wall placement */
export const CLOCK_SPRITE: SpriteData = (() => {
  const F = '#8B6914' // wood frame
  const W = '#FFFFF0' // face white
  const D = '#333333' // hands/numbers
  const R = '#CC3333' // second hand
  const C = '#444444' // center
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, F, F, F, F, F, F, _, _, _, _, _],
    [_, _, _, _, F, F, W, W, W, W, F, F, _, _, _, _],
    [_, _, _, F, F, W, W, W, D, W, W, F, F, _, _, _],
    [_, _, _, F, W, W, W, W, D, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, D, W, W, W, F, _, _, _],
    [_, _, _, F, W, D, W, W, C, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, R, C, R, R, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, C, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, F, W, W, W, D, W, W, F, F, _, _, _],
    [_, _, _, _, F, F, W, W, W, W, F, F, _, _, _, _],
    [_, _, _, _, _, F, F, F, F, F, F, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Couch: 32x16 (2 tiles wide, 1 tile tall) — comfy office couch, top-down */
export const COUCH_SPRITE: SpriteData = (() => {
  const F = '#4A6FA5' // fabric main
  const D = '#3A5A88' // fabric dark/shadow
  const L = '#5A82B8' // fabric highlight
  const A = '#3A4E6E' // armrest
  const B = '#2A3E5E' // armrest shadow
  const P = '#445588' // pillow accent
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, _, _],
    [_, _, A, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, A, _, _],
    [_, _, A, B, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, B, A, _, _],
    [_, _, A, B, D, F, F, F, F, F, F, F, F, F, P, P, F, F, F, F, F, F, F, F, F, F, F, D, B, A, _, _],
    [_, _, A, B, D, F, L, L, L, L, L, L, F, F, P, P, F, F, L, L, L, L, L, L, L, F, F, D, B, A, _, _],
    [_, _, A, B, D, F, L, L, L, L, L, L, F, F, P, P, F, F, L, L, L, L, L, L, L, F, F, D, B, A, _, _],
    [_, _, A, B, D, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, D, B, A, _, _],
    [_, _, A, B, D, F, L, L, L, L, L, L, F, F, F, F, F, F, L, L, L, L, L, L, L, F, F, D, B, A, _, _],
    [_, _, A, B, D, F, L, L, L, L, L, L, F, F, F, F, F, F, L, L, L, L, L, L, L, F, F, D, B, A, _, _],
    [_, _, A, B, D, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, D, B, A, _, _],
    [_, _, A, B, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, B, A, _, _],
    [_, _, A, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, B, A, _, _],
    [_, _, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, A, _, _],
    [_, _, _, _, B, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, B, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Comfy Chair: 16x16 — plush armchair, top-down */
export const COMFY_CHAIR_SPRITE: SpriteData = (() => {
  const M = '#8B3A3A' // main fabric (burgundy)
  const D = '#6B2A2A' // dark shadow
  const L = '#A54A4A' // highlight
  const A = '#5C2020' // armrest
  const B = '#4A1818' // armrest shadow
  const C = '#9B4040' // cushion accent
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, A, A, A, A, A, A, A, A, A, A, _, _, _],
    [_, _, A, B, D, D, D, D, D, D, D, D, B, A, _, _],
    [_, _, A, B, D, M, M, M, M, M, M, D, B, A, _, _],
    [_, A, A, B, D, M, L, L, L, L, M, D, B, A, A, _],
    [_, A, B, D, M, L, C, C, C, C, L, M, D, B, A, _],
    [_, A, B, D, M, L, C, C, C, C, L, M, D, B, A, _],
    [_, A, B, D, M, M, M, M, M, M, M, M, D, B, A, _],
    [_, A, B, D, M, L, C, C, C, C, L, M, D, B, A, _],
    [_, A, B, D, M, L, C, C, C, C, L, M, D, B, A, _],
    [_, A, B, D, M, M, M, M, M, M, M, M, D, B, A, _],
    [_, A, A, B, D, D, D, D, D, D, D, D, B, A, A, _],
    [_, _, A, A, A, A, A, A, A, A, A, A, A, A, _, _],
    [_, _, _, B, _, _, _, _, _, _, _, _, B, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Trash can: 16x16 — small office waste bin */
export const TRASH_CAN_SPRITE: SpriteData = (() => {
  const M = '#888888' // metal
  const D = '#666666' // metal dark
  const L = '#999999' // metal light
  const B = '#555555' // base
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, L, L, L, L, _, _, _, _, _, _],
    [_, _, _, _, _, D, M, M, M, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, L, L, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, L, L, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, L, L, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, L, L, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, L, L, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, L, L, M, D, _, _, _, _, _],
    [_, _, _, _, _, D, M, M, M, M, D, _, _, _, _, _],
    [_, _, _, _, _, _, B, B, B, B, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Wall painting: 16x16 — decorative framed art for walls */
export const PAINTING_SPRITE: SpriteData = (() => {
  const F = '#8B6914' // gold frame
  const D = '#6B4E0A' // frame shadow
  const S = '#87CEEB' // sky blue
  const G = '#4CAF50' // green (hills)
  const Y = '#FFD700' // sun
  const L = '#66BB6A' // light green
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, F, F, F, F, F, F, F, F, F, F, F, F, _, _],
    [_, _, F, D, D, D, D, D, D, D, D, D, D, F, _, _],
    [_, _, F, D, S, S, S, S, S, S, S, S, D, F, _, _],
    [_, _, F, D, S, S, S, Y, Y, S, S, S, D, F, _, _],
    [_, _, F, D, S, S, S, S, S, S, S, S, D, F, _, _],
    [_, _, F, D, S, S, S, S, S, S, S, S, D, F, _, _],
    [_, _, F, D, G, G, L, L, L, L, G, G, D, F, _, _],
    [_, _, F, D, G, G, G, L, L, G, G, G, D, F, _, _],
    [_, _, F, D, G, G, G, G, G, G, G, G, D, F, _, _],
    [_, _, F, D, D, D, D, D, D, D, D, D, D, F, _, _],
    [_, _, F, F, F, F, F, F, F, F, F, F, F, F, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Standing whiteboard on wheels: 16x32 (1x2 tiles) — mobile easel-style whiteboard */
export const WHITEBOARD_STANDING_SPRITE: SpriteData = (() => {
  const F = '#888888' // aluminum frame
  const W = '#F0F0F5' // white surface
  const T = '#AAAAAA' // tray/ledge
  const L = '#666666' // legs
  const K = '#444444' // wheel
  const M = '#CC4444' // red marker writing
  const B = '#3366AA' // blue marker writing
  const G = '#33AA55' // green marker writing
  const N = '#FF8833' // orange sticky note
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, W, M, M, M, M, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, N, N, F, _, _, _],
    [_, _, _, F, W, W, B, B, B, B, N, N, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, W, G, G, G, W, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, B, B, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, M, M, M, M, M, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, G, G, G, W, W, F, _, _, _],
    [_, _, _, F, W, W, W, W, W, W, W, W, F, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, T, T, T, T, T, T, T, T, T, T, _, _, _],
    [_, _, _, F, _, _, _, _, _, _, _, _, F, _, _, _],
    [_, _, _, F, _, _, _, _, _, _, _, _, F, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, _, _, _, _, _, _, L, _, _, _, _],
    [_, _, _, _, L, L, _, _, _, _, L, L, _, _, _, _],
    [_, _, _, K, K, L, _, _, _, _, L, K, K, _, _, _],
    [_, _, _, K, K, _, _, _, _, _, _, K, K, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Microwave: 16x16 — break room microwave, surface item */
export const MICROWAVE_SPRITE: SpriteData = (() => {
  const F = '#BBBBBB' // metal body
  const D = '#999999' // body shadow
  const G = '#222222' // glass door
  const L = '#333344' // glass highlight
  const H = '#AAAAAA' // handle
  const B = '#666666' // buttons panel
  const O = '#00CC44' // green display
  const K = '#888888' // button dots
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, F, F, F, F, F, F, F, F, F, F, F, F, _, _],
    [_, _, F, D, D, D, D, D, D, D, D, D, D, F, _, _],
    [_, _, F, D, G, G, G, G, G, G, H, B, B, F, _, _],
    [_, _, F, D, G, L, L, G, G, G, H, O, O, F, _, _],
    [_, _, F, D, G, L, G, G, G, G, H, B, B, F, _, _],
    [_, _, F, D, G, G, G, G, G, G, H, K, K, F, _, _],
    [_, _, F, D, G, G, G, G, G, G, H, K, K, F, _, _],
    [_, _, F, D, D, D, D, D, D, D, D, D, D, F, _, _],
    [_, _, F, F, F, F, F, F, F, F, F, F, F, F, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Nitro cold brew tap: 16x32 (1x2 tiles) — keg-style tap tower with drip tray */
export const NITRO_TAP_SPRITE: SpriteData = (() => {
  const M = '#555555' // metal body
  const D = '#444444' // dark metal
  const L = '#777777' // metal highlight
  const H = '#333333' // tap handle dark
  const T = '#666666' // tap handle
  const C = '#1a1008' // cold brew (very dark brown)
  const G = '#888888' // drip grate
  const B = '#3a3a3a' // base
  const K = '#222222' // keg
  const S = '#999999' // steel
  const W = '#DDDDDD' // label white
  const N = '#1a5276' // "NITRO" blue accent
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    // Tap handles
    [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
    [_, _, _, _, _, _, H, T, T, H, _, _, _, _, _, _],
    [_, _, _, _, _, _, H, T, T, H, _, _, _, _, _, _],
    [_, _, _, _, _, _, H, T, T, H, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, T, T, _, _, _, _, _, _, _],
    // Tap tower top
    [_, _, _, _, _, M, M, M, M, M, M, _, _, _, _, _],
    [_, _, _, _, _, M, L, L, L, L, M, _, _, _, _, _],
    [_, _, _, _, _, M, L, S, S, L, M, _, _, _, _, _],
    // Spout
    [_, _, _, _, _, M, M, M, M, M, M, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, D, D, _, _, _, _, _, _, _],
    // Label area
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, W, N, N, N, N, W, D, _, _, _, _],
    [_, _, _, _, D, W, N, N, N, N, W, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    // Keg body
    [_, _, _, _, K, K, K, K, K, K, K, K, _, _, _, _],
    [_, _, _, _, K, D, K, K, K, K, D, K, _, _, _, _],
    [_, _, _, _, K, D, K, K, K, K, D, K, _, _, _, _],
    [_, _, _, _, K, D, K, K, K, K, D, K, _, _, _, _],
    [_, _, _, _, K, D, K, K, K, K, D, K, _, _, _, _],
    [_, _, _, _, K, K, K, K, K, K, K, K, _, _, _, _],
    // Drip tray
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, G, G, G, G, G, G, G, G, _, _, _, _],
    [_, _, _, _, G, D, D, D, D, D, D, G, _, _, _, _],
    [_, _, _, _, G, D, C, C, C, C, D, G, _, _, _, _],
    [_, _, _, _, G, G, G, G, G, G, G, G, _, _, _, _],
    // Base/feet
    [_, _, _, _, B, _, _, _, _, _, _, B, _, _, _, _],
    [_, _, _, B, B, _, _, _, _, _, _, B, B, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Ping Pong Table: 48x32 (3x2 tiles) — landscape orientation, net runs top-to-bottom */
export const PING_PONG_TABLE_SPRITE: SpriteData = (() => {
  const T = '#1A6B3A' // table green
  const D = '#145A2E' // table dark
  const L = '#2A8B4A' // table highlight
  const N = '#CCCCCC' // net
  const W = '#EEEEEE' // net highlight
  const E = '#3A3A3A' // edge/frame
  const B = '#2A2A2A' // legs
  return [
    [_, _, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, _, _],
    [_, _, E, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, L, L, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, L, L, D, E, _, _],
    [_, _, E, D, T, L, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, L, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, T, L, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, L, T, D, E, _, _],
    [_, _, E, D, T, L, L, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, W, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, L, L, T, D, E, _, _],
    [_, _, E, D, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, N, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, D, E, _, _],
    [_, _, E, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, E, _, _],
    [_, _, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, _, _],
    [_, _, _, B, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, B, _, _, _, _],
  ]
})()

/** Bean Bag: 16x16 — squishy bean bag chair */
export const BEAN_BAG_SPRITE: SpriteData = (() => {
  const M = '#E85D3A' // main orange
  const D = '#C44A2A' // dark shadow
  const L = '#FF7A50' // highlight
  const S = '#B83820' // deep shadow
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, D, D, D, D, D, D, _, _, _, _, _],
    [_, _, _, _, D, M, M, M, M, M, M, D, _, _, _, _],
    [_, _, _, D, M, M, L, L, L, L, M, M, D, _, _, _],
    [_, _, D, M, M, L, L, L, L, L, L, M, M, D, _, _],
    [_, _, D, M, L, L, L, L, L, L, L, L, M, D, _, _],
    [_, D, M, M, L, L, L, L, L, L, L, L, M, M, D, _],
    [_, D, M, M, M, L, L, L, L, L, L, M, M, M, D, _],
    [_, D, M, M, M, M, M, L, L, M, M, M, M, M, D, _],
    [_, D, M, M, M, M, M, M, M, M, M, M, M, M, D, _],
    [_, _, D, M, M, M, M, M, M, M, M, M, M, D, _, _],
    [_, _, D, D, M, M, M, M, M, M, M, M, D, D, _, _],
    [_, _, _, D, D, D, M, M, M, M, D, D, D, _, _, _],
    [_, _, _, _, S, S, D, D, D, D, S, S, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Foosball Table: 32x16 (2x1 tiles) — top-down foosball */
export const FOOSBALL_TABLE_SPRITE: SpriteData = (() => {
  const W = '#5C3D0A' // wood frame
  const D = '#4A2E06' // dark wood
  const G = '#2A8B4A' // green field
  const F = '#1A6B3A' // field dark
  const R = '#CC3333' // red rod handle
  const B = '#3333CC' // blue rod handle
  const S = '#AAAAAA' // steel rod
  const L = '#3A9B5A' // field light
  return [
    [_, _, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, _, _],
    [_, _, D, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, D, _, _],
    [_, R, D, W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W, D, B, _],
    [_, R, D, W, F, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, F, W, D, B, _],
    [_, _, D, W, F, G, L, G, G, G, G, G, G, G, G, L, L, G, G, G, G, G, G, G, G, L, G, F, W, D, _, _],
    [_, R, D, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, D, B, _],
    [_, _, D, W, F, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, F, W, D, _, _],
    [_, R, D, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, D, B, _],
    [_, _, D, W, F, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, F, W, D, _, _],
    [_, R, D, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, D, B, _],
    [_, _, D, W, F, G, L, G, G, G, G, G, G, G, G, L, L, G, G, G, G, G, G, G, G, L, G, F, W, D, _, _],
    [_, R, D, W, F, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, F, W, D, B, _],
    [_, R, D, W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W, D, B, _],
    [_, _, D, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, D, _, _],
    [_, _, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, _, _],
    [_, _, _, D, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, D, _, _, _],
  ]
})()

/** Kegerator: 16x16 — beer keg fridge with tap */
export const KEGERATOR_SPRITE: SpriteData = (() => {
  const M = '#555555' // metal body
  const D = '#444444' // dark
  const L = '#666666' // light
  const H = '#888888' // handle/tap
  const T = '#CCAA00' // tap gold
  const B = '#333333' // base
  return [
    [_, _, _, _, _, _, T, T, T, T, _, _, _, _, _, _],
    [_, _, _, _, _, _, T, H, H, T, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, H, H, _, _, _, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, D, M, M, M, M, M, M, M, M, D, _, _, _],
    [_, _, _, D, M, L, L, L, L, L, L, M, D, _, _, _],
    [_, _, _, D, M, L, L, L, L, L, L, M, D, _, _, _],
    [_, _, _, D, M, M, M, M, M, M, M, M, D, _, _, _],
    [_, _, _, D, M, L, L, L, L, L, L, M, D, _, _, _],
    [_, _, _, D, M, L, L, L, L, L, L, M, D, _, _, _],
    [_, _, _, D, M, M, M, M, M, M, M, M, D, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, B, B, B, B, B, B, B, B, B, B, _, _, _],
    [_, _, _, B, _, _, _, _, _, _, _, _, B, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Standing Desk: 32x16 (2x1 tiles) — adjustable height desk */
export const STANDING_DESK_SPRITE: SpriteData = (() => {
  const W = '#B09070' // wood top
  const D = '#8B7050' // wood dark
  const L = '#C8A880' // wood light
  const M = '#777777' // metal legs
  const G = '#666666' // metal dark
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, _, _],
    [_, _, D, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, D, _, _],
    [_, _, D, W, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, W, D, _, _],
    [_, _, D, W, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, L, W, D, _, _],
    [_, _, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, M, G, M, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, M, G, M, _, _, _, _, _],
    [_, _, _, _, _, G, G, G, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, G, G, G, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Arcade Cabinet: 16x32 (1x2 tiles) — retro arcade machine */
export const ARCADE_CABINET_SPRITE: SpriteData = (() => {
  const B = '#1A1A2E' // body dark
  const M = '#2A2A4E' // body mid
  const L = '#3A3A6E' // body light
  const S = '#4488FF' // screen glow
  const G = '#44FF88' // screen green
  const Y = '#FFCC00' // screen yellow
  const R = '#FF4444' // button red
  const C = '#333355' // control panel
  const D = '#111122' // darkest
  const J = '#AAAAAA' // joystick
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, S, S, S, S, M, B, D, _, _, _],
    [_, _, _, D, B, M, S, G, Y, S, M, B, D, _, _, _],
    [_, _, _, D, B, M, S, Y, G, S, M, B, D, _, _, _],
    [_, _, _, D, B, M, S, S, S, S, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, D, C, C, C, C, C, C, C, C, D, _, _, _],
    [_, _, _, D, C, J, C, C, C, C, R, C, D, _, _, _],
    [_, _, _, D, C, J, C, C, C, R, C, R, D, _, _, _],
    [_, _, _, D, C, C, C, C, C, C, C, C, D, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, M, M, M, M, M, M, B, D, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, L, L, L, L, L, L, L, L, D, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, D, _, _, _, _, _, _, _, _, D, _, _, _],
    [_, _, _, D, _, _, _, _, _, _, _, _, D, _, _, _],
    [_, _, _, D, D, _, _, _, _, _, _, D, D, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Snack Table: 16x16 — small table with snacks */
export const SNACK_TABLE_SPRITE: SpriteData = (() => {
  const W = '#B09070' // wood
  const D = '#8B7050' // dark wood
  const R = '#CC3333' // red snack bag
  const G = '#33AA33' // green snack
  const Y = '#DDBB44' // yellow chip
  const B = '#6B4E0A' // legs
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, D, W, W, W, W, W, W, W, W, D, _, _, _],
    [_, _, _, D, W, R, R, W, W, G, G, W, D, _, _, _],
    [_, _, _, D, W, R, R, W, W, G, G, W, D, _, _, _],
    [_, _, _, D, W, W, W, Y, Y, W, W, W, D, _, _, _],
    [_, _, _, D, W, W, W, Y, Y, W, W, W, D, _, _, _],
    [_, _, _, D, W, W, W, W, W, W, W, W, D, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, _, B, _, _, _, _, _, _, B, _, _, _, _],
    [_, _, _, _, B, _, _, _, _, _, _, B, _, _, _, _],
    [_, _, _, _, B, _, _, _, _, _, _, B, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Laptop: 16x16 — open laptop, surface-placeable */
export const LAPTOP_SPRITE: SpriteData = (() => {
  const F = '#444444' // frame
  const S = '#3A5A88' // screen
  const L = '#5A82B8' // screen light
  const K = '#333333' // keyboard
  const D = '#555555' // keyboard light
  const B = '#2A2A2A' // bezel
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, B, B, B, B, B, B, B, B, _, _, _, _],
    [_, _, _, _, B, S, S, S, S, S, S, B, _, _, _, _],
    [_, _, _, _, B, S, L, L, L, L, S, B, _, _, _, _],
    [_, _, _, _, B, S, L, L, L, L, S, B, _, _, _, _],
    [_, _, _, _, B, S, S, S, S, S, S, B, _, _, _, _],
    [_, _, _, _, B, B, B, B, B, B, B, B, _, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, F, K, K, K, K, K, K, K, K, F, _, _, _],
    [_, _, _, F, K, D, D, D, D, D, D, K, F, _, _, _],
    [_, _, _, F, K, D, D, D, D, D, D, K, F, _, _, _],
    [_, _, _, F, F, F, F, F, F, F, F, F, F, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Neon Sign: 16x16 — "HACK" neon sign, wall-mountable */
export const NEON_SIGN_SPRITE: SpriteData = (() => {
  const N = '#FF44FF' // neon pink
  const G = '#44FFFF' // neon cyan glow
  const D = '#222222' // backing
  const B = '#333333' // border
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, B, B, B, B, B, B, B, B, B, B, B, B, _, _],
    [_, _, B, D, D, D, D, D, D, D, D, D, D, B, _, _],
    [_, _, B, D, N, D, N, D, G, G, D, N, D, B, _, _],
    [_, _, B, D, N, D, N, D, G, D, D, N, D, B, _, _],
    [_, _, B, D, N, N, N, D, G, D, D, N, N, B, _, _],
    [_, _, B, D, N, D, N, D, G, G, D, N, D, B, _, _],
    [_, _, B, D, N, D, N, D, G, D, D, N, D, B, _, _],
    [_, _, B, D, D, D, D, D, D, D, D, D, D, B, _, _],
    [_, _, B, B, B, B, B, B, B, B, B, B, B, B, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Pizza Box: 16x16 — open pizza box, surface-placeable */
export const PIZZA_BOX_SPRITE: SpriteData = (() => {
  const B = '#D4A560' // box cardboard
  const D = '#B08840' // box dark
  const C = '#EEDD88' // cheese
  const R = '#CC3333' // pepperoni
  const S = '#DD9944' // sauce edge
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, B, S, S, S, S, S, S, B, D, _, _, _],
    [_, _, _, D, B, S, C, C, R, C, S, B, D, _, _, _],
    [_, _, _, D, B, S, R, C, C, C, S, B, D, _, _, _],
    [_, _, _, D, B, S, C, C, C, R, S, B, D, _, _, _],
    [_, _, _, D, B, S, C, R, C, C, S, B, D, _, _, _],
    [_, _, _, D, B, S, S, S, S, S, S, B, D, _, _, _],
    [_, _, _, D, B, B, B, B, B, B, B, B, D, _, _, _],
    [_, _, _, D, D, D, D, D, D, D, D, D, D, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Skateboard Rack: 16x32 (1x2 tiles) — wall-mounted board rack */
export const SKATEBOARD_RACK_SPRITE: SpriteData = (() => {
  const W = '#8B6914' // wood rack
  const D = '#6B4E0A' // dark wood
  const B1 = '#3388CC' // board 1 blue
  const B2 = '#CC4433' // board 2 red
  const B3 = '#44AA44' // board 3 green
  const K = '#333333' // wheels
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, B1, B1, B1, B1, B1, B1, B1, B1, B1, B1, _, _, _],
    [_, _, _, _, K, _, _, _, _, _, _, K, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, B2, B2, B2, B2, B2, B2, B2, B2, B2, B2, _, _, _],
    [_, _, _, _, K, _, _, _, _, _, _, K, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, _, D, W, W, W, W, W, W, D, _, _, _, _],
    [_, _, _, B3, B3, B3, B3, B3, B3, B3, B3, B3, B3, _, _, _],
    [_, _, _, _, K, _, _, _, _, _, _, K, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Dog Bed: 16x16 — cozy pet bed for the office dog */
export const DOG_BED_SPRITE: SpriteData = (() => {
  const M = '#8B6644' // bed main brown
  const D = '#6B4E2A' // dark edge
  const L = '#AA8855' // cushion light
  const C = '#CCAA77' // center cushion
  const P = '#997755' // pillow
  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, D, M, M, M, M, M, M, M, M, D, _, _, _],
    [_, _, D, M, M, P, P, P, P, P, P, M, M, D, _, _],
    [_, _, D, M, P, L, L, L, L, L, L, P, M, D, _, _],
    [_, _, D, M, P, L, C, C, C, C, L, P, M, D, _, _],
    [_, _, D, M, P, L, C, C, C, C, L, P, M, D, _, _],
    [_, _, D, M, P, L, C, C, C, C, L, P, M, D, _, _],
    [_, _, D, M, P, L, C, C, C, C, L, P, M, D, _, _],
    [_, _, D, M, P, L, L, L, L, L, L, P, M, D, _, _],
    [_, _, D, M, M, P, P, P, P, P, P, M, M, D, _, _],
    [_, _, _, D, M, M, M, M, M, M, M, M, D, _, _, _],
    [_, _, _, _, D, D, D, D, D, D, D, D, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ]
})()

// ── Speech Bubble Sprites ───────────────────────────────────────

/** Permission bubble: white square with "..." in amber, and a tail pointer (11x13) */
export const BUBBLE_PERMISSION_SPRITE: SpriteData = (() => {
  const B = '#555566' // border
  const F = '#EEEEFF' // fill
  const A = '#CCA700' // amber dots
  return [
    [B, B, B, B, B, B, B, B, B, B, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, A, F, A, F, A, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, B, B, B, B, B, B, B, B, B, B],
    [_, _, _, _, B, B, B, _, _, _, _],
    [_, _, _, _, _, B, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _],
  ]
})()

/** Waiting bubble: white square with green checkmark, and a tail pointer (11x13) */
export const BUBBLE_WAITING_SPRITE: SpriteData = (() => {
  const B = '#555566' // border
  const F = '#EEEEFF' // fill
  const G = '#44BB66' // green check
  return [
    [_, B, B, B, B, B, B, B, B, B, _],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, G, F, B],
    [B, F, F, F, F, F, F, G, F, F, B],
    [B, F, F, G, F, F, G, F, F, F, B],
    [B, F, F, F, G, G, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [B, F, F, F, F, F, F, F, F, F, B],
    [_, B, B, B, B, B, B, B, B, B, _],
    [_, _, _, _, B, B, B, _, _, _, _],
    [_, _, _, _, _, B, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _],
  ]
})()

// ── Character Sprites ───────────────────────────────────────────
// 16x24 characters with palette substitution

/** Palette colors for 6 distinct agent characters */
export const CHARACTER_PALETTES = [
  { skin: '#FFCC99', shirt: '#4488CC', pants: '#334466', hair: '#553322', shoes: '#222222' },
  { skin: '#FFCC99', shirt: '#CC4444', pants: '#333333', hair: '#FFD700', shoes: '#222222' },
  { skin: '#DEB887', shirt: '#44AA66', pants: '#334444', hair: '#222222', shoes: '#333333' },
  { skin: '#FFCC99', shirt: '#AA55CC', pants: '#443355', hair: '#AA4422', shoes: '#222222' },
  { skin: '#DEB887', shirt: '#CCAA33', pants: '#444433', hair: '#553322', shoes: '#333333' },
  { skin: '#FFCC99', shirt: '#FF8844', pants: '#443322', hair: '#111111', shoes: '#222222' },
] as const

interface CharPalette {
  skin: string
  shirt: string
  pants: string
  hair: string
  shoes: string
}

// Template keys for character pixel data
const H = 'hair'
const K = 'skin'
const S = 'shirt'
const P = 'pants'
const O = 'shoes'
const E = '#FFFFFF' // eyes

type TemplateCell = typeof H | typeof K | typeof S | typeof P | typeof O | typeof E | typeof _

/** Resolve a template to SpriteData using a palette */
function resolveTemplate(template: TemplateCell[][], palette: CharPalette): SpriteData {
  return template.map((row) =>
    row.map((cell) => {
      if (cell === _) return ''
      if (cell === E) return E
      if (cell === H) return palette.hair
      if (cell === K) return palette.skin
      if (cell === S) return palette.shirt
      if (cell === P) return palette.pants
      if (cell === O) return palette.shoes
      return cell
    }),
  )
}

/** Flip a template horizontally (for generating left sprites from right) */
function flipHorizontal(template: TemplateCell[][]): TemplateCell[][] {
  return template.map((row) => [...row].reverse())
}

// ════════════════════════════════════════════════════════════════
// DOWN-FACING SPRITES
// ════════════════════════════════════════════════════════════════

// Walk down: 4 frames (1, 2=standing, 3=mirror legs, 2 again)
const CHAR_WALK_DOWN_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, P, P, _, _, _, _, P, P, _, _, _, _],
  [_, _, _, _, P, P, _, _, _, _, P, P, _, _, _, _],
  [_, _, _, _, O, O, _, _, _, _, _, O, O, _, _, _],
  [_, _, _, _, O, O, _, _, _, _, _, O, O, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_WALK_DOWN_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_WALK_DOWN_3: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, O, O, _, _, _, _, _, _, P, P, _, _, _],
  [_, _, _, O, O, _, _, _, _, _, _, P, P, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, O, O, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, O, O, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// Down typing: front-facing sitting, arms on keyboard
const CHAR_DOWN_TYPE_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, K, K, S, S, S, S, S, S, K, K, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_DOWN_TYPE_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, K, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, _, K, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// Down reading: front-facing sitting, arms at sides, looking at screen
const CHAR_DOWN_READ_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_DOWN_READ_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, E, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// ════════════════════════════════════════════════════════════════
// UP-FACING SPRITES (back of head, no face)
// ════════════════════════════════════════════════════════════════

// Walk up: back view, legs alternate
const CHAR_WALK_UP_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, P, P, _, _, _, _, P, P, _, _, _, _],
  [_, _, _, _, P, P, _, _, _, _, P, P, _, _, _, _],
  [_, _, _, O, O, _, _, _, _, _, _, O, O, _, _, _],
  [_, _, _, O, O, _, _, _, _, _, _, O, O, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_WALK_UP_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_WALK_UP_3: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, O, O, _, _, _, _, _, _, P, P, _, _, _],
  [_, _, _, O, O, _, _, _, _, _, _, P, P, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, O, O, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, O, O, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// Up typing: back view, arms out to keyboard
const CHAR_UP_TYPE_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, K, K, S, S, S, S, S, S, K, K, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_UP_TYPE_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, K, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, _, K, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// Up reading: back view, arms at sides
const CHAR_UP_READ_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_UP_READ_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, _, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, H, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, K, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, S, S, S, S, S, S, S, S, _, _, _, _],
  [_, _, _, _, K, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, P, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// ════════════════════════════════════════════════════════════════
// RIGHT-FACING SPRITES (side profile, one eye visible)
// Left sprites are generated by flipHorizontal()
// ════════════════════════════════════════════════════════════════

// Right walk: side view, legs step
const CHAR_WALK_RIGHT_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, K, S, S, S, S, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, _, P, P, _, _, _, _],
  [_, _, _, _, _, P, P, _, _, _, P, P, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, _, _, O, O, _, _, _],
  [_, _, _, _, _, O, O, _, _, _, _, O, O, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_WALK_RIGHT_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, K, S, S, S, S, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, O, O, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, O, O, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_WALK_RIGHT_3: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, K, S, S, S, S, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, P, P, P, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, O, O, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// Right typing: side profile sitting, one arm on keyboard
const CHAR_RIGHT_TYPE_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, K, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, O, O, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_RIGHT_TYPE_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, K, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, _, _, K, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, O, O, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// Right reading: side sitting, arms at side
const CHAR_RIGHT_READ_1: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, K, S, S, S, S, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, O, O, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

const CHAR_RIGHT_READ_2: TemplateCell[][] = [
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, H, H, H, H, H, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, E, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, K, _, _, _, _, _],
  [_, _, _, _, _, _, K, K, K, K, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, S, S, S, S, S, S, _, _, _, _, _],
  [_, _, _, _, _, K, S, S, S, S, K, _, _, _, _, _],
  [_, _, _, _, _, _, S, S, S, S, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, P, P, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, P, P, _, _, _, _, _, _],
  [_, _, _, _, _, _, P, P, _, P, P, _, _, _, _, _],
  [_, _, _, _, _, _, O, O, _, O, O, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
]

// ════════════════════════════════════════════════════════════════
// Template export (for export-characters script)
// ════════════════════════════════════════════════════════════════

/** All character templates grouped by direction, for use by the export script.
 *  Frame order per direction: walk1, walk2, walk3, type1, type2, read1, read2 */
export const CHARACTER_TEMPLATES = {
  down: [
    CHAR_WALK_DOWN_1, CHAR_WALK_DOWN_2, CHAR_WALK_DOWN_3,
    CHAR_DOWN_TYPE_1, CHAR_DOWN_TYPE_2,
    CHAR_DOWN_READ_1, CHAR_DOWN_READ_2,
  ],
  up: [
    CHAR_WALK_UP_1, CHAR_WALK_UP_2, CHAR_WALK_UP_3,
    CHAR_UP_TYPE_1, CHAR_UP_TYPE_2,
    CHAR_UP_READ_1, CHAR_UP_READ_2,
  ],
  right: [
    CHAR_WALK_RIGHT_1, CHAR_WALK_RIGHT_2, CHAR_WALK_RIGHT_3,
    CHAR_RIGHT_TYPE_1, CHAR_RIGHT_TYPE_2,
    CHAR_RIGHT_READ_1, CHAR_RIGHT_READ_2,
  ],
} as const

// ════════════════════════════════════════════════════════════════
// Loaded character sprites (from PNG assets)
// ════════════════════════════════════════════════════════════════

interface LoadedCharacterData {
  down: SpriteData[]
  up: SpriteData[]
  right: SpriteData[]
}

let loadedCharacters: LoadedCharacterData[] | null = null

/** Set pre-colored character sprites loaded from PNG assets. Call this when characterSpritesLoaded message arrives. */
export function setCharacterTemplates(data: LoadedCharacterData[]): void {
  loadedCharacters = data
  // Clear cache so sprites are rebuilt from loaded data
  spriteCache.clear()
}

/** Flip a SpriteData horizontally (for generating left sprites from right) */
function flipSpriteHorizontal(sprite: SpriteData): SpriteData {
  return sprite.map((row) => [...row].reverse())
}

// ════════════════════════════════════════════════════════════════
// Sprite resolution + caching
// ════════════════════════════════════════════════════════════════

export interface CharacterSprites {
  walk: Record<Direction, [SpriteData, SpriteData, SpriteData, SpriteData]>
  typing: Record<Direction, [SpriteData, SpriteData]>
  reading: Record<Direction, [SpriteData, SpriteData]>
}

const spriteCache = new Map<string, CharacterSprites>()

/** Apply hue shift to every sprite in a CharacterSprites set */
function hueShiftSprites(sprites: CharacterSprites, hueShift: number): CharacterSprites {
  const color: FloorColor = { h: hueShift, s: 0, b: 0, c: 0 }
  const shift = (s: SpriteData) => adjustSprite(s, color)
  const shiftWalk = (arr: [SpriteData, SpriteData, SpriteData, SpriteData]): [SpriteData, SpriteData, SpriteData, SpriteData] =>
    [shift(arr[0]), shift(arr[1]), shift(arr[2]), shift(arr[3])]
  const shiftPair = (arr: [SpriteData, SpriteData]): [SpriteData, SpriteData] =>
    [shift(arr[0]), shift(arr[1])]
  return {
    walk: {
      [Dir.DOWN]: shiftWalk(sprites.walk[Dir.DOWN]),
      [Dir.UP]: shiftWalk(sprites.walk[Dir.UP]),
      [Dir.RIGHT]: shiftWalk(sprites.walk[Dir.RIGHT]),
      [Dir.LEFT]: shiftWalk(sprites.walk[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData, SpriteData, SpriteData]>,
    typing: {
      [Dir.DOWN]: shiftPair(sprites.typing[Dir.DOWN]),
      [Dir.UP]: shiftPair(sprites.typing[Dir.UP]),
      [Dir.RIGHT]: shiftPair(sprites.typing[Dir.RIGHT]),
      [Dir.LEFT]: shiftPair(sprites.typing[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData]>,
    reading: {
      [Dir.DOWN]: shiftPair(sprites.reading[Dir.DOWN]),
      [Dir.UP]: shiftPair(sprites.reading[Dir.UP]),
      [Dir.RIGHT]: shiftPair(sprites.reading[Dir.RIGHT]),
      [Dir.LEFT]: shiftPair(sprites.reading[Dir.LEFT]),
    } as Record<Direction, [SpriteData, SpriteData]>,
  }
}

export function getCharacterSprites(paletteIndex: number, hueShift = 0): CharacterSprites {
  const cacheKey = `${paletteIndex}:${hueShift}`
  const cached = spriteCache.get(cacheKey)
  if (cached) return cached

  let sprites: CharacterSprites

  if (loadedCharacters) {
    // Use pre-colored character sprites directly (no palette swapping)
    const char = loadedCharacters[paletteIndex % loadedCharacters.length]
    const d = char.down
    const u = char.up
    const rt = char.right
    const flip = flipSpriteHorizontal

    sprites = {
      walk: {
        [Dir.DOWN]: [d[0], d[1], d[2], d[1]],
        [Dir.UP]: [u[0], u[1], u[2], u[1]],
        [Dir.RIGHT]: [rt[0], rt[1], rt[2], rt[1]],
        [Dir.LEFT]: [flip(rt[0]), flip(rt[1]), flip(rt[2]), flip(rt[1])],
      },
      typing: {
        [Dir.DOWN]: [d[3], d[4]],
        [Dir.UP]: [u[3], u[4]],
        [Dir.RIGHT]: [rt[3], rt[4]],
        [Dir.LEFT]: [flip(rt[3]), flip(rt[4])],
      },
      reading: {
        [Dir.DOWN]: [d[5], d[6]],
        [Dir.UP]: [u[5], u[6]],
        [Dir.RIGHT]: [rt[5], rt[6]],
        [Dir.LEFT]: [flip(rt[5]), flip(rt[6])],
      },
    }
  } else {
    // Fallback: use hardcoded templates with palette swapping
    const pal = CHARACTER_PALETTES[paletteIndex % CHARACTER_PALETTES.length]
    const r = (t: TemplateCell[][]) => resolveTemplate(t, pal)
    const rf = (t: TemplateCell[][]) => resolveTemplate(flipHorizontal(t), pal)

    sprites = {
      walk: {
        [Dir.DOWN]: [r(CHAR_WALK_DOWN_1), r(CHAR_WALK_DOWN_2), r(CHAR_WALK_DOWN_3), r(CHAR_WALK_DOWN_2)],
        [Dir.UP]: [r(CHAR_WALK_UP_1), r(CHAR_WALK_UP_2), r(CHAR_WALK_UP_3), r(CHAR_WALK_UP_2)],
        [Dir.RIGHT]: [r(CHAR_WALK_RIGHT_1), r(CHAR_WALK_RIGHT_2), r(CHAR_WALK_RIGHT_3), r(CHAR_WALK_RIGHT_2)],
        [Dir.LEFT]: [rf(CHAR_WALK_RIGHT_1), rf(CHAR_WALK_RIGHT_2), rf(CHAR_WALK_RIGHT_3), rf(CHAR_WALK_RIGHT_2)],
      },
      typing: {
        [Dir.DOWN]: [r(CHAR_DOWN_TYPE_1), r(CHAR_DOWN_TYPE_2)],
        [Dir.UP]: [r(CHAR_UP_TYPE_1), r(CHAR_UP_TYPE_2)],
        [Dir.RIGHT]: [r(CHAR_RIGHT_TYPE_1), r(CHAR_RIGHT_TYPE_2)],
        [Dir.LEFT]: [rf(CHAR_RIGHT_TYPE_1), rf(CHAR_RIGHT_TYPE_2)],
      },
      reading: {
        [Dir.DOWN]: [r(CHAR_DOWN_READ_1), r(CHAR_DOWN_READ_2)],
        [Dir.UP]: [r(CHAR_UP_READ_1), r(CHAR_UP_READ_2)],
        [Dir.RIGHT]: [r(CHAR_RIGHT_READ_1), r(CHAR_RIGHT_READ_2)],
        [Dir.LEFT]: [rf(CHAR_RIGHT_READ_1), rf(CHAR_RIGHT_READ_2)],
      },
    }
  }

  // Apply hue shift if non-zero
  if (hueShift !== 0) {
    sprites = hueShiftSprites(sprites, hueShift)
  }

  spriteCache.set(cacheKey, sprites)
  return sprites
}
