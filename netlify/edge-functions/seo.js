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

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripHtml(s) {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function fetchJson(pathname) {
  try {
    const res = await fetch(new URL(pathname, BASE).href);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`[seo] fetch ${pathname} failed:`, e.message);
    return null;
  }
}

function findItem(json, section, id) {
  if (!json) return null;
  const map = { obres: "works", projectes: "projects", festivals: "festivals", premis: "awards" };
  const key = map[section];
  if (key && Array.isArray(json[key])) {
    return json[key].find((x) => x.id === id) || null;
  }
  return null;
}

function buildMeta({ section, article, lang, json }) {
  const isEn = lang === "en";

  if (section === "home") {
    const seo = json?.seo;
    return {
      title: isEn
        ? (seo?.title_en || seo?.title || "Adrián Salcedo Toca — Avant-garde poet")
        : (seo?.title || "Adrián Salcedo Toca — Poeta avantguardista"),
      desc: isEn
        ? (seo?.description_en || seo?.description || "Digital portfolio of Adrián Salcedo Toca.")
        : (seo?.description || "Portfoli digital d'Adrián Salcedo Toca."),
      type: "website",
      image: `${BASE}/media/images/sat.png`,
    };
  }

  if (article) {
    const item = findItem(json, section, article);
    if (item) {
      const t = isEn ? (item.title_en || item.title) : item.title;
      const raw = isEn ? (item.content_en || item.content) : item.content;
      const desc = stripHtml(Array.isArray(raw) ? raw.join(" ") : raw).slice(0, 300);

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

    const fallback = article.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${fallback} | Adrián Salcedo Toca`,
      desc: isEn ? "Avant-garde poetry by Adrián Salcedo Toca." : "Poesia avantguardista d'Adrián Salcedo Toca.",
      type: "article",
      image: `${BASE}/media/images/sat.png`,
    };
  }

  const t = SECTION_TITLES[section];
  if (t) {
    return {
      title: `${t[isEn ? "en" : "ca"]} | Adrián Salcedo Toca`,
      desc: isEn
        ? `Explore the ${t.en.toLowerCase()} of Adrián Salcedo Toca.`
        : `Explora la secció de ${t.ca.toLowerCase()} d'Adrián Salcedo Toca.`,
      type: "website",
      image: `${BASE}/media/images/sat.png`,
    };
  }

  return null;
}

const STATIC_EXTS = ["css", "js", "json", "png", "jpg", "jpeg", "gif", "svg", "webp", "mp4", "mp3", "pdf", "woff", "woff2", "ico", "xml", "txt", "map"];

export default async (request, context) => {
  const url = new URL(request.url);

  const ext = url.pathname.split(".").pop()?.toLowerCase();
  if (ext && STATIC_EXTS.includes(ext)) return context.next();

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
  const json = await fetchJson(`/content/${jsonFile}`);

  const meta = buildMeta({ section, article, lang, json });
  if (!meta) return context.next();

  const canonical = `${BASE}${url.pathname}`;
  const res = await context.next();
  const html = await res.text();

  const ogLocale = lang === "en" ? "en_GB" : "ca_ES";
  const twCard = meta.type === "article" && meta.image !== `${BASE}/media/images/sat.png` ? "summary_large_image" : "summary";

  const modified = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(meta.desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(canonical)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(meta.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(meta.desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(canonical)}">`)
    .replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${meta.type}">`)
    .replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${ogLocale}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(meta.image)}">`)
    .replace(/<meta name="twitter:card" content="[^"]*">/, `<meta name="twitter:card" content="${twCard}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(meta.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(meta.desc)}">`)
    .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${esc(meta.image)}">`);

  return new Response(modified, {
    status: res.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
