import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { AREAS, QUESTS, SPECIES, TIPS, WARDENS } from './game/data'
import { createGame, creatureName, gameReducer } from './game/engine'
import { decodeSave, encodeSave, loadAdventure, MAX_SAVE_BYTES, saveAdventure } from './game/persistence'
import { WARDEN_IDS } from './game/types'
import type { Action, Creature, GameState, Landmark, Point, SpeciesId } from './game/types'
import { findPath, nearestGrass, nearbyLandmark, WORLDS } from './game/world'
import { useSound } from './audio'
import { useOffline } from './offline'
import { BattleView } from './components/Battle'
import { CreatureArt } from './components/CreatureArt'
import { Icon } from './components/Icon'
import { BagPanel, EndingPanel, GuidePanel, HelpPanel, InteractionPanel, JournalPanel, MapPanel, MiniCompanion, SettingsPanel, TeamPanel } from './components/Panels'
import { Welcome } from './components/Welcome'
import { World } from './components/World'
import { ElementTag, HealthBar, Modal, Petals, PressButton } from './components/ui'

type Panel = 'guide' | 'bag' | 'team' | 'map' | 'settings' | 'help' | 'journal' | 'ending'
type RootAction = Action | { type: 'RESTORE'; state: GameState }
interface Route { steps: Point[]; interactId?: string }
interface PendingImport { state: GameState; savedAt: string }

function reducer(state: GameState, action: RootAction) {
  return action.type === 'RESTORE' ? action.state : gameReducer(state, action)
}

function freshAdventure() {
  return createGame(crypto.getRandomValues(new Uint32Array(1))[0])
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function GameApp() {
  const [boot] = useState(loadAdventure)
  const [state, dispatch] = useReducer(reducer, boot, value => value.result?.ok ? value.result.state : freshAdventure())
  const [panel, setPanel] = useState<Panel | null>(null)
  const [selectedUid, setSelectedUid] = useState<number | undefined>()
  const [route, setRoute] = useState<Route | null>(null)
  const [saveError, setSaveError] = useState<string | null>(boot.result && !boot.result.ok ? boot.result.error : null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [calm, setCalm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastKeyStep = useRef(0)
  const sound = useSound(setMessage)
  const playSound = sound.play
  const offline = useOffline()
  const area = AREAS[state.area]
  const blocked = Boolean(state.battle || state.dialog || panel || pendingImport || !state.started)
  const isGrass = WORLDS[state.area].tiles[state.position.y][state.position.x] === 'grass'
  const nearby = nearbyLandmark(state.area, state.position)
  const day = String(Math.floor(state.steps / 240) + 1).padStart(2, '0')
  const currentWardenId = WARDEN_IDS.at(state.seals.length)
  const nextWarden = currentWardenId ? WARDENS[currentWardenId] : null

  const send = useCallback((action: Action) => {
    if (action.type === 'END_BATTLE') setRoute(null)
    dispatch(action)
    if (action.type === 'MOVE') playSound('step')
    else if (action.type === 'ATTACK') playSound('attack')
    else if (action.type === 'CAPTURE') playSound('capture')
    else if (action.type === 'CLAIM_QUEST' || action.type === 'END_BATTLE') playSound('reward')
    else if (action.type !== 'DISMISS_NOTICE') playSound('select')
  }, [playSound])

  useEffect(() => {
    if (!state.started) return
    // oxlint-disable-next-line react/set-state-in-effect -- Surface quota/privacy failures from the synchronous browser-storage side effect.
    setSaveError(saveAdventure(state))
  }, [state])

  useEffect(() => {
    if (state.started) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
  }, [state.started])

  useEffect(() => {
    if (!state.notice) return
    const timeout = setTimeout(() => dispatch({ type: 'DISMISS_NOTICE' }), 6500)
    return () => clearTimeout(timeout)
  }, [state.notice])

  useEffect(() => {
    if (!message) return
    const timeout = setTimeout(() => setMessage(null), 8000)
    return () => clearTimeout(timeout)
  }, [message])

  useEffect(() => {
    if (!route || blocked) return
    const timeout = setTimeout(() => {
      const next = route.steps[0]
      if (next) {
        send({ type: 'MOVE', dx: next.x - state.position.x, dy: next.y - state.position.y })
        setRoute({ ...route, steps: route.steps.slice(1) })
      } else {
        if (route.interactId) send({ type: 'INTERACT', id: route.interactId })
        setRoute(null)
      }
    }, 135)
    return () => clearTimeout(timeout)
  }, [route, blocked, state.position.x, state.position.y, send])

  const openPanel = useCallback((next: Panel) => {
    if (state.battle) return
    setRoute(null)
    if (state.dialog) send({ type: 'CLOSE_DIALOG' })
    setPanel(next)
    playSound('select')
  }, [state.battle, state.dialog, send, playSound])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target
      if (event.ctrlKey || event.metaKey || event.altKey || (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable))) return
      if (pendingImport || panel || state.dialog || !state.started) return
      if (state.battle) {
        if (state.battle.status === 'active' && /^[1-4]$/.test(event.key) && !event.repeat) {
          event.preventDefault()
          send({ type: 'ATTACK', move: Number(event.key) - 1 })
        }
        return
      }
      const key = event.key.toLowerCase()
      const directions: Record<string, [number, number]> = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }
      const direction = directions[key]
      if (direction) {
        event.preventDefault()
        const now = performance.now()
        if (lastKeyStep.current && now - lastKeyStep.current < 110) return
        lastKeyStep.current = now
        setRoute(null)
        send({ type: 'MOVE', dx: direction[0], dy: direction[1] })
      } else if (!event.repeat) {
        if (key === 'e' || (key === ' ' && !(target instanceof HTMLButtonElement))) {
          event.preventDefault()
          setRoute(null)
          send({ type: 'INTERACT' })
        } else if (key === 'm') openPanel('map')
        else if (key === 'j') openPanel('guide')
        else if (key === 'b') openPanel('bag')
        else if (key === 't') openPanel('team')
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [state.started, state.battle, state.dialog, pendingImport, panel, send, openPanel])

  const walk = (point: Point) => {
    if (blocked) return
    const steps = findPath(state.area, state.position, point)
    if (steps === null) { setMessage('That spot is off the trail. Try a path, clearing, or patch of grass.'); return }
    setRoute({ steps })
  }

  const walkToLandmark = (landmark: Landmark) => {
    if (blocked) return
    const steps = findPath(state.area, state.position, landmark, true)
    if (steps === null) { setMessage('There is no clear trail to that spot from here. Try approaching from the path.'); return }
    setRoute({ steps, interactId: landmark.id })
  }

  const visit = (id: string) => {
    const landmark = WORLDS[state.area].landmarks.find(entry => entry.id === id)
    if (landmark) walkToLandmark(landmark)
  }

  const exploreGrass = () => {
    if (blocked) return
    const steps = nearestGrass(state.area, state.position)
    if (!steps?.length) { setMessage('Try a different patch of tall grass.'); return }
    const first = steps.at(-1)!
    const neighbor = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: first.x + dx, y: first.y + dy }))
      .find(point => WORLDS[state.area].tiles[point.y]?.[point.x] === 'grass')
    if (neighbor) for (let i = 0; i < 8; i++) steps.push(i % 2 === 0 ? { ...neighbor } : { ...first })
    setRoute({ steps })
  }

  const manualMove = (dx: number, dy: number) => {
    setRoute(null)
    send({ type: 'MOVE', dx, dy })
  }

  const exportAdventure = () => {
    download(encodeSave(state), `wildkin-mosslight-${new Date().toISOString().slice(0, 10)}.json`)
    setMessage('Adventure exported. Keep that little piece of Mosslight somewhere safe.')
  }

  const importAdventure = async (file: File) => {
    if (file.size > MAX_SAVE_BYTES) { setMessage('That save is too large. Choose a Wildkin adventure smaller than 1 MB.'); return }
    let text: string
    try {
      text = await file.text()
    } catch (error) {
      if (!(error instanceof DOMException)) throw error
      setMessage(`The file could not be read: ${error.message}`)
      return
    }
    const result = decodeSave(text)
    if (!result.ok) { setMessage(result.error); return }
    if (!result.state.started) { setMessage('That file does not contain a started adventure. Choose a save with a companion.'); return }
    setPanel(null)
    setPendingImport({ state: result.state, savedAt: result.savedAt })
  }

  const restore = (game: GameState) => {
    setRoute(null)
    setPanel(null)
    setPendingImport(null)
    setSaveError(saveAdventure(game))
    dispatch({ type: 'RESTORE', state: game })
  }

  const updateGame = () => {
    const error = state.started ? saveAdventure(state) : null
    if (error) { setSaveError(error); return }
    offline.applyUpdate()
  }

  const begin = (name: string, starter: SpeciesId) => send({ type: 'START', name, starter })
  const closePanel = () => { setPanel(null); setSelectedUid(undefined) }
  const closeDialogue = () => send({ type: 'CLOSE_DIALOG' })
  const manageCompanion = (creature: Creature) => { setSelectedUid(creature.uid); openPanel('team') }
  const finishBattle = () => {
    const finalEncounter = state.battle?.kind === 'guardian' && ['won', 'captured'].includes(state.battle.status)
    send({ type: 'END_BATTLE' })
    if (finalEncounter) setPanel('ending')
  }
  const questPreviews = QUESTS.filter(quest => !state.claimedQuests.includes(quest.id)).slice(0, 2)
  const newFriendObjective = state.captures === 0 && state.seals.length === 0
  const objectiveTitle = state.completed ? 'Take the long way home.' : newFriendObjective ? 'A friend in the wild.' : nextWarden ? `Meet ${nextWarden.name}. Earn a seal.` : 'The light is calling.'
  const objectiveCopy = state.completed ? 'Your story is not over. Evolve your friends, seek luminous wildkin, and fill every page.' : newFriendObjective ? 'Follow a rustle into the tall grass. Weaken a wildkin, then offer a bond pod.' : nextWarden ? `${nextWarden.name}, ${nextWarden.title.toLowerCase()}, is waiting in ${AREAS[nextWarden.area].name}.` : 'Bring your four seals to the altar in Firstlight Sanctuary. Someone is waiting for you.'
  const followObjective = () => {
    if (state.completed) openPanel('guide')
    else if (newFriendObjective) exploreGrass()
    else if (nextWarden) { if (state.area === nextWarden.area) visit('warden'); else openPanel('map') }
    else if (state.area === 'sanctum') visit('altar')
    else openPanel('map')
  }
  const toast = message || state.notice

  return <div className={`app-shell ${calm ? 'calm-mode' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to adventure</a>
    <header className="site-header">
      <a className="brand" href={import.meta.env.BASE_URL} aria-label="Wildkin: Mosslight home"><span className="brand-mark"><Icon name="leaf" size={27} /><span /></span><div><span className="brand-word">wildkin<span className="brand-period">.</span></span><span className="brand-subtitle">THE MOSSLIGHT ADVENTURE</span></div></a>
      {state.started ? <nav className="main-nav" aria-label="Adventure menus">
        <button className={!panel ? 'nav-active' : ''} onClick={closePanel}><Icon name="compass" size={17} /><span>Adventure</span></button>
        <button className={panel === 'guide' ? 'nav-active' : ''} onClick={() => openPanel('guide')}><Icon name="book" size={17} /><span>Field guide</span><small>{state.caught.length}</small></button>
        <button className={panel === 'bag' ? 'nav-active' : ''} onClick={() => openPanel('bag')}><Icon name="bag" size={17} /><span>Satchel</span></button>
        <button className={panel === 'map' ? 'nav-active' : ''} onClick={() => openPanel('map')}><Icon name="map" size={17} /><span>Island map</span></button>
      </nav> : <span className="header-note">FOR THE CURIOUS AT HEART</span>}
      <div className="header-actions"><button className="icon-button sound-button" aria-label={sound.enabled ? 'Turn sound off' : 'Turn sound on'} aria-pressed={sound.enabled} title={sound.enabled ? 'Sound on' : 'Sound off'} onClick={sound.toggle}><Icon name={sound.enabled ? 'volume' : 'mute'} size={19} /></button><button className="icon-button" aria-label="How to play" title="How to play" onClick={() => openPanel('help')}><Icon name="help" size={19} /></button><button className="icon-button" aria-label="Settings" title="Settings and saves" onClick={() => openPanel('settings')}><Icon name="settings" size={19} /></button>{state.started && <span className="avatar-letter" title={`${state.name}'s adventure`}>{state.name[0].toUpperCase()}</span>}</div>
    </header>

    {!state.started ? <Welcome onStart={begin} onImport={() => inputRef.current?.click()} error={boot.result && !boot.result.ok ? boot.result.error : undefined} /> : <main className="adventure" id="main-content" tabIndex={-1}>
      <div className="adventure-heading"><div><span className="eyebrow"><Icon name="compass" size={14} /> MOSSLIGHT ISLAND <span>/</span> TRAIL {String(AREA_IDS_INDEX[state.area]).padStart(2, '0')}</span><h1>{area.name}<span className="heading-leaf"><Icon name={state.area === 'sanctum' ? 'sun' : 'leaf'} size={27} /></span></h1><p>{area.description}</p></div><div className="day-card"><Icon name="sun" size={27} /><div><span className="utility">DAY {day}</span><span>A fine day to wander</span></div></div></div>
      {saveError && <div className="error-banner save-warning" role="alert">{saveError}<button className="text-button" onClick={exportAdventure}>Export backup</button></div>}
      <div className="adventure-layout">
        <section className="play-column" aria-label="Explore Mosslight">
          <div className="world-card">
            <div className="world-toolbar"><span><span className="status-dot" />{route ? 'Following the trail...' : isGrass ? 'Something is rustling...' : 'A little room to roam'}</span><div>{state.lureSteps > 0 && <span className="lure-indicator"><Icon name="lure" size={14} />{state.lureSteps} steps</span>}<span className="coordinates utility">X {String(state.position.x).padStart(2, '0')} : Y {String(state.position.y).padStart(2, '0')}</span><button className="icon-button small-icon-button" aria-label="Open island map" onClick={() => openPanel('map')}><Icon name="map" size={17} /></button></div></div>
            <World state={state} onWalk={walk} onLandmark={walkToLandmark} destination={route?.steps.at(-1)} />
            <div className="world-controls">
              <div className="movement-controls"><div className="dpad"><div className="dpad-up"><PressButton label="Move up" onPress={() => manualMove(0, -1)} disabled={blocked}><Icon name="chevron" className="rotate-up" size={17} /></PressButton></div><div className="dpad-left"><PressButton label="Move left" onPress={() => manualMove(-1, 0)} disabled={blocked}><Icon name="chevron" className="rotate-left" size={17} /></PressButton></div><div className="dpad-center"><Icon name="footsteps" size={15} /></div><div className="dpad-right"><PressButton label="Move right" onPress={() => manualMove(1, 0)} disabled={blocked}><Icon name="chevron" size={17} /></PressButton></div><div className="dpad-down"><PressButton label="Move down" onPress={() => manualMove(0, 1)} disabled={blocked}><Icon name="chevron" className="rotate-down" size={17} /></PressButton></div></div><div className="keyboard-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>or arrow keys</span></span><small>Click anywhere to walk there.</small></div></div>
              <div className="explore-actions"><button className="secondary-button interact-button" onClick={() => { setRoute(null); send({ type: 'INTERACT' }) }} disabled={blocked || !nearby}><kbd>E</kbd>{nearby ? nearby.kind === 'rest' ? 'Rest cottage' : nearby.kind === 'shop' ? 'Supply cart' : nearby.kind === 'warden' ? 'Meet warden' : nearby.kind === 'chest' ? 'Open cache' : nearby.kind === 'altar' ? 'Visit altar' : nearby.kind === 'gate' ? 'Read signpost' : 'Talk to Wren' : 'Interact'}</button><button className="primary-button grass-button" onClick={exploreGrass} disabled={blocked}><Icon name="leaf" size={17} />Explore grass<Icon name="arrow" size={16} /></button></div>
            </div>
          </div>
          <div className="trail-shortcuts" aria-label="Walk to a place"><span className="utility">TAKE ME TO</span><button onClick={() => visit('cottage')}><Icon name="home" size={15} />Rest cottage</button><button onClick={() => visit('shop')}><Icon name="shop" size={15} />Supply cart</button><button onClick={() => visit(state.area === 'sanctum' ? 'altar' : 'warden')}><Icon name="flag" size={15} />{state.area === 'sanctum' ? 'Firstlight altar' : 'Warden clearing'}</button><button onClick={() => visit('researcher')}><Icon name="book" size={15} />Wren</button></div>
          <section className="party-section" aria-labelledby="party-heading"><div className="section-heading compact-heading"><div><h2 id="party-heading">Your little crew<span>{state.party.length} / 6</span></h2></div><button className="text-button" onClick={() => openPanel('team')}>Manage team<Icon name="arrow" size={15} /></button></div><div className="party-grid">{state.party.map((creature, index) => <MiniCompanion key={creature.uid} creature={creature} lead={index === 0} onClick={() => manageCompanion(creature)} />)}{Array.from({ length: 6 - state.party.length }, (_, i) => <button key={`empty-${i}`} className="party-empty" onClick={exploreGrass} aria-label="Find another companion"><Icon name="plus" size={20} /><span>A friend to find</span></button>)}</div></section>
          <div className="trail-tip"><span className="tip-icon"><Icon name="leaf" size={18} /></span><p>{TIPS[Math.floor(state.steps / 24) % TIPS.length]}</p><span className="utility">WREN'S WISDOM</span></div>
        </section>
        <aside className="field-journal" aria-label="Expedition journal">
          <div className="journal-top"><span className="eyebrow">A PAGE FROM YOUR</span><h2>Field journal<span><Icon name="book" size={21} /></span></h2><div className="journal-owner"><span className="owner-line" /><span>{state.name}'s adventure</span><span className="owner-line" /></div></div>
          <div className="journal-objective"><span className="objective-label"><Icon name="flag" size={15} />THE NEXT LITTLE THING</span><h3>{objectiveTitle}</h3><p>{objectiveCopy}</p><button className="journal-link" onClick={followObjective}>{state.completed ? 'Open field guide' : newFriendObjective ? 'Head for the grass' : nextWarden && state.area === nextWarden.area ? 'Find the clearing' : !nextWarden && state.area === 'sanctum' ? 'Find the altar' : 'Find the next trail'}<Icon name="arrow" size={16} /></button></div>
          <div className="journal-seals"><div className="inline-heading"><span className="eyebrow">LITTLE SIGNS OF GROWTH</span><span className="utility">{state.seals.length}/4</span></div><div className="seal-row">{WARDEN_IDS.map(id => <button className={`seal ${state.seals.includes(id) ? 'earned' : ''}`} key={id} title={`${WARDENS[id].seal}${state.seals.includes(id) ? ' earned' : ` / Meet ${WARDENS[id].name}`}`} aria-label={`${WARDENS[id].seal}${state.seals.includes(id) ? ' earned' : ' not yet earned'}`} onClick={() => openPanel('map')}><span><Icon name={WARDENS[id].element} size={25} /></span><small>{WARDENS[id].seal.split(' ')[0]}</small></button>)}</div></div>
          <div className="journal-notes"><div className="inline-heading"><span className="eyebrow">FIELD NOTES</span><button className="text-button" onClick={() => openPanel('journal')}>All notes<Icon name="arrow" size={13} /></button></div>{questPreviews.map(quest => {
            const progress = Math.min(quest.goal, quest.progress(state))
            const ready = progress === quest.goal
            return <div className="mini-quest" key={quest.id}><span className={`mini-quest-icon ${ready ? 'ready' : ''}`}><Icon name={ready ? 'check' : 'leaf'} size={15} /></span><div><h4>{quest.title}</h4><p>{quest.description}</p>{ready ? <button className="claim-link" onClick={() => send({ type: 'CLAIM_QUEST', id: quest.id })}>Collect <Petals amount={quest.reward} /><Icon name="arrow" size={13} /></button> : <div className="mini-progress"><span style={{ width: `${progress / quest.goal * 100}%` }} /></div>}</div></div>
          })}{questPreviews.length === 0 && <p className="journal-complete">Every page tells a story. What an adventure this has been.</p>}</div>
          <div className="journal-satchel"><span><Icon name="bag" size={19} />TRAIL FUNDS</span><Petals amount={state.coins} /></div>
          <div className="journal-companion"><CreatureArt species={state.party[0].species} decorative happy /><div><span className="eyebrow">BY YOUR SIDE</span><strong>{creatureName(state.party[0])}</strong><ElementTag element={SPECIES[state.party[0].species].element} small /><HealthBar creature={state.party[0]} compact /></div></div>
          <p className="journal-signoff">The best adventures leave<br />a little mud on your boots.</p>
        </aside>
      </div>
    </main>}

    <footer className="site-footer"><span><Icon name="leaf" size={15} />Made for the long way round.</span><div>{offline.status === 'ready' && <span className="offline-ready"><Icon name="check" size={12} />Ready for offline wandering</span>}{state.started && <span className={`save-status ${saveError ? 'save-failed' : ''}`}><span className="status-dot" />{saveError ? 'Backup recommended' : 'Adventure saved on this device'}</span>}<a href="https://github.com/xavierxmorris/wildkin-mosslight" target="_blank" rel="noreferrer" aria-label="View the Wildkin source on GitHub"><Icon name="github" size={16} /><span>Open source</span></a></div></footer>
    {offline.updateAvailable && !blocked && !toast && <div className="update-banner" role="status"><Icon name="leaf" size={19} /><p>A fresh page of the adventure is ready.</p><button className="primary-button small-button" onClick={updateGame}>Save and update</button></div>}
    {!blocked && toast && <div className="toast" role="status"><Icon name="leaf" size={19} /><p>{toast}</p><button className="icon-button" aria-label="Dismiss notification" onClick={() => { setMessage(null); send({ type: 'DISMISS_NOTICE' }) }}><Icon name="close" size={16} /></button></div>}
    {!state.started && !panel && !pendingImport && message && <div className="toast" role="status"><Icon name="help" size={19} /><p>{message}</p><button className="icon-button" aria-label="Dismiss notification" onClick={() => setMessage(null)}><Icon name="close" size={16} /></button></div>}
    <input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="Import an adventure file" onChange={event => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) void importAdventure(file).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'The adventure file could not be read.'))
    }} />
    {state.battle && <BattleView state={state} send={send} onFinish={finishBattle} />}
    {!state.battle && state.dialog && <InteractionPanel state={state} send={send} onClose={closeDialogue} onGuide={() => { closeDialogue(); setPanel('guide') }} />}
    {panel === 'guide' && <GuidePanel state={state} onClose={closePanel} />}
    {panel === 'team' && <TeamPanel state={state} send={send} onClose={closePanel} initialUid={selectedUid} />}
    {panel === 'bag' && <BagPanel state={state} send={send} onClose={closePanel} />}
    {panel === 'map' && <MapPanel state={state} send={send} onClose={closePanel} />}
    {panel === 'journal' && <JournalPanel state={state} send={send} onClose={closePanel} />}
    {panel === 'help' && <HelpPanel onClose={closePanel} />}
    {panel === 'settings' && <SettingsPanel onClose={closePanel} onExport={exportAdventure} onImport={() => inputRef.current?.click()} onReset={() => restore(freshAdventure())} onSound={sound.toggle} sound={sound.enabled} calm={calm} onCalm={() => setCalm(!calm)} saveError={saveError || message || offline.error} started={state.started} />}
    {panel === 'ending' && <EndingPanel state={state} onClose={closePanel} onExport={exportAdventure} />}
    {pendingImport && <Modal title={`Welcome back, ${pendingImport.state.name}.`} eyebrow="A LITTLE ADVENTURE, SAFELY PACKED" onClose={() => setPendingImport(null)} className="import-modal"><div className="import-preview"><CreatureArt species={pendingImport.state.party[0].species} decorative happy /><div><h3>{AREAS[pendingImport.state.area].name}</h3><p>{pendingImport.state.caught.length} wildkin registered / {pendingImport.state.seals.length} warden seals</p><span className="utility">SAVED {new Date(pendingImport.savedAt).toLocaleDateString()}</span></div></div><p className="dialogue-copy">{state.started ? 'Loading this adventure replaces the save on this device. Your current friends will only be available again if you have an exported backup.' : 'Your companions are exactly where you left them, even in the middle of an encounter.'}</p><div className="save-actions"><button className="primary-button" onClick={() => restore(pendingImport.state)}>Load adventure<Icon name="arrow" size={17} /></button><button className="secondary-button" onClick={() => setPendingImport(null)}>Keep current adventure</button></div></Modal>}
    {boot.raw && boot.result && !boot.result.ok && !state.started && !panel && <button className="text-button recovery-download" onClick={() => download(boot.raw!, 'wildkin-unreadable-save-backup.json')}><Icon name="download" size={15} />Download the unreadable save for recovery</button>}
  </div>
}

const AREA_IDS_INDEX = { meadow: 1, shore: 2, grove: 3, summit: 4, sanctum: 5 }
