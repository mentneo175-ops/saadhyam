/// <reference types="vinxi/types/server" />
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (err) => {
    const isDev = process.env.NODE_ENV !== 'production';
    const isTimeoutOrNetwork = err && (
      err.message?.includes('Stream lifetime exceeded') || 
      err.message?.includes('Serialization timeout') ||
      err.message?.includes('Unhandled') ||
      err.message?.includes('ECONNREFUSED')
    );
    
    if (isTimeoutOrNetwork) {
      console.warn('[TanStack Start SSR Watchdog] Handled stream/serialization/network error safely without crashing:', err.message);
      return;
    }
    
    console.error('Uncaught Exception:', err);
    if (!isDev) {
      process.exit(1);
    }
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
