import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

async function assetsIn(directory: string, prefix = ''): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = `${prefix}${entry.name}`
    if (entry.isDirectory()) files.push(...await assetsIn(join(directory, entry.name), `${relative}/`))
    else if (entry.isFile() && entry.name !== 'sw.js') files.push(relative)
  }
  return files
}

export function offlineGame(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'wildkin-offline',
    apply: 'build',
    configResolved(resolved) { config = resolved },
    async closeBundle() {
      const directory = resolve(config.root, config.build.outDir)
      const files = await assetsIn(directory)
      const digest = createHash('sha256')
      for (const file of files) {
        digest.update(file)
        digest.update(await readFile(resolve(directory, file)))
      }
      const cacheName = `wildkin-mosslight-${digest.digest('hex').slice(0, 16)}`
      const urls = [config.base, ...files.map(file => `${config.base}${file}`)]
      const source = `
const CACHE_NAME = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(urls)};
const INDEX = ${JSON.stringify(config.base)};
const SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    for (const name of names) {
      if (name.startsWith('wildkin-mosslight-') && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const offline = await cache.match(INDEX);
        if (offline) return offline;
        throw error;
      }
    })());
  } else {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      // These are public same-origin build assets. Static hosts may add Vary: Origin,
      // while module requests include Origin and precache Request objects do not.
      const cached = await cache.match(event.request, { ignoreVary: true });
      return cached || fetch(event.request);
    })());
  }
});
`
      await writeFile(join(directory, 'sw.js'), source.trimStart(), 'utf8')
    },
  }
}
