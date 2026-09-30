const fs = require('fs');
const path = require('path');

const ROOT = __dirname + '/..';
const CONTENT = path.join(ROOT, 'content');

const BASE = 'https://adriansalcedo.com';

const SECTIONS = {
  obres: 'works',
  projectes: 'projects',
  festivals: 'festivals',
  premis: 'awards',
  premsa: 'articles',
  quisoc: null,
  contacte: null,
  arxiu: null,
  cerca: null,
  agenda: null,
};

function stripHtml(s) {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, name), 'utf8'));
}

/* ── Single sources of truth (all editable from /admin) ─────────────── */

const SITE = (() => { try { return readJson('site.json').site || {}; } catch { return {}; } })();


/* ── Person schema is generated from content/site.json ────────────────── */

function personSchema() {
  const socials = (() => { try { return readJson('site.json').social || {}; } catch { return {}; } })();
  const sameAs = Object.keys(socials)
    .map((k) => socials[k] && socials[k].url)
    .filter(Boolean)
    .sort((a, b) => {
      const refs = ['wikipedia', 'goodreads', 'wikidata'];
      const rank = (u) => { const i = refs.findIndex((r) => socials[r] && socials[r].url === u); return i === -1 ? 99 : i; };
      return rank(a) - rank(b);
    });

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': SITE.title || 'Adrián Salcedo Toca',
    'givenName': 'Adrián',
    'familyName': 'Salcedo Toca',
    'jobTitle': 'Poeta avantguardista i crític cultural',
    'description': 'Poeta avantguardista, comunicador i crític cultural. Membre de l\'Associació d\'Escriptors en Llengua Catalana (AELC).',
    'url': SITE.url || BASE,
    'image': (SITE.url || BASE) + (SITE.logo || '/media/images/sat.png'),
    ...(SITE.email ? { email: SITE.email } : {}),
    'nationality': { '@type': 'Country', 'name': 'Spain' },
    'address': { '@type': 'PostalAddress', 'addressLocality': 'Mataró', 'addressRegion': 'Catalunya', 'addressCountry': 'ES' },
    'knowsLanguage': ['ca', 'en', 'es'],
    'hasOccupation': [
      { '@type': 'Occupation', 'name': 'Poeta', 'occupationLocation': { '@type': 'Country', 'name': 'Spain' } },
      { '@type': 'Occupation', 'name': 'Crític cultural', 'occupationLocation': { '@type': 'Country', 'name': 'Spain' } },
    ],
    'award': [
      'Premi Marta Pessarrodona de Poesia 2021',
      'Finalista VII Certamen Art Jove de Poesia Salvador Iborra',
    ],
    'sameAs': sameAs,
  };
}

function injectPersonSchema(html) {
  const block = '<script type="application/ld+json">\r\n' + JSON.stringify(personSchema(), null, 2).replace(/\n/g, '\r\n') + '\r\n</script>';
  const re = /<script type="application\/ld\+json">\s*[\s\S]*?<\/script>/g;
  let found = false;
  const out = html.replace(re, (m) => {
    if (found || !/"@type":\s*"Person"/.test(m)) return m;
    found = true;
    return block;
  });
  if (!found) console.warn('[build-seo] Person schema block not found in index.html');
  return out;
}

let TEMPLATE = injectPersonSchema(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
if (TEMPLATE !== fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) {
  fs.writeFileSync(path.join(ROOT, 'index.html'), TEMPLATE, 'utf8');
}

// --- Sitemap ---
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = new Date().toISOString().slice(0, 10);

function sitemapUrl(loc, opts) {
  const o = opts || {};
  const lastmod = o.lastmod || today;
  const changefreq = o.changefreq || 'monthly';
  const priority = o.priority || '0.6';
  return `  <url>
    <loc>${xmlEsc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const SECTION_SPLIT = {
  obres:     ['weekly', '0.9'],
  projectes: ['weekly', '0.9'],
  festivals: ['weekly', '0.9'],
  premis:    ['monthly', '0.8'],
  quisoc:    ['monthly', '0.8'],
  contacte:  ['monthly', '0.7'],
  premsa:    ['monthly', '0.7'],
  arxiu:     ['monthly', '0.7'],
  cerca:     ['monthly', '0.3'],
  agenda:    ['weekly', '0.8'],
};

const smUrls = [sitemapUrl(BASE + '/', { changefreq: 'weekly', priority: '1.0' }), sitemapUrl(BASE + '/en', { changefreq: 'weekly', priority: '1.0' })];

for (const [section, itemKey] of Object.entries(SECTIONS)) {
  const split = SECTION_SPLIT[section] || ['monthly', '0.6'];

  for (const lang of ['ca', 'en']) {
    const prefix = lang === 'en' ? '/en' : '';
    smUrls.push(sitemapUrl(`${BASE}${prefix}/${section}`, { changefreq: split[0], priority: split[1] }));

    if (itemKey) {
      let json;
      try { json = readJson(section + '.json'); } catch { json = null; }
      if (json && Array.isArray(json[itemKey])) {
        for (const item of json[itemKey]) {
          smUrls.push(sitemapUrl(`${BASE}${prefix}/${section}/${item.id}`, { changefreq: 'monthly', priority: '0.6' }));
        }
      }
    }
  }
}

fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + smUrls.join('\n') + '\n</urlset>\n',
  'utf8'
);

// --- Feed (RSS) ---
const worksData = readJson('obres.json');
const worksAll = Array.isArray(worksData.works) ? worksData.works : [];
const worksSorted = [...worksAll].sort((a, b) => (b.year || 0) - (a.year || 0));

const rssDate = (year) => new Date(Date.UTC(year, 11, 31)).toUTCString().replace('00:00:00', '12:00:00');

const feedItems = worksSorted.map((w) => {
  const year = w.year || new Date().getFullYear();
  const desc = stripHtml(Array.isArray(w.content) ? w.content.join(' ') : '').slice(0, 400);
  return `    <item>
      <title>${xmlEsc(w.title)}</title>
      <link>${BASE}/obres/${w.id}</link>
      <description>${xmlEsc(desc)}</description>
      <pubDate>${rssDate(year)}</pubDate>
      <guid>${BASE}/obres/${w.id}</guid>
    </item>`;
}).join('\n');

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Adrián Salcedo Toca</title>
    <link>${BASE}</link>
    <description>Poesia avantguardista, videopoesia, crònica cultural i projectes editorials.</description>
    <language>ca</language>
    <copyright>Adrián Salcedo Toca // © ${new Date().getFullYear()}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
${feedItems}
  </channel>
</rss>`;

fs.writeFileSync(path.join(ROOT, 'feed.xml'), feed, 'utf8');

console.log(`[build-seo] ${smUrls.length} sitemap URLs`);
console.log(`[build-seo] ${feedItems ? worksSorted.length : 0} feed items`);
console.log(`[build-seo] index.html (schema Person), sitemap.xml i feed.xml generats`);
console.log(`[build-seo] en producció les pàgines les serveix _worker.js (Cloudflare) a partir de l'index.html`);
