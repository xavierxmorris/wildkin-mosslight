import { useState } from 'react'
import { AREAS, ELEMENTS, getMoves, ITEMS, QUESTS, SPECIES, WARDENS } from '../game/data'
import { creatureName, effectiveness, maxHp } from '../game/engine'
import { AREA_IDS, ELEMENT_IDS, SPECIES_IDS, WARDEN_IDS } from '../game/types'
import type { Action, Creature, GameState, ItemId, SpeciesId } from '../game/types'
import { CreatureArt } from './CreatureArt'
import { Icon } from './Icon'
import { ExplorerSprite, IslandIllustration } from './World'
import { ElementTag, ExperienceBar, HealthBar, Modal, Petals } from './ui'

interface PanelProps { state: GameState; send: (action: Action) => void; onClose: () => void }

function habitat(id: SpeciesId): string {
  if (id === 'solume') return 'Answer the call at Firstlight Sanctuary.'
  const preEvolution = Object.values(SPECIES).find(species => species.evolvesTo === id)
  if (preEvolution) return `Raise ${preEvolution.name} to level ${preEvolution.evolvesAt}.`
  return Object.values(AREAS).filter(area => area.encounters.some(encounter => encounter.species === id)).map(area => area.name).join(', ')
}

export function GuidePanel({ state, onClose }: Omit<PanelProps, 'send'>) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [element, setElement] = useState('all')
  const [selected, setSelected] = useState<SpeciesId | null>(null)
  const filtered = SPECIES_IDS.filter(id => {
    const species = SPECIES[id]
    const seen = state.seen.includes(id)
    return (filter === 'all' || (filter === 'befriended' ? state.caught.includes(id) : seen))
      && (element === 'all' || (seen && species.element === element))
      && (!query || (seen && species.name.toLowerCase().includes(query.toLowerCase())))
  })
  return <Modal title="Every little wonder." eyebrow="YOUR MOSSLIGHT FIELD GUIDE" onClose={onClose} className="guide-modal">
    <div className="guide-summary"><p>Not a checklist. A collection of encounters.</p><div><strong>{state.seen.length}<small>SEEN</small></strong><span /><strong>{state.caught.length}<small>BEFRIENDED</small></strong><span /><strong>24<small>TO DISCOVER</small></strong></div></div>
    {selected ? (() => {
      const species = SPECIES[selected]
      const seen = state.seen.includes(selected)
      const owned = state.caught.includes(selected)
      return <div className="guide-detail">
        <button className="text-button" onClick={() => setSelected(null)}><Icon name="arrow" className="flip" size={16} />Back to all wildkin</button>
        <div className="guide-detail-layout">
          <div className={`guide-portrait ${seen ? '' : 'undiscovered'}`} style={{ backgroundColor: seen ? ELEMENTS[species.element].pale : '#edf0e5' }}><span className="field-number">NO. {String(SPECIES_IDS.indexOf(selected) + 1).padStart(2, '0')}</span><CreatureArt species={selected} decorative /><span className="portrait-caption">{owned ? 'A FRIEND OF YOURS' : seen ? 'A FAMILIAR FACE' : 'A STORY STILL TO FIND'}</span></div>
          <div><span className="eyebrow">{seen ? species.personality : 'SOMEWHERE ON MOSSLIGHT'}</span><h3>{seen ? species.name : 'An undiscovered wildkin'}</h3>{seen && <ElementTag element={species.element} />}<p>{owned ? species.description : seen ? 'You have crossed paths. Befriend this wildkin to complete its field notes.' : 'Every path holds a little surprise. This page is waiting for yours.'}</p><div className="habitat-box"><Icon name="map" size={20} /><div><span className="eyebrow">WHERE TO LOOK</span><p>{habitat(selected)}</p></div></div>{species.evolvesTo && seen && <div className="evolution-note"><Icon name="spark" size={18} />Grows into {SPECIES[species.evolvesTo].name} at level {species.evolvesAt}.</div>}</div>
        </div>
      </div>
    })() : <>
      <div className="guide-filters"><div className="segmented-control" aria-label="Field guide filter">{['all', 'seen', 'befriended'].map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>{value === 'all' ? 'All wildkin' : value === 'seen' ? 'Seen' : 'Befriended'}</button>)}</div><label className="sr-only" htmlFor="guide-element">Filter by element</label><select id="guide-element" value={element} onChange={event => setElement(event.target.value)}><option value="all">Every element</option>{ELEMENT_IDS.map(id => <option value={id} key={id}>{ELEMENTS[id].name}</option>)}</select><label className="sr-only" htmlFor="guide-search">Search discovered wildkin</label><input id="guide-search" type="search" placeholder="Find a familiar face..." value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="dex-grid">{filtered.map(id => {
        const species = SPECIES[id]
        const seen = state.seen.includes(id)
        const owned = state.caught.includes(id)
        return <button key={id} className={`dex-card ${seen ? '' : 'undiscovered'}`} onClick={() => setSelected(id)} aria-label={`View ${seen ? species.name : `field entry ${SPECIES_IDS.indexOf(id) + 1}`}`}>
          <div className="dex-card-top"><span className="utility">NO. {String(SPECIES_IDS.indexOf(id) + 1).padStart(2, '0')}</span>{owned ? <Icon name="check" size={15} /> : <span className="unfilled-dot" />}</div>
          <CreatureArt species={id} decorative /><h3>{seen ? species.name : '???'}</h3>{seen ? <ElementTag element={species.element} small /> : <span className="unknown-type">Waiting to be found</span>}
        </button>
      })}</div>
      {filtered.length === 0 && <div className="empty-state"><Icon name="book" size={32} /><h3>No field notes here yet.</h3><p>Try a different filter, or head back to the grass to meet someone new.</p></div>}
    </>}
  </Modal>
}

export function TeamPanel({ state, send, onClose, initialUid }: PanelProps & { initialUid?: number }) {
  const [tab, setTab] = useState<'team' | 'reserve'>('team')
  const [selectedUid, setSelectedUid] = useState(initialUid ?? state.party[0]?.uid)
  const collection = [...state.party, ...state.reserve]
  const selected = collection.find(creature => creature.uid === selectedUid) ?? state.party[0]
  const species = SPECIES[selected.species]
  const inParty = state.party.some(creature => creature.uid === selected.uid)
  const list = tab === 'team' ? state.party : state.reserve
  return <Modal title="Better, together." eyebrow="YOUR TRAIL COMPANIONS" onClose={onClose} className="team-modal" feedback={state.notice}>
    <div className="segmented-control team-tabs"><button className={tab === 'team' ? 'active' : ''} aria-pressed={tab === 'team'} onClick={() => setTab('team')}>Trail team <span>{state.party.length}/6</span></button><button className={tab === 'reserve' ? 'active' : ''} aria-pressed={tab === 'reserve'} onClick={() => setTab('reserve')}>Reserve sanctuary <span>{state.reserve.length}</span></button></div>
    <div className="team-panel-layout">
      <div className="team-list">{list.map(creature => <button key={creature.uid} className={`team-list-card ${selected.uid === creature.uid ? 'selected' : ''}`} onClick={() => setSelectedUid(creature.uid)}>
        <CreatureArt species={creature.species} luminous={creature.luminous} decorative /><div><strong>{creatureName(creature)}</strong><span className="utility">LV {creature.level} {creature.hp === 0 ? '/ RESTING' : ''}</span><HealthBar creature={creature} compact /></div>{state.party[0]?.uid === creature.uid && <span className="lead-pill">LEAD</span>}
      </button>)}{list.length === 0 && <div className="empty-state"><Icon name="home" size={28} /><h3>A quiet sanctuary.</h3><p>Once your team has six friends, new companions rest here. They are never lost or released.</p></div>}</div>
      <div className="companion-detail">
        <div className="companion-portrait" style={{ backgroundColor: ELEMENTS[species.element].pale }}><CreatureArt species={selected.species} luminous={selected.luminous} /><span className="portrait-level utility">LEVEL {selected.level}</span>{selected.luminous && <span className="luminous-label"><Icon name="star" size={13} />Luminous</span>}</div>
        <div className="inline-heading"><h3>{creatureName(selected)}</h3><ElementTag element={species.element} /></div>
        <p className="companion-description">{species.description}</p>
        <HealthBar creature={selected} /><ExperienceBar creature={selected} />
        <div className="companion-stats"><span><strong>{maxHp(selected)}</strong>MAX HP</span><span><strong>{species.attack}</strong>BASE POWER</span><span><strong>{species.defense}</strong>BASE DEFENSE</span></div>
        <CompanionMoves creature={selected} />
        {species.evolvesTo && <p className="evolution-note"><Icon name="spark" size={16} />Grows into {SPECIES[species.evolvesTo].name} at level {species.evolvesAt}.</p>}
        <form className="nickname-form" key={`${selected.uid}-${selected.nickname}`} onSubmit={event => {
          event.preventDefault()
          const name = new FormData(event.currentTarget).get('nickname')
          if (typeof name === 'string') send({ type: 'NICKNAME', uid: selected.uid, name })
        }}><label htmlFor="companion-nickname">A name between friends</label><div><input id="companion-nickname" name="nickname" maxLength={20} placeholder={species.name} defaultValue={selected.nickname} /><button className="secondary-button" type="submit">Save name</button></div></form>
        <div className="companion-actions">
          {inParty ? <button className="primary-button" disabled={state.party[0].uid === selected.uid || selected.hp === 0} onClick={() => send({ type: 'LEAD', uid: selected.uid })}><Icon name="flag" size={17} />{state.party[0].uid === selected.uid ? 'Leading the way' : 'Lead the way'}</button> : state.party.length < 6 ? <button className="primary-button" onClick={() => send({ type: 'ADD_TO_PARTY', uid: selected.uid })}><Icon name="plus" size={17} />Add to team</button> : <form className="reserve-swap" onSubmit={event => {
            event.preventDefault()
            const partyUid = Number(new FormData(event.currentTarget).get('partyUid'))
            send({ type: 'SWAP_RESERVE', partyUid, reserveUid: selected.uid })
          }}><label className="sr-only" htmlFor="reserve-swap">Team companion to swap with</label><select id="reserve-swap" name="partyUid">{state.party.map(creature => <option key={creature.uid} value={creature.uid}>Swap with {creatureName(creature)}</option>)}</select><button className="secondary-button" type="submit"><Icon name="swap" size={17} />Swap</button></form>}
          <button className="secondary-button" disabled={selected.hp === maxHp(selected) || state.inventory.tonics === 0} onClick={() => send({ type: 'TONIC', uid: selected.uid })}><Icon name="potion" size={17} />Use tonic ({state.inventory.tonics})</button>
        </div>
      </div>
    </div>
  </Modal>
}

export function BagPanel({ state, send, onClose }: PanelProps) {
  const [target, setTarget] = useState(state.party.find(c => c.hp < maxHp(c))?.uid ?? state.party[0].uid)
  return <Modal title="A little preparation." eyebrow="YOUR TRAIL SATCHEL" onClose={onClose} className="bag-modal" feedback={state.notice}>
    <div className="satchel-intro"><Icon name="bag" size={38} /><p>Just the essentials for the next little adventure.</p><Petals amount={state.coins} /></div>
    <div className="inventory-list">{(['pods', 'tonics', 'lures'] satisfies ItemId[]).map(id => <article className={`inventory-item item-${id}`} key={id}>
      <div className="item-art"><Icon name={id === 'pods' ? 'pod' : id === 'tonics' ? 'potion' : 'lure'} size={40} /></div><div className="item-copy"><div className="inline-heading"><h3>{ITEMS[id].name}</h3><span className="item-quantity">{state.inventory[id]}</span></div><p>{ITEMS[id].description}</p>
        {id === 'tonics' && <div className="item-actions"><label className="sr-only" htmlFor="tonic-target">Companion to heal</label><select id="tonic-target" value={target} onChange={event => setTarget(Number(event.target.value))}>{state.party.map(creature => <option value={creature.uid} key={creature.uid}>{creatureName(creature)} / {creature.hp} of {maxHp(creature)} HP</option>)}</select><button className="secondary-button" disabled={state.inventory.tonics === 0 || state.party.find(c => c.uid === target)?.hp === maxHp(state.party.find(c => c.uid === target) ?? state.party[0])} onClick={() => send({ type: 'TONIC', uid: target })}>Use tonic</button></div>}
        {id === 'lures' && <button className="secondary-button" disabled={state.inventory.lures === 0 || state.lureSteps > 0} onClick={() => send({ type: 'USE_LURE' })}>{state.lureSteps > 0 ? `Lure active / ${state.lureSteps} steps` : 'Use starlight lure'}</button>}
        {id === 'pods' && <span className="item-hint">Offer one during a wild encounter.</span>}
      </div>
    </article>)}</div>
    <div className="quiet-note"><Icon name="home" size={19} /><p>Running low? Rest cottages heal your whole collection for free. Battles, caches, and field notes earn petals.</p></div>
  </Modal>
}

export function MapPanel({ state, send, onClose }: PanelProps) {
  return <Modal title="There is more out there." eyebrow="THE ISLAND OF MOSSLIGHT" onClose={onClose} className="map-modal" feedback={state.notice}>
    <div className="island-map-art"><IslandIllustration /><span className="map-legend"><Icon name="flag" size={15} />{state.seals.length} of 4 warden seals</span></div>
    <div className="region-list">{AREA_IDS.map((id, index) => {
      const area = AREAS[id]
      const unlocked = state.seals.length >= area.requiredSeals
      const current = state.area === id
      return <button className={`region-card ${current ? 'current' : ''}`} key={id} disabled={!unlocked || current} onClick={() => { send({ type: 'TRAVEL', area: id }); onClose() }}>
        <span className="region-symbol" style={{ backgroundColor: area.sky, color: area.accent }}><Icon name={!unlocked ? 'lock' : area.warden ? WARDENS[area.warden].element : 'sun'} size={24} /></span>
        <span className="region-copy"><span className="utility">TRAIL {String(index + 1).padStart(2, '0')} / LEVEL {area.levels.join('-')}</span><strong>{area.name}</strong><small>{!unlocked ? `Opens with ${area.requiredSeals} warden ${area.requiredSeals === 1 ? 'seal' : 'seals'}` : area.subtitle}</small></span>
        <span className="region-status">{current ? 'YOU ARE HERE' : !unlocked ? <Icon name="lock" size={17} /> : <><span>Travel</span><Icon name="arrow" size={18} /></>}</span>
      </button>
    })}</div>
    <p className="quiet-note">Travel between unlocked regions whenever you are outside an encounter. Your companions keep their current health.</p>
  </Modal>
}

export function JournalPanel({ state, send, onClose }: PanelProps) {
  return <Modal title="Notes from the trail." eyebrow="WREN'S EXPLORER JOURNAL" onClose={onClose} className="journal-modal" feedback={state.notice}>
    <p className="panel-intro">Small milestones, little rewards. There is no hurry to fill every page.</p>
    <div className="quest-list">{QUESTS.map(quest => {
      const claimed = state.claimedQuests.includes(quest.id)
      const progress = Math.min(quest.goal, quest.progress(state))
      const ready = progress === quest.goal
      return <article className={`quest-row ${claimed ? 'claimed' : ''}`} key={quest.id}>
        <span className={`quest-marker ${ready ? 'ready' : ''}`}><Icon name={claimed ? 'check' : ready ? 'star' : 'book'} size={21} /></span>
        <div className="quest-copy"><h3>{quest.title}</h3><p>{quest.description}</p><div className="quest-progress"><div><span style={{ width: `${progress / quest.goal * 100}%` }} /></div><span className="utility">{progress}/{quest.goal}</span></div></div>
        <div className="quest-reward"><Petals amount={quest.reward} />{claimed ? <span className="utility">COLLECTED</span> : <button className={ready ? 'primary-button small-button' : 'secondary-button small-button'} disabled={!ready} onClick={() => send({ type: 'CLAIM_QUEST', id: quest.id })}>{ready ? 'Collect reward' : 'In progress'}</button>}</div>
      </article>
    })}</div>
  </Modal>
}

export function InteractionPanel({ state, send, onClose, onGuide }: PanelProps & { onGuide: () => void }) {
  const dialog = state.dialog
  if (!dialog) return null
  if (dialog.kind === 'gate') return <MapPanel state={state} send={send} onClose={onClose} />
  const area = AREAS[state.area]
  const warden = area.warden ? WARDENS[area.warden] : null
  const cleared = Boolean(warden && state.seals.includes(warden.id))
  const title = dialog.kind === 'rest' ? 'Put your feet up.' : dialog.kind === 'shop' ? 'Good things for the road.' : dialog.kind === 'warden' && warden ? `A moment with ${warden.name}.` : dialog.kind === 'altar' ? 'The first light of Mosslight.' : 'A word from Wren.'
  return <Modal title={title} eyebrow={dialog.kind === 'shop' ? "NELL'S TRAVELING SUPPLY CART" : dialog.kind === 'rest' ? 'THE TRAIL SHELTER / ALWAYS FREE' : dialog.kind === 'warden' && warden ? warden.title.toUpperCase() : dialog.kind === 'altar' ? 'FIRSTLIGHT SANCTUARY' : 'PROFESSOR WREN / FIELD RESEARCHER'} onClose={onClose} className={`interaction-modal interaction-${dialog.kind}`} feedback={state.notice}>
    {dialog.kind === 'rest' && <>
      <div className="rest-illustration"><span className="rest-sun"><Icon name="sun" size={70} /></span><CreatureArt species={state.party[0].species} happy decorative /><span className="rest-zzz">z z z</span></div>
      <p className="dialogue-copy">A warm cup, a quiet corner, and all the time in the world. Your whole collection can rest here, including friends in the sanctuary.</p>
      <button className="primary-button full-width" onClick={() => send({ type: 'REST' })}><Icon name="heart" size={19} />Rest all companions / Free</button>
    </>}
    {dialog.kind === 'shop' && <>
      <div className="shop-welcome"><p>"Pack light. Leave room for stories."</p><Petals amount={state.coins} /></div>
      <div className="shop-items">{(['pods', 'tonics', 'lures'] satisfies ItemId[]).map(item => <article className={`shop-item item-${item}`} key={item}><span className="item-art"><Icon name={item === 'pods' ? 'pod' : item === 'tonics' ? 'potion' : 'lure'} size={36} /></span><div><h3>{ITEMS[item].name}</h3><p>{ITEMS[item].description}</p><span className="utility">{state.inventory[item]} IN YOUR SATCHEL</span></div><button className="secondary-button" disabled={state.coins < ITEMS[item].price} onClick={() => send({ type: 'BUY', item, quantity: 1 })} aria-label={`Buy ${ITEMS[item].singular}`}><span>Buy 1</span><Petals amount={ITEMS[item].price} /></button></article>)}</div>
    </>}
    {dialog.kind === 'warden' && warden && <>
      <div className="npc-dialogue"><div className="npc-portrait" style={{ backgroundColor: ELEMENTS[warden.element].pale }}><svg viewBox="-28 -53 56 74" aria-hidden="true"><ExplorerSprite npc color={ELEMENTS[warden.element].color} /></svg></div><p>"{cleared ? warden.after : warden.greeting}"</p></div>
      <div className="warden-roster">{warden.roster.map((entry, i) => <div key={i}><CreatureArt species={entry.species} decorative /><strong>{SPECIES[entry.species].name}</strong><span className="utility">LEVEL {entry.level}</span></div>)}</div>
      <div className="warden-prize"><Icon name="flag" size={19} /><span>{warden.seal} + a new trail</span><Petals amount={warden.reward} /></div>
      {cleared ? <button className="primary-button full-width" onClick={onClose}><Icon name="check" />Seal earned</button> : <button className="primary-button full-width" onClick={() => send({ type: 'CHALLENGE', warden: warden.id })}>Challenge {warden.name}<Icon name="arrow" /></button>}
      {!cleared && <p className="battle-tip">A rested team of two or more companions helps. You can retreat and try again any time.</p>}
    </>}
    {dialog.kind === 'researcher' && <>
      <div className="npc-dialogue"><div className="npc-portrait"><svg viewBox="-28 -53 56 74" aria-hidden="true"><ExplorerSprite npc color="#d4cc9d" /></svg></div><p>"{state.completed ? 'You did not conquer this island. You got to know it. I cannot think of a better kind of adventure.' : state.captures === 0 ? 'Ah, a new pair of muddy boots! Walk into the tall grass to meet wildkin. Weaken one gently, then offer it a bond pod. Friendship takes a little patience.' : state.seals.length === 0 ? 'Look at you, making friends already! Rowan is waiting in the clearing to the east. Rest up and bring a couple of companions. Every team member earns experience.' : 'Follow your curiosity, not just your map. Some wildkin grow into entirely new companions as they level up. And a luminous one? Now that is a story worth writing down.'}"</p></div>
      <div className="research-stats"><span><strong>{state.caught.length}/24</strong>FIELD ENTRIES</span><span><strong>{state.captures}</strong>NEW FRIENDSHIPS</span><span><strong>{state.seals.length}/4</strong>WARDEN SEALS</span></div>
      <button className="primary-button full-width" onClick={onGuide}><Icon name="book" size={18} />Open field guide</button>
    </>}
    {dialog.kind === 'altar' && <>
      <div className="altar-portrait"><CreatureArt species="solume" decorative happy={state.caught.includes('solume')} /></div>
      <p className="dialogue-copy">{state.caught.includes('solume') ? 'The altar is quiet now. The light that once waited here is walking beside you. There are still little wonders left to find.' : 'Your four seals begin to glow. Beyond the leaves, something ancient and gentle stirs. Solume is not a prize to win. It is a light to share.'}</p>
      <div className="altar-seals">{WARDEN_IDS.map(id => <span key={id} style={{ color: ELEMENTS[WARDENS[id].element].color, backgroundColor: ELEMENTS[WARDENS[id].element].pale }}><Icon name={WARDENS[id].element} size={26} /></span>)}</div>
      {state.caught.includes('solume') ? <button className="primary-button full-width" onClick={onClose}>Keep wandering<Icon name="arrow" /></button> : <><button className="primary-button full-width" onClick={() => send({ type: 'AWAKEN' })}><Icon name="sun" size={20} />Call to Solume</button><p className="battle-tip">Weaken Solume to 25% health or less for a guaranteed bond. If it faints, you can return and try again.</p></>}
    </>}
  </Modal>
}

export function SettingsPanel({ onClose, onExport, onImport, onReset, onSound, sound, calm, onCalm, saveError, started }: {
  onClose: () => void; onExport: () => void; onImport: () => void; onReset: () => void; onSound: () => void; sound: boolean; calm: boolean; onCalm: () => void; saveError: string | null; started: boolean
}) {
  const [confirmReset, setConfirmReset] = useState(false)
  return <Modal title="Make yourself at home." eyebrow="A FEW LITTLE SETTINGS" onClose={onClose} className="settings-modal">
    {saveError && <div className="error-banner" role="alert">{saveError}</div>}
    <div className="setting-row"><div><h3>The sound of Mosslight</h3><p>A soft, original soundscape and gentle game sounds.</p></div><button className={`toggle ${sound ? 'on' : ''}`} role="switch" aria-checked={sound} aria-label="Game sound" onClick={onSound}><span /></button></div>
    <div className="setting-row"><div><h3>A quieter kind of motion</h3><p>Turn off decorative animations. Your system's reduced-motion preference is also respected.</p></div><button className={`toggle ${calm ? 'on' : ''}`} role="switch" aria-checked={calm} aria-label="Calm mode" onClick={onCalm}><span /></button></div>
    <div className="save-section"><span className="eyebrow">TAKE YOUR ADVENTURE WITH YOU</span><h3>Your story, safely tucked away.</h3><p>Progress saves in this browser after every action, including encounters. A downloaded save lets you switch browsers or keep a backup.</p><div className="save-actions"><button className="primary-button" onClick={onExport} disabled={!started}><Icon name="download" size={18} />Export adventure</button><button className="secondary-button" onClick={onImport}><Icon name="upload" size={18} />Import adventure</button></div><p className="privacy-note">No accounts, analytics, or game servers. Your adventure stays with you.</p></div>
    {started && <div className="reset-section">{confirmReset ? <><h3>Start a completely new story?</h3><p>This replaces this browser's saved adventure. Export a backup first if you would like to visit these companions again.</p><div className="save-actions"><button className="danger-button" onClick={onReset}>Yes, start a new adventure</button><button className="secondary-button" onClick={() => setConfirmReset(false)}>Keep this adventure</button></div></> : <button className="text-button muted" onClick={() => setConfirmReset(true)}><Icon name="refresh" size={15} />Start a new adventure</button>}</div>}
    <div className="version-note utility">WILDKIN: MOSSLIGHT / V1.0.0 / AN ORIGINAL LITTLE WORLD</div>
  </Modal>
}

export function HelpPanel({ onClose }: { onClose: () => void }) {
  return <Modal title="A field guide to getting started." eyebrow="GOOD TO KNOW BEFORE YOU GO" onClose={onClose} className="help-modal">
    <div className="help-grid">
      <article><Icon name="footsteps" size={25} /><h3>Follow your feet.</h3><p>Click a spot on the map to walk there. Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys, or hold the direction buttons on touch screens. Only tall grass starts wild encounters.</p></article>
      <article><Icon name="heart" size={25} /><h3>Make a little room.</h3><p>Weaken a wild wildkin, then offer a bond pod. Six friends can join your team; up to 120 more stay in your reserve sanctuary.</p></article>
      <article><Icon name="spark" size={25} /><h3>Find your rhythm.</h3><p>Quick bump restores 1 energy. Take shelter restores 2 and halves the next hit. Elemental moves spend energy. All six team companions earn XP.</p></article>
      <article><Icon name="flag" size={25} /><h3>A story in four seals.</h3><p>Meet the wardens in order: Rowan, Marin, Iris, then Flint. Each seal opens a new trail. Bring all four to Firstlight Sanctuary to meet Solume.</p></article>
    </div>
    <div className="keyboard-shortcuts"><span className="eyebrow">A FEW HANDY SHORTCUTS</span><div><span><kbd>E</kbd> or <kbd>Space</kbd> Interact</span><span><kbd>M</kbd> Island map</span><span><kbd>J</kbd> Field guide</span><span><kbd>B</kbd> Satchel</span><span><kbd>T</kbd> Team</span><span><kbd>1</kbd>-<kbd>4</kbd> Battle moves</span><span><kbd>Esc</kbd> Close menus</span></div></div>
    <h3 className="type-chart-title">A little elemental know-how.</h3>
    <p className="panel-intro">Read across from your move to the opponent's element. Quick bump ignores elements.</p>
    <div className="type-chart-scroll"><table className="type-chart"><caption className="sr-only">Elemental damage multipliers. Attacking element in rows; defending element in columns.</caption><thead><tr><th scope="col">MOVE / FOE</th>{ELEMENT_IDS.map(id => <th scope="col" key={id}><Icon name={id} size={17} /><span>{ELEMENTS[id].name}</span></th>)}</tr></thead><tbody>{ELEMENT_IDS.map(attack => <tr key={attack}><th scope="row"><ElementTag element={attack} small /></th>{ELEMENT_IDS.map(defense => { const multiplier = effectiveness(attack, defense); return <td className={multiplier > 1 ? 'strong' : multiplier < 1 ? 'weak' : ''} key={defense}>{multiplier}x</td> })}</tr>)}</tbody></table></div>
    <p className="quiet-note"><Icon name="home" size={20} />Rest cottages always heal every companion for free. If your whole team faints, Wren gets you to safety. Nothing is permanently lost.</p>
  </Modal>
}

export function EndingPanel({ state, onClose, onExport }: { state: GameState; onClose: () => void; onExport: () => void }) {
  return <Modal title="You brought the light home." eyebrow="THE END OF ONE STORY. THE START OF MANY MORE." onClose={onClose} className="ending-modal">
    <div className="ending-art"><span className="ending-halo" /><CreatureArt species="solume" happy decorative /></div>
    <p className="ending-letter">Dear {state.name},<br /><br />Some explorers measure a journey in miles. Some in mountains. I think the best ones measure it in friends.<br /><br />Mosslight is a little brighter because you came. Thank you for taking the long way round.<br /><br /><strong>See you on the trail,<br />Wren</strong></p>
    <div className="research-stats"><span><strong>{state.caught.length}</strong>WILDKIN DISCOVERED</span><span><strong>{state.seals.length}</strong>SEALS EARNED</span><span><strong>{state.steps.toLocaleString()}</strong>STEPS TAKEN</span></div>
    <button className="primary-button full-width" onClick={onClose}>There is still more to find<Icon name="arrow" /></button>
    <button className="text-button ending-export" onClick={onExport}><Icon name="download" size={16} />Save a little keepsake of this adventure</button>
  </Modal>
}

export function MiniCompanion({ creature, onClick, lead = false }: { creature: Creature; onClick: () => void; lead?: boolean }) {
  return <button className={`party-card ${lead ? 'party-lead' : ''} ${creature.hp === 0 ? 'fainted' : ''}`} onClick={onClick} aria-label={`Manage ${creatureName(creature)}`}>
    <span className="party-level utility">LV {creature.level}</span>{lead && <span className="party-lead-dot" title="Trail leader" />}
    <CreatureArt species={creature.species} luminous={creature.luminous} decorative /><strong>{creatureName(creature)}</strong><HealthBar creature={creature} compact /><span className="party-hp utility">{creature.hp === 0 ? 'NEEDS A REST' : `${creature.hp} / ${maxHp(creature)} HP`}</span>
  </button>
}

export function CompanionMoves({ creature }: { creature: Creature }) {
  return <div className="companion-moves">{getMoves(creature.species).map(move => <span key={move.name}>{move.name}<small>{move.cost} energy</small></span>)}</div>
}
