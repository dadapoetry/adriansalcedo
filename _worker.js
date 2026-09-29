const SITE_URL = "https://adriansalcedo.com";
const DEFAULT_IMAGE = "/media/images/sat.png";

const SECTION_TO_JSON = {
  obres: "/content/obres.json",
  festivals: "/content/festivals.json",
  premis: "/content/premis.json",
  projectes: "/content/projectes.json",
  premsa: "/content/premsa.json",
  quisoc: "/content/quisoc.json",
  contacte: "/content/contacte.json",
  arxiu: "/content/arxiu.json",
  bibliografia: "/content/bibliografia.json",
  agenda: "/content/agenda.json",
};

const cache = {};

function cached(key, loader) {
  if (!cache[key]) cache[key] = loader();
  return cache[key];
}

async function getSeo(env) {
  return cached("seo", () => fetchJson("/content/seo.json", env));
}

async function getSite(lang, env) {
  const file = lang === "en" ? "/content/site.en.json" : "/content/site.json";
  return cached(`site:${lang}`, () => fetchJson(file, env));
}

async function getNavTitles(env) {
  if (cache.navTitles) return cache.navTitles;
  const site = await getSite("ca", env);
  const map = {};
  for (const item of (site && site.nav) || []) {
    if (!item || !item.id) continue;
    map[item.id] = {
      ca: item.seo_title || item.label || null,
      en: item.seo_title_en || item.label_en || item.label || null,
    };
  }
  cache.navTitles = map;
  return map;
}

function sectionTitle(navTitles, lang, section) {
  const row = navTitles[section];
  if (row && row[lang]) return row[lang];
  if (lang === "en") return row ? row.ca : null;
  return row ? row.en : null;
}

function sectionDesc(seo, lang, section) {
  const row = ((seo && seo.sections) || []).find((s) => s && s.key === section);
  if (!row) return null;
  return (lang === "en" ? row.desc_en : row.desc) || null;
}

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

  const [seo, navTitles, site] = await Promise.all([getSeo(env), getNavTitles(env), getSite(lang, env)]);
  const siteCfg = (site && site.site) || {};
  const siteName = siteCfg.title || "Adrián Salcedo Toca";
  const prefix = isEn ? "/en" : "";

  const sectionName = sectionTitle(navTitles, lang, section);
  let title = section === "home" ? siteName : (sectionName ? `${sectionName} | ${siteName}` : siteName);
  let description = sectionDesc(seo, lang, section) || siteCfg.description || "";
  let image = siteCfg.logo || DEFAULT_IMAGE;
  let url = `${SITE_URL}${path}`;
  let ogType = "website";
  let item = null;
  let breadcrumb = [
    { "@type": "ListItem", position: 1, name: isEn ? "Home" : "Inici", item: SITE_URL + (isEn ? "/en" : "/") },
    { "@type": "ListItem", position: 2, name: sectionName || section, item: `${SITE_URL}${prefix}/${section}` },
  ];

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

      const found = items.find((i) => i.id === articleId);
      if (found) {
        item = found;
        const itemTitle = isEn ? (item.title_en || item.title) : item.title;
        title = `${itemTitle} | ${siteName}`;

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

  if (item) {
    breadcrumb.push({
      "@type": "ListItem",
      position: 3,
      name: isEn ? (item.title_en || item.title) : item.title,
      item: `${SITE_URL}${prefix}/${section}/${item.id}`,
    });
  }

  return { title, description, image, url, lang, ogType, section, articleId, item, siteName, email: siteCfg.email, breadcrumb, schema: buildSchema({ section, articleId, item, isEn, title, description, url, siteName, email: siteCfg.email, breadcrumb }) };
}

function buildSchema(ctx) {
  const { section, articleId, item, isEn, title, description, url, siteName, email, breadcrumb } = ctx;
  const person = {
    "@type": "Person",
    name: siteName,
    url: SITE_URL,
    ...(email ? { email: `mailto:${email}` } : {}),
  };

  if (articleId && item) {
    const isWork = section === "obres";
    const body = isWork
      ? {
          "@type": item.isbn ? "Book" : "CreativeWork",
          name: isEn ? (item.title_en || item.title) : item.title,
          ...(item.isbn ? { isbn: item.isbn } : {}),
          ...(item.publisher ? { publisher: { "@type": "Organization", name: item.publisher } } : {}),
          ...(item.year ? { datePublished: String(item.year) } : {}),
          author: person,
          inLanguage: "ca",
        }
      : {
          "@type": "Article",
          headline: title,
          description,
          url,
          ...(item.publication || item.category || item.year
            ? { ...(item.publication ? { articleSection: item.publication } : {}), ...(item.category ? { articleSection: item.category } : {}), ...(item.year ? { datePublished: String(item.year) } : {}) }
            : {}),
          author: person,
          inLanguage: isEn ? "en" : "ca",
        };
    return { "@context": "https://schema.org", ...body, breadcrumb: { "@type": "BreadcrumbList", itemListElement: breadcrumb } };
  }

  if (section === "contacte") {
    return { "@context": "https://schema.org", "@type": "ContactPage", name: title, description, url, mainEntity: person };
  }

  if (section === "home") {
    return { "@context": "https://schema.org", "@type": "ProfilePage", name: title, description, url, mainEntity: person };
  }

  if (section === "obres") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      isPartOf: { "@type": "WebSite", name: siteName, url: SITE_URL },
    };
  }

  return null;
}

function applySchema(html, schema) {
  const tag = `<script type="application/ld+json" id="dynamic-schema">\n${JSON.stringify(schema, null, 2).replace(/</g, "\\u003c")}\n</script>`;
  if (!schema) return html.replace(/<script type="application\/ld\+json" id="dynamic-schema">[\s\S]*?<\/script>\s*/, "");
  if (html.includes('id="dynamic-schema"')) {
    return html.replace(/<script type="application\/ld\+json" id="dynamic-schema">[\s\S]*?<\/script>/, tag);
  }
  return html.replace("</head>", `${tag}\n</head>`);
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

  return applySchema(html, meta.schema);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (/\.[a-z0-9]+$/i.test(path) && !path.endsWith(".html")) return env.ASSETS.fetch(request);

    if (path !== "/" && !path.startsWith("/admin")) {
      const clean = path.replace(/\/+$/, "").replace(/(\/index)?\.html$/i, "");
      if (clean !== path) {
        const dest = new URL(clean === "" ? "/" : clean, url);
        dest.search = url.search;
        return Response.redirect(dest, 301);
      }
    }

    if (path === "/admin" || path === "/admin/index.html") {
      const dest = new URL("/admin/", url);
      dest.search = url.search;
      return Response.redirect(dest, 301);
    }

    if (path === "/admin/") {
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
