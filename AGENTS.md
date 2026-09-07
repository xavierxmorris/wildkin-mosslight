# Working on Wildkin: Mosslight

## Commands

- `npm ci` installs the locked graph; use Node 24.x.
- `npm run check` runs Oxlint, Vitest, and a strict production build.
- `npx playwright install chromium` prepares browser coverage on a new machine.
- `npm run test:e2e` builds and runs Playwright against development port 4173 and preview port 4174.

## Invariants

- Keep `src/game/engine.ts` independent of React, DOM APIs, network access, and clocks.
- All gameplay mutations go through `gameReducer`. Randomness must advance the RNG stored in state; do not call `Math.random()` inside the reducer.
- Every public action must preserve `gameSchema` validity. Test malformed commands or interrupted transitions at the engine and save boundaries.
- Do not move, travel, shop, claim quests, or rearrange the team while a battle is present.
- Preserve companion UIDs across capture, evolution, naming, and reserve swaps.
- Use `canWalk`, `findPath`, and `nearbyLandmark` for navigation and interactions. Do not introduce teleporting shortcuts disguised as walking.
- Any content identifier change requires save-compatibility consideration. Do not silently accept unknown save versions or overwrite corrupt saves.
- Keep the field-guide collection complete: every species needs an encounter, evolution path, or explicit guardian path.

## Interface and assets

- Preserve the illustrated field-guide direction and the existing color/type tokens.
- Use existing `Icon`, `CreatureArt`, `Modal`, `HealthBar`, and `ElementTag` components.
- Keep dialog focus restoration, keyboard input guards, touch controls, and reduced motion intact.
- Do not add copied Pokemon/Nintendo/Game Freak characters, assets, audio, maps, logos, or data.
- Keep fonts self-hosted and distribute their license texts.
- Browser-visible failures must be actionable; do not add silent catches or fake success states.

## Publishing

- GitHub Pages uses `/wildkin-mosslight/`; links, the manifest, and offline behavior must work under that base.
- The offline precache must derive from the actual build output, not guessed asset names.
- Pin GitHub Actions to immutable revisions and keep write permissions in the deployment job.
- Do not commit saves, secrets, browser profiles, `node_modules`, build output, or test-run artifacts.
