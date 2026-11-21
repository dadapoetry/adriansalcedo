const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const names = ['site', 'site.en', 'home', 'obres', 'projectes', 'festivals', 'premis', 'premsa', 'quisoc', 'agenda', 'labels'];
const data = {};

for (const name of names) {
  data[name] = JSON.parse(fs.readFileSync(path.join(root, 'content', `${name}.json`), 'utf8'));
}

fs.writeFileSync(
  path.join(root, 'prototip', 'data.js'),
  `window.PROTOTIP_DATA = ${JSON.stringify(data)};\n`
);
