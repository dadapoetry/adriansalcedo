// Comprovació petita del muntatge de la capa WebGL: el canvas ha de ser decoratiu,
// carregar-se de forma opcional i no substituir mai el text del rotlle.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const app = read('js/app.js');
const css = read('css/style.css');
const paper = read('js/paper.js');

assert.match(html, /<canvas id="paper" aria-hidden="true"><\/canvas>/);
assert.match(html, /<div class="viewport">\s*<canvas id="paper"/);
assert.match(css, /#paper\s*\{[^}]*pointer-events:\s*none/s);
assert.match(css, /\.roll\s*\{[^}]*z-index:\s*1/s);
assert.match(app, /if \(!reduceMotion\)/);
assert.match(app, /await import\(withBase\('\/js\/paper\.js'\)\)/);
assert.match(app, /paper\?\.resize\(window\.innerWidth, window\.innerHeight\)/);
assert.match(app, /if \(paper && !document\.hidden\) paper\.update\(current\)/);
assert.ok(!/paper\.innerHTML|roll\.innerHTML\s*=.*paper/.test(app), 'el paper no pot substituir el DOM');
assert.match(paper, /three@0\.187\.0\/build\/three\.module\.js/);
assert.ok(!/canvas-html/.test(paper), 'canvas-html és una funció volàtil');

console.log('Capa de paper: muntatge correcte.');
