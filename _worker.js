const SITE_URL = "https://adriansalcedo.com";
const DEFAULT_IMAGE = "/media/images/sat.png";

const SECTION_META = {
  ca: {
    home: { title: "Inici — Poeta avantguardista", desc: "Portfoli oficial d'Adrián Salcedo Toca — poeta i artista avantguardista. Obres, festivals, premis i projectes." },
    obres: { title: "Obres i poesia avantguardista", desc: "Explora l'obra poètica i visual d'Adrián Salcedo Toca — llibres, poemes i instal·lacions." },
    festivals: { title: "Festivals i exposicions", desc: "Festivals i exposicions on Adrián Salcedo Toca ha presentat la seva obra poètica i visual." },
    premis: { title: "Premis i reconeixements", desc: "Premis i reconeixements rebuts per Adrián Salcedo Toca en el camp de la poesia i l'art." },
    projectes: { title: "Projectes poètics", desc: "Els projectes artístics i editorials d'Adrián Salcedo Toca." },
    premsa: { title: "Premsa", desc: "Cobertura mediàtica de l'obra d'Adrián Salcedo Toca." },
    quisoc: { title: "Qui soc", desc: "Biografia i trajectòria professional d'Adrián Salcedo Toca — poeta, artista i editor." },
    arxiu: { title: "Arxiu", desc: "Arxiu i cercador del portfoli d'Adrián Salcedo Toca." },
    cerca: { title: "Cerca", desc: "Cerca al portfoli d'Adrián Salcedo Toca." },
  },
  en: {
    home: { title: "Home — Avant-garde poet", desc: "Official portfolio of Adrián Salcedo Toca — avant-garde poet and artist. Works, festivals, awards and projects." },
    obres: { title: "Works and avant-garde poetry", desc: "Explore the poetic and visual works of Adrián Salcedo Toca — books, poems and installations." },
    festivals: { title: "Festivals and exhibitions", desc: "Festivals and exhibitions featuring Adrián Salcedo Toca's poetic and visual work." },
    premis: { title: "Awards and recognition", desc: "Awards and recognition received by Adrián Salcedo Toca in poetry and art." },
    projectes: { title: "Poetic projects", desc: "The artistic and editorial projects of Adrián Salcedo Toca." },
    premsa: { title: "Press", desc: "Press coverage of Adrián Salcedo Toca's work." },
    quisoc: { title: "About", desc: "Biography and professional trajectory of Adrián Salcedo Toca — poet, artist and editor." },
    arxiu: { title: "Archive", desc: "Archive and search for the Adrián Salcedo Toca portfolio." },
    cerca: { title: "Search", desc: "Search the Adrián Salcedo Toca portfolio." },
  },
};

const SECTION_TO_JSON = {
  obres: "/content/obres.json",
  festivals: "/content/festivals.json",
  premis: "/content/premis.json",
  projectes: "/content/projectes.json",
  premsa: "/content/premsa.json",
  quisoc: "/content/quisoc.json",
  arxiu: "/content/arxiu.json",
};

function extractId(pathname, section) {
  const clean = pathname.replace(/^\/en/, "");
  const segments = clean.replace(/^\/$/, "").split("/").filter(Boolean);
  if (segments[0] === section && segments.length > 1) return segments[1];
  return null;
}

function truncate(text, max) {
  if (!text) return "";
  const clean = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.substring(0, max).replace(/\s+\S*$/, "") + "…" : clean;
}

async function fetchJson(path, env) {
  try {
    const res = await env.ASSETS.fetch(new Request(new URL(path, SITE_URL)));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getMeta(pathname, env) {
  const path = pathname.replace(/\/$/, "") || "/";
  const isEn = path.startsWith("/en");
  const lang = isEn ? "en" : "ca";
  const cleanPath = isEn ? path.replace(/^\/en/, "") : path;
  const segments = cleanPath.replace(/^\/$/, "").split("/").filter(Boolean);
  const section = segments[0] || "home";
  const articleId = segments.length > 1 ? segments[1] : null;

  const base = SECTION_META[lang][section] || SECTION_META[lang].home;
  let title = base.title;
  let description = base.desc;
  let image = DEFAULT_IMAGE;
  let url = `${SITE_URL}${pathname}`;
  let ogType = "website";

  if (section === "home" && !articleId) {
    const home = await fetchJson("/content/home.json", env);
    if (home?.seo) {
      title = isEn ? (home.seo.title_en || home.seo.title || title) : (home.seo.title || title);
      description = isEn ? (home.seo.description_en || home.seo.description || description) : (home.seo.description || description);
    }
    if (home?.image) image = home.image.startsWith("http") ? home.image : `${SITE_URL}${home.image}`;
  }

  if (articleId && SECTION_TO_JSON[section]) {
    ogType = "article";
    const data = await fetchJson(SECTION_TO_JSON[section], env);
    if (data) {
      let items = [];
      if (section === "obres") items = data.works || [];
      else if (section === "festivals") items = data.festivals || [];
      else if (section === "premis") items = data.awards || [];
      else if (section === "projectes") items = data.projects || [];
      else if (section === "premsa") items = data.articles || [];

      const item = items.find((i) => i.id === articleId);
      if (item) {
        const itemTitle = isEn ? (item.title_en || item.title) : item.title;
        title = `${itemTitle} | Adrián Salcedo Toca`;

        const content = isEn ? (item.content_en || item.content) : item.content;
        if (Array.isArray(content) && content.length) {
          description = truncate(content[0], 160);
        } else if (item.description) {
          description = isEn ? (item.description_en || item.description) : item.description;
        } else if (item.category) {
          description = `${item.category}${item.year ? " (" + item.year + ")" : ""} — ${itemTitle}`;
        }

        if (item.image) image = item.image.startsWith("http") ? item.image : `${SITE_URL}${item.image}`;
        else if (item.images?.length) {
          const src = item.images[0].src || item.images[0];
          image = typeof src === "string" && src.startsWith("http") ? src : `${SITE_URL}${src}`;
        }
      }
    }
  }

  if (section === "premsa" && !articleId) {
    const data = await fetchJson(SECTION_TO_JSON.premsa, env);
    if (data?.description) description = isEn ? (data.description_en || data.description) : data.description;
  }
  if (section === "arxiu" && !articleId) {
    const data = await fetchJson(SECTION_TO_JSON.arxiu, env);
    if (data?.description) description = isEn ? (data.description_en || data.description) : data.description;
  }

  return { title, description, image, url, lang, ogType };
}

function applyMeta(html, meta) {
  const esc = (s) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  html = html.replace(/<html lang="[^"]*">/, `<html lang="${meta.lang}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${meta.url}">`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(meta.description)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(meta.title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(meta.description)}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${meta.url}">`);
  html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${meta.image}">`);
  html = html.replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${meta.ogType}">`);
  html = html.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${meta.lang === "en" ? "en_GB" : "ca_ES"}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(meta.title)}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(meta.description)}">`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${meta.image}">`);

  if (meta.lang === "en") {
    html = html.replace(
      /<link rel="alternate" hreflang="ca" href="[^"]*">/,
      `<link rel="alternate" hreflang="ca" href="${meta.url.replace("/en", "")}">`
    );
    html = html.replace(/<link rel="alternate" hreflang="en" href="[^"]*">/, `<link rel="alternate" hreflang="en" href="${meta.url}">`);
  } else {
    html = html.replace(/<link rel="alternate" hreflang="en" href="[^"]*">/, `<link rel="alternate" hreflang="en" href="${SITE_URL}/en${meta.url.replace(SITE_URL, "")}">`);
    html = html.replace(/<link rel="alternate" hreflang="ca" href="[^"]*">/, `<link rel="alternate" hreflang="ca" href="${meta.url}">`);
  }

  return html;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (/\.[a-z0-9]+$/i.test(path) && !path.endsWith(".html")) return env.ASSETS.fetch(request);

    if (path === "/admin" || path === "/admin/" || path === "/admin/index.html") {
      return env.ASSETS.fetch(new Request(new URL("/admin/index.html", url)));
    }

    const res = await env.ASSETS.fetch(new Request(new URL("/index.html", url.origin + path)));
    let html = await res.text();

    const meta = await getMeta(path, env);
    html = applyMeta(html, meta);

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
    });
  },
};
