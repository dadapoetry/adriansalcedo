import { readFile } from "https://deno.land/std@0.168.0/fs/mod.ts";

const BASE = "https://adriansalcedo.com";
const SECTION_TITLES = {
  home:      { ca: "Inici — Poeta avantguardista",        en: "Home — Avant-garde poet" },
  obres:     { ca: "Obres i poesia avantguardista",       en: "Works and avant-garde poetry" },
  projectes: { ca: "Projectes poètics",                   en: "Poetic projects" },
  festivals: { ca: "Festivals i exposicions",             en: "Festivals and exhibitions" },
  premis:    { ca: "Premis i reconeixements",             en: "Awards and recognition" },
  quisoc:    { ca: "Qui soc",                             en: "About" },
  premsa:    { ca: "Premsa",                              en: "Press" },
  cerca:     { ca: "Cerca",                               en: "Search" },
  arxiu:     { ca: "Arxiu",                               en: "Archive" },
};

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function readJson(path) {
  try {
    const raw = await readFile(`./content/${path}`);
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return null;
  }
}

function getMeta(data) {
  if (!data) return null;
  const isEn = data.lang === "en";

  if (data.section === "home") {
    const seo = data.json?.seo;
    return {
      title: isEn ? (seo?.title_en || seo?.title || "Adrián Salcedo Toca — Avant-garde poet") : (seo?.title || "Adrián Salcedo Toca — Poeta avantguardista"),
      desc:  isEn ? (seo?.description_en || seo?.description || "Digital portfolio of Adrián Salcedo Toca, avant-garde poet and cultural critic.") : (seo?.description || "Portfoli digital d'Adrián Salcedo Toca, poeta avantguardista i crític cultural."),
      type:  "website",
      image: `${BASE}/media/images/sat.png`,
    };
  }

  const titles = SECTION_TITLES[data.section];
  if (data.article) {
    let item = null;
    const s = data.section;
    const a = data.article;
    const d = data.json;

    if (s === "obres" && d?.works)    item = d.works.find(x => x.id === a);
    if (s === "projectes" && d?.projects) item = d.projects.find(x => x.id === a);
    if (s === "festivals" && d?.festivals) item = d.festivals.find(x => x.id === a);
    if (s === "premis" && d?.awards)   item = d.awards.find(x => x.id === a);

    if (item) {
      const t = isEn ? (item.title_en || item.title) : item.title;
      let desc = "";
      if (s === "premis") {
        desc = isEn ? (item.content_en?.[0] || "") : (item.content?.[0] || "");
      } else {
        const c = isEn ? (item.content_en || item.content) : item.content;
        desc = Array.isArray(c) ? c.join(" ") : (c || "");
      }
      desc = desc.replace(/<[^>]+>/g, "").trim();
      if (desc.length > 300) desc = desc.slice(0, 297) + "...";

      let image = null;
      if (item.images?.[0]?.src) {
        image = item.images[0].src.startsWith("http") ? item.images[0].src : `${BASE}${item.images[0].src}`;
      } else if (item.image) {
        image = item.image.startsWith("http") ? item.image : `${BASE}${item.image}`;
      }

      return {
        title: `${t} | Adrián Salcedo Toca`,
        desc: desc || (isEn ? "Avant-garde poetry by Adrián Salcedo Toca." : "Poesia avantguardista d'Adrián Salcedo Toca."),
        type: "article",
        image: image || `${BASE}/media/images/sat.png`,
      };
    }

    return {
      title: `${a.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} | Adrián Salcedo Toca`,
      desc:  isEn ? "Avant-garde poetry by Adrián Salcedo Toca." : "Poesia avantguardista d'Adrián Salcedo Toca.",
      type:  "article",
      image: `${BASE}/media/images/sat.png`,
    };
  }

  if (titles) {
    const pageTitle = `${titles[isEn ? "en" : "ca"]} | Adrián Salcedo Toca`;
    const pageDesc = isEn
      ? `Explore the ${titles.en.toLowerCase()} of Adrián Salcedo Toca.`
      : `Explora la secció de ${titles.ca.toLowerCase()} d'Adrián Salcedo Toca.`;
    return {
      title: pageTitle,
      desc:  pageDesc,
      type:  "website",
      image: `${BASE}/media/images/sat.png`,
    };
  }

  return null;
}

function buildHead(meta, lang, canonical) {
  const ogLocale = lang === "en" ? "en_GB" : "ca_ES";
  return `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.desc)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(meta.title)}">
    <meta property="og:description" content="${escapeHtml(meta.desc)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="${meta.type}">
    <meta property="og:locale" content="${ogLocale}">
    <meta property="og:image" content="${escapeHtml(meta.image)}">
    <meta name="twitter:card" content="${meta.type === "article" && meta.image !== `${BASE}/media/images/sat.png` ? "summary_large_image" : "summary"}">
    <meta name="twitter:title" content="${escapeHtml(meta.title)}">
    <meta name="twitter:description" content="${escapeHtml(meta.desc)}">
    <meta name="twitter:image" content="${escapeHtml(meta.image)}">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"${meta.type === "article" ? "Article" : "WebPage"}","name":"${escapeHtml(meta.title).replace(/"/g, '\\"')}","description":"${escapeHtml(meta.desc).replace(/"/g, '\\"')}","url":"${canonical}"}</script>`;
}

export default async (request, context) => {
  const url = new URL(request.url);
  const ext = url.pathname.split(".").pop();
  if (ext && ext !== "html") return context.next();

  const segments = url.pathname.split("/").filter(Boolean);
  let lang = "ca";
  let section = "home";
  let article = null;
  let startIdx = 0;

  if (segments[0] === "en") {
    lang = "en";
    startIdx = 1;
  }

  if (segments[startIdx]) {
    section = segments[startIdx];
    if (section === "index.html" || section === "index") section = "home";
  }
  if (segments[startIdx + 1]) article = segments[startIdx + 1];

  const jsonFile = section === "home" ? "home.json" : `${section}.json`;
  const json = await readJson(jsonFile);

  const meta = getMeta({ section, article, lang, json });
  if (!meta) return context.next();

  const canonical = `${BASE}${url.pathname}`;
  const res = await context.next();
  const html = await res.text();

  const newHead = buildHead(meta, lang, canonical);
  const modified = html.replace(/<title>.*?<\/title>([\s\S]*?)(<\/head>)/, `${newHead}\n$1$2`);

  return new Response(modified, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

export const config = { path: "/*" };
