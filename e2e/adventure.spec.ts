import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { createGame, gameReducer, makeCreature } from '../src/game/engine'
import { decodeSave, encodeSave, SAVE_KEY } from '../src/game/persistence'
import type { GameState, SpeciesId } from '../src/game/types'

function adventure(starter: SpeciesId = 'fernling') {
  return gameReducer(createGame(1), { type: 'START', name: 'Scout', starter })
}

function encounter() {
  const state = adventure()
  const enemy = makeCreature(state, 'puffinch', 3)
  state.seen.push('puffinch')
  state.battle = { kind: 'wild', enemy, queue: [], activeUid: 1, energy: 3, round: 1, status: 'active', log: ['A wild Puffinch appears.'], reward: 0, effect: 'none' }
  return state
}

async function load(page: Page, state: GameState) {
  await page.goto('./')
  await page.evaluate(({ key, text }) => localStorage.setItem(key, text), { key: SAVE_KEY, text: encodeSave(state) })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mosslight Meadow', exact: true })).toBeVisible()
}

async function saved(page: Page): Promise<GameState> {
  const text = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)
  expect(text).toBeTruthy()
  const result = decodeSave(text!)
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error)
  return result.state
}

test('starts with the chosen companion and name, at the top of the map', async ({ page }) => {
  await page.goto('./')
  await page.locator('.starter-ember').click()
  await page.getByLabel('And what should we call you?').fill('Juniper')
  await page.getByRole('button', { name: 'Set off with Cindercub' }).click()
  await expect(page.getByRole('button', { name: 'Manage Cindercub' })).toBeVisible()
  await expect(page.getByTestId('world')).toHaveAttribute('data-x', '9')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  expect((await saved(page)).name).toBe('Juniper')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Manage Cindercub' })).toBeVisible()
  expect((await saved(page)).name).toBe('Juniper')
})

test('supports arrow keys, direction buttons, proximity interaction, and free rest', async ({ page }) => {
  await load(page, adventure())
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('world')).toHaveAttribute('data-x', '10')
  for (let step = 0; step < 5; step++) await page.getByRole('button', { name: 'Move left', exact: true }).click()
  await expect(page.getByTestId('world')).toHaveAttribute('data-x', '5')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toContainText('Put your feet up.')
  await page.getByRole('button', { name: 'Rest all companions / Free' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(async () => (await saved(page)).position.x).toBe(5)
})

test('finds a real encounter by walking through grass and cancels auto-walking after retreat', async ({ page }) => {
  await load(page, adventure())
  await page.getByRole('button', { name: 'Explore grass', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('A rustle in the grass.', { timeout: 15_000 })
  const during = await saved(page)
  expect(during.steps).toBeGreaterThan(0)
  expect(during.battle?.kind).toBe('wild')
  await page.getByRole('button', { name: /Retreat/ }).click()
  await page.getByRole('button', { name: 'Back to the trail' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.waitForTimeout(650)
  const after = await saved(page)
  expect(after.position).toEqual(during.position)
  expect(after.battle).toBeNull()
})

test('persists an encounter after a keyboard attack and resumes its exact state', async ({ page }) => {
  await load(page, encounter())
  await expect(page.getByRole('dialog')).toContainText('Puffinch')
  await page.keyboard.press('1')
  await expect.poll(async () => (await saved(page)).battle?.round).toBe(2)
  const before = await saved(page)
  await page.reload()
  await expect(page.getByRole('dialog')).toContainText('TURN 2')
  const after = await saved(page)
  expect(after.battle).toEqual(before.battle)
  expect(after.party).toEqual(before.party)
  expect(after.seed).toBe(before.seed)
})

test('befriends a wildkin and renders it in the team and completed field entry', async ({ page }) => {
  await load(page, encounter())
  await page.getByRole('button', { name: /Bond pod/ }).click()
  await expect(page.getByRole('dialog')).toContainText('A new little friendship.')
  await page.getByRole('button', { name: 'Back to the trail' }).click()
  await expect(page.getByRole('button', { name: 'Manage Puffinch' })).toBeVisible()
  await page.getByRole('button', { name: /Field guide/ }).click()
  await page.getByRole('button', { name: 'View Puffinch', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Puffs up to twice its size')
})

test('walks to a shop, buys supplies, and claims a quest only once', async ({ page }) => {
  await load(page, adventure())
  await page.locator('.trail-shortcuts').getByRole('button', { name: 'Supply cart' }).click()
  await expect(page.getByRole('dialog')).toContainText('Good things for the road.', { timeout: 15_000 })
  await page.getByRole('button', { name: 'Buy Bond pod', exact: true }).click()
  await expect.poll(async () => (await saved(page)).inventory.pods).toBe(11)
  expect((await saved(page)).coins).toBe(150)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'All notes' }).click()
  await page.getByRole('button', { name: 'Collect reward', exact: true }).click()
  await expect.poll(async () => (await saved(page)).coins).toBe(180)
  await expect(page.getByRole('button', { name: 'Collect reward', exact: true })).toHaveCount(0)
})

test('does not move while a modal is open and restores keyboard focus on Escape', async ({ page }) => {
  await load(page, adventure())
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.keyboard.press('ArrowRight')
  expect((await saved(page)).position.x).toBe(9)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused()
})

test('keeps locked regions closed and allows unlocked fast travel', async ({ page }) => {
  const state = adventure()
  state.seals = ['rowan']
  await load(page, state)
  await page.getByRole('button', { name: 'Island map', exact: true }).click()
  await expect(page.getByRole('button', { name: /Lanternroot Grove/ })).toBeDisabled()
  await page.getByRole('button', { name: /Saltwhistle Shore/ }).click()
  await expect(page.getByRole('heading', { name: 'Saltwhistle Shore', exact: true })).toBeVisible()
  expect((await saved(page)).visited).toContain('shore')
})

test('renames companions as text and moves a reserve into the team', async ({ page }) => {
  const state = adventure()
  const reserve = makeCreature(state, 'ripplefin', 5)
  state.reserve.push(reserve)
  state.seen.push('ripplefin')
  state.caught.push('ripplefin')
  await load(page, state)
  await page.getByRole('button', { name: 'Manage team', exact: true }).click()
  await page.getByLabel('A name between friends').fill('<b>Friend</b>')
  await page.getByRole('button', { name: 'Save name', exact: true }).click()
  await expect(page.getByRole('heading', { name: '<b>Friend</b>', exact: true })).toBeVisible()
  await expect(page.locator('.companion-detail h3 b')).toHaveCount(0)
  await page.getByRole('button', { name: /Reserve sanctuary/ }).click()
  await page.locator('.team-list').getByRole('button', { name: /Ripplefin/ }).click()
  await page.getByRole('button', { name: 'Add to team', exact: true }).click()
  expect((await saved(page)).party).toHaveLength(2)
  expect((await saved(page)).reserve).toHaveLength(0)
})

test('exports a valid adventure and requires confirmation before import replaces progress', async ({ page }) => {
  await load(page, adventure())
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export adventure', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^wildkin-mosslight-.*\.json$/)
  const path = await download.path()
  expect(decodeSave(await readFile(path!, 'utf8')).ok).toBe(true)
  const imported = adventure('cindercub')
  imported.name = 'Wayfarer'
  await page.getByLabel('Import an adventure file').setInputFiles({ name: 'new-adventure.json', mimeType: 'application/json', buffer: Buffer.from(encodeSave(imported)) })
  await expect(page.getByRole('dialog')).toContainText('Welcome back, Wayfarer.')
  expect((await saved(page)).name).toBe('Scout')
  await page.getByRole('button', { name: 'Load adventure', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Manage Cindercub' })).toBeVisible()
  expect((await saved(page)).name).toBe('Wayfarer')
})

test('rejects a malformed imported save without overwriting the current one', async ({ page }) => {
  await load(page, adventure())
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Import an adventure file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"broken":') })
  await expect(page.getByRole('alert')).toContainText('not valid JSON')
  expect((await saved(page)).name).toBe('Scout')
  await expect(page.getByRole('button', { name: 'Load adventure', exact: true })).toHaveCount(0)
})

test('preserves an unreadable autosave until the player explicitly starts over', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(key => localStorage.setItem(key, 'unreadable original'), SAVE_KEY)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('not valid JSON')
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe('unreadable original')
  await expect(page.getByRole('button', { name: 'Download the unreadable save for recovery' })).toBeVisible()
})

test('does not reset an adventure until the destructive confirmation is accepted', async ({ page }) => {
  await load(page, adventure())
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Start a new adventure', exact: true }).click()
  expect((await saved(page)).started).toBe(true)
  await page.getByRole('button', { name: 'Keep this adventure', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Yes, start a new adventure' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Start a new adventure', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, start a new adventure', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Set off with Fernling', exact: true })).toBeVisible()
  expect((await saved(page)).started).toBe(false)
})

test('supports held direction buttons and fits narrow mobile screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await load(page, adventure())
  const left = page.getByRole('button', { name: 'Move left', exact: true })
  const bounds = await left.boundingBox()
  expect(bounds).not.toBeNull()
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(650)
  await page.mouse.up()
  expect((await saved(page)).position.x).toBeLessThanOrEqual(6)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  await page.getByRole('button', { name: 'Field guide', exact: false }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.querySelector('dialog')!.scrollWidth > document.querySelector('dialog')!.clientWidth)).toBe(false)
})

test('honors reduced motion and provides opt-in synthesized sound', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await load(page, adventure())
  expect(await page.locator('.journal-companion .creature-body').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
  await page.getByRole('button', { name: 'Turn sound on', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Turn sound off', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Turn sound off', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Turn sound on', exact: true })).toBeVisible()
})

for (const surface of ['welcome', 'adventure', 'guide', 'team', 'bag', 'map', 'journal', 'settings', 'help', 'battle'] as const) {
  test(`has no WCAG A/AA accessibility violations on ${surface}`, async ({ page }) => {
    if (surface === 'welcome') await page.goto('./')
    else await load(page, surface === 'battle' ? encounter() : adventure())
    const menus = { guide: 'Field guide', team: 'Manage team', bag: 'Satchel', map: 'Island map', journal: 'All notes', settings: 'Settings', help: 'How to play' }
    if (surface in menus) {
      const name = menus[surface as keyof typeof menus]
      await page.getByRole('button', { name, exact: surface !== 'guide' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
    }
    await page.evaluate(() => document.fonts.ready)
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      failures: violation.nodes.map(node => ({ target: node.target, reason: node.failureSummary })),
    }))).toEqual([])
  })
}

test('produces no runtime errors while exploring, opening menus, and entering a battle', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await load(page, adventure())
  for (const name of ['Settings', 'How to play', 'Manage team', 'Island map', 'Satchel']) {
    await page.getByRole('button', { name, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
  }
  await page.getByRole('button', { name: 'Explore grass', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('A rustle in the grass.', { timeout: 15_000 })
  expect(errors).toEqual([])
})
