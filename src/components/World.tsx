import { memo, useId } from 'react'
import { AREAS, WARDENS } from '../game/data'
import { COLS, ROWS, TILE, WORLDS } from '../game/world'
import type { AreaId, Direction, GameState, Landmark, Point } from '../game/types'

function Tree({ x, y, color, variant = 0 }: { x: number; y: number; color: string; variant?: number }) {
  return <g transform={`translate(${x} ${y})`} className="world-tree">
    <ellipse cx="2" cy="10" rx="22" ry="9" fill="#254e3b" opacity=".14" />
    <path d="M-5 7v-28H5V7l-5 3Z" fill="#987958" />
    {variant === 2 ? <>
      <path d="m0-65 20 28H11l15 23H12L26 2h-52l14-16h-14l15-23h-9Z" fill={color} stroke="#355f4d" strokeWidth="1.6" />
      <path d="m0-58-12 23h9L-15-15h12L-12-2H0Z" fill="#fff" opacity=".1" />
    </> : <>
      <path d="M-24-17c-12-11-5-31 6-34-3-16 14-27 25-18 13-8 29 4 26 16 15 7 16 26 6 33 0 17-18 23-28 17-15 12-31 1-35-14Z" fill={color} stroke="#426d4e" strokeWidth="1.5" />
      <path d="M-22-33c-2-14 9-20 15-18 0-12 11-17 19-11m-28 40q13 7 19-1m10-16q10 3 15-4" fill="none" stroke="#fff" strokeWidth="5" opacity=".13" strokeLinecap="round" />
      <path d="M-27-16q9 14 21 7m14 2q20 6 28-15" fill="none" stroke="#244f3b" strokeWidth="5" opacity=".16" strokeLinecap="round" />
    </>}
  </g>
}

export function ExplorerSprite({ x = 0, y = 0, facing = 'down', step = 0, npc = false, color = '#ef855d' }: {
  x?: number; y?: number; facing?: Direction; step?: number; npc?: boolean; color?: string
}) {
  const stride = step % 2 ? 2 : -2
  const back = facing === 'up'
  return <g transform={`translate(${x} ${y})`} className={npc ? 'npc-sprite' : 'explorer-sprite'}>
    <ellipse cy="10" rx="13" ry="5" fill="#244b3b" opacity=".2" />
    <path d={`M-7 3v${8 + stride}h6V3m3 0v${8 - stride}h6V3`} fill="#345a5b" stroke="#284342" strokeWidth="1.5" />
    <rect x="-11" y="-14" width="22" height="22" rx="6" fill={npc ? '#dbbd83' : '#467e78'} stroke="#284f48" strokeWidth="1.5" />
    <path d="M-10-10-14 2m24-12 4 12" stroke="#e7bd91" strokeWidth="6" strokeLinecap="round" />
    <rect x="-9" y="-29" width="18" height="19" rx="7" fill="#e9c399" stroke="#765b44" strokeWidth="1.2" />
    <path d="M-10-21v-6q0-13 11-11 12 0 10 12v6" fill="#684b3d" />
    {!back && <><circle cx={facing === 'right' ? 4 : -4} cy="-21" r="1.5" fill="#374941" /><circle cx={facing === 'left' ? -4 : 4} cy="-21" r="1.5" fill="#374941" /><path d="M-2-15h4" stroke="#b17a64" strokeWidth="1.2" /></>}
    <path d="M-12-29q-1-13 12-13 13 0 13 13Z" fill={color} stroke="#674e3e" strokeWidth="1.3" />
    <path d={facing === 'left' ? 'M-12-30h-6v4h29v-4' : 'M-12-30H17v4h-29'} fill={color} stroke="#674e3e" strokeWidth="1.2" />
    <path d="M-6-36h5" stroke="#fff" opacity=".45" strokeWidth="3" />
    {back && <rect x="-8" y="-10" width="16" height="16" rx="4" fill="#e1b665" stroke="#795d42" strokeWidth="1.5" />}
    {!npc && <path d="m-3-50 3 4 3-4" fill="#fffbe7" stroke="#506b45" strokeWidth="1" />}
  </g>
}

function Cottage({ x, y, shelter }: { x: number; y: number; shelter: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx="3" cy="6" rx="62" ry="15" fill="#425b3c" opacity=".16" />
    <rect x="-46" y="-60" width="92" height="64" rx="3" fill="#f4e3bc" stroke="#877a55" strokeWidth="2" />
    <path d="M-51-30H50M-45-6H44M-46-43H46" stroke="#cfbb92" strokeWidth="2" />
    <rect x="21" y="-94" width="15" height="30" fill="#a8997f" stroke="#7f785e" strokeWidth="2" />
    <path d="M-61-56-32-95h61l33 39Z" fill={shelter ? '#789997' : '#d2866a'} stroke="#936753" strokeWidth="2" />
    <path d="M-53-65H52M-46-76H44M-37-87H35M-25-90l-7 31m23-33-1 33m22-33 7 33" stroke={shelter ? '#517c79' : '#b16b57'} strokeWidth="2" opacity=".6" />
    <rect x="-9" y="-33" width="24" height="37" rx="10" fill="#527367" stroke="#526655" strokeWidth="2" />
    <circle cx="9" cy="-11" r="2" fill="#e8c17d" />
    <rect x="-35" y="-37" width="17" height="20" rx="2" fill="#91bac0" stroke="#a9885c" strokeWidth="3" />
    <path d="M-26-37v20m-9-10h17" stroke="#ede2b9" strokeWidth="2" />
    <rect x="25" y="-34" width="13" height="17" rx="2" fill="#91bac0" stroke="#a9885c" strokeWidth="3" />
    <path d="M-15 6h38" stroke="#c5b791" strokeWidth="6" strokeLinecap="round" />
    <path d="M-49-9q-14-9-16 5l3 11h17Z" fill="#789656" stroke="#56734c" strokeWidth="1.5" />
    <path d="m-56-2-2-12m9 13 5-12" stroke="#648147" strokeWidth="3" />
    <circle cx="-59" cy="-14" r="4" fill="#e8bb88" /><circle cx="-45" cy="-13" r="4" fill="#e8bb88" />
    <g className="chimney-smoke" fill="#fff" opacity=".35"><circle cx="29" cy="-106" r="6" /><circle cx="34" cy="-121" r="8" /></g>
  </g>
}

function ShopCart({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="9" rx="33" ry="9" fill="#425b3c" opacity=".15" />
    <circle cx="-22" cy="6" r="8" fill="#857a57" stroke="#5b654b" strokeWidth="2" /><circle cx="23" cy="6" r="8" fill="#857a57" stroke="#5b654b" strokeWidth="2" />
    <rect x="-29" y="-31" width="59" height="33" rx="3" fill="#c7a779" stroke="#897650" strokeWidth="2" />
    <path d="M-27-31v-24m54 24v-24" stroke="#7b8060" strokeWidth="4" />
    <path d="m-35-41 8-20h54l8 20Z" fill="#f0e5b7" stroke="#898269" strokeWidth="2" />
    <path d="m-15-60-4 20m22-20v20m15-20 4 20" stroke="#6c9780" strokeWidth="9" />
    <path d="M-35-41h70v7q-6 9-12 0-6 9-12 0-6 9-12 0-6 9-12 0-6 9-12 0-6 9-10 0Z" fill="#7d9f80" stroke="#6e8c6d" strokeWidth="1" />
    <path d="M-25-15h50" stroke="#a38c62" strokeWidth="2" />
    <circle cx="-16" cy="-22" r="5" fill="#e9c17c" /><rect x="-3" y="-28" width="9" height="12" rx="3" fill="#8bb6b0" /><circle cx="17" cy="-22" r="5" fill="#ddb597" />
    <path d="M-5-9h10M0-14v10" stroke="#f8eccc" strokeWidth="2" />
  </g>
}

function Altar({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="8" rx="58" ry="21" fill="#e8dfae" opacity=".65" />
    <ellipse cy="6" rx="38" ry="14" fill="#a6aa8d" stroke="#878e76" strokeWidth="2" />
    <path d="M-30 1v-11h60V1" fill="#c8c9ac" stroke="#878e76" strokeWidth="2" />
    <path d="m-22-13 6-41h32l6 41Z" fill="#d8d8b8" stroke="#969b7b" strokeWidth="2" />
    <path d="M-42 0v-59q0-42 42-42t42 42V0H29v-59q0-28-29-28t-29 28V0Z" fill="#b0bba0" stroke="#87967d" strokeWidth="2" />
    <path d="m0-77 14 21-14 22-14-22Z" fill="#f5dda0" stroke="#b9a16a" strokeWidth="2" className="altar-light" />
    <circle cy="-56" r="5" fill="#fff6cf" />
    <path d="m-43-18 7 3m-6-25 8 3m67-21 9 2m-8 20 8-1" stroke="#87967d" strokeWidth="3" />
  </g>
}

const Landscape = memo(function Landscape({ areaId, prefix }: { areaId: AreaId; prefix: string }) {
  const area = AREAS[areaId]
  const map = WORLDS[areaId]
  const width = COLS * TILE
  const height = ROWS * TILE
  return <>
    <defs>
      <pattern id={`${prefix}-ground`} width="64" height="64" patternUnits="userSpaceOnUse">
        <rect width="64" height="64" fill={area.ground} />
        <path d="m7 15 3-3m19 27 4 0m14-29 2 2M8 52h3m41-5 3-1" stroke="#648454" opacity=".22" strokeWidth="2" strokeLinecap="round" />
        <circle cx="41" cy="31" r="1.5" fill="#f6f0bb" opacity=".5" />
      </pattern>
      <pattern id={`${prefix}-grass`} width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill={area.grass} opacity=".14" />
        <path d="m2 26 3-10 4 7 4-12 2 15m5-13 2-8 4 10 4-6m-14 23 4-9 3 9" fill="none" stroke={area.grass} strokeWidth="2.7" strokeLinecap="round" />
        <path d="m5 19 1-5m16-5V6" stroke="#c5d9a3" strokeWidth="2" />
      </pattern>
      <pattern id={`${prefix}-water`} width="96" height="72" patternUnits="userSpaceOnUse">
        <rect width="96" height="72" fill={area.water} />
        <path d="M9 17h18m27 23h21M22 61h13m42-49h12" stroke="#e2f3df" strokeWidth="2.5" strokeLinecap="round" opacity=".45" />
        <path d="M30 23h6m41 25h9" stroke="#4f929a" strokeWidth="2" opacity=".25" />
      </pattern>
    </defs>
    <rect width={width} height={height} fill={`url(#${prefix}-ground)`} />
    {Array.from({ length: 24 }, (_, i) => <ellipse key={`patch-${i}`} cx={(i * 137 + 81) % width} cy={(i * 89 + 32) % height} rx={25 + i % 4 * 13} ry={12 + i % 3 * 7} fill={i % 3 ? '#a6c28a' : '#e5dca7'} opacity=".18" />)}
    {map.tiles.flatMap((row, y) => row.map((tile, x) => {
      const px = x * TILE
      const py = y * TILE
      if (tile === 'grass') return <g key={`${x}-${y}`}><rect x={px} y={py} width={TILE} height={TILE} rx="5" fill={area.grass} opacity=".08" /><rect x={px} y={py} width={TILE} height={TILE} fill={`url(#${prefix}-grass)`} /></g>
      if (tile === 'path') return <g key={`${x}-${y}`}><rect x={px - 1} y={py - 1} width={TILE + 2} height={TILE + 2} rx="8" fill="#e1d1a6" /><path d={`m${px + 8} ${py + 8} 5 1m8 13h3m-19 4h3`} stroke="#c1ae85" strokeWidth="1.5" opacity=".4" /></g>
      if (tile === 'water') return <g key={`${x}-${y}`}>
        <rect x={px - 1} y={py - 1} width={TILE + 2} height={TILE + 2} rx="4" fill={`url(#${prefix}-water)`} />
        {map.tiles[y - 1]?.[x] !== 'water' && <path d={`M${px + 3} ${py + 2}h26`} stroke="#e4e9bd" strokeWidth="4" />}
        {map.tiles[y + 1]?.[x] !== 'water' && <path d={`M${px + 3} ${py + 29}h26`} stroke="#e4e9bd" strokeWidth="4" />}
      </g>
      return null
    }))}
    {Array.from({ length: 25 }, (_, i) => {
      const x = ((i * 73 + 43) % 800) + 25
      const y = ((i * 131 + 100) % 470) + 55
      const tile = map.tiles[Math.floor(y / TILE)]?.[Math.floor(x / TILE)]
      if (tile !== 'ground') return null
      return <g key={`flower-${i}`} transform={`translate(${x} ${y})`}>
        <path d="M0 6v-9m0 7 4-2" stroke={area.grass} strokeWidth="1.5" />
        {areaId === 'grove' ? <><path d="M-6-3q6-13 12 0Z" fill="#efd393" /><path d="M0-3V5" stroke="#f0e3b2" strokeWidth="3" /></> : <><circle cy="-5" r="3.5" fill={i % 2 ? '#f3ecc8' : '#eaba91'} /><circle cy="-5" r="1.2" fill="#d4a35b" /></>}
      </g>
    })}
    <g stroke="#839769" fill="none" strokeWidth="3" strokeLinecap="round">
      <path d="M82 341v-17m0 5h39m0-5v17M405 359v-16m0 5h43m0-5v16m0-11h42m0-5v16M571 359v-16m0 5h35m0-5v16" />
    </g>
    <g fill="#73986b" stroke="#527e58" strokeWidth="1">
      <ellipse cx="130" cy="373" rx="14" ry="8" /><ellipse cx="413" cy="290" rx="21" ry="11" /><ellipse cx="607" cy="403" rx="19" ry="10" />
    </g>
    {map.tiles.flatMap((row, y) => row.map((tile, x) => {
      if (tile === 'tree' && (x % 2 === 0 || (y > 0 && y < ROWS - 1))) return <Tree key={`tree-${x}-${y}`} x={x * TILE + 16} y={y * TILE + 23} color={area.trees} variant={areaId === 'summit' ? 2 : 0} />
      if (tile === 'rock') return <g key={`rock-${x}-${y}`} transform={`translate(${x * TILE + 16} ${y * TILE + 20})`}><ellipse cy="7" rx="18" ry="8" fill="#8e9980" opacity=".25" /><path d="m-18 4 3-24 21-8L21-8l-3 14Z" fill="#afa995" stroke="#8d907b" strokeWidth="1.5" /><path d="m-15-20 17 6 4-14m-4 14 16 20" fill="none" stroke="#d7cfb8" strokeWidth="2" /></g>
      return null
    }))}
    {areaId !== 'sanctum' && <g className="water-life">
      <path d="m715 198 11 4-11 4-6-4Z" fill="#629ca3" opacity=".6" />
      <ellipse cx="739" cy="172" rx="13" ry="6" fill="#76a586" /><path d="m739 171 11-4" stroke="#a7c6a3" strokeWidth="1.5" />
      <circle cx="744" cy="167" r="3" fill="#edceaa" />
    </g>}
  </>
})

function LandmarkArt({ landmark, areaId, completed, opened }: { landmark: Landmark; areaId: AreaId; completed: boolean; opened: boolean }) {
  const x = landmark.x * TILE + 16
  const y = landmark.y * TILE + 22
  const area = AREAS[areaId]
  switch (landmark.kind) {
    case 'rest': return <Cottage x={x} y={y} shelter={areaId !== 'meadow'} />
    case 'shop': return <ShopCart x={x} y={y} />
    case 'researcher': return <ExplorerSprite x={x} y={y} npc color="#e6dbab" />
    case 'warden': return <g>
      <ellipse cx={x} cy={y + 4} rx="40" ry="17" fill="#dbd5ae" stroke="#abb38c" strokeWidth="2" strokeDasharray="4 4" />
      <path d={`M${x + 37} ${y + 5}v-62h25v24h-25`} fill={area.accent} stroke="#637855" strokeWidth="2" />
      <path d={`m${x + 45} ${y - 50} 6 5-6 6`} fill="none" stroke="#f3e7bf" strokeWidth="2" />
      <ExplorerSprite x={x} y={y} npc color={area.accent} />
      {completed && <path d={`m${x - 6} ${y - 54} 5 5 10-12`} fill="none" stroke="#fff6d2" strokeWidth="4" />}
    </g>
    case 'chest': return <g transform={`translate(${x} ${y})`}>
      <ellipse cy="5" rx="18" ry="7" fill="#566f45" opacity=".15" />
      <rect x="-14" y="-17" width="28" height="21" rx="3" fill={opened ? '#a69770' : '#bb915c'} stroke="#7f7352" strokeWidth="2" />
      <path d={opened ? 'M-14-18v-13h28v13Z' : 'M-14-16q0-13 14-13t14 13Z'} fill="#d0b17a" stroke="#7f7352" strokeWidth="2" />
      <rect x="-3" y="-15" width="6" height="9" rx="1" fill="#f1d795" />
      {!opened && <path d="m0-42 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#fff0b8" className="cache-glint" />}
    </g>
    case 'gate': return <g transform={`translate(${x} ${y})`}>
      <path d="M0 8v-55" stroke="#8d7e58" strokeWidth="6" />
      <path d="M-22-46h40l9 9-9 9h-40Z" fill="#d3ba87" stroke="#8f805c" strokeWidth="2" /><path d="M-15-17h34l7 7-7 7h-34Z" fill="#d3ba87" stroke="#8f805c" strokeWidth="2" />
      <path d="M-11-37H13m-18 27h20" stroke="#8e865f" strokeWidth="2" />
    </g>
    case 'altar': return <Altar x={x} y={y} />
  }
}

export function World({ state, onWalk, onLandmark, destination }: {
  state: GameState
  onWalk: (point: Point) => void
  onLandmark: (landmark: Landmark) => void
  destination?: Point
}) {
  const prefix = useId().replace(/:/g, '')
  const area = AREAS[state.area]
  return <div className={`world-view world-${state.area}`} data-testid="world" data-x={state.position.x} data-y={state.position.y}>
    <svg viewBox={`0 0 ${COLS * TILE} ${ROWS * TILE}`} role="img" aria-label={`${area.name}. Use the direction buttons or arrow keys to explore. Click the map to walk.`}
      onPointerDown={event => {
        if (event.button !== 0) return
        const bounds = event.currentTarget.getBoundingClientRect()
        onWalk({
          x: Math.floor((event.clientX - bounds.left) / bounds.width * COLS),
          y: Math.floor((event.clientY - bounds.top) / bounds.height * ROWS),
        })
      }}>
      <Landscape areaId={state.area} prefix={prefix} />
      {WORLDS[state.area].landmarks.map(landmark => <g key={landmark.id} className="landmark" onPointerDown={event => { event.stopPropagation(); onLandmark(landmark) }}>
        <LandmarkArt landmark={landmark} areaId={state.area} completed={Boolean(area.warden && state.seals.includes(area.warden))} opened={state.openedChests.includes(state.area)} />
        <rect x={landmark.x * TILE - 12} y={landmark.y * TILE - 33} width="56" height="65" fill="transparent" />
        <title>{landmark.kind === 'warden' && area.warden ? `Warden ${WARDENS[area.warden].name}` : landmark.label}</title>
      </g>)}
      {destination && <g transform={`translate(${destination.x * TILE + 16} ${destination.y * TILE + 20})`} className="destination-marker"><ellipse rx="13" ry="6" fill="none" stroke="#fffce4" strokeWidth="2" strokeDasharray="3 3" /><circle r="2" fill="#fffce4" /></g>}
      <ExplorerSprite x={state.position.x * TILE + 16} y={state.position.y * TILE + 22} facing={state.facing} step={state.steps} />
      <g className="map-label" transform="translate(83 238)"><rect width="75" height="19" rx="5" fill="#fffce8" fillOpacity=".88" /><text x="37.5" y="13" textAnchor="middle">REST COTTAGE</text></g>
      <g className="map-label" transform="translate(265 131)"><rect width="78" height="19" rx="5" fill="#fffce8" fillOpacity=".88" /><text x="39" y="13" textAnchor="middle">SUPPLY CART</text></g>
      <g className="map-label" transform={area.warden ? 'translate(708 429)' : 'translate(670 91)'}><rect width="99" height="19" rx="5" fill="#fffce8" fillOpacity=".88" /><text x="49.5" y="13" textAnchor="middle">{area.warden ? 'WARDEN CLEARING' : 'FIRSTLIGHT ALTAR'}</text></g>
    </svg>
    <div className="map-corner-label"><span className="live-dot" /> EXPLORE AT YOUR OWN PACE</div>
    <div className="map-compass" aria-hidden="true"><span>N</span><svg viewBox="0 0 30 30"><path d="m15 2 6 23-6-5-6 5Z" fill="#3f6252" /><path d="M15 2v18l-6 5Z" fill="#f2ead0" /></svg></div>
    <div className="map-vignette" />
  </div>
}

export function IslandIllustration({ className = '' }: { className?: string }) {
  return <svg className={`island-illustration ${className}`} viewBox="0 0 660 400" role="img" aria-label="The island of Mosslight, with forest trails, a cottage, mountains, and a quiet blue bay.">
    <defs>
      <pattern id="island-sea" width="80" height="50" patternUnits="userSpaceOnUse"><path d="M5 10h20m25 27h17" stroke="#83bfc5" strokeWidth="2" strokeLinecap="round" opacity=".5" /></pattern>
    </defs>
    <ellipse cx="331" cy="263" rx="294" ry="103" fill="#b5d8d8" opacity=".4" />
    <ellipse cx="330" cy="261" rx="277" ry="92" fill="url(#island-sea)" />
    <path d="M131 286C76 256 130 210 144 190c7-43 62-64 104-60 29-49 96-55 136-26 60-5 90 28 92 57 54 2 95 41 76 81 27 39-8 76-50 80-26 32-96 24-126 7-55 39-112 28-153-4-40 10-82-8-92-39Z" fill="#e0d4a7" stroke="#c6c49c" strokeWidth="2" />
    <path d="M145 272c-41-23-4-61 13-78 11-37 54-54 95-45 28-45 86-60 128-25 58-4 83 23 82 57 42-1 73 19 66 48-49-10-65 12-70 36-5 34 5 40 16 46-38 15-72 10-99-8-49 32-102 24-137-1-43 13-65-12-94-30Z" fill="#aac58a" />
    <path d="M448 221c-38-27-82-5-72 25 11 27 42 26 50 49 19 47 58 20 52-4-49-9-3-43 20-46 24-4 31-6 31-15-25-5-65 6-81-9Z" fill="#8bc4c5" stroke="#e7d5a4" strokeWidth="8" />
    <path d="M192 234q91 48 139 8t84-83M281 253l-1 57m44-66 88 40" fill="none" stroke="#e5d1a1" strokeWidth="14" strokeLinecap="round" />
    <path d="m297 151 46-95 60 99Z" fill="#b6bca5" stroke="#8c9d8b" strokeWidth="2" />
    <path d="m343 57-21 44 21-9 15 8 6-13Z" fill="#eef0d8" />
    <path d="m363 160 52-98 58 112Z" fill="#9cab99" stroke="#869885" strokeWidth="2" />
    <path d="m415 62-19 38 18-5 15 10 3-8Z" fill="#f2efd8" />
    {[[164, 215], [189, 185], [224, 166], [262, 172], [285, 196], [190, 284], [220, 289], [329, 309], [351, 296], [474, 196], [498, 218]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y}) scale(.65)`}><Tree x={0} y={0} color={i > 8 ? '#6b957e' : '#688f58'} /></g>)}
    <g transform="translate(241 231) scale(.68)"><Cottage x={0} y={0} shelter={false} /></g>
    <g transform="translate(335 228) scale(.85)"><ExplorerSprite color="#ee875f" /></g>
    <g transform="translate(418 164) scale(.45)"><Altar x={0} y={0} /></g>
    <g fill="#f5faf0" opacity=".95" className="island-clouds">
      <path d="M84 116c-8-17 6-25 17-20 3-17 28-18 32 0 17-6 28 8 20 20Z" />
      <path d="M475 98c-7-18 8-29 21-21 7-17 28-12 30 2 22-5 29 12 19 19Z" />
      <path d="M377 46c-2-11 7-19 18-13 4-12 20-10 25 1 12-3 19 7 13 12Z" />
    </g>
    <g stroke="#567b70" strokeWidth="2" fill="none" strokeLinecap="round"><path d="M511 145q5-7 10 0 5-7 10 0m-412 23q5-7 10 0 5-7 10 0m345-42q4-6 8 0 4-6 8 0" /></g>
    <path d="M161 334q-6 16-20 8l6-6Z" fill="#eac891" stroke="#a69c75" strokeWidth="1.5" />
  </svg>
}
