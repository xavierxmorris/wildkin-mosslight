import { useState } from 'react'
import { SPECIES, STARTERS } from '../game/data'
import type { SpeciesId } from '../game/types'
import { CreatureArt } from './CreatureArt'
import { Icon } from './Icon'
import { IslandIllustration } from './World'
import { ElementTag } from './ui'

export function Welcome({ onStart, onImport, error }: { onStart: (name: string, starter: SpeciesId) => void; onImport: () => void; error?: string }) {
  const [starter, setStarter] = useState<SpeciesId>('fernling')
  const [name, setName] = useState('')
  return <main className="welcome" id="main-content">
    <section className="welcome-hero">
      <div className="welcome-copy">
        <span className="eyebrow"><span className="live-dot" /> A LITTLE ISLAND. A WILD ADVENTURE.</span>
        <h1>Good things<br />are <span>in the grass.</span></h1>
        <p>Unfamiliar trails. Unlikely friends. An island full of little wonders. Your Mosslight story starts with a companion.</p>
        <div className="welcome-features"><span><Icon name="map" size={16} />5 regions to roam</span><span><Icon name="book" size={16} />24 wildkin to meet</span></div>
      </div>
      <div className="welcome-world">
        <div className="world-stamp"><Icon name="compass" size={28} /><span>MOSSLIGHT<br />ISLAND</span></div>
        <IslandIllustration />
        <span className="island-caption"><span className="dashed-line" /> Somewhere worth getting a little lost.</span>
      </div>
    </section>
    <section className="starter-section" aria-labelledby="starter-heading">
      <div className="section-heading"><div><span className="eyebrow">EVERY GOOD STORY STARTS WITH A FRIEND</span><h2 id="starter-heading">Who is coming with you?</h2></div><span className="starter-note">No wrong choices. Just different adventures.</span></div>
      <div className="starter-grid" role="group" aria-label="Choose your first companion">
        {STARTERS.map(id => {
          const species = SPECIES[id]
          return <button key={id} className={`starter-card starter-${species.element} ${starter === id ? 'selected' : ''}`} aria-pressed={starter === id} onClick={() => setStarter(id)}>
            <span className="starter-number">FIELD NO. {String(Object.keys(SPECIES).indexOf(id) + 1).padStart(2, '0')}</span>
            <span className="selection-circle">{starter === id && <Icon name="check" size={15} />}</span>
            <div className="starter-art"><span className="starter-halo" /><CreatureArt species={id} decorative happy={starter === id} /></div>
            <div className="starter-heading"><h3>{species.name}</h3><ElementTag element={species.element} /></div>
            <p className="starter-personality">{species.personality}</p>
            <p className="starter-description">{id === 'fernling' ? 'All leafy ears and endless curiosity. A balanced friend for the winding road.' : id === 'cindercub' ? 'A warm heart and a fearless little spark. Small paws, big first moves.' : 'A gentle soul who goes with the flow. A little more patience, a little more staying power.'}</p>
          </button>
        })}
      </div>
      <form className="start-form" onSubmit={event => { event.preventDefault(); onStart(name, starter) }}>
        <label htmlFor="explorer-name">And what should we call you?<input id="explorer-name" name="explorer-name" autoComplete="nickname" maxLength={20} placeholder="Explorer" value={name} onChange={event => setName(event.target.value)} /></label>
        <div className="start-actions"><button className="primary-button start-button" type="submit">Set off with {SPECIES[starter].name}<Icon name="arrow" size={20} /></button><span><Icon name="heart" size={13} />No accounts. No timers. Just you and the trail.</span></div>
      </form>
      {error && <div className="error-banner" role="alert">{error} Starting here creates a new adventure; your old save is not changed until you set off.</div>}
      <button className="text-button import-welcome" onClick={onImport}><Icon name="upload" size={15} />Already have an adventure? Import your save.</button>
    </section>
  </main>
}
