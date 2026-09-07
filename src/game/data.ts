import type { Area, AreaId, Element, ItemId, Move, Quest, Species, SpeciesId, Warden, WardenId } from './types'

export const ELEMENTS: Record<Element, { name: string; color: string; pale: string; strong: Element[] }> = {
  leaf: { name: 'Leaf', color: '#397042', pale: '#e5efd8', strong: ['tide', 'stone'] },
  ember: { name: 'Ember', color: '#a33f25', pale: '#fbe2d4', strong: ['leaf', 'gale'] },
  tide: { name: 'Tide', color: '#246d86', pale: '#d8eef3', strong: ['ember', 'stone'] },
  stone: { name: 'Stone', color: '#705839', pale: '#eee5d5', strong: ['spark', 'ember'] },
  gale: { name: 'Gale', color: '#6760a0', pale: '#eae6f5', strong: ['leaf', 'stone'] },
  spark: { name: 'Spark', color: '#7d5900', pale: '#fcf0c4', strong: ['tide', 'gale'] },
}

export const SPECIES: Record<SpeciesId, Species> = {
  fernling: {
    id: 'fernling', name: 'Fernling', element: 'leaf', shape: 'fox', color: '#a1c96b', accent: '#426f47',
    baseHp: 36, attack: 16, defense: 15, rarity: 'uncommon', personality: 'The curious one',
    description: 'A pocket-sized trail companion. The leaves behind its ears turn toward interesting sounds, not sunlight.',
    evolvesTo: 'briarhorn', evolvesAt: 12,
  },
  briarhorn: {
    id: 'briarhorn', name: 'Briarhorn', element: 'leaf', shape: 'deer', color: '#80ac62', accent: '#eadba5',
    baseHp: 54, attack: 25, defense: 23, rarity: 'rare', personality: 'A gentle pathfinder',
    description: 'Wildflowers grow between its antlers. Lost travelers find that it always walks just slowly enough to follow.',
  },
  cindercub: {
    id: 'cindercub', name: 'Cindercub', element: 'ember', shape: 'cub', color: '#ec9562', accent: '#914336',
    baseHp: 34, attack: 19, defense: 12, rarity: 'uncommon', personality: 'The brave one',
    description: 'Its little ember tuft crackles when it gets excited. Excellent at keeping tea warm; terrible at sitting still.',
    evolvesTo: 'cinderlynx', evolvesAt: 12,
  },
  cinderlynx: {
    id: 'cinderlynx', name: 'Cinderlynx', element: 'ember', shape: 'fox', color: '#d9774d', accent: '#f6d179',
    baseHp: 50, attack: 30, defense: 20, rarity: 'rare', personality: 'A fireside guardian',
    description: 'Its tufted ears glow like lanterns at dusk. It curls around younger wildkin on cold summit nights.',
  },
  ripplefin: {
    id: 'ripplefin', name: 'Ripplefin', element: 'tide', shape: 'otter', color: '#88c5cd', accent: '#467f9f',
    baseHp: 40, attack: 14, defense: 17, rarity: 'uncommon', personality: 'The daydreamer',
    description: 'Collects perfectly round pebbles and promptly forgets where it put them. Its whiskers can feel approaching rain.',
    evolvesTo: 'tidewhisk', evolvesAt: 12,
  },
  tidewhisk: {
    id: 'tidewhisk', name: 'Tidewhisk', element: 'tide', shape: 'otter', color: '#6cacc3', accent: '#ece5c4',
    baseHp: 60, attack: 23, defense: 27, rarity: 'rare', personality: 'Keeper of the shallows',
    description: 'Braids ribbons of water through the air. Sailors say a glimpse of its silver whiskers means a safe journey.',
  },
  pebblit: {
    id: 'pebblit', name: 'Pebblit', element: 'stone', shape: 'turtle', color: '#c6b691', accent: '#7f9171',
    baseHp: 38, attack: 12, defense: 22, rarity: 'common', personality: 'In no particular hurry',
    description: 'Often mistaken for a stepping stone. It does not mind, as long as you say thank you.',
    evolvesTo: 'cairnback', evolvesAt: 10,
  },
  cairnback: {
    id: 'cairnback', name: 'Cairnback', element: 'stone', shape: 'turtle', color: '#93a184', accent: '#d5c0a0',
    baseHp: 62, attack: 20, defense: 32, rarity: 'rare', personality: 'The moving mountain',
    description: 'The cairn on its shell grows with every kind deed it witnesses. A whole meadow can nap on its back.',
  },
  puffinch: {
    id: 'puffinch', name: 'Puffinch', element: 'gale', shape: 'bird', color: '#e3d6a7', accent: '#93b3bc',
    baseHp: 30, attack: 15, defense: 11, rarity: 'common', personality: 'A very small weather report',
    description: 'Puffs up to twice its size before a gust. No one knows if it predicts the wind or causes it.',
    evolvesTo: 'plumesail', evolvesAt: 10,
  },
  plumesail: {
    id: 'plumesail', name: 'Plumesail', element: 'gale', shape: 'bird', color: '#b2b9dc', accent: '#f1d897',
    baseHp: 46, attack: 26, defense: 19, rarity: 'rare', personality: 'A sky full of possibilities',
    description: 'Its ribbonlike feathers catch currents invisible to other creatures. It only lands for good company.',
  },
  glimworm: {
    id: 'glimworm', name: 'Glimworm', element: 'spark', shape: 'worm', color: '#c9d87b', accent: '#f8db7b',
    baseHp: 28, attack: 13, defense: 13, rarity: 'common', personality: 'A tiny bright idea',
    description: 'Reads fallen leaves by the glow of its tail. Entire libraries of leaf-shaped holes follow in its wake.',
    evolvesTo: 'lumimoth', evolvesAt: 10,
  },
  lumimoth: {
    id: 'lumimoth', name: 'Lumimoth', element: 'spark', shape: 'moth', color: '#f2cd77', accent: '#87baac',
    baseHp: 44, attack: 28, defense: 17, rarity: 'rare', personality: 'A lantern with wings',
    description: 'On the darkest nights, whole swarms trace glowing maps of the stars beneath the forest canopy.',
  },
  capshroom: {
    id: 'capshroom', name: 'Capshroom', element: 'leaf', shape: 'mushroom', color: '#e5c797', accent: '#cb7c67',
    baseHp: 39, attack: 13, defense: 19, rarity: 'common', personality: 'The forest floor philosopher',
    description: 'Shares the shade of its cap with smaller creatures. Has strong opinions about moss.',
  },
  wickit: {
    id: 'wickit', name: 'Wickit', element: 'ember', shape: 'ghost', color: '#edbc8b', accent: '#e37b5b',
    baseHp: 32, attack: 22, defense: 12, rarity: 'uncommon', personality: 'A wandering warm thought',
    description: 'A shy wisp that lives in old campfire rings. It glows brighter when someone tells a good story.',
  },
  shellby: {
    id: 'shellby', name: 'Shellby', element: 'tide', shape: 'snail', color: '#9cc9bd', accent: '#e2bda5',
    baseHp: 43, attack: 11, defense: 23, rarity: 'common', personality: 'Home is wherever you are',
    description: 'Its spiral shell hums with the sound of distant tides, even miles from the sea.',
  },
  craggle: {
    id: 'craggle', name: 'Craggle', element: 'stone', shape: 'golem', color: '#a7aba0', accent: '#cfa184',
    baseHp: 49, attack: 21, defense: 24, rarity: 'uncommon', personality: 'A soft heart in a hard place',
    description: 'Carefully stacks rocks into sculptures. When nobody is looking, it makes little stone portraits of its friends.',
  },
  wisplet: {
    id: 'wisplet', name: 'Wisplet', element: 'gale', shape: 'ghost', color: '#c5b9df', accent: '#8ea9bf',
    baseHp: 33, attack: 20, defense: 14, rarity: 'uncommon', personality: 'A half-remembered daydream',
    description: 'Drifts through the grove with the scent of rain. Its quiet song sounds different to everyone.',
  },
  coilfin: {
    id: 'coilfin', name: 'Coilfin', element: 'spark', shape: 'fish', color: '#80c0b7', accent: '#f2ce79',
    baseHp: 37, attack: 23, defense: 14, rarity: 'uncommon', personality: 'A little current of joy',
    description: 'Swims through the air on magnetic currents. Its coiled fins uncurl whenever it meets a new friend.',
  },
  petalune: {
    id: 'petalune', name: 'Petalune', element: 'leaf', shape: 'moth', color: '#edb3b1', accent: '#a7c989',
    baseHp: 35, attack: 23, defense: 17, rarity: 'rare', personality: 'The bloom after the rain',
    description: 'Mistaken for a flower until it takes flight. The seeds caught in its wings grow only where the moon can see them.',
  },
  scorchip: {
    id: 'scorchip', name: 'Scorchip', element: 'ember', shape: 'lizard', color: '#cd876e', accent: '#f4c878',
    baseHp: 37, attack: 24, defense: 16, rarity: 'uncommon', personality: 'Sun-warmed and self-assured',
    description: 'Basks on warm stones until sunset, then carries their heat home to its nest.',
  },
  dewdrop: {
    id: 'dewdrop', name: 'Dewdrop', element: 'tide', shape: 'drop', color: '#a1d5d4', accent: '#83adcc',
    baseHp: 46, attack: 16, defense: 19, rarity: 'common', personality: 'A puddle with plans',
    description: 'Always reflects a clear sky, whatever the weather. Poking its belly makes a very satisfying plip.',
  },
  geodeer: {
    id: 'geodeer', name: 'Geodeer', element: 'stone', shape: 'deer', color: '#b7a4cb', accent: '#d6c7a2',
    baseHp: 45, attack: 23, defense: 23, rarity: 'rare', personality: 'Quiet as a crystal cavern',
    description: 'Its crystal antlers sing when the mountain trembles. It knows paths that have not existed for a thousand years.',
  },
  hushowl: {
    id: 'hushowl', name: 'Hushowl', element: 'gale', shape: 'owl', color: '#b6b6ca', accent: '#e7d4ac',
    baseHp: 41, attack: 23, defense: 19, rarity: 'rare', personality: 'Listening to the quiet',
    description: 'Can hear a seed open underground. If it closes both eyes in your presence, it trusts you completely.',
  },
  solume: {
    id: 'solume', name: 'Solume', element: 'spark', shape: 'guardian', color: '#f2d893', accent: '#86bdb0',
    baseHp: 75, attack: 30, defense: 27, rarity: 'guardian', personality: 'The light that brings us home',
    description: 'The island remembers its first sunrise through Solume. Its light is not captured, only shared.',
  },
}

export const STARTERS: SpeciesId[] = ['fernling', 'cindercub', 'ripplefin']

const elementalMoves: Record<Element, [string, string]> = {
  leaf: ['Leaf flick', 'Canopy burst'],
  ember: ['Ember kiss', 'Sunflare'],
  tide: ['Ripple rush', 'Tidal ribbon'],
  stone: ['Pebble pitch', 'Mountain echo'],
  gale: ['Breeze cut', 'Sky spiral'],
  spark: ['Static pop', 'Aurora pulse'],
}

export function getMoves(species: SpeciesId): Move[] {
  const element = SPECIES[species].element
  return [
    { name: 'Quick bump', element: 'neutral', power: 22, cost: 0, description: 'A reliable hit. Recover 1 energy.' },
    { name: elementalMoves[element][0], element, power: 30, cost: 1, description: 'An elemental strike. Use type advantages.' },
    { name: elementalMoves[element][1], element, power: 53, cost: 3, description: 'Your strongest elemental attack.' },
    { name: 'Take shelter', element: 'neutral', power: 0, cost: 0, guard: true, description: 'Halve incoming damage. Recover 2 energy.' },
  ]
}

export const AREAS: Record<AreaId, Area> = {
  meadow: {
    id: 'meadow', name: 'Mosslight Meadow', subtitle: 'Where little adventures begin',
    description: 'Wind in the leaves. A cottage on the hill. Something moving in the grass.',
    requiredSeals: 0, levels: [3, 5], ground: '#b9d59c', grass: '#719c62', water: '#89c7ca', trees: '#558452', sky: '#ddecdb', accent: '#64865b', warden: 'rowan',
    encounters: [{ species: 'fernling', weight: 8 }, { species: 'cindercub', weight: 8 }, { species: 'ripplefin', weight: 8 }, { species: 'pebblit', weight: 22 }, { species: 'puffinch', weight: 22 }, { species: 'glimworm', weight: 16 }, { species: 'capshroom', weight: 16 }],
  },
  shore: {
    id: 'shore', name: 'Saltwhistle Shore', subtitle: 'Follow the tide, find your rhythm',
    description: 'Shells in your pockets. Salt in the air. The sea has a story to tell.',
    requiredSeals: 1, levels: [6, 8], ground: '#dcd3a8', grass: '#85a793', water: '#7fbecb', trees: '#719d81', sky: '#e4eef0', accent: '#488d9b', warden: 'marin',
    encounters: [{ species: 'ripplefin', weight: 16 }, { species: 'shellby', weight: 27 }, { species: 'dewdrop', weight: 25 }, { species: 'puffinch', weight: 10 }, { species: 'coilfin', weight: 22 }],
  },
  grove: {
    id: 'grove', name: 'Lanternroot Grove', subtitle: 'A thousand tiny lights',
    description: 'The old trees whisper. Every mushroom is a lantern waiting for night.',
    requiredSeals: 2, levels: [9, 11], ground: '#a7bc9d', grass: '#658c72', water: '#90bdb3', trees: '#426e64', sky: '#e0e8e4', accent: '#78826d', warden: 'iris',
    encounters: [{ species: 'fernling', weight: 10 }, { species: 'capshroom', weight: 24 }, { species: 'wisplet', weight: 23 }, { species: 'petalune', weight: 18 }, { species: 'glimworm', weight: 25 }],
  },
  summit: {
    id: 'summit', name: 'Emberpeak Trail', subtitle: 'A little closer to the sky',
    description: 'Warm stones and wide horizons. The last warden is waiting above the clouds.',
    requiredSeals: 3, levels: [12, 14], ground: '#c8bea8', grass: '#979e7b', water: '#a5bcc2', trees: '#8a967e', sky: '#eee6d9', accent: '#af8063', warden: 'flint',
    encounters: [{ species: 'cindercub', weight: 15 }, { species: 'wickit', weight: 18 }, { species: 'craggle', weight: 22 }, { species: 'scorchip', weight: 20 }, { species: 'geodeer', weight: 12 }, { species: 'hushowl', weight: 13 }],
  },
  sanctum: {
    id: 'sanctum', name: 'Firstlight Sanctuary', subtitle: 'Every path leads somewhere',
    description: 'Four seals. One quiet clearing. The light at the heart of the island is waking.',
    requiredSeals: 4, levels: [14, 16], ground: '#c6cfb3', grass: '#8da98c', water: '#94c5c1', trees: '#678f7e', sky: '#f2ecd7', accent: '#b59a57',
    encounters: [{ species: 'coilfin', weight: 26 }, { species: 'wisplet', weight: 24 }, { species: 'hushowl', weight: 25 }, { species: 'petalune', weight: 25 }],
  },
}

export const WARDENS: Record<WardenId, Warden> = {
  rowan: {
    id: 'rowan', name: 'Rowan', title: 'Keeper of the meadow', seal: 'Sprout seal', element: 'leaf', area: 'meadow',
    greeting: 'A good explorer listens before they lead. Show me you and your companion can listen to each other.',
    after: 'The shore is open to you now. Remember: every creature has something to teach you.',
    roster: [{ species: 'puffinch', level: 5 }, { species: 'capshroom', level: 6 }], reward: 220,
  },
  marin: {
    id: 'marin', name: 'Marin', title: 'Keeper of the tides', seal: 'Tide seal', element: 'tide', area: 'shore',
    greeting: 'Battles are like the tide. There is a time to push forward and a time to draw back. Shall we?',
    after: 'Beautifully done. Follow the lanterns inland; Iris will be waiting in the grove.',
    roster: [{ species: 'shellby', level: 8 }, { species: 'coilfin', level: 8 }, { species: 'ripplefin', level: 9 }], reward: 340,
  },
  iris: {
    id: 'iris', name: 'Iris', title: 'Keeper of the lanterns', seal: 'Glow seal', element: 'spark', area: 'grove',
    greeting: 'Even the smallest light can change the forest. Let me see what makes your team shine.',
    after: 'Your light is your own. Take it to Emberpeak, and do not let the mountain hurry you.',
    roster: [{ species: 'wisplet', level: 11 }, { species: 'petalune', level: 11 }, { species: 'lumimoth', level: 12 }], reward: 460,
  },
  flint: {
    id: 'flint', name: 'Flint', title: 'Keeper of the summit', seal: 'Summit seal', element: 'stone', area: 'summit',
    greeting: 'Getting here was the hard part. Now, one last lesson: strength is knowing who to stand beside.',
    after: 'All four seals. Firstlight Sanctuary is calling. Go on. The island has been waiting for you.',
    roster: [{ species: 'craggle', level: 14 }, { species: 'cinderlynx', level: 14 }, { species: 'geodeer', level: 15 }], reward: 600,
  },
}

export const ITEMS: Record<ItemId, { name: string; singular: string; price: number; description: string }> = {
  pods: { name: 'Bond pods', singular: 'Bond pod', price: 30, description: 'Invite a wildkin to join you. Lower health makes a stronger bond.' },
  tonics: { name: 'Meadow tonics', singular: 'Meadow tonic', price: 45, description: 'Restore 55 HP to a companion. Also wakes up a fainted friend.' },
  lures: { name: 'Starlight lures', singular: 'Starlight lure', price: 80, description: 'More encounters and a better chance of luminous wildkin for 40 steps.' },
}

export const QUESTS: Quest[] = [
  { id: 'set-off', title: 'A friend for the road', description: 'Choose your first companion.', goal: 1, progress: s => Number(s.started), reward: 30, pods: 2 },
  { id: 'first-catch', title: 'Room for one more', description: 'Befriend a wild wildkin with a bond pod.', goal: 1, progress: s => s.captures, reward: 90, pods: 3 },
  { id: 'first-seal', title: 'A little green light', description: 'Earn your first warden seal.', goal: 1, progress: s => s.seals.length, reward: 120 },
  { id: 'six-friends', title: 'Quite the little family', description: 'Register six different wildkin.', goal: 6, progress: s => s.caught.length, reward: 200, pods: 4 },
  { id: 'wayfarer', title: 'Off the beaten path', description: 'Visit three regions of Mosslight.', goal: 3, progress: s => s.visited.length, reward: 180 },
  { id: 'all-seals', title: 'The island knows your name', description: 'Earn all four warden seals.', goal: 4, progress: s => s.seals.length, reward: 350 },
  { id: 'homecoming', title: 'Bring the light home', description: 'Meet the guardian at Firstlight Sanctuary.', goal: 1, progress: s => Number(s.completed), reward: 500, pods: 5 },
  { id: 'naturalist', title: 'Every little wonder', description: 'Complete all 24 entries in your field guide.', goal: 24, progress: s => s.caught.length, reward: 1000 },
]

export const TIPS = [
  'Rustling grass is home to wild wildkin. Paths are always safe.',
  'A weakened wildkin is more likely to accept a bond pod.',
  'Quick bump restores energy. Take shelter restores more.',
  'Rest cottages heal your whole collection, completely free.',
  'All three starter species can also be found in the wild.',
  'Every companion in your team earns experience, even while resting.',
  'Luminous wildkin have a rare glow. A starlight lure helps you find them.',
  'Your progress saves automatically. Export a backup in Settings.',
]
