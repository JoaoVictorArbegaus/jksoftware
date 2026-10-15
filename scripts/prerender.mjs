// Injeta o HTML renderizado no servidor (dist-ssr) em dist/index.html e remove o bundle de SSR.
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { render } = await import(pathToFileURL(`${root}dist-ssr/entry-server.js`).href);

const file = `${root}dist/index.html`;
const html = await readFile(file, 'utf8');
if (!html.includes('<!--app-html-->')) throw new Error('Marcador <!--app-html--> não encontrado em dist/index.html');
await writeFile(file, html.replace('<!--app-html-->', render()));
await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log('Pré-renderizado: dist/index.html');
