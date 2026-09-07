import { z } from 'zod'
import { MAX_LEVEL, MAX_RESERVE, maxHp, xpToNext } from './engine'
import { AREAS } from './data'
import { AREA_IDS, QUEST_IDS, SPECIES_IDS, WARDEN_IDS } from './types'
import type { GameState } from './types'
import { canWalk, COLS, ROWS } from './world'

export const SAVE_KEY = 'wildkin.mosslight.adventure.v1'
export const MAX_SAVE_BYTES = 1_000_000
const integer = (max: number) => z.number().int().nonnegative().max(max)
const speciesId = z.enum(SPECIES_IDS)
const creature = z.object({
  uid: z.number().int().min(1).max(1_000_000_000),
  species: speciesId,
  nickname: z.string().max(20),
  level: z.number().int().min(1).max(MAX_LEVEL),
  xp: integer(1000),
  hp: integer(1000),
  luminous: z.boolean(),
}).strict().superRefine((value, ctx) => {
  if (value.hp > maxHp(value)) ctx.addIssue({ code: 'custom', message: 'HP exceeds this companion\'s maximum.' })
  if (value.xp >= xpToNext(value.level) || (value.level === MAX_LEVEL && value.xp !== 0)) ctx.addIssue({ code: 'custom', message: 'Experience is outside the current level.' })
})

export const gameSchema: z.ZodType<GameState> = z.object({
  version: z.literal(1),
  started: z.boolean(),
  name: z.string().min(1).max(20),
  seed: z.number().int().min(1).max(4294967295),
  nextUid: z.number().int().min(1).max(1_000_000_000),
  area: z.enum(AREA_IDS),
  position: z.object({ x: integer(COLS - 1), y: integer(ROWS - 1) }).strict(),
  facing: z.enum(['up', 'down', 'left', 'right']),
  steps: integer(1_000_000_000),
  encounterSteps: integer(8),
  party: z.array(creature).max(6),
  reserve: z.array(creature).max(MAX_RESERVE),
  seen: z.array(speciesId).max(24),
  caught: z.array(speciesId).max(24),
  captures: integer(1_000_000_000),
  wins: integer(1_000_000_000),
  seals: z.array(z.enum(WARDEN_IDS)).max(4),
  visited: z.array(z.enum(AREA_IDS)).min(1).max(5),
  claimedQuests: z.array(z.enum(QUEST_IDS)).max(8),
  openedChests: z.array(z.enum(AREA_IDS)).max(5),
  coins: integer(1_000_000_000),
  inventory: z.object({ pods: integer(10_000_000), tonics: integer(10_000_000), lures: integer(10_000_000) }).strict(),
  lureSteps: integer(40),
  battle: z.object({
    kind: z.enum(['wild', 'warden', 'guardian']),
    enemy: creature,
    queue: z.array(creature).max(2),
    activeUid: z.number().int().positive(),
    energy: integer(5),
    round: z.number().int().min(1).max(1_000_000),
    status: z.enum(['active', 'won', 'lost', 'captured', 'fled']),
    log: z.array(z.string().max(600)).max(8),
    warden: z.enum(WARDEN_IDS).optional(),
    reward: integer(1000),
    caughtUid: z.number().int().positive().optional(),
    effect: z.enum(['ally', 'enemy', 'capture', 'guard', 'none']),
  }).strict().nullable(),
  dialog: z.object({
    kind: z.enum(['rest', 'shop', 'warden', 'researcher', 'chest', 'gate', 'altar']),
    id: z.string().max(40),
  }).strict().nullable(),
  notice: z.string().max(3000).nullable(),
  completed: z.boolean(),
}).strict().superRefine((state, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message })
  const owned = [...state.party, ...state.reserve]
  if (state.started && state.party.length === 0) issue('An adventure needs at least one team companion.')
  if (!state.started && (owned.length > 0 || state.battle)) issue('An unstarted adventure cannot contain companions or a battle.')
  if (new Set(owned.map(c => c.uid)).size !== owned.length) issue('Companion identifiers must be unique.')
  if (owned.some(c => !state.caught.includes(c.species))) issue('Owned companions must be registered in the field guide.')
  if (state.caught.some(id => !state.seen.includes(id))) issue('Registered species must also be seen.')
  for (const list of [state.seen, state.caught, state.seals, state.visited, state.claimedQuests, state.openedChests]) {
    if (new Set(list).size !== list.length) issue('Collection entries must not be duplicated.')
  }
  if (!canWalk(state.area, state.position)) issue('The explorer must be standing on a walkable tile.')
  if (state.seals.some((seal, index) => seal !== WARDEN_IDS[index])) issue('Warden seals must be earned in trail order.')
  if (AREAS[state.area].requiredSeals > state.seals.length) issue('This region is not unlocked by these seals.')
  if (!state.visited.includes(state.area) || !state.visited.includes('meadow')) issue('Visited regions must include the current region and meadow.')
  const battle = state.battle
  const allIds = [...owned.map(c => c.uid), ...(battle ? [battle.enemy.uid, ...battle.queue.map(c => c.uid)] : [])]
  if (allIds.some(uid => uid >= state.nextUid)) issue('The next companion identifier must exceed existing identifiers.')
  if (battle) {
    const active = state.party.find(c => c.uid === battle.activeUid)
    if (!active) issue('The active battle companion must be in the team.')
    if (!state.seen.includes(battle.enemy.species)) issue('The current opponent must have a field-guide sighting.')
    if (battle.kind === 'warden' && !battle.warden) issue('A warden battle needs its warden identifier.')
    if (battle.kind !== 'warden' && (battle.warden || battle.queue.length)) issue('Only wardens can have a queued team.')
    if (battle.status === 'active' && (battle.enemy.hp === 0 || active?.hp === 0)) issue('An active encounter needs two conscious companions.')
    if (battle.status === 'won' && (battle.enemy.hp !== 0 || battle.queue.length > 0)) issue('A won encounter must have no remaining opponents.')
    if (battle.status === 'captured' && !owned.some(c => c.uid === battle.caughtUid && c.uid === battle.enemy.uid)) issue('A befriended wildkin must exist in the collection.')
    const opponents = [battle.enemy, ...battle.queue]
    if (new Set(opponents.map(c => c.uid)).size !== opponents.length) issue('Opponent identifiers must be unique.')
    if (battle.status !== 'captured' && opponents.some(enemy => owned.some(c => c.uid === enemy.uid))) issue('Opponents cannot also be owned companions.')
  }
})

const saveSchema = z.object({
  format: z.literal('wildkin-mosslight'),
  version: z.literal(1),
  savedAt: z.iso.datetime(),
  state: gameSchema,
}).strict()

export type ReadResult =
  | { ok: true; state: GameState; savedAt: string }
  | { ok: false; error: string }

export function encodeSave(state: GameState, savedAt = new Date().toISOString()): string {
  return JSON.stringify({
    format: 'wildkin-mosslight',
    version: 1,
    savedAt,
    state: { ...state, notice: null, dialog: null },
  })
}

export function decodeSave(text: string): ReadResult {
  if (text.length > MAX_SAVE_BYTES) return { ok: false, error: 'That save is too large. Choose a Wildkin save smaller than 1 MB.' }
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return { ok: false, error: 'This file is not valid JSON. Choose an exported Wildkin adventure.' }
  }
  const result = saveSchema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    return { ok: false, error: `This adventure cannot be loaded: ${issue.path.join('.') || 'save'}: ${issue.message}` }
  }
  return { ok: true, state: result.data.state, savedAt: result.data.savedAt }
}

function isStorageError(error: unknown): error is DOMException {
  return error instanceof DOMException && ['SecurityError', 'QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'].includes(error.name)
}

export function loadAdventure(): { result: ReadResult | null; raw: string | null } {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    return { result: raw ? decodeSave(raw) : null, raw }
  } catch (error) {
    if (!isStorageError(error)) throw error
    return { result: { ok: false, error: 'Browser storage is unavailable. You can still play; export your adventure before leaving.' }, raw: null }
  }
}

export function saveAdventure(state: GameState): string | null {
  try {
    window.localStorage.setItem(SAVE_KEY, encodeSave(state))
    return null
  } catch (error) {
    if (!isStorageError(error)) throw error
    return 'Your browser could not save this adventure. Export a backup in Settings before closing the game.'
  }
}
