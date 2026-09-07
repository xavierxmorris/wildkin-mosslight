import { describe, expect, it } from 'vitest'
import { AREAS, ELEMENTS, getMoves, ITEMS, QUESTS, SPECIES, STARTERS, WARDENS } from './data'
import { captureChance, createGame, damageFor, effectiveness, gameReducer, makeCreature, maxHp, MAX_LEVEL, MAX_RESERVE, random, xpToNext } from './engine'
import { gameSchema } from './persistence'
import { AREA_IDS, ELEMENT_IDS, SPECIES_IDS, WARDEN_IDS } from './types'
import type { Action, Creature, GameState, SpeciesId } from './types'
import { canWalk, distance, findPath, nearbyLandmark, nearestGrass, SPAWN, WORLDS } from './world'

function started(starter: SpeciesId = 'fernling', seed = 1): GameState {
  return gameReducer(createGame(seed), { type: 'START', name: 'Scout', starter })
}

function addFriend(state: GameState, species: SpeciesId, level = 5, reserve = false): Creature {
  const creature = makeCreature(state, species, level)
  ;(reserve ? state.reserve : state.party).push(creature)
  if (!state.seen.includes(species)) state.seen.push(species)
  if (!state.caught.includes(species)) state.caught.push(species)
  return creature
}

function wild(state = started(), species: SpeciesId = 'puffinch', level = 3): GameState {
  const enemy = makeCreature(state, species, level)
  if (!state.seen.includes(species)) state.seen.push(species)
  state.battle = { kind: 'wild', enemy, queue: [], activeUid: state.party[0].uid, energy: 3, round: 1, status: 'active', log: [], reward: 0, effect: 'none' }
  return state
}

function assertValid(state: GameState) {
  const result = gameSchema.safeParse(state)
  expect(result.success, result.success ? undefined : result.error.message).toBe(true)
}

describe('new adventures and deterministic state', () => {
  it.each(STARTERS)('starts with %s and a complete, valid save', starter => {
    const state = started(starter)
    expect(state.party).toHaveLength(1)
    expect(state.party[0].species).toBe(starter)
    expect(state.party[0].hp).toBe(maxHp(state.party[0]))
    expect(state.caught).toEqual([starter])
    expect(state.inventory.pods).toBe(10)
    assertValid(state)
  })

  it('trims and bounds the explorer name and accepts an empty name', () => {
    expect(gameReducer(createGame(), { type: 'START', name: ' '.repeat(4), starter: 'fernling' }).name).toBe('Explorer')
    expect(gameReducer(createGame(), { type: 'START', name: `  ${'x'.repeat(60)}  `, starter: 'fernling' }).name).toHaveLength(20)
  })

  it('rejects non-starters and repeated starts without replacing progress', () => {
    const unstarted = gameReducer(createGame(), { type: 'START', starter: 'solume', name: 'Scout' })
    expect(unstarted.started).toBe(false)
    expect(unstarted.notice).toContain('three')
    const state = started()
    const repeated = gameReducer(state, { type: 'START', starter: 'ripplefin', name: 'Other' })
    expect(repeated.party).toEqual(state.party)
    expect(repeated.name).toBe('Scout')
  })

  it('is pure and replays the same random sequence for the same action', () => {
    const state = wild()
    const snapshot = structuredClone(state)
    const action: Action = { type: 'ATTACK', move: 0 }
    expect(gameReducer(state, action)).toEqual(gameReducer(state, action))
    expect(state).toEqual(snapshot)
    const left = createGame(39231)
    const right = createGame(39231)
    for (let i = 0; i < 50; i++) expect(random(left)).toBe(random(right))
  })

  it('normalizes a zero seed and keeps generated values in range', () => {
    const state = createGame(0)
    for (let i = 0; i < 1000; i++) {
      const value = random(state)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
    expect(state.seed).not.toBe(0)
  })
})

describe('world navigation and encounters', () => {
  it('moves exactly one tile and never crosses a wall or water', () => {
    const state = started()
    const moved = gameReducer(state, { type: 'MOVE', dx: 1, dy: 0 })
    expect(moved.position).toEqual({ x: 10, y: 11 })
    expect(moved.steps).toBe(1)
    const blocked = { ...state, position: { x: 1, y: 11 } }
    expect(gameReducer(blocked, { type: 'MOVE', dx: -1, dy: 0 }).position).toEqual(blocked.position)
    expect(gameReducer(state, { type: 'MOVE', dx: 9, dy: 0 }).position).toEqual(state.position)
    expect(gameReducer(state, { type: 'MOVE', dx: 0.5, dy: 0.5 }).steps).toBe(0)
  })

  it.each(AREA_IDS)('provides reachable landmarks and grass in %s', area => {
    for (const landmark of WORLDS[area].landmarks) {
      const path = findPath(area, SPAWN, landmark, true)
      expect(path, `${area}: ${landmark.id}`).not.toBeNull()
      let position = SPAWN
      for (const point of path ?? []) {
        expect(distance(position, point)).toBe(1)
        expect(canWalk(area, point)).toBe(true)
        position = point
      }
      expect(nearbyLandmark(area, position, landmark.id)?.id).toBe(landmark.id)
    }
    const grass = nearestGrass(area, SPAWN)
    expect(grass?.length).toBeGreaterThan(0)
    const last = grass!.at(-1)!
    expect(WORLDS[area].tiles[last.y][last.x]).toBe('grass')
    expect(findPath(area, SPAWN, { x: -10, y: 300 })).toBeNull()
  })

  it('never starts a wild encounter on a path', () => {
    let state = started()
    for (let i = 0; i < 200; i++) state = gameReducer(state, { type: 'MOVE', dx: i % 2 ? -1 : 1, dy: 0 })
    expect(state.steps).toBe(200)
    expect(state.battle).toBeNull()
  })

  it('guarantees an encounter within eight grass steps, without external APIs', () => {
    let state = { ...started('fernling', 52796), position: { x: 3, y: 4 } }
    for (let i = 0; i < 8 && !state.battle; i++) state = gameReducer(state, { type: 'MOVE', dx: i % 2 ? -1 : 1, dy: 0 })
    expect(state.battle?.status).toBe('active')
    expect(state.seen).toContain(state.battle?.enemy.species)
    assertValid(state)
  })

  it('locks regions and opens them in seal order', () => {
    let state = started()
    expect(gameReducer(state, { type: 'TRAVEL', area: 'shore' }).area).toBe('meadow')
    state.seals = ['rowan']
    state = gameReducer(state, { type: 'TRAVEL', area: 'shore' })
    expect(state.area).toBe('shore')
    expect(state.visited).toEqual(['meadow', 'shore'])
    expect(state.position).toEqual(SPAWN)
    assertValid(state)
  })

  it('keeps autosaves valid when every selected companion needs a rest', () => {
    let state = { ...started(), position: { x: 3, y: 4 } }
    state.party[0].hp = 0
    for (let i = 0; i < 24; i++) state = gameReducer(state, { type: 'MOVE', dx: i % 2 ? -1 : 1, dy: 0 })
    expect(state.battle).toBeNull()
    expect(state.encounterSteps).toBeLessThanOrEqual(8)
    expect(state.notice).toContain('rest')
    assertValid(state)
  })

  it('requires proximity for interaction, shopping, rest, and warden challenges', () => {
    const state = started()
    expect(gameReducer(state, { type: 'REST' }).notice).toContain('Visit')
    expect(gameReducer(state, { type: 'CHALLENGE', warden: 'rowan' }).battle).toBeNull()
    expect(gameReducer(state, { type: 'BUY', item: 'pods', quantity: 1 }).coins).toBe(state.coins)
    expect(gameReducer(state, { type: 'INTERACT', id: 'cottage' }).dialog).toBeNull()
  })

  it('makes all 24 species obtainable through encounters, growth, or the guardian', () => {
    const available = new Set<SpeciesId>(['solume'])
    for (const area of Object.values(AREAS)) for (const entry of area.encounters) available.add(entry.species)
    for (const id of available) if (SPECIES[id].evolvesTo) available.add(SPECIES[id].evolvesTo!)
    expect([...available].sort()).toEqual([...SPECIES_IDS].sort())
  })
})

describe('turn-based battles', () => {
  it('spends energy, applies one reply, and regenerates energy with a quick move', () => {
    let state = wild(started(), 'pebblit', 10)
    state = gameReducer(state, { type: 'ATTACK', move: 2 })
    expect(state.battle?.energy).toBe(0)
    expect(state.battle?.round).toBe(2)
    expect(state.party[0].hp).toBeLessThan(maxHp(state.party[0]))
    const rejected = gameReducer(state, { type: 'ATTACK', move: 2 })
    expect(rejected.battle).toEqual(state.battle)
    expect(rejected.notice).toContain('energy')
    state = gameReducer(state, { type: 'ATTACK', move: 0 })
    expect(state.battle?.energy).toBe(1)
  })

  it('taking shelter halves damage and restores energy up to five', () => {
    const state = wild(started('ripplefin'), 'pebblit', 5)
    state.battle!.energy = 4
    const guarded = gameReducer(state, { type: 'ATTACK', move: 3 })
    expect(guarded.battle?.energy).toBe(5)
    expect(guarded.battle?.enemy.hp).toBe(state.battle!.enemy.hp)
    expect(guarded.battle?.log.join(' ')).toContain('Shelter softens')
    expect(guarded.party[0].hp).toBeGreaterThan(maxHp(state.party[0]) - 20)
    assertValid(guarded)
  })

  it.each(ELEMENT_IDS)('uses documented %s strengths consistently', element => {
    for (const defense of ELEMENTS[element].strong) expect(effectiveness(element, defense)).toBe(1.5)
    expect(effectiveness(element, element)).toBe(0.8)
    expect(effectiveness('neutral', element)).toBe(1)
  })

  it('changes damage with type matchups, level, and move power', () => {
    const state = started()
    const attacker = state.party[0]
    const weak = makeCreature(state, 'dewdrop', 5)
    const resistant = makeCreature(state, 'cindercub', 5)
    const move = getMoves('fernling')[1]
    expect(damageFor(attacker, weak, move)).toBeGreaterThan(damageFor(attacker, resistant, move))
    expect(damageFor(attacker, weak, getMoves('fernling')[2])).toBeGreaterThan(damageFor(attacker, weak, move))
  })

  it('cannot move, travel, buy, reorder, claim rewards, or close an active battle', () => {
    const state = wild()
    const commands: Action[] = [
      { type: 'MOVE', dx: 1, dy: 0 }, { type: 'TRAVEL', area: 'meadow' },
      { type: 'BUY', item: 'pods', quantity: 1 }, { type: 'LEAD', uid: 1 },
      { type: 'CLAIM_QUEST', id: 'set-off' }, { type: 'END_BATTLE' },
    ]
    for (const action of commands) {
      const next = gameReducer(state, action)
      expect(next.position).toEqual(state.position)
      expect(next.battle).toEqual(state.battle)
      expect(next.coins).toBe(state.coins)
      expect(next.notice).toBeTruthy()
    }
  })

  it('switches companions atomically and makes the enemy answer the new companion', () => {
    const state = wild()
    const nextFriend = addFriend(state, 'ripplefin', 6)
    const next = gameReducer(state, { type: 'SWITCH', uid: nextFriend.uid })
    expect(next.battle?.activeUid).toBe(nextFriend.uid)
    expect(next.battle?.energy).toBe(3)
    expect(next.party[0].hp).toBe(state.party[0].hp)
    expect(next.party[1].hp).toBeLessThan(nextFriend.hp)
    expect(gameReducer(next, { type: 'SWITCH', uid: nextFriend.uid }).battle?.round).toBe(next.battle?.round)
  })

  it('automatically sends a conscious teammate after a faint', () => {
    const state = wild()
    state.party[0].hp = 1
    const friend = addFriend(state, 'ripplefin', 5)
    const next = gameReducer(state, { type: 'ATTACK', move: 3 })
    expect(next.party[0].hp).toBe(0)
    expect(next.battle?.activeUid).toBe(friend.uid)
    expect(next.battle?.status).toBe('active')
    assertValid(next)
  })

  it('rescues and heals the collection after total defeat without deleting friends', () => {
    const state = wild()
    state.party[0].hp = 1
    const reserve = addFriend(state, 'wickit', 5, true)
    reserve.hp = 2
    const next = gameReducer(state, { type: 'ATTACK', move: 3 })
    expect(next.battle?.status).toBe('lost')
    expect(next.party[0].hp).toBe(maxHp(next.party[0]))
    expect(next.reserve[0].hp).toBe(maxHp(next.reserve[0]))
    expect(next.position).toEqual(SPAWN)
    expect(next.coins).toBe(162)
    assertValid(next)
  })

  it('retreats safely without handing out unearned XP or money', () => {
    const state = wild()
    const next = gameReducer(state, { type: 'RUN' })
    expect(next.battle?.status).toBe('fled')
    expect(next.coins).toBe(state.coins)
    expect(next.party).toEqual(state.party)
    expect(gameReducer(next, { type: 'END_BATTLE' }).battle).toBeNull()
  })

  it('awards experience to the whole party, evolves at the threshold, and preserves nicknames', () => {
    const state = started()
    state.party[0].level = 11
    state.party[0].hp = maxHp(state.party[0])
    state.party[0].xp = xpToNext(11) - 1
    state.party[0].nickname = 'Sprout'
    const friend = addFriend(state, 'glimworm', 9)
    friend.xp = xpToNext(9) - 1
    friend.hp = 0
    wild(state, 'puffinch', 3).battle!.enemy.hp = 1
    const next = gameReducer(state, { type: 'ATTACK', move: 0 })
    expect(next.party[0].species).toBe('briarhorn')
    expect(next.party[0].nickname).toBe('Sprout')
    expect(next.party[1].species).toBe('lumimoth')
    expect(next.party[1].hp).toBe(0)
    expect(next.caught).toEqual(expect.arrayContaining(['fernling', 'briarhorn', 'glimworm', 'lumimoth']))
    expect(next.battle?.status).toBe('won')
    assertValid(next)
  })

  it('caps levels and experience without corrupting a max-level save', () => {
    const state = started('ripplefin')
    state.party[0].level = MAX_LEVEL - 1
    state.party[0].xp = xpToNext(MAX_LEVEL - 1) - 1
    state.party[0].hp = maxHp(state.party[0])
    wild(state, 'puffinch', 20).battle!.enemy.hp = 1
    const next = gameReducer(state, { type: 'ATTACK', move: 0 })
    expect(next.party[0].level).toBe(MAX_LEVEL)
    expect(next.party[0].xp).toBe(0)
    assertValid(next)
  })
})

describe('friendship, supplies, and team management', () => {
  it('makes weakened wildkin easier to befriend and guarantees a weakened guardian', () => {
    const state = started()
    const creature = makeCreature(state, 'puffinch', 5)
    const initial = captureChance(creature)
    creature.hp = 1
    expect(captureChance(creature)).toBeGreaterThan(initial)
    const guardian = makeCreature(state, 'solume', 16)
    guardian.hp = Math.floor(maxHp(guardian) / 4)
    expect(captureChance(guardian)).toBe(1)
  })

  it('spends one pod, preserves the captured creature, and registers a new friend', () => {
    const state = wild(started('fernling', 1), 'puffinch', 3)
    const enemyUid = state.battle!.enemy.uid
    const next = gameReducer(state, { type: 'CAPTURE' })
    expect(next.battle?.status).toBe('captured')
    expect(next.inventory.pods).toBe(9)
    expect(next.party[1].uid).toBe(enemyUid)
    expect(next.captures).toBe(1)
    expect(next.caught).toContain('puffinch')
    assertValid(next)
  })

  it('sends a seventh companion to reserves without losing it', () => {
    const state = started()
    for (const species of ['cindercub', 'ripplefin', 'pebblit', 'glimworm', 'capshroom'] satisfies SpeciesId[]) addFriend(state, species)
    wild(state)
    const next = gameReducer(state, { type: 'CAPTURE' })
    expect(next.party).toHaveLength(6)
    expect(next.reserve).toHaveLength(1)
    expect(next.reserve[0].species).toBe('puffinch')
    assertValid(next)
  })

  it('answers a failed capture with an enemy turn and does not duplicate rewards', () => {
    const state = wild(started('fernling', 123456789))
    const next = gameReducer(state, { type: 'CAPTURE' })
    expect(next.battle?.status).toBe('active')
    expect(next.inventory.pods).toBe(9)
    expect(next.party).toHaveLength(1)
    expect(next.party[0].hp).toBeLessThan(state.party[0].hp)
    expect(next.captures).toBe(0)
    const won = gameReducer(wild(started()), { type: 'CAPTURE' })
    expect(gameReducer(won, { type: 'CAPTURE' }).captures).toBe(1)
  })

  it('never spends pods when empty, at capacity, or facing a warden', () => {
    const noPods = wild()
    noPods.inventory.pods = 0
    expect(gameReducer(noPods, { type: 'CAPTURE' }).battle?.round).toBe(1)
    const warden = wild()
    warden.battle!.kind = 'warden'
    warden.battle!.warden = 'rowan'
    expect(gameReducer(warden, { type: 'CAPTURE' }).inventory.pods).toBe(10)
    const full = started()
    for (let i = 1; i < 6; i++) addFriend(full, 'pebblit')
    for (let i = 0; i < MAX_RESERVE; i++) addFriend(full, 'pebblit', 5, true)
    wild(full)
    expect(gameReducer(full, { type: 'CAPTURE' }).inventory.pods).toBe(10)
  })

  it('uses a tonic to wake a fainted friend, and does not waste one at full health', () => {
    const state = started()
    expect(gameReducer(state, { type: 'TONIC', uid: 1 }).inventory.tonics).toBe(5)
    state.party[0].hp = 0
    const next = gameReducer(state, { type: 'TONIC', uid: 1 })
    expect(next.party[0].hp).toBe(55)
    expect(next.inventory.tonics).toBe(4)
  })

  it('restores the team and reserves for free at a cottage', () => {
    const state = started()
    state.position = { x: 5, y: 11 }
    state.party[0].hp = 1
    addFriend(state, 'ripplefin', 5, true).hp = 0
    const next = gameReducer(gameReducer(state, { type: 'INTERACT', id: 'cottage' }), { type: 'REST' })
    for (const creature of [...next.party, ...next.reserve]) expect(creature.hp).toBe(maxHp(creature))
    expect(next.coins).toBe(180)
    expect(next.dialog).toBeNull()
  })

  it('opens each cache only once', () => {
    const state = started()
    state.position = { x: 16, y: 5 }
    const once = gameReducer(state, { type: 'INTERACT', id: 'chest' })
    const twice = gameReducer(once, { type: 'INTERACT', id: 'chest' })
    expect(once.inventory.pods).toBe(13)
    expect(twice.inventory.pods).toBe(13)
    expect(twice.coins).toBe(270)
  })

  it('buys exact quantities, rejects negative/fractional quantities and insufficient funds', () => {
    let state = started()
    state.position = { x: 10, y: 7 }
    state = gameReducer(state, { type: 'INTERACT', id: 'shop' })
    const bought = gameReducer(state, { type: 'BUY', item: 'pods', quantity: 3 })
    expect(bought.inventory.pods).toBe(13)
    expect(bought.coins).toBe(180 - 3 * ITEMS.pods.price)
    for (const quantity of [-2, 0, 1.5, 11]) expect(gameReducer(state, { type: 'BUY', item: 'pods', quantity }).coins).toBe(180)
    expect(gameReducer(state, { type: 'BUY', item: 'lures', quantity: 10 }).coins).toBe(180)
  })

  it('uses lures once, counts down real movement, and will not stack them', () => {
    let state = gameReducer(started(), { type: 'USE_LURE' })
    expect(state.inventory.lures).toBe(1)
    expect(state.lureSteps).toBe(40)
    expect(gameReducer(state, { type: 'USE_LURE' }).inventory.lures).toBe(1)
    for (let i = 0; i < 40; i++) state = gameReducer(state, { type: 'MOVE', dx: i % 2 ? -1 : 1, dy: 0 })
    expect(state.lureSteps).toBe(0)
    assertValid(state)
  })

  it('allows nicknames, team leads, and reserve swaps while preserving identity and health', () => {
    const state = started()
    const friend = addFriend(state, 'ripplefin')
    const reserve = addFriend(state, 'cindercub', 8, true)
    let next = gameReducer(state, { type: 'NICKNAME', uid: friend.uid, name: '   Pebble pal  ' })
    next = gameReducer(next, { type: 'LEAD', uid: friend.uid })
    expect(next.party[0].nickname).toBe('Pebble pal')
    next = gameReducer(next, { type: 'SWAP_RESERVE', partyUid: friend.uid, reserveUid: reserve.uid })
    expect(next.party[0]).toEqual(reserve)
    expect(next.reserve[0].nickname).toBe('Pebble pal')
    next = gameReducer(next, { type: 'ADD_TO_PARTY', uid: friend.uid })
    expect(next.party).toHaveLength(3)
    expect(next.reserve).toHaveLength(0)
    assertValid(next)
  })

  it('awards completed field notes exactly once and rejects unfinished notes', () => {
    const state = started()
    expect(gameReducer(state, { type: 'CLAIM_QUEST', id: 'first-catch' }).coins).toBe(180)
    const next = gameReducer(state, { type: 'CLAIM_QUEST', id: 'set-off' })
    expect(next.coins).toBe(210)
    expect(next.inventory.pods).toBe(12)
    expect(gameReducer(next, { type: 'CLAIM_QUEST', id: 'set-off' }).coins).toBe(210)
    assertValid(next)
  })
})

describe('complete adventure playthroughs through public game actions', () => {
  const act = (state: GameState, action: Action) => {
    const next = gameReducer(state, action)
    assertValid(next)
    return next
  }

  function resolveBattle(initial: GameState, befriend = false): GameState {
    let state = initial
    for (let turn = 0; turn < 120 && state.battle?.status === 'active'; turn++) {
      const battle = state.battle
      const active = state.party.find(c => c.uid === battle.activeUid)!
      const options = getMoves(active.species).map((move, index) => ({ move, index, damage: damageFor(active, battle.enemy, move) }))
      if (befriend && state.inventory.pods > 0) {
        const safeHit = options.filter(option => !option.move.guard && option.move.cost <= battle.energy && option.damage * 1.12 < battle.enemy.hp).sort((a, b) => b.damage - a.damage)[0]
        if (battle.enemy.hp / maxHp(battle.enemy) < 0.3 || !safeHit) state = act(state, { type: 'CAPTURE' })
        else state = act(state, { type: 'ATTACK', move: safeHit.index })
      } else {
        const best = options.filter(option => !option.move.guard && option.move.cost <= battle.energy).sort((a, b) => b.damage - a.damage)[0]
        state = act(state, { type: 'ATTACK', move: best.index })
      }
    }
    expect(state.battle?.status).not.toBe('active')
    return state
  }

  function visit(state: GameState, landmarkId: string): GameState {
    const landmark = WORLDS[state.area].landmarks.find(entry => entry.id === landmarkId)!
    const path = findPath(state.area, state.position, landmark, true)!
    for (const point of path) {
      state = act(state, { type: 'MOVE', dx: point.x - state.position.x, dy: point.y - state.position.y })
      if (state.battle) {
        state = resolveBattle(state)
        state = act(state, { type: 'END_BATTLE' })
        return visit(state, landmarkId)
      }
    }
    return act(state, { type: 'INTERACT', id: landmarkId })
  }

  function rest(state: GameState): GameState {
    state = act(state, { type: 'TRAVEL', area: state.area })
    state = visit(state, 'cottage')
    return act(state, { type: 'REST' })
  }

  function findEncounter(state: GameState): GameState {
    const grass = findPath(state.area, state.position, { x: 3, y: 4 })!
    for (const point of grass) {
      state = act(state, { type: 'MOVE', dx: point.x - state.position.x, dy: point.y - state.position.y })
      if (state.battle) return state
    }
    for (let i = 0; i < 12 && !state.battle; i++) state = act(state, { type: 'MOVE', dx: state.position.x === 3 ? 1 : -1, dy: 0 })
    expect(state.battle).not.toBeNull()
    return state
  }

  function collectNotes(state: GameState): GameState {
    for (const quest of QUESTS) if (!state.claimedQuests.includes(quest.id) && quest.progress(state) >= quest.goal) state = act(state, { type: 'CLAIM_QUEST', id: quest.id })
    return state
  }

  it.each(STARTERS)('finishes all four wardens and bonds with Solume starting with %s', starter => {
    let state = started(starter, 93821 + STARTERS.indexOf(starter) * 153)
    let encounters = 0
    for (const wardenId of WARDEN_IDS) {
      const warden = WARDENS[wardenId]
      state = act(state, { type: 'TRAVEL', area: warden.area })
      const target = warden.roster.at(-1)!.level + 2
      for (let training = 0; training < 35; training++) {
        if (state.party[0].level >= target && state.party.length >= 3) break
        state = rest(state)
        state = findEncounter(state)
        state = resolveBattle(state, state.party.length < 6)
        state = act(state, { type: 'END_BATTLE' })
        state = collectNotes(state)
        encounters++
      }
      expect(state.party.length).toBeGreaterThanOrEqual(3)
      state = rest(state)
      state = visit(state, 'warden')
      state = act(state, { type: 'CHALLENGE', warden: wardenId })
      expect(state.battle?.kind).toBe('warden')
      state = resolveBattle(state)
      expect(state.battle?.status, `${starter}: ${wardenId}`).toBe('won')
      state = act(state, { type: 'END_BATTLE' })
      expect(state.seals).toContain(wardenId)
      state = collectNotes(state)
    }
    state = act(state, { type: 'TRAVEL', area: 'sanctum' })
    state = rest(state)
    state = visit(state, 'shop')
    while (state.inventory.pods < 4) state = act(state, { type: 'BUY', item: 'pods', quantity: 1 })
    state = act(state, { type: 'CLOSE_DIALOG' })
    state = visit(state, 'altar')
    state = act(state, { type: 'AWAKEN' })
    expect(state.battle?.enemy.species).toBe('solume')
    state = resolveBattle(state, true)
    expect(state.battle?.status).toBe('captured')
    expect(state.completed).toBe(true)
    expect(state.caught).toContain('solume')
    expect(state.seals).toHaveLength(4)
    expect(encounters).toBeLessThan(65)
    assertValid(state)
  })
})

describe('warden and guardian state transitions', () => {
  it('queues the next warden opponent and only awards a seal at the final victory', () => {
    const state = started('cindercub')
    state.position = { x: 21, y: 11 }
    let next = gameReducer(state, { type: 'CHALLENGE', warden: 'rowan' })
    next.battle!.enemy.hp = 1
    next = gameReducer(next, { type: 'ATTACK', move: 0 })
    expect(next.battle?.status).toBe('active')
    expect(next.battle?.enemy.species).toBe('capshroom')
    expect(next.seals).toEqual([])
    next.battle!.enemy.hp = 1
    next = gameReducer(next, { type: 'ATTACK', move: 0 })
    expect(next.seals).toEqual(['rowan'])
    expect(next.battle?.reward).toBe(220)
    next = gameReducer(next, { type: 'END_BATTLE' })
    expect(gameReducer(next, { type: 'CHALLENGE', warden: 'rowan' }).battle).toBeNull()
  })

  it('lets a defeated guardian be met again rather than permanently missing the catch', () => {
    const state = started()
    state.area = 'sanctum'
    state.position = { x: 22, y: 7 }
    state.seals = [...WARDEN_IDS]
    state.visited = [...AREA_IDS]
    let next = gameReducer(state, { type: 'AWAKEN' })
    next.battle!.enemy.hp = 1
    next = gameReducer(next, { type: 'ATTACK', move: 0 })
    expect(next.completed).toBe(true)
    expect(next.caught).not.toContain('solume')
    next = gameReducer(next, { type: 'END_BATTLE' })
    next = gameReducer(next, { type: 'AWAKEN' })
    expect(next.battle?.status).toBe('active')
    assertValid(next)
  })

  it.each(AREA_IDS)('keeps locked-area requirements aligned with the warden sequence: %s', areaId => {
    const index = AREA_IDS.indexOf(areaId)
    expect(AREAS[areaId].requiredSeals).toBe(index)
    const warden = AREAS[areaId].warden
    if (warden) expect(WARDENS[warden].area).toBe(areaId)
  })
})
