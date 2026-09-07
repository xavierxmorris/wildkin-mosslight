import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, makeCreature, maxHp, xpToNext } from './engine'
import { decodeSave, encodeSave, gameSchema, MAX_SAVE_BYTES } from './persistence'
import type { GameState } from './types'

const start = () => gameReducer(createGame(239887), { type: 'START', name: 'Scout', starter: 'ripplefin' })
const stamp = '2026-09-07T00:00:00.000Z'

describe('portable save format', () => {
  it('round-trips complete progress without transient messages or dialogs', () => {
    const state = start()
    state.dialog = { kind: 'rest', id: 'cottage' }
    state.notice = 'Tea time.'
    const result = decodeSave(encodeSave(state, stamp))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state).toEqual({ ...state, dialog: null, notice: null })
    expect(result.savedAt).toBe(stamp)
  })

  it('preserves a mid-encounter random stream, health, energy, and the next turn', () => {
    const state = start()
    const enemy = makeCreature(state, 'pebblit', 7)
    state.seen.push('pebblit')
    state.battle = { kind: 'wild', enemy, queue: [], activeUid: 1, energy: 2, round: 4, status: 'active', log: ['A pebblit appears.'], reward: 0, effect: 'none' }
    const result = decodeSave(encodeSave(state, stamp))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(gameReducer(result.state, { type: 'ATTACK', move: 0 })).toEqual(gameReducer({ ...state, notice: null }, { type: 'ATTACK', move: 0 }))
  })

  it('rejects non-JSON, oversize, wrong-format, and future-version files', () => {
    expect(decodeSave('not a save').ok).toBe(false)
    expect(decodeSave('x'.repeat(MAX_SAVE_BYTES + 1)).ok).toBe(false)
    expect(decodeSave('{}').ok).toBe(false)
    const data = JSON.parse(encodeSave(start(), stamp))
    expect(decodeSave(JSON.stringify({ ...data, version: 2 })).ok).toBe(false)
    expect(decodeSave(JSON.stringify({ ...data, format: 'some-other-game' })).ok).toBe(false)
  })

  const corruptions: [string, (state: GameState) => void][] = [
    ['duplicate companions', state => state.party.push(structuredClone(state.party[0]))],
    ['negative health', state => { state.party[0].hp = -1 }],
    ['health above maximum', state => { state.party[0].hp = maxHp(state.party[0]) + 1 }],
    ['out-of-range experience', state => { state.party[0].xp = xpToNext(5) }],
    ['negative currency', state => { state.coins = -40 }],
    ['non-finite currency', state => { state.coins = Infinity }],
    ['fractional inventory', state => { state.inventory.pods = 1.5 }],
    ['unwalkable position', state => { state.position = { x: 0, y: 0 } }],
    ['locked region', state => { state.area = 'sanctum'; state.visited.push('sanctum') }],
    ['out-of-order seals', state => { state.seals = ['flint'] }],
    ['duplicate guide entries', state => state.caught.push('ripplefin')],
    ['missing collection entries', state => { state.caught = [] }],
    ['invalid ID allocation', state => { state.nextUid = 1 }],
    ['no active companions', state => { state.party = [] }],
    ['zero RNG stream', state => { state.seed = 0 }],
  ]

  it.each(corruptions)('rejects %s without accepting a success-shaped fallback', (_, corrupt) => {
    const state = start()
    corrupt(state)
    const result = decodeSave(encodeSave(state, stamp))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('cannot be loaded')
  })

  it('rejects unknown species and executable-looking extra fields', () => {
    const document = JSON.parse(encodeSave(start(), stamp))
    document.state.party[0].species = 'not-a-wildkin'
    expect(decodeSave(JSON.stringify(document)).ok).toBe(false)
    const extra = JSON.parse(encodeSave(start(), stamp))
    extra.state.script = '<script>not executable</script>'
    expect(decodeSave(JSON.stringify(extra)).ok).toBe(false)
  })

  it('accepts text characters as data without interpreting names as markup', () => {
    const state = start()
    state.party[0].nickname = '<b>Friend</b>'
    const result = decodeSave(encodeSave(state, stamp))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.state.party[0].nickname).toBe('<b>Friend</b>')
  })

  it('validates active and completed battle invariants', () => {
    const state = start()
    const enemy = makeCreature(state, 'puffinch', 5)
    state.seen.push('puffinch')
    state.battle = { kind: 'wild', enemy, queue: [], activeUid: 999, energy: 3, round: 1, status: 'active', log: [], reward: 0, effect: 'none' }
    expect(gameSchema.safeParse(state).success).toBe(false)
    state.battle.activeUid = 1
    state.battle.enemy.hp = 0
    expect(gameSchema.safeParse(state).success).toBe(false)
    state.battle.status = 'won'
    expect(gameSchema.safeParse(state).success).toBe(true)
  })
})
