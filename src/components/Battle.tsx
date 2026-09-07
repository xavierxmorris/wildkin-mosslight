import { useState } from 'react'
import { AREAS, ELEMENTS, getMoves, SPECIES, WARDENS } from '../game/data'
import { captureChance, creatureName, effectiveness, MAX_ENERGY, maxHp } from '../game/engine'
import type { Action, GameState } from '../game/types'
import { CreatureArt } from './CreatureArt'
import { Icon } from './Icon'
import { ElementTag, HealthBar, Modal, Petals } from './ui'

export function BattleView({ state, send, onFinish }: { state: GameState; send: (action: Action) => void; onFinish: () => void }) {
  const [switching, setSwitching] = useState(false)
  const battle = state.battle
  if (!battle) return null
  const active = state.party.find(creature => creature.uid === battle.activeUid)
  if (!active) throw new Error('The active battle companion is missing.')
  const enemy = battle.enemy
  const enemySpecies = SPECIES[enemy.species]
  const area = AREAS[state.area]
  const activeSpecies = SPECIES[active.species]
  const moves = getMoves(active.species)
  const ongoing = battle.status === 'active'
  const warden = battle.warden ? WARDENS[battle.warden] : null
  const chance = Math.round(captureChance(enemy) * 100)
  const title = ongoing
    ? warden ? `${warden.name}'s challenge` : battle.kind === 'guardian' ? 'The light is waking.' : 'A rustle in the grass.'
    : battle.status === 'captured' ? 'A new little friendship.' : battle.status === 'won' ? warden ? 'A seal, well earned.' : battle.kind === 'guardian' ? 'You brought the light home.' : 'A little stronger together.' : battle.status === 'lost' ? 'A breather, not the end.' : 'See you down the trail.'

  return <Modal title={title} eyebrow={warden ? `${warden.title.toUpperCase()} / WARDEN CHALLENGE` : `${area.name.toUpperCase()} / ${battle.kind === 'guardian' ? 'GUARDIAN ENCOUNTER' : 'WILD ENCOUNTER'}`} onClose={ongoing ? undefined : onFinish} className="battle-modal" feedback={state.notice}>
    <div className={`battle-stage ${ongoing ? '' : `outcome-${battle.status}`}`}>
      <svg className="battle-scenery" viewBox="0 0 800 330" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="800" height="330" fill={area.sky} />
        <circle cx="616" cy="50" r="32" fill="#f3df9a" opacity=".7" />
        <path d="M0 161Q93 23 252 140 395 14 493 149 649 4 800 135V330H0Z" fill={area.trees} opacity=".18" />
        <path d="M0 178q150-110 290 0Q504 75 800 149v181H0Z" fill={area.ground} />
        <path d="M0 246q233-131 514-30 130 42 286-26v140H0Z" fill={area.grass} opacity=".24" />
        <path d="M0 330v-35q249-50 504 35" fill={area.grass} opacity=".25" />
        <ellipse cx="583" cy="208" rx="133" ry="25" fill="#8a9c70" opacity=".25" />
        <ellipse cx="202" cy="313" rx="152" ry="26" fill="#849b64" opacity=".24" />
        <path d="m38 210 3-12 4 8 6-19 3 22m656 71 6-17 4 9 8-20m-390 21 3-13 4 9 5-16" stroke={area.grass} strokeWidth="3" fill="none" opacity=".8" />
        <g fill="#faf4d2"><circle cx="60" cy="212" r="3" /><circle cx="726" cy="258" r="3" /><circle cx="356" cy="277" r="3" /></g>
      </svg>
      <div className="battle-health enemy-health">
        <div className="combatant-title"><h3>{creatureName(enemy)}</h3><span className="utility">LV {enemy.level}</span></div>
        <div className="combatant-tagline"><ElementTag element={enemySpecies.element} small />{enemy.luminous && <span className="luminous-label"><Icon name="star" size={12} />Luminous</span>}{battle.queue.length > 0 && <span className="utility">+{battle.queue.length} waiting</span>}</div>
        <HealthBar creature={enemy} />
      </div>
      <div key={`enemy-${battle.round}-${enemy.uid}`} className={`combatant enemy ${battle.effect === 'enemy' ? 'hit-animation' : ''} ${battle.status === 'captured' ? 'befriended' : ''}`}>
        <CreatureArt species={enemy.species} luminous={enemy.luminous} happy={battle.status === 'captured'} />
      </div>
      <div key={`ally-${battle.round}-${active.uid}`} className={`combatant ally ${battle.effect === 'guard' ? 'guard-animation' : ''}`}>
        <CreatureArt species={active.species} luminous={active.luminous} decorative />
        {battle.effect === 'guard' && <span className="guard-bubble" />}
      </div>
      {battle.effect === 'capture' && <div key={battle.round} className={`capture-pod ${battle.status === 'captured' ? 'capture-success' : ''}`}><Icon name="pod" size={42} /></div>}
      <div className="battle-health ally-health">
        <div className="combatant-title"><h3>{creatureName(active)}</h3><span className="utility">LV {active.level}</span></div>
        <div className="combatant-tagline"><ElementTag element={activeSpecies.element} small /><div className="energy" aria-label={`${battle.energy} of ${MAX_ENERGY} energy`}>{Array.from({ length: MAX_ENERGY }, (_, i) => <span key={i} className={i < battle.energy ? 'filled' : ''} />)}<span className="utility">ENERGY</span></div></div>
        <HealthBar creature={active} />
      </div>
    </div>
    <div className="battle-message" aria-live="polite" aria-atomic="true"><span className="message-spark"><Icon name={ongoing ? 'spark' : battle.status === 'captured' ? 'heart' : 'leaf'} size={18} /></span><div>{battle.log.slice(-2).map((line, i) => <p key={`${battle.round}-${i}`}>{line}</p>)}</div><span className="turn-indicator utility">TURN {battle.round}</span></div>
    {ongoing ? <>
      <div className="battle-command-heading"><h3>What will {creatureName(active)} do?</h3><span className="utility">YOUR MOVE</span></div>
      {switching ? <div className="battle-switch">
        <div className="inline-heading"><p>Calling a companion uses your turn.</p><button className="text-button" onClick={() => setSwitching(false)}>Back to moves<Icon name="close" size={15} /></button></div>
        <div className="switch-grid">{state.party.map(creature => <button className="switch-card" key={creature.uid} disabled={creature.hp === 0 || creature.uid === active.uid} onClick={() => { send({ type: 'SWITCH', uid: creature.uid }); setSwitching(false) }}>
          <CreatureArt species={creature.species} decorative /><span><strong>{creatureName(creature)}</strong><small>Lv. {creature.level} / {creature.hp} HP</small><HealthBar creature={creature} compact /></span>{creature.uid === active.uid ? <Icon name="check" size={16} /> : <Icon name="swap" size={16} />}
        </button>)}</div>
      </div> : <div className="move-grid">{moves.map((move, index) => {
        const multiplier = effectiveness(move.element, enemySpecies.element)
        return <button className={`move-button ${move.guard ? 'shelter-move' : ''}`} key={move.name} disabled={move.cost > battle.energy} onClick={() => send({ type: 'ATTACK', move: index })} title={move.description}>
          <span className="move-icon" style={{ backgroundColor: move.element === 'neutral' ? '#eaf0e3' : ELEMENTS[move.element].pale, color: move.element === 'neutral' ? '#577454' : ELEMENTS[move.element].color }}><Icon name={move.guard ? 'home' : move.element === 'neutral' ? 'spark' : move.element} /></span>
          <span className="move-name"><strong>{move.name}</strong><small>{move.guard ? 'Guard + recover 2 energy' : move.cost === 0 ? 'Attack + recover 1 energy' : `${move.cost} energy${multiplier > 1 ? ' / Strong match' : multiplier < 1 ? ' / Resisted' : ' / Elemental attack'}`}</small></span>
          <kbd>{index + 1}</kbd>
        </button>
      })}</div>}
      <div className="battle-tools">
        <button className="capture-button" disabled={battle.kind === 'warden' || state.inventory.pods === 0} onClick={() => send({ type: 'CAPTURE' })} title={battle.kind === 'warden' ? 'Warden companions cannot be befriended with a pod.' : 'Lower health improves the chance of making a friend.'}>
          <Icon name="pod" size={21} /><span>Bond pod <small>{state.inventory.pods} packed</small></span>{battle.kind !== 'warden' && <span className="chance">{chance}%</span>}
        </button>
        <button className="battle-tool" disabled={state.inventory.tonics === 0 || active.hp === maxHp(active)} onClick={() => send({ type: 'TONIC', uid: active.uid })}><Icon name="potion" /><span>Tonic<small>{state.inventory.tonics} packed</small></span></button>
        <button className="battle-tool" disabled={state.party.filter(c => c.hp > 0).length < 2} onClick={() => setSwitching(!switching)}><Icon name="swap" /><span>Switch<small>Companion</small></span></button>
        <button className="battle-tool retreat" onClick={() => send({ type: 'RUN' })}><Icon name="footsteps" /><span>Retreat<small>Leave safely</small></span></button>
      </div>
      <p className="battle-tip">{battle.kind === 'guardian' ? 'At 25% health or less, Solume always accepts a bond pod.' : battle.kind === 'warden' ? 'A warden battle ends when their whole team settles down. All your companions earn XP.' : 'A little patience goes a long way. Weaken a wildkin, then offer a bond pod.'}</p>
    </> : <div className="battle-outcome">
      <div className="outcome-summary">
        <span className="outcome-icon"><Icon name={battle.status === 'captured' ? 'heart' : battle.status === 'won' ? 'flag' : 'home'} size={26} /></span>
        <div><h3>{battle.status === 'captured' ? `Welcome, ${creatureName(enemy)}.` : battle.status === 'won' && warden ? warden.seal : battle.status === 'won' ? 'Growing, one adventure at a time.' : battle.status === 'lost' ? 'Everyone is safe and fully rested.' : 'There is always another path.'}</h3><p>{battle.status === 'captured' ? (state.party.some(c => c.uid === battle.caughtUid) ? 'Your new friend is waiting in your team.' : 'Your new friend is resting in your reserve sanctuary.') : battle.status === 'won' && warden ? 'A new region is open on your island map.' : battle.status === 'lost' ? 'Wren brought your team to the trail shelter. No companions were lost.' : 'The island will be here when you are ready.'}</p></div>
        {battle.reward > 0 && <Petals amount={battle.reward} />}
      </div>
      <button className="primary-button" onClick={onFinish}>Back to the trail<Icon name="arrow" /></button>
    </div>}
    <details className="battle-log"><summary>Encounter log</summary><ol>{battle.log.map((line, i) => <li key={i}>{line}</li>)}</ol></details>
  </Modal>
}
