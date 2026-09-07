import { AREAS, ELEMENTS, getMoves, ITEMS, QUESTS, SPECIES, STARTERS, WARDENS } from './data'
import type { Action, Battle, Creature, Element, GameState, Move, SpeciesId } from './types'
import { canWalk, nearbyLandmark, SPAWN, WORLDS } from './world'

export const MAX_LEVEL = 40
export const MAX_RESERVE = 120
export const MAX_ENERGY = 5

export function createGame(seed = 20260907): GameState {
  return {
    version: 1, started: false, name: 'Explorer', seed: (seed >>> 0) || 1, nextUid: 1,
    area: 'meadow', position: { ...SPAWN }, facing: 'down', steps: 0, encounterSteps: 0,
    party: [], reserve: [], seen: [], caught: [], captures: 0, wins: 0,
    seals: [], visited: ['meadow'], claimedQuests: [], openedChests: [],
    coins: 180, inventory: { pods: 10, tonics: 5, lures: 2 }, lureSteps: 0,
    battle: null, dialog: null, notice: null, completed: false,
  }
}

export function maxHp(creature: Pick<Creature, 'species' | 'level'>): number {
  return SPECIES[creature.species].baseHp + creature.level * 5
}

export function xpToNext(level: number): number {
  return 30 + level * 10
}

export function creatureName(creature: Creature): string {
  return creature.nickname || SPECIES[creature.species].name
}

// The random stream belongs to the save, keeping reducer replay and mid-battle reloads deterministic.
export function random(state: GameState): number {
  let value = state.seed
  value ^= value << 13
  value ^= value >>> 17
  value ^= value << 5
  state.seed = value >>> 0
  return state.seed / 4294967296
}

export function makeCreature(state: GameState, species: SpeciesId, level: number, luminous = false): Creature {
  const creature: Creature = {
    uid: state.nextUid++, species, nickname: '', level, xp: 0, hp: 0, luminous,
  }
  creature.hp = maxHp(creature)
  return creature
}

function register(list: SpeciesId[], species: SpeciesId): void {
  if (!list.includes(species)) list.push(species)
}

export function effectiveness(attack: Element | 'neutral', defense: Element): number {
  if (attack === 'neutral') return 1
  if (attack === defense) return 0.8
  if (ELEMENTS[attack].strong.includes(defense)) return 1.5
  if (ELEMENTS[defense].strong.includes(attack)) return 0.65
  return 1
}

export function damageFor(attacker: Creature, defender: Creature, move: Move, variance = 1): number {
  if (move.guard) return 0
  const attack = SPECIES[attacker.species]
  const defense = SPECIES[defender.species]
  const raw = move.power * 0.46 + (attack.attack + attacker.level * 1.8) * 0.68
    - (defense.defense + defender.level * 1.1) * 0.3
  const sameType = move.element === attack.element ? 1.15 : 1
  return Math.max(2, Math.floor(raw * sameType * effectiveness(move.element, defense.element) * variance))
}

export function captureChance(creature: Creature): number {
  const ratio = creature.hp / maxHp(creature)
  const rarity = SPECIES[creature.species].rarity
  if (rarity === 'guardian' && ratio <= 0.25) return 1
  const base = { common: 0.35, uncommon: 0.28, rare: 0.2, guardian: 0.08 }[rarity]
  return Math.min(0.95, base + (1 - ratio) * 0.65)
}

function notify(state: GameState, text: string): GameState {
  state.notice = text
  return state
}

function log(battle: Battle, text: string): void {
  battle.log = [...battle.log.slice(-7), text]
}

function healCollection(state: GameState): void {
  for (const creature of [...state.party, ...state.reserve]) creature.hp = maxHp(creature)
}

function startBattle(state: GameState, enemy: Creature, kind: Battle['kind'], queue: Creature[] = []): void {
  const active = state.party.find(creature => creature.hp > 0)
  if (!active) {
    notify(state, 'Your companions need a rest. Visit the cottage or use a meadow tonic.')
    return
  }
  state.battle = {
    kind, enemy, queue, activeUid: active.uid, energy: 3, round: 1, status: 'active',
    log: [kind === 'wild' ? `A wild ${creatureName(enemy)} rustles out of the grass!` : `${creatureName(enemy)} is ready to meet your team.`],
    reward: 0, effect: 'none',
  }
  register(state.seen, enemy.species)
  state.dialog = null
  state.encounterSteps = 0
}

function encounter(state: GameState): void {
  const area = AREAS[state.area]
  const sum = area.encounters.reduce((total, entry) => total + entry.weight, 0)
  let pick = random(state) * sum
  let species = area.encounters[0].species
  for (const entry of area.encounters) {
    pick -= entry.weight
    if (pick < 0) {
      species = entry.species
      break
    }
  }
  const level = area.levels[0] + Math.floor(random(state) * (area.levels[1] - area.levels[0] + 1))
  const luminous = random(state) < (state.lureSteps > 0 ? 1 / 16 : 1 / 100)
  startBattle(state, makeCreature(state, species, level, luminous), 'wild')
}

function awardExperience(state: GameState, amount: number): void {
  const announcements: string[] = []
  for (const creature of state.party) {
    if (creature.level === MAX_LEVEL) continue
    creature.xp += amount
    const oldLevel = creature.level
    const oldMax = maxHp(creature)
    const wasFainted = creature.hp === 0
    while (creature.xp >= xpToNext(creature.level) && creature.level < MAX_LEVEL) {
      creature.xp -= xpToNext(creature.level)
      creature.level++
    }
    if (creature.level === MAX_LEVEL) creature.xp = 0
    const species = SPECIES[creature.species]
    if (species.evolvesTo && creature.level >= (species.evolvesAt ?? MAX_LEVEL + 1)) {
      const oldName = species.name
      creature.species = species.evolvesTo
      register(state.seen, creature.species)
      register(state.caught, creature.species)
      announcements.push(`${oldName} grew into ${SPECIES[creature.species].name}!`)
    } else if (creature.level > oldLevel) {
      announcements.push(`${creatureName(creature)} reached level ${creature.level}.`)
    }
    creature.hp = wasFainted ? 0 : Math.min(maxHp(creature), creature.hp + maxHp(creature) - oldMax)
  }
  if (announcements.length) {
    state.notice = announcements.join(' ')
    if (state.battle) for (const announcement of announcements) log(state.battle, announcement)
  }
}

function enemyDefeated(state: GameState): void {
  const battle = state.battle
  if (!battle) return
  log(battle, `${creatureName(battle.enemy)} settles down. Your team earns ${battle.enemy.level * 16} XP each.`)
  awardExperience(state, battle.enemy.level * 16)
  const nextEnemy = battle.queue.shift()
  if (nextEnemy) {
    battle.enemy = nextEnemy
    register(state.seen, nextEnemy.species)
    battle.energy = Math.max(battle.energy, 3)
    log(battle, `${battle.warden ? WARDENS[battle.warden].name : 'The warden'} sends out ${creatureName(nextEnemy)}.`)
    return
  }
  battle.status = 'won'
  state.wins++
  if (battle.kind === 'warden' && battle.warden) {
    const warden = WARDENS[battle.warden]
    if (!state.seals.includes(warden.id)) state.seals.push(warden.id)
    battle.reward = warden.reward
    log(battle, `${warden.name} gives you the ${warden.seal.toLowerCase()}! A new trail is open.`)
    awardExperience(state, 80)
  } else if (battle.kind === 'guardian') {
    state.completed = true
    battle.reward = 750
    log(battle, 'Solume shares its light with you. Mosslight is whole again. Return to the altar to befriend it.')
  } else {
    battle.reward = 12 + battle.enemy.level * 9
  }
  state.coins += battle.reward
}

function enemyTurn(state: GameState, guarded = false): void {
  const battle = state.battle
  if (!battle || battle.status !== 'active') return
  const active = state.party.find(creature => creature.uid === battle.activeUid)
  if (!active) throw new Error('Battle invariant violated: active companion is not in the party.')
  const moves = getMoves(battle.enemy.species)
  const move = moves[battle.round % 4 === 0 ? 2 : random(state) < 0.75 ? 1 : 0]
  const damage = Math.max(1, Math.floor(damageFor(battle.enemy, active, move, 0.9 + random(state) * 0.16) * (guarded ? 0.5 : 1)))
  active.hp = Math.max(0, active.hp - damage)
  log(battle, `${creatureName(battle.enemy)} uses ${move.name}. ${guarded ? 'Shelter softens it to' : 'You take'} ${damage} damage.`)
  if (active.hp === 0) {
    log(battle, `${creatureName(active)} needs a breather.`)
    const replacement = state.party.find(creature => creature.hp > 0)
    if (replacement) {
      battle.activeUid = replacement.uid
      battle.energy = 3
      log(battle, `${creatureName(replacement)} steps in. You have got this.`)
    } else {
      battle.status = 'lost'
      const lost = Math.min(60, Math.floor(state.coins * 0.1))
      state.coins -= lost
      healCollection(state)
      state.position = { ...SPAWN }
      log(battle, `Wren brings everyone safely to the trail shelter. Your team is healed; supplies cost ${lost} petals.`)
    }
  }
}

const battleActions = new Set<Action['type']>(['ATTACK', 'CAPTURE', 'TONIC', 'SWITCH', 'RUN', 'END_BATTLE', 'DISMISS_NOTICE'])

export function gameReducer(current: GameState, action: Action): GameState {
  if (action.type === 'DISMISS_NOTICE' && !current.notice) return current
  const state = structuredClone(current)
  state.notice = null
  if (!state.started && action.type !== 'START') return notify(state, 'Choose a companion to start your adventure.')
  if (state.battle && !battleActions.has(action.type)) return notify(state, 'Finish the encounter before returning to the trail.')

  switch (action.type) {
    case 'START': {
      if (state.started) return notify(state, 'Your adventure is already underway.')
      if (!STARTERS.includes(action.starter)) return notify(state, 'Choose one of the three trail companions.')
      state.started = true
      state.name = action.name.trim().slice(0, 20) || 'Explorer'
      const creature = makeCreature(state, action.starter, 5)
      state.party = [creature]
      state.seen = [creature.species]
      state.caught = [creature.species]
      return notify(state, `Welcome to Mosslight, ${state.name}. Click the trail or use the arrow keys to explore.`)
    }
    case 'MOVE': {
      if (state.dialog) return state
      if (!Number.isInteger(action.dx) || !Number.isInteger(action.dy) || Math.abs(action.dx) + Math.abs(action.dy) !== 1) return notify(state, 'Move one trail tile at a time.')
      state.facing = action.dx === 1 ? 'right' : action.dx === -1 ? 'left' : action.dy === 1 ? 'down' : 'up'
      const position = { x: state.position.x + action.dx, y: state.position.y + action.dy }
      if (!canWalk(state.area, position)) return notify(state, 'There is no trail that way. Try the path around.')
      state.position = position
      state.steps++
      if (WORLDS[state.area].tiles[position.y][position.x] === 'grass') {
        state.encounterSteps = Math.min(8, state.encounterSteps + 1)
        if (state.encounterSteps >= 2 && (random(state) < (state.lureSteps > 0 ? 0.45 : 0.24) || state.encounterSteps >= 8)) encounter(state)
      }
      state.lureSteps = Math.max(0, state.lureSteps - 1)
      return state
    }
    case 'INTERACT': {
      const landmark = nearbyLandmark(state.area, state.position, action.id)
      if (!landmark) return notify(state, 'Walk next to a person, cottage, cart, or signpost to interact.')
      if (landmark.kind === 'chest') {
        if (state.openedChests.includes(state.area)) return notify(state, 'You already collected this trail cache. Leave a little wonder for the next explorer.')
        state.openedChests.push(state.area)
        const petals = 90 + AREAS[state.area].requiredSeals * 45
        state.coins += petals
        state.inventory.pods += 3
        state.inventory.tonics++
        return notify(state, `Trail cache found! ${petals} petals, 3 bond pods, and a meadow tonic.`)
      }
      state.dialog = { kind: landmark.kind, id: landmark.id }
      return state
    }
    case 'CLOSE_DIALOG':
      state.dialog = null
      return state
    case 'REST':
      if (state.dialog?.kind !== 'rest' || !nearbyLandmark(state.area, state.position, 'cottage')) return notify(state, 'Visit a rest cottage to heal your companions.')
      healCollection(state)
      state.dialog = null
      return notify(state, 'A little tea, a little sunshine. Every companion is fully rested, including your reserves.')
    case 'TRAVEL': {
      const area = AREAS[action.area]
      if (state.seals.length < area.requiredSeals) return notify(state, `The way to ${area.name} opens after ${area.requiredSeals} warden seals.`)
      state.area = area.id
      state.position = { ...SPAWN }
      state.facing = 'down'
      state.encounterSteps = 0
      state.dialog = null
      if (!state.visited.includes(area.id)) state.visited.push(area.id)
      return notify(state, `Welcome to ${area.name}. ${area.subtitle}.`)
    }
    case 'CHALLENGE': {
      const warden = WARDENS[action.warden]
      if (state.area !== warden.area || !nearbyLandmark(state.area, state.position, 'warden')) return notify(state, 'Meet the warden in their clearing first.')
      if (state.seals.includes(warden.id)) return notify(state, `${warden.name} has already awarded you their seal. The next trail is waiting.`)
      const enemies = warden.roster.map(entry => makeCreature(state, entry.species, entry.level))
      startBattle(state, enemies[0], 'warden', enemies.slice(1))
      if (state.battle) state.battle.warden = warden.id
      return state
    }
    case 'AWAKEN':
      if (state.area !== 'sanctum' || state.seals.length < 4 || !nearbyLandmark(state.area, state.position, 'altar')) return notify(state, 'Bring all four seals to the Firstlight altar.')
      if (state.caught.includes('solume')) return notify(state, 'The altar glows softly. Solume is already walking beside you.')
      startBattle(state, makeCreature(state, 'solume', 16), 'guardian')
      return state
    case 'ATTACK': {
      const battle = state.battle
      if (!battle || battle.status !== 'active') return notify(state, 'There is no active encounter.')
      const active = state.party.find(creature => creature.uid === battle.activeUid)
      if (!active) throw new Error('Battle invariant violated: missing active companion.')
      const move = getMoves(active.species)[action.move]
      if (!move) return notify(state, 'Choose one of your companion\'s four moves.')
      if (move.cost > battle.energy) return notify(state, 'Not enough energy. Quick bump and Take shelter restore it.')
      battle.energy = Math.min(MAX_ENERGY, battle.energy - move.cost + (move.guard ? 2 : move.cost === 0 ? 1 : 0))
      battle.round++
      if (move.guard) {
        battle.effect = 'guard'
        log(battle, `${creatureName(active)} takes shelter and recovers 2 energy.`)
        enemyTurn(state, true)
        return state
      }
      const damage = damageFor(active, battle.enemy, move, 0.92 + random(state) * 0.16)
      battle.enemy.hp = Math.max(0, battle.enemy.hp - damage)
      const multiplier = effectiveness(move.element, SPECIES[battle.enemy.species].element)
      battle.effect = 'enemy'
      log(battle, `${creatureName(active)} uses ${move.name} for ${damage} damage.${multiplier > 1 ? ' A strong match!' : multiplier < 1 ? ' Not very effective.' : ''}`)
      if (battle.enemy.hp === 0) enemyDefeated(state)
      else enemyTurn(state)
      return state
    }
    case 'CAPTURE': {
      const battle = state.battle
      if (!battle || battle.status !== 'active') return notify(state, 'Bond pods are for active wild encounters.')
      if (battle.kind === 'warden') return notify(state, 'A warden\'s companion already has a home.')
      if (state.inventory.pods < 1) return notify(state, 'No bond pods left. Visit the supply cart or claim a field-note reward.')
      if (state.party.length >= 6 && state.reserve.length >= MAX_RESERVE) return notify(state, 'Your sanctuary is full. All 126 companion spaces are occupied.')
      state.inventory.pods--
      battle.round++
      battle.effect = 'capture'
      if (random(state) < captureChance(battle.enemy)) {
        const caught = structuredClone(battle.enemy)
        caught.hp = Math.max(1, caught.hp)
        if (state.party.length < 6) state.party.push(caught)
        else state.reserve.push(caught)
        register(state.caught, caught.species)
        state.captures++
        battle.status = 'captured'
        battle.caughtUid = caught.uid
        log(battle, `${creatureName(caught)} chose you! ${state.party.some(c => c.uid === caught.uid) ? 'Your team' : 'Your reserve sanctuary'} has a new friend.`)
        awardExperience(state, caught.level * 9)
        if (battle.kind === 'guardian') {
          state.completed = true
          state.coins += 750
          battle.reward = 750
          log(battle, 'Solume shares its light with you. You brought the light home.')
        }
      } else {
        log(battle, `${creatureName(battle.enemy)} is not quite ready. Try weakening it a little more.`)
        enemyTurn(state)
      }
      return state
    }
    case 'TONIC': {
      const battle = state.battle
      if (battle && battle.status !== 'active') return notify(state, 'Return to the trail before using another item.')
      const target = [...state.party, ...(battle ? [] : state.reserve)].find(creature => creature.uid === action.uid)
      if (!target) return notify(state, 'Choose a companion from your team.')
      if (state.inventory.tonics < 1) return notify(state, 'No meadow tonics left. Rest at a cottage for free.')
      if (target.hp === maxHp(target)) return notify(state, `${creatureName(target)} is already feeling great.`)
      const restored = Math.min(55, maxHp(target) - target.hp)
      target.hp += restored
      state.inventory.tonics--
      if (battle) {
        battle.round++
        battle.effect = 'ally'
        log(battle, `${creatureName(target)} recovers ${restored} HP.`)
        enemyTurn(state)
      } else notify(state, `${creatureName(target)} recovers ${restored} HP.`)
      return state
    }
    case 'SWITCH': {
      const battle = state.battle
      if (!battle || battle.status !== 'active') return notify(state, 'Use the team menu to choose your trail companion.')
      const target = state.party.find(creature => creature.uid === action.uid)
      if (!target || target.hp <= 0) return notify(state, 'Choose a companion who is ready to battle.')
      if (target.uid === battle.activeUid) return notify(state, `${creatureName(target)} is already out.`)
      battle.activeUid = target.uid
      battle.energy = 3
      battle.round++
      battle.effect = 'ally'
      log(battle, `${creatureName(target)} steps forward! Switching uses your turn.`)
      enemyTurn(state)
      return state
    }
    case 'RUN':
      if (!state.battle || state.battle.status !== 'active') return notify(state, 'There is no active encounter to leave.')
      state.battle.status = 'fled'
      log(state.battle, 'You give each other a little space and return to the trail.')
      return state
    case 'END_BATTLE':
      if (state.battle?.status === 'active') return notify(state, 'Finish the encounter or choose to retreat first.')
      state.battle = null
      return state
    case 'BUY': {
      if (state.dialog?.kind !== 'shop' || !nearbyLandmark(state.area, state.position, 'shop')) return notify(state, 'Visit the supply cart to buy trail supplies.')
      if (!Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > 10) return notify(state, 'Choose between 1 and 10 items.')
      const item = ITEMS[action.item]
      const cost = item.price * action.quantity
      if (state.coins < cost) return notify(state, `You need ${cost - state.coins} more petals. Battles and field notes earn more.`)
      state.coins -= cost
      state.inventory[action.item] += action.quantity
      return notify(state, `Packed ${action.quantity} ${action.quantity === 1 ? item.singular.toLowerCase() : item.name.toLowerCase()}. Happy trails!`)
    }
    case 'USE_LURE':
      if (state.inventory.lures < 1) return notify(state, 'No starlight lures left. The supply cart has more.')
      if (state.lureSteps > 0) return notify(state, `Your current lure still has ${state.lureSteps} steps left.`)
      state.inventory.lures--
      state.lureSteps = 40
      return notify(state, 'Starlight drifts through the grass. More encounters and luminous wildkin for 40 steps.')
    case 'LEAD': {
      const index = state.party.findIndex(creature => creature.uid === action.uid)
      if (index < 0 || state.party[index].hp === 0) return notify(state, 'Choose a rested companion to lead the way.')
      const [creature] = state.party.splice(index, 1)
      state.party.unshift(creature)
      return notify(state, `${creatureName(creature)} is leading the way.`)
    }
    case 'SWAP_RESERVE': {
      const partyIndex = state.party.findIndex(creature => creature.uid === action.partyUid)
      const reserveIndex = state.reserve.findIndex(creature => creature.uid === action.reserveUid)
      if (partyIndex < 0 || reserveIndex < 0) return notify(state, 'Choose one team companion and one reserve companion.')
      const previous = state.party[partyIndex]
      state.party[partyIndex] = state.reserve[reserveIndex]
      state.reserve[reserveIndex] = previous
      return notify(state, `${creatureName(state.party[partyIndex])} joins the trail team.`)
    }
    case 'ADD_TO_PARTY': {
      if (state.party.length >= 6) return notify(state, 'Your team is full. Swap a companion with a reserve instead.')
      const index = state.reserve.findIndex(creature => creature.uid === action.uid)
      if (index < 0) return notify(state, 'Choose a companion from your reserves.')
      const [creature] = state.reserve.splice(index, 1)
      state.party.push(creature)
      return notify(state, `${creatureName(creature)} joins the team.`)
    }
    case 'NICKNAME': {
      const creature = [...state.party, ...state.reserve].find(entry => entry.uid === action.uid)
      if (!creature) return notify(state, 'That companion is not in your collection.')
      creature.nickname = action.name.trim().slice(0, 20)
      return notify(state, `Your companion is now called ${creatureName(creature)}.`)
    }
    case 'CLAIM_QUEST': {
      const quest = QUESTS.find(entry => entry.id === action.id)
      if (!quest || quest.progress(state) < quest.goal) return notify(state, 'There is a little more exploring to do for that field note.')
      if (state.claimedQuests.includes(quest.id)) return notify(state, 'You already collected that field-note reward.')
      state.claimedQuests.push(quest.id)
      state.coins += quest.reward
      state.inventory.pods += quest.pods ?? 0
      return notify(state, `Field note complete: ${quest.title}. +${quest.reward} petals${quest.pods ? ` and ${quest.pods} bond pods` : ''}.`)
    }
    case 'DISMISS_NOTICE':
      return state
  }
}
