export const AREA_IDS = ['meadow', 'shore', 'grove', 'summit', 'sanctum'] as const
export const ELEMENT_IDS = ['leaf', 'ember', 'tide', 'stone', 'gale', 'spark'] as const
export const WARDEN_IDS = ['rowan', 'marin', 'iris', 'flint'] as const
export const SPECIES_IDS = [
  'fernling', 'briarhorn', 'cindercub', 'cinderlynx', 'ripplefin', 'tidewhisk',
  'pebblit', 'cairnback', 'puffinch', 'plumesail', 'glimworm', 'lumimoth',
  'capshroom', 'wickit', 'shellby', 'craggle', 'wisplet', 'coilfin',
  'petalune', 'scorchip', 'dewdrop', 'geodeer', 'hushowl', 'solume',
] as const
export const QUEST_IDS = ['set-off', 'first-catch', 'first-seal', 'six-friends', 'wayfarer', 'all-seals', 'homecoming', 'naturalist'] as const

export type AreaId = typeof AREA_IDS[number]
export type Element = typeof ELEMENT_IDS[number]
export type WardenId = typeof WARDEN_IDS[number]
export type SpeciesId = typeof SPECIES_IDS[number]
export type QuestId = typeof QUEST_IDS[number]
export type ItemId = 'pods' | 'tonics' | 'lures'
export type Shape = 'fox' | 'deer' | 'cub' | 'otter' | 'turtle' | 'bird' | 'worm' | 'moth' | 'mushroom' | 'ghost' | 'snail' | 'golem' | 'fish' | 'lizard' | 'drop' | 'owl' | 'guardian'
export type Direction = 'up' | 'down' | 'left' | 'right'
export interface Point { x: number; y: number }

export interface Species {
  id: SpeciesId
  name: string
  element: Element
  shape: Shape
  color: string
  accent: string
  baseHp: number
  attack: number
  defense: number
  rarity: 'common' | 'uncommon' | 'rare' | 'guardian'
  description: string
  personality: string
  evolvesTo?: SpeciesId
  evolvesAt?: number
}

export interface Creature {
  uid: number
  species: SpeciesId
  nickname: string
  level: number
  xp: number
  hp: number
  luminous: boolean
}

export interface Move {
  name: string
  element: Element | 'neutral'
  power: number
  cost: number
  description: string
  guard?: boolean
}

export interface Encounter { species: SpeciesId; weight: number }
export interface Area {
  id: AreaId
  name: string
  subtitle: string
  description: string
  requiredSeals: number
  levels: [number, number]
  ground: string
  grass: string
  water: string
  trees: string
  sky: string
  accent: string
  warden?: WardenId
  encounters: Encounter[]
}

export interface Warden {
  id: WardenId
  name: string
  title: string
  seal: string
  element: Element
  area: AreaId
  greeting: string
  after: string
  roster: { species: SpeciesId; level: number }[]
  reward: number
}

export interface Battle {
  kind: 'wild' | 'warden' | 'guardian'
  enemy: Creature
  queue: Creature[]
  activeUid: number
  energy: number
  round: number
  status: 'active' | 'won' | 'lost' | 'captured' | 'fled'
  log: string[]
  warden?: WardenId
  reward: number
  caughtUid?: number
  effect: 'ally' | 'enemy' | 'capture' | 'guard' | 'none'
}

export type LandmarkKind = 'rest' | 'shop' | 'warden' | 'researcher' | 'chest' | 'gate' | 'altar'
export interface Landmark extends Point {
  id: string
  kind: LandmarkKind
  label: string
}

export interface GameState {
  version: 1
  started: boolean
  name: string
  seed: number
  nextUid: number
  area: AreaId
  position: Point
  facing: Direction
  steps: number
  encounterSteps: number
  party: Creature[]
  reserve: Creature[]
  seen: SpeciesId[]
  caught: SpeciesId[]
  captures: number
  wins: number
  seals: WardenId[]
  visited: AreaId[]
  claimedQuests: QuestId[]
  openedChests: AreaId[]
  coins: number
  inventory: Record<ItemId, number>
  lureSteps: number
  battle: Battle | null
  dialog: { kind: LandmarkKind; id: string } | null
  notice: string | null
  completed: boolean
}

export type Action =
  | { type: 'START'; name: string; starter: SpeciesId }
  | { type: 'MOVE'; dx: number; dy: number }
  | { type: 'INTERACT'; id?: string }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'REST' }
  | { type: 'TRAVEL'; area: AreaId }
  | { type: 'CHALLENGE'; warden: WardenId }
  | { type: 'AWAKEN' }
  | { type: 'ATTACK'; move: number }
  | { type: 'CAPTURE' }
  | { type: 'TONIC'; uid: number }
  | { type: 'SWITCH'; uid: number }
  | { type: 'RUN' }
  | { type: 'END_BATTLE' }
  | { type: 'BUY'; item: ItemId; quantity: number }
  | { type: 'USE_LURE' }
  | { type: 'LEAD'; uid: number }
  | { type: 'SWAP_RESERVE'; partyUid: number; reserveUid: number }
  | { type: 'ADD_TO_PARTY'; uid: number }
  | { type: 'NICKNAME'; uid: number; name: string }
  | { type: 'CLAIM_QUEST'; id: QuestId }
  | { type: 'DISMISS_NOTICE' }

export interface Quest {
  id: QuestId
  title: string
  description: string
  goal: number
  progress: (state: GameState) => number
  reward: number
  pods?: number
}
