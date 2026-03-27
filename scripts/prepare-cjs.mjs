import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const cjsDir = resolve(process.cwd(), 'dist/cjs');

await mkdir(cjsDir, { recursive: true });
await writeFile(
  resolve(cjsDir, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
  'utf8'
);
