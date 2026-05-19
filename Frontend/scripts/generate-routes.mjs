import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Generator, getConfig } from '@tanstack/router-generator';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const config = getConfig(
  {
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
  },
  root,
);

const generator = new Generator({ config, root });
await generator.run();
console.log('Generated', path.join(root, 'src/routeTree.gen.ts'));
