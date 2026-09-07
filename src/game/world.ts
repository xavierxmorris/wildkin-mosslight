import type { AreaId, Landmark, Point } from './types'

export const COLS = 28
export const ROWS = 18
export const TILE = 32
export const SPAWN: Point = { x: 9, y: 11 }
export type Tile = 'ground' | 'path' | 'grass' | 'water' | 'tree' | 'rock' | 'building'
export interface WorldMap { tiles: Tile[][]; landmarks: Landmark[] }

function makeMap(area: AreaId): WorldMap {
  const tiles: Tile[][] = Array.from({ length: ROWS }, () => Array<Tile>(COLS).fill('ground'))
  const paint = (x: number, y: number, w: number, h: number, tile: Tile) => {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        if (tiles[row]?.[col] !== undefined) tiles[row][col] = tile
      }
    }
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) tiles[y][x] = 'tree'
    }
  }
  paint(2, 3, 5, 4, 'grass')
  paint(12, 3, 6, 4, 'grass')
  paint(12, 13, 7, 3, 'grass')
  paint(3, 13, 4, 3, 'grass')
  for (let y = 3; y <= 9; y++) {
    for (let x = 19; x <= 25; x++) {
      if (((x - 22) / 3.5) ** 2 + ((y - 6) / 3.7) ** 2 < 1) tiles[y][x] = 'water'
    }
  }
  const treePoints = [[2, 2], [5, 2], [8, 2], [11, 2], [15, 1], [18, 2], [26, 2], [2, 8], [8, 8], [11, 8], [17, 8], [25, 14], [22, 15], [9, 16], [2, 16], [19, 16], [26, 16]]
  for (const [x, y] of treePoints) tiles[y][x] = 'tree'
  paint(1, 11, 26, 1, 'path')
  paint(9, 3, 1, 13, 'path')
  paint(5, 10, 5, 1, 'path')
  paint(10, 7, 1, 5, 'path')
  paint(21, 10, 4, 3, 'path')
  paint(4, 8, 3, 3, 'building')
  paint(10, 6, 1, 1, 'building')
  const landmarks: Landmark[] = [
    { id: 'cottage', x: 5, y: 10, kind: 'rest', label: area === 'meadow' ? 'Rest cottage' : 'Trail shelter' },
    { id: 'shop', x: 10, y: 6, kind: 'shop', label: 'Supply cart' },
    { id: 'researcher', x: 8, y: 12, kind: 'researcher', label: 'Professor Wren' },
    { id: 'chest', x: 16, y: 5, kind: 'chest', label: 'Trail cache' },
    { id: 'gate', x: 26, y: 11, kind: 'gate', label: 'Island signpost' },
  ]
  if (area !== 'sanctum') landmarks.push({ id: 'warden', x: 22, y: 11, kind: 'warden', label: 'Warden clearing' })
  if (area === 'shore') {
    paint(19, 2, 8, 8, 'water')
    paint(23, 13, 4, 4, 'water')
    paint(19, 7, 5, 1, 'path')
    paint(19, 6, 1, 2, 'path')
  }
  if (area === 'grove') {
    for (const [x, y] of [[7, 4], [11, 4], [18, 4], [2, 14], [20, 14], [25, 3]]) tiles[y][x] = 'tree'
  }
  if (area === 'summit') {
    for (const [x, y] of [[3, 2], [6, 7], [15, 8], [18, 9], [23, 3], [24, 14], [7, 15]]) tiles[y][x] = 'rock'
  }
  if (area === 'sanctum') {
    paint(19, 3, 7, 7, 'ground')
    paint(22, 6, 1, 6, 'path')
    landmarks.push({ id: 'altar', x: 22, y: 6, kind: 'altar', label: 'Firstlight altar' })
    paint(21, 5, 3, 2, 'building')
  }
  return { tiles, landmarks }
}

export const WORLDS: Record<AreaId, WorldMap> = {
  meadow: makeMap('meadow'),
  shore: makeMap('shore'),
  grove: makeMap('grove'),
  summit: makeMap('summit'),
  sanctum: makeMap('sanctum'),
}

export function canWalk(area: AreaId, point: Point): boolean {
  const tile = WORLDS[area].tiles[point.y]?.[point.x]
  return tile === 'ground' || tile === 'path' || tile === 'grass'
}

export function distance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function nearbyLandmark(area: AreaId, position: Point, id?: string): Landmark | undefined {
  return WORLDS[area].landmarks.find(landmark => (!id || landmark.id === id) && distance(position, landmark) <= 1)
}

export function findPath(area: AreaId, from: Point, to: Point, adjacent = false): Point[] | null {
  const queue: Point[] = [from]
  const key = (p: Point) => `${p.x},${p.y}`
  const previous = new Map<string, Point | null>([[key(from), null]])
  let destination: Point | undefined
  for (let head = 0; head < queue.length; head++) {
    const point = queue[head]
    if (adjacent ? distance(point, to) <= 1 : distance(point, to) === 0) {
      destination = point
      break
    }
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const next = { x: point.x + dx, y: point.y + dy }
      if (canWalk(area, next) && !previous.has(key(next))) {
        previous.set(key(next), point)
        queue.push(next)
      }
    }
  }
  if (!destination) return null
  const path: Point[] = []
  let point: Point | null | undefined = destination
  while (point && distance(point, from) !== 0) {
    path.unshift(point)
    point = previous.get(key(point))
  }
  return path
}

export function nearestGrass(area: AreaId, from: Point): Point[] | null {
  const candidates: Point[] = []
  WORLDS[area].tiles.forEach((row, y) => row.forEach((tile, x) => {
    if (tile === 'grass' && distance(from, { x, y }) > 0) candidates.push({ x, y })
  }))
  candidates.sort((a, b) => distance(a, from) - distance(b, from))
  for (const candidate of candidates) {
    const path = findPath(area, from, candidate)
    if (path) return path
  }
  return null
}
