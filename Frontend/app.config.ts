import { defineConfig } from '@tanstack/react-router/config'

export default defineConfig({
  routesDirectory: './src/routes',
  generatedRouteTree: './src/routeTree.gen.ts',
})
