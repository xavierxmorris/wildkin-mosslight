# A little island, built to be playable

## Direction

Mosslight is a small, finished, single-player adventure, not a service game. The visual identity combines an illustrated pocket world, an explorer's paper journal, a pixel-lettered wordmark, and friendly creature silhouettes. All creature and landscape art is authored as SVG in the application.

The core colors are mist `#EAF2EC`, ink `#183E3C`, fern `#5F8D53`, sea `#72B9C2`, coral `#EF855D`, and sun `#F1CF76`. Secondary text uses darker shades for contrast. Silkscreen supplies the wordmark, Nunito Sans the interface, and IBM Plex Mono the field data. Fonts are self-hosted.

## Progression

| Region | Wild levels | Warden team | Unlock |
| --- | --- | --- | --- |
| Mosslight Meadow | 3-5 | Rowan: 5, 6 | Start |
| Saltwhistle Shore | 6-8 | Marin: 8, 8, 9 | Sprout seal |
| Lanternroot Grove | 9-11 | Iris: 11, 11, 12 | Tide seal |
| Emberpeak Trail | 12-14 | Flint: 14, 14, 15 | Glow seal |
| Firstlight Sanctuary | 14-16 | Solume: 16 | Summit seal |

A warden awards a seal only after every queued opponent is defeated. A previously defeated warden cannot be farmed for more seal rewards. Solume can be encountered again if defeated rather than befriended, so the final field-guide entry cannot be permanently missed.

The ending unlocks continued exploration. There is no time limit, permadeath, premium currency, or content dependent on a server.

## Battle rules

- The player chooses first. A surviving opponent answers once.
- A team begins with three energy, capped at five. Switching sets energy to three and uses the turn.
- Quick bump is neutral, costs zero, and restores one energy.
- The elemental strike costs one energy; the burst costs three.
- Take shelter restores two energy and halves incoming damage for that turn.
- A strong elemental matchup multiplies damage by 1.5, a resisted matchup by 0.65, and a same-element matchup by 0.8. Neutral attacks ignore the chart.
- An exhausted active companion is replaced automatically by the first conscious teammate.
- Total defeat returns the explorer to the current region's safe spawn, heals the entire collection, and costs 10% of available petals, capped at 60.

Each elemental move uses the same documented effectiveness function as the help chart and damage calculation.

## Friendship and growth

Capture odds are rarity-dependent and improve with missing health. Every attempt consumes exactly one pod and, on failure, gives the opponent a turn. Warden companions cannot be captured.

Solume accepts a pod with certainty at 25% health or below. Luminous creatures use a cosmetic alternate palette: 1 in 100 wild encounters normally, or 1 in 16 while a lure is active. A lure lasts 40 successful walking steps and also raises encounter frequency.

The active team holds six companions. The reserve sanctuary holds another 120. Captures beyond the active team are sent to reserves; when both are full, capture is refused without spending a pod.

Every team member receives 16 times the defeated opponent's level in experience. Capture awards 9 times the opponent's level. The next-level threshold is `30 + 10 * currentLevel`; the level cap is 40. Level-ups add newly gained maximum HP without reviving fainted companions.

| Starting form | Grown form | Level |
| --- | --- | --- |
| Fernling | Briarhorn | 12 |
| Cindercub | Cinderlynx | 12 |
| Ripplefin | Tidewhisk | 12 |
| Pebblit | Cairnback | 10 |
| Puffinch | Plumesail | 10 |
| Glimworm | Lumimoth | 10 |

Growth preserves identity and nicknames and adds both forms to the guide. All base species are obtainable in the regional encounter tables; evolved forms come from growth, not an unreachable placeholder.

## Navigation invariants

The board has 28 columns and 18 rows. Movement is one orthogonal tile at a time. Water, trees, rocks, and building footprints are solid.

Click-to-walk uses breadth-first search through the same `canWalk` predicate as movement. Landmark paths end within Manhattan distance one. All landmarks in all regions are checked for reachability from the safe spawn.

The **Explore grass** shortcut walks a real route and then a short search pattern. It does not spawn encounters directly or bypass collision. An encounter pauses the route, and returning to the trail cancels it; movement never resumes unexpectedly after a battle.

Tall grass guarantees an encounter within eight grass steps. Ordinary paths cannot trigger wild encounters. Timers never decide battle outcomes.

## Saves and deterministic behavior

`gameReducer` is pure with respect to its input. It clones state before applying a command. Its xorshift random stream is stored in the game state, making the next turn reproducible across reloads and React Strict Mode reducer replays.

The save envelope contains a format identifier, schema version, timestamp, and game state. Validation covers identifiers, bounds, unique companions, guide membership, next-ID allocation, seal order, walkable positions, and battle consistency. Dialogs and temporary notifications are not persisted.

Malformed or future-version saves are rejected explicitly. Imports require confirmation before replacing an existing adventure. Storage errors do not pretend that saving succeeded.

## Production and offline behavior

The production build enumerates its actual output and derives a content-addressed cache name from asset paths and bytes. Installation succeeds only when the precache completes.

The worker handles GET requests within this game's same-origin scope. Navigation tries the network first and uses the cached entry document on network failure. Build assets are cache-first. Their lookup ignores `Vary` because these are public, invariant, same-origin files: hosts such as Vite Preview add `Vary: Origin`, while module requests and precache requests carry different Origin metadata.

Old caches are deleted only if their names belong to this game's namespace. New workers wait until the player chooses to save and update. The service worker never reads the game save or contacts a third-party game service.

## Boundaries

This is a deliberately compact RPG: five fixed authored maps, no multiplayer, no open-ended procedural continent, no trading between browsers, and one local adventure per browser profile. Difficulty comes from team composition, energy, and preparation rather than reaction speed.

Current screenshots are generated from the actual application, including its mobile layouts. Engine playthroughs prove the complete progression path for all three starters; browser scenarios exercise the visible interactions and offline delivery.
