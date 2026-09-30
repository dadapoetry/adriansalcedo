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

/* ── Auth del CMS (Decap) ──────────────────────────────────────────────
   Les credencials de GitHub OAuth viuen al panell de Cloudflare
   (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SITE_URL). Aquesta lògica ha de
   viure al worker perquè, amb _worker.js al directori de sortida, Cloudflare
   Pages ignora completament el directori /functions.

   Garanties del flux (vegeu la doc de GitHub "Authorizing OAuth apps"):
   - state: 32 bytes aleatoris, comparats al callback amb comparació
     constant. GitHub: "If the states don't match, then a third party created
     the request, and you should abort the process."
   - PKCE S256: el code_verifier només viu en una cookie HttpOnly, de manera
     que un codi interceptat no es pot canviar sense el secret del navegador.
   - redirect_uri: sempre fixat al callback del nostre origen. No agafem mai
     cap URL del query string, per evitar open redirect. */

const OAUTH_COOKIE = "cms_oauth";
const OAUTH_TTL = 600;
const ADMIN_CSP = [
  "default-src 'self'",
  // Script sense 'unsafe-inline': res de la pagina d'admin pot injectar markup
  // (títols, descripcions que es renderitzen al preview) però no executar JS.
  "script-src 'self' https://unpkg.com",
  // Emotion injecta <style> en temps d'execució, de manera que el style-src
  // necessita 'unsafe-inline'. No hi ha cap script inline perquè el bootstrap
  // viu a /admin/bootstrap.js.
  "style-src 'self' https://unpkg.com https://fonts.googleapis.com 'unsafe-inline'",
  "font-src 'self' https://fonts.gstatic.com https://unpkg.com data:",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://github.com",
  "connect-src 'self' https://api.github.com https://uploads.github.com https://raw.githubusercontent.com https://unpkg.com https://fonts.googleapis.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

function authError(message, status) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ── Auxiliars criptogràfics ────────────────────────────────────────────

function base64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Base64url(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return base64url(new Uint8Array(digest));
}

// Comparació constant: no ha de ramificar segons el contingut.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function parseCookies(request) {
  const out = {};
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (key) out[key] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Escapa una cadena perquè es pugui incrustar en un <script> de manera segura:
// JSON.stringify sol no escapa el '</script>'.
function jsString(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function oauthCallbackUrl(env) {
  return env.OAUTH_CALLBACK_URL || `${env.SITE_URL || SITE_URL}/api/auth/callback`;
}

function clearCookie(response) {
  response.headers.append(
    "Set-Cookie",
    `${OAUTH_COOKIE}=; Path=/api/auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  );
  return response;
}

// ── Gate d'accés a /admin (opcional) ───────────────────────────────────
// Obert per defecte, per no trencar res sense vol de les variables. Activa'l
// amb ADMIN_PASSWORD_SHA256 (hex del sha256 de la contrasenya) o
// ADMIN_PASSWORD (text pla), i ADMIN_USER (per defecte "admin").
// La millor opció continua sent posar Cloudflare Access per davant del domini.
async function adminGate(request, env) {
  const hash = (env.ADMIN_PASSWORD_SHA256 || "").trim().toLowerCase();
  const plain = env.ADMIN_PASSWORD || "";
  if (!hash && !plain) return null; // Gate desactivat.

  const header = request.headers.get("Authorization") || "";
  const match = /^Basic\s+(.+)$/i.exec(header.trim());
  if (!match) return unauthorized();

  let user = "";
  let pass = "";
  try {
    const decoded = atob(match[1]);
    const i = decoded.indexOf(":");
    if (i < 0) return unauthorized();
    user = decoded.slice(0, i);
    pass = decoded.slice(i + 1);
  } catch {
    return unauthorized();
  }

  if (!safeEqual(user, env.ADMIN_USER || "admin")) return unauthorized();
  const ok = hash ? safeEqual(await sha256Hex(pass), hash) : safeEqual(pass, plain);
  return ok ? null : unauthorized();
}

function unauthorized() {
  return new Response(null, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

async function withAdminSecurity(res) {
  const headers = new Headers(res.headers);
  headers.set("Content-Security-Policy", ADMIN_CSP);
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Cache-Control", "no-store");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

// El CMS obre /api/auth en un pop-up; des d'aquí el llencem a GitHub.
async function authStart(request, url, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) return authError("GitHub OAuth not configured: missing GITHUB_CLIENT_ID.", 500);

  const callback = oauthCallbackUrl(env);
  const state = randomToken(32);
  const codeVerifier = randomToken(48);
  const codeChallenge = await sha256Base64url(codeVerifier);

  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", clientId);
  github.searchParams.set("redirect_uri", callback);
  github.searchParams.set("scope", "public_repo,user");
  github.searchParams.set("state", state);
  github.searchParams.set("code_challenge", codeChallenge);
  github.searchParams.set("code_challenge_method", "S256");

  const payload = JSON.stringify({
    state,
    codeVerifier,
    exp: Date.now() + OAUTH_TTL * 1000,
  });

  // Scope=/api/auth: el callback és /api/auth/callback. HttpOnly perquè cap
  // script del CMS pugui llegir el code_verifier. SameSite=Lax permet que
  // la navegació de retorn des de GitHub (top-level GET) l'enviï.
  const cookie = `${OAUTH_COOKIE}=${encodeURIComponent(payload)}; Path=/api/auth; Max-Age=${OAUTH_TTL}; HttpOnly; Secure; SameSite=Lax`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: github.toString(),
      "Cache-Control": "no-store",
      "Set-Cookie": cookie,
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}

// GitHub torna aquí amb ?code=...&state=...; el canviem per un token i el
// deixem al localStorage on el backend de Decap el va a llegir.
async function authCallback(request, url, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return authError("GitHub OAuth not configured: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.", 500);
  }

  const denied = url.searchParams.get("error");
  if (denied) {
    return clearCookie(
      authError(`GitHub ha denegat l'autorització (${denied}).`, 400)
    );
  }

  const code = url.searchParams.get("code");
  if (!code) return authError("Missing ?code from GitHub.", 400);

  const state = url.searchParams.get("state");
  if (!state) {
    return clearCookie(
      authError("Missing ?state from GitHub. S'aborta el procés per protecció CSRF.", 400)
    );
  }

  const raw = parseCookies(request)[OAUTH_COOKIE];
  if (!raw) {
    return authError("Cookie d'auth absent o caducat. Torna a començar l'inici de sessió.", 400);
  }

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return clearCookie(authError("Cookie d'auth corrupte. Torna a començar.", 400));
  }

  if (typeof session.exp !== "number" || Date.now() > session.exp) {
    return clearCookie(authError("L'inici de sessió ha caducat. Torna a començar-lo.", 400));
  }

  if (!safeEqual(session.state, state)) {
    return clearCookie(
      authError(
        "El state OAuth no coincideix: aquesta petició no l'ha iniciat aquest navegador. S'aborta.",
        400
      )
    );
  }

  if (typeof session.codeVerifier !== "string" || !session.codeVerifier) {
    return clearCookie(authError("Falta el code_verifier de PKCE. Torna a començar.", 400));
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: oauthCallbackUrl(env),
      code_verifier: session.codeVerifier,
    }),
  });
  if (!tokenRes.ok) {
    return clearCookie(authError(`GitHub token exchange failed with status ${tokenRes.status}.`, 502));
  }

  const data = await tokenRes.json();
  if (!data.access_token) {
    return clearCookie(
      authError(`GitHub error: ${data.error_description || data.error || "unknown"}.`, 400)
    );
  }

  const user = { backendName: "github", token: data.access_token, scope: data.scope || "repo" };
  // El CMS retrieve() fa JSON.parse del que hi ha a localStorage, i valida el
  // nonce que deixa a sessionStorage en obrir el pop-up. Desem l'objecte
  // serialitzat (un sol cop) i el nonce de torn, que és el que ell espera.
  const html = `<!DOCTYPE html>
<html lang="ca">
<head><meta charset="utf-8"><title>Iniciant sessió</title></head>
<body>
<p id="status">Iniciant sessió…</p>
<script>
try {
  localStorage.setItem("netlify-cms-user", ${jsString(JSON.stringify(user))});
  var auth = sessionStorage.getItem("netlify-cms-auth");
  if (auth) {
    var nonce = JSON.parse(auth).nonce;
    if (window.opener) window.opener.postMessage({ type: "authorization", payload: { token: ${jsString(data.access_token)}, provider: "github", nonce: nonce } }, window.location.origin);
  }
  if (window.opener) {
    window.opener.location.reload();
    setTimeout(function () { window.close(); }, 1000);
  } else {
    window.location.href = "/admin/";
  }
} catch (e) {
  document.getElementById("status").textContent = "Error: " + e.message;
}
</script>
</body>
</html>`;

  return clearCookie(
    new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    })
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Gate d'accés. Obert si no s'ha configurat cap contrasenya. Cobreix també
    // /api/auth i /api/auth/callback: deixar el flux OAuth obert faria el gate
    // il·lusori, perquè un atacant podria començar el login sense contrasenya.
    const isAdmin = path === "/admin" || path.startsWith("/admin/");
    const isAuth = path === "/api/auth" || path === "/api/auth/callback";
    if (isAdmin || isAuth) {
      const gate = await adminGate(request, env);
      if (gate) return gate;
    }

    if (path === "/api/auth") return authStart(request, url, env);
    if (path === "/api/auth/callback") return authCallback(request, url, env);
    if (path.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (/\.[a-z0-9]+$/i.test(path) && !path.endsWith(".html")) {
      const res = await env.ASSETS.fetch(request);
      return isAdmin ? withAdminSecurity(res) : res;
    }

    if (path !== "/" && !isAdmin) {
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
      const res = await env.ASSETS.fetch(new Request(new URL("/admin/index.html", url)));
      return withAdminSecurity(res);
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
