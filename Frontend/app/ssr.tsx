/// <reference types="vinxi/types/server" />
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
