/// <reference types="vinxi/types/server" />
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (err) => {
    if (err && (err.message?.includes('Stream lifetime exceeded') || err.message?.includes('Serialization timeout'))) {
      console.warn('[TanStack Start SSR Watchdog] Handled stream/serialization timeout safely without crashing.');
      return;
    }
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

import { getRouterManifest } from '@tanstack/react-router/server'
import { createMemoryHistory } from '@tanstack/react-router'
import { StartServer } from '@tanstack/react-router'
import { getRouter } from '../src/router'
import type { AnyRouter } from '@tanstack/react-router'

export async function render(opts: { url: string }) {
  const router = getRouter()
  const memoryHistory = createMemoryHistory({
    initialEntries: [opts.url],
  })

  router.update({
    history: memoryHistory,
  })

  await router.load()

  const appHtml = await StartServer({
    router: router as AnyRouter,
  })

  return {
    html: appHtml,
    router,
  }
}

export function getManifest() {
  return getRouterManifest()
}
