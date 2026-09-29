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
  bibliografia: null,
  agenda: null,
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function stripHtml(s) {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, name), 'utf8'));
}

/* ── Single sources of truth (all editable from /admin) ─────────────── */

// content/seo.json -> { section: { ca, en } } meta descriptions
const SECTION_DESCS = {};
try {
  for (const row of readJson('seo.json').sections || []) {
    if (!row || !row.key) continue;
    SECTION_DESCS[row.key] = { ca: row.desc || '', en: row.desc_en || '' };
  }
} catch {
  console.warn('[build-seo] content/seo.json not readable, falling back to generic descriptions');
}

// content/site.json + content/site.en.json -> { section: { ca, en } } page titles
const SECTION_TITLES = {};
try {
  for (const item of readJson('site.json').nav || []) {
    if (!item || !item.id) continue;
    SECTION_TITLES[item.id] = {
      ca: item.seo_title || item.label || null,
      en: item.seo_title_en || item.label_en || item.label || null,
    };
  }
  for (const item of readJson('site.en.json').nav || []) {
    if (!item || !item.id) continue;
    const row = SECTION_TITLES[item.id] || (SECTION_TITLES[item.id] = { ca: null, en: null });
    if (!row.ca) row.ca = item.label || null;
    if (!row.en) row.en = item.label || item.label_en || null;
  }
} catch {
  console.warn('[build-seo] site nav not readable, falling back to section names');
}

const SITE = (() => { try { return readJson('site.json').site || {}; } catch { return {}; } })();
const HOME_SEO = (() => { try { return readJson('home.json').seo || {}; } catch { return {}; } })();

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

function meta(desc, lang) {
  const isEn = lang === 'en';
  const seo = desc;

  let title, description, ogType, image;

  if (seo.item) {
    const item = seo.item;
    const itemSeo = item.seo || {};
    const t = isEn ? (item.title_en || item.title) : item.title;
    const raw = isEn ? (item.content_en || item.content) : item.content;

    const seoTitle = isEn ? (itemSeo.title_en || itemSeo.title) : itemSeo.title;
    title = seoTitle ? seoTitle + ' | Adrián Salcedo Toca' : t + ' | Adrián Salcedo Toca';

    const seoDesc = isEn ? (itemSeo.description_en || itemSeo.description) : itemSeo.description;
    if (seoDesc) {
      description = seoDesc;
    } else {
      const contentDesc = stripHtml(Array.isArray(raw) ? raw.join(' ') : raw).slice(0, 300);
      description = contentDesc || (item.publication
        ? (isEn ? 'Article by Adrián Salcedo Toca.' : "Article d'Adrián Salcedo Toca.")
        : (isEn ? 'Avant-garde poetry by Adrián Salcedo Toca.' : "Poesia avantguardista d'Adrián Salcedo Toca."));
    }
    ogType = 'article';
    if (item.images && item.images[0] && item.images[0].src) {
      image = item.images[0].src.startsWith('http') ? item.images[0].src : BASE + item.images[0].src;
    } else if (item.image) {
      image = item.image.startsWith('http') ? item.image : BASE + item.image;
    } else {
      image = BASE + (SITE.logo || '/media/images/sat.png');
    }
  } else if (seo.title) {
    title = seo.title + ' | Adrián Salcedo Toca';
    description = (desc.section && SECTION_DESCS[desc.section] && (isEn ? SECTION_DESCS[desc.section].en : SECTION_DESCS[desc.section].ca))
      || SITE.description
      || (isEn ? 'Portfolio of Adrián Salcedo Toca.' : "Portfoli d'Adrián Salcedo Toca.");
    ogType = 'website';
    image = BASE + (SITE.logo || '/media/images/sat.png');
  } else {
    title = isEn ? (HOME_SEO.title_en || HOME_SEO.title) : (HOME_SEO.title || (SITE.title || 'Adrián Salcedo Toca'));
    description = isEn ? (HOME_SEO.description_en || HOME_SEO.description) : (HOME_SEO.description || SITE.description || '');
    ogType = 'website';
    image = BASE + (SITE.logo || '/media/images/sat.png');
  }
  if (!title) title = SITE.title || 'Adrián Salcedo Toca';
  if (!description) description = SITE.description || '';

  return { title, description, ogType, image, lang };
}

function buildPage(m) {
  if (!m) return null;
  const langAttr = m.lang === 'en' ? 'en' : 'ca';
  const ogLocale = m.lang === 'en' ? 'en_GB' : 'ca_ES';
  const twCard = m.ogType === 'article' && m.image !== BASE + '/media/images/sat.png' ? 'summary_large_image' : 'summary';
  const canonical = m._canonical;

  let html = TEMPLATE;
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${langAttr}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(m.description)}$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(canonical)}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(m.title)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(m.description)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`);
  html = html.replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${m.ogType}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${ogLocale}$2`);
  html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(m.image)}$2`);
  html = html.replace(/(<meta name="twitter:card" content=")[^"]*(")/, `$1${twCard}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(m.title)}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(m.description)}$2`);
  html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(m.image)}$2`);

  return html;
}

let count = 0;

function writePage(urlPath, html) {
  const isHome = urlPath.endsWith('/');
  const filePath = isHome
    ? path.join(ROOT, urlPath.slice(1), 'index.html')
    : path.join(ROOT, urlPath.slice(1) + '.html');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html, 'utf8');
  count++;
}

// Home
for (const lang of ['ca', 'en']) {
  const prefix = lang === 'en' ? '/en' : '';
  const m = meta({}, lang);
  m._canonical = BASE + prefix + '/';
  writePage(prefix + '/', buildPage(m));
}

// Sections and articles
for (const [section, itemKey] of Object.entries(SECTIONS)) {
  const jsonName = section + '.json';
  let json;
  try { json = readJson(jsonName); } catch { continue; }

  for (const lang of ['ca', 'en']) {
    const prefix = lang === 'en' ? '/en' : '';
    const isEn = lang === 'en';

    const sectionTitle = isEn
      ? (SECTION_TITLES[section] && SECTION_TITLES[section].en)
      : (SECTION_TITLES[section] && SECTION_TITLES[section].ca);
    if (!sectionTitle) continue;

    const m = meta({ title: sectionTitle, section }, lang);
    m._canonical = BASE + prefix + '/' + section + '/';
    writePage(prefix + '/' + section, buildPage(m));

    if (itemKey && Array.isArray(json[itemKey])) {
      for (const item of json[itemKey]) {
        const im = meta({ item }, lang);
        if (!im) continue;
        im._canonical = BASE + prefix + '/' + section + '/' + item.id;
        writePage(prefix + '/' + section + '/' + item.id, buildPage(im));
      }
    }
  }
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
  bibliografia: ['monthly', '0.7'],
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
console.log(`[build-seo] sitemap.xml, feed.xml i ${count} HTML prerenderitzats generats`);
console.log(`[build-seo] en producció les pàgines les serveix _worker.js (Cloudflare) a partir de l'index.html`);
