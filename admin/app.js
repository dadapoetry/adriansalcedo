/* ═══════════════════════════════════════════════════════════
   ADMIN PERSONALITZAT — Adrián Salcedo Toca
   Editor git-backed sobre l'API de GitHub. Formularis estructurats
   per als camps habituals + editor JSON avançat per als blocs.
   ═══════════════════════════════════════════════════════════ */

const OWNER = "dadapoetry";
const REPO = "adriansalcedo";
const BRANCH = "main";
const API = "https://api.github.com";

/* ── Esquemes de col·lecció ────────────────────────────────────
   type: string | text | number | boolean | select | url | image |
         stringList | object | list | json
   list: itemFields (object) o itemType:'string'/'number'
   object: fields
   select: options: string[] o {value,label}[]
*/
const COLLECTIONS = [
  { id: "site", label: "Configuració (CA)", file: "content/site.json", kind: "file",
    fields: [
      { name: "site", type: "object", label: "Configuració del lloc", fields: [
        { name: "title", type: "string", label: "Títol del lloc" },
        { name: "description", type: "text", label: "Descripció" },
        { name: "language", type: "string", label: "Idioma" },
        { name: "url", type: "url", label: "URL" },
        { name: "copyright", type: "string", label: "Copyright" },
        { name: "locale", type: "string", label: "Locale" },
        { name: "logo", type: "image", label: "Logotip" },
        { name: "favicon", type: "image", label: "Favicon" },
        { name: "email", type: "string", label: "Email" },
        { name: "cta", type: "string", label: "CTA (CA)" },
        { name: "cta_en", type: "string", label: "CTA (EN)" },
      ]},
      { name: "nav", type: "list", label: "Navegació", itemFields: [
        { name: "id", type: "string", label: "ID" },
        { name: "label", type: "string", label: "Etiqueta (CA)" },
        { name: "label_en", type: "string", label: "Etiqueta (EN)" },
        { name: "seo_title", type: "string", label: "SEO title (CA)" },
        { name: "seo_title_en", type: "string", label: "SEO title (EN)" },
        { name: "path", type: "string", label: "Camí" },
      ]},
      { name: "social", type: "object", label: "Xarxes socials", fields: [
        { name: "instagram", type: "social", label: "Instagram" },
        { name: "twitter", type: "social", label: "Twitter / X" },
        { name: "youtube", type: "social", label: "YouTube" },
        { name: "tiktok", type: "social", label: "TikTok" },
        { name: "goodreads", type: "social", label: "Goodreads" },
        { name: "wikipedia", type: "social", label: "Wikipedia" },
        { name: "wikidata", type: "social", label: "Wikidata" },
      ]},
    ] },
  { id: "site-en", label: "Configuració (EN)", file: "content/site.en.json", kind: "file",
    fields: null }, // reuse via copy at runtime? handle below
  { id: "labels", label: "Textos UI", file: "content/labels.json", kind: "file",
    fields: [ { name: "labels", type: "list", label: "Etiquetes", itemFields: [
      { name: "key", type: "string", label: "Clau" },
      { name: "ca", type: "string", label: "Català" },
      { name: "en", type: "string", label: "Anglès" },
    ]} ] },
  { id: "seo", label: "SEO", file: "content/seo.json", kind: "file",
    fields: [ { name: "sections", type: "list", label: "Seccions", itemFields: [
      { name: "key", type: "select", label: "Secció", options: ["obres","projectes","festivals","premis","premsa","quisoc","contacte","arxiu","agenda","cerca"] },
      { name: "desc", type: "text", label: "Descripció (CA)" },
      { name: "desc_en", type: "text", label: "Descripció (EN)" },
    ]} ] },
  { id: "home", label: "Inici", file: "content/home.json", kind: "file",
    fields: [
      { name: "hero", type: "object", label: "Hero", fields: [
        { name: "title", type: "string", label: "Títol (CA)" },
        { name: "title_en", type: "string", label: "Títol (EN)" },
        { name: "subtitle", type: "string", label: "Subtítol (CA)" },
        { name: "subtitle_en", type: "string", label: "Subtítol (EN)" },
        { name: "statement", type: "text", label: "Declaració (CA)" },
        { name: "statement_en", type: "text", label: "Declaració (EN)" },
        { name: "image", type: "image", label: "Imatge" },
        { name: "imageAlt", type: "string", label: "Alt text" },
        { name: "width", type: "string", label: "Amplada" },
        { name: "height", type: "number", label: "Alçada" },
      ]},
      { name: "featuredWork", type: "object", label: "Obra destacada", fields: [
        { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
        { name: "title", type: "string", label: "Títol (CA)" },
        { name: "title_en", type: "string", label: "Títol (EN)" },
        { name: "type", type: "string", label: "Tipus (CA)" },
        { name: "type_en", type: "string", label: "Tipus (EN)" },
        { name: "publisher", type: "string", label: "Editorial" },
        { name: "year", type: "number", label: "Any" },
        { name: "description", type: "text", label: "Descripció (CA)" },
        { name: "description_en", type: "text", label: "Descripció (EN)" },
        { name: "image", type: "image", label: "Imatge" },
        { name: "imageAlt", type: "string", label: "Alt (CA)" },
        { name: "imageAlt_en", type: "string", label: "Alt (EN)" },
        { name: "link", type: "string", label: "Enllaç (CA)" },
        { name: "link_en", type: "string", label: "Enllaç (EN)" },
      ]},
      { name: "featuredProjects", type: "list", label: "Projectes destacats", itemFields: [
        { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
        { name: "title", type: "string", label: "Títol (CA)" },
        { name: "title_en", type: "string", label: "Títol (EN)" },
        { name: "description", type: "text", label: "Descripció (CA)" },
        { name: "description_en", type: "text", label: "Descripció (EN)" },
        { name: "link", type: "string", label: "Enllaç (CA)" },
        { name: "link_en", type: "string", label: "Enllaç (EN)" },
      ]},
      { name: "bio", type: "text", label: "Bio curta (CA)" },
      { name: "bio_en", type: "text", label: "Bio curta (EN)" },
      { name: "manifesto", type: "text", label: "Manifest (CA)" },
      { name: "manifesto_en", type: "text", label: "Manifest (EN)" },
      { name: "currentProjects", type: "list", label: "Projectes actuals", itemFields: [
        { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
        { name: "title", type: "string", label: "Títol (CA)" },
        { name: "title_en", type: "string", label: "Títol (EN)" },
        { name: "description", type: "text", label: "Descripció (CA)" },
        { name: "description_en", type: "text", label: "Descripció (EN)" },
        { name: "status", type: "string", label: "Estat" },
      ]},
      { name: "seo", type: "object", label: "SEO", fields: [
        { name: "title", type: "string", label: "Títol SEO (CA)" },
        { name: "title_en", type: "string", label: "Títol SEO (EN)" },
        { name: "description", type: "text", label: "Descripció SEO (CA)" },
        { name: "description_en", type: "text", label: "Descripció SEO (EN)" },
      ]},
    ] },
  { id: "projectes", label: "Projectes", file: "content/projectes.json", kind: "list", arrayKey: "projects", titleKey: "title",
    itemFields: [
      { name: "id", type: "string", label: "ID" },
      { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
      { name: "title", type: "string", label: "Títol" },
      { name: "issn", type: "string", label: "ISSN" },
      { name: "url", type: "url", label: "URL" },
      { name: "image", type: "image", label: "Imatge" },
      { name: "imageAlt", type: "string", label: "Alt text" },
      { name: "imageWidth", type: "string", label: "Amplada imatge" },
      { name: "status", type: "select", label: "Estat", options: ["active","inactive","archived"] },
      { name: "content", type: "stringList", label: "Contingut (CA)" },
      { name: "content_en", type: "stringList", label: "Contingut (EN)" },
      { name: "blocks", type: "json", label: "Blocs (JSON avançat)" },
      { name: "seo", type: "json", label: "SEO (JSON)" },
    ],
    topFields: [ { name: "seo", type: "json", label: "SEO global (JSON)" } ] },
  { id: "festivals", label: "Festivals", file: "content/festivals.json", kind: "list", arrayKey: "festivals", titleKey: "title",
    topFields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "seo", type: "json", label: "SEO (JSON)" },
    ],
    itemFields: [
      { name: "id", type: "string", label: "ID" },
      { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "label", type: "select", label: "Tipus", options: ["recital","exhibition","intervention","festival","workshop","lecture"] },
      { name: "year", type: "number", label: "Any" },
      { name: "content", type: "stringList", label: "Contingut (CA)" },
      { name: "content_en", type: "stringList", label: "Contingut (EN)" },
      { name: "contentList", type: "stringList", label: "Llista (CA)" },
      { name: "contentList_en", type: "stringList", label: "Llista (EN)" },
      { name: "images", type: "json", label: "Imatges (JSON)" },
      { name: "videos", type: "json", label: "Vídeos (JSON)" },
      { name: "blocks", type: "json", label: "Blocs (JSON avançat)" },
      { name: "seo", type: "json", label: "SEO (JSON)" },
    ] },
  { id: "obres", label: "Obres", file: "content/obres.json", kind: "list", arrayKey: "works", titleKey: "title",
    itemFields: [
      { name: "id", type: "string", label: "ID" },
      { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
      { name: "title", type: "string", label: "Títol" },
      { name: "type", type: "select", label: "Tipus", options: ["publication","videopoem","installation","digital"] },
      { name: "year", type: "number", label: "Any" },
      { name: "publisher", type: "string", label: "Editorial" },
      { name: "isbn", type: "string", label: "ISBN" },
      { name: "content", type: "stringList", label: "Contingut (CA)" },
      { name: "content_en", type: "stringList", label: "Contingut (EN)" },
      { name: "images", type: "json", label: "Imatges (JSON)" },
      { name: "videos", type: "json", label: "Vídeos (JSON)" },
      { name: "reviews", type: "json", label: "Recepció crítica (JSON)" },
      { name: "contributors", type: "json", label: "Col·laboradors (JSON)" },
      { name: "links", type: "json", label: "Llegeix-ne més (JSON)" },
      { name: "buyLinks", type: "json", label: "On comprar-lo (JSON)" },
      { name: "image_position", type: "select", label: "Posició imatge", options: ["bottom","middle","top"] },
      { name: "videos_position", type: "select", label: "Posició vídeos", options: ["bottom","middle","top"] },
      { name: "blocks", type: "json", label: "Blocs (JSON avançat)" },
      { name: "seo", type: "json", label: "SEO (JSON)" },
    ],
    topFields: [
      { name: "links", type: "json", label: "Llegeix-ne més global (JSON)" },
      { name: "buyLinks", type: "json", label: "On comprar-lo global (JSON)" },
      { name: "image_position", type: "select", label: "Posició imatge global", options: ["bottom","middle","top"] },
      { name: "videos_position", type: "select", label: "Posició vídeos global", options: ["bottom","middle","top"] },
      { name: "seo", type: "json", label: "SEO global (JSON)" },
    ] },
  { id: "premis", label: "Premis", file: "content/premis.json", kind: "list", arrayKey: "awards", titleKey: "title",
    topFields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
    ],
    itemFields: [
      { name: "id", type: "string", label: "ID" },
      { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "year", type: "number", label: "Any" },
      { name: "category", type: "string", label: "Categoria" },
      { name: "closing", type: "text", label: "Paràgraf final (CA)" },
      { name: "closing_en", type: "text", label: "Paràgraf final (EN)" },
      { name: "content", type: "stringList", label: "Contingut (CA)" },
      { name: "content_en", type: "stringList", label: "Contingut (EN)" },
      { name: "images", type: "json", label: "Imatges (JSON)" },
      { name: "videos", type: "json", label: "Vídeos (JSON)" },
      { name: "blocks", type: "json", label: "Blocs (JSON avançat)" },
      { name: "seo", type: "json", label: "SEO (JSON)" },
    ] },
  { id: "quisoc", label: "Qui soc", file: "content/quisoc.json", kind: "file",
    fields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "biography", type: "stringList", label: "Biografia (CA)" },
      { name: "biography_en", type: "stringList", label: "Biografia (EN)" },
      { name: "performances", type: "stringList", label: "Actuacions (CA)" },
      { name: "performances_en", type: "stringList", label: "Actuacions (EN)" },
      { name: "memberships", type: "stringList", label: "Membresies (CA)" },
      { name: "memberships_en", type: "stringList", label: "Membresies (EN)" },
      { name: "awards", type: "stringList", label: "Premis (CA)" },
      { name: "awards_en", type: "stringList", label: "Premis (EN)" },
      { name: "education", type: "stringList", label: "Formació (CA)" },
      { name: "education_en", type: "stringList", label: "Formació (EN)" },
      { name: "portrait", type: "image", label: "Retrat" },
      { name: "cv", type: "string", label: "CV (URL)" },
      { name: "artistStatement", type: "text", label: "Declaració d'artista (CA)" },
      { name: "artistStatement_en", type: "text", label: "Declaració d'artista (EN)" },
      { name: "timeline", type: "list", label: "Línia de temps", itemFields: [
        { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
        { name: "year", type: "number", label: "Any" },
        { name: "label", type: "string", label: "Etiqueta (CA)" },
        { name: "label_en", type: "string", label: "Etiqueta (EN)" },
        { name: "description", type: "text", label: "Descripció (CA)" },
        { name: "description_en", type: "text", label: "Descripció (EN)" },
      ]},
    ] },
  { id: "premsa", label: "Premsa", file: "content/premsa.json", kind: "list", arrayKey: "articles", titleKey: "title",
    topFields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
    ],
    itemFields: [
      { name: "id", type: "string", label: "ID" },
      { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
      { name: "date", type: "string", label: "Data (YYYY-MM-DD)" },
      { name: "publication", type: "string", label: "Publicació" },
      { name: "title", type: "string", label: "Títol de l'article" },
      { name: "url", type: "url", label: "URL" },
      { name: "language", type: "select", label: "Idioma", options: ["ca","en","es"] },
      { name: "type", type: "select", label: "Tipus", options: ["interview","article","review","feature"] },
      { name: "seo", type: "json", label: "SEO (JSON)" },
    ] },
  { id: "arxiu", label: "Arxiu", file: "content/arxiu.json", kind: "file",
    fields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "description", type: "text", label: "Descripció" },
      { name: "tags", type: "stringList", label: "Etiquetes" },
    ] },
  { id: "contacte", label: "Contacte", file: "content/contacte.json", kind: "file",
    fields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "intro", type: "string", label: "Frase (CA)" },
      { name: "intro_en", type: "string", label: "Frase (EN)" },
    ] },
  { id: "agenda", label: "Agenda", file: "content/agenda.json", kind: "list", arrayKey: "events", titleKey: "title",
    topFields: [
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "description", type: "text", label: "Descripció (CA)" },
      { name: "description_en", type: "text", label: "Descripció (EN)" },
    ],
    itemFields: [
      { name: "destacat", type: "boolean", label: "Destacar al rotlle" },
      { name: "id", type: "string", label: "ID" },
      { name: "title", type: "string", label: "Títol (CA)" },
      { name: "title_en", type: "string", label: "Títol (EN)" },
      { name: "date", type: "string", label: "Data (YYYY-MM-DD)" },
      { name: "time", type: "string", label: "Hora" },
      { name: "venue", type: "string", label: "Lloc" },
      { name: "city", type: "string", label: "Ciutat" },
      { name: "description", type: "text", label: "Descripció (CA)" },
      { name: "description_en", type: "text", label: "Descripció (EN)" },
      { name: "url", type: "url", label: "URL" },
    ] },
];

// site-en reuses site schema
const siteEn = COLLECTIONS.find((c) => c.id === "site");
COLLECTIONS.find((c) => c.id === "site-en").fields = siteEn.fields;

/* ── Fonts del rotlle ───────────────────────────────────────────
   Cada panell dinàmic del rotlle prové d'una col·lecció. L'admin
   unifica aquestes entrades per permetre reordenar-les arrossegant. */
const ROLL_SOURCES = [
  { collection: "home", path: ["featuredWork"], single: true, titleKey: "title", label: "Obra destacada" },
  { collection: "projectes", path: ["projects"], array: true, titleKey: "title", label: "Projectes" },
  { collection: "festivals", path: ["festivals"], array: true, titleKey: "title", label: "Festivals" },
  { collection: "obres", path: ["works"], array: true, titleKey: "title", label: "Obres" },
  { collection: "premis", path: ["awards"], array: true, titleKey: "title", label: "Premis" },
  { collection: "home", path: ["featuredProjects"], array: true, titleKey: "title", label: "Projectes destacats" },
  { collection: "home", path: ["currentProjects"], array: true, titleKey: "title", label: "Projectes actuals" },
  { collection: "quisoc", path: ["timeline"], array: true, titleKey: "label", label: "Cronologia" },
  { collection: "agenda", path: ["events"], array: true, titleKey: "title", label: "Agenda" },
];

function getByPathArr(obj, path) {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const state = {
  token: null,
  user: null,
  collection: null,
  data: null,
  sha: null,
  dirty: false,
  busy: false,
  rollDirty: new Set(),
  view: "form", // 'form' | 'json'
  selectedEntry: null, // index for list collections
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function decodeBase64(b64) {
  const bin = atob((b64 || "").replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function getToken() {
  try {
    const u = JSON.parse(localStorage.getItem("netlify-cms-user") || "null");
    return u && u.token ? u : null;
  } catch { return null; }
}
function clearToken() { localStorage.removeItem("netlify-cms-user"); }

async function gh(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try { const j = await res.json(); if (j.message) msg = j.message; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function fetchFile(path) {
  const data = await gh(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
  const json = JSON.parse(decodeBase64(data.content));
  return { json, sha: data.sha };
}
async function saveFile(path, json, sha, message) {
  const content = encodeBase64(JSON.stringify(json, null, 2) + "\n");
  return gh(`/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content, sha, branch: BRANCH }),
  });
}

function toast(msg, kind = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ── Form helpers ── */
function getByPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setByPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null) cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function fieldLabel(f) { return f.label || f.name; }

function renderField(f, path, value) {
  const lbl = fieldLabel(f);
  const id = `f-${path.replace(/[^a-z0-9]/gi, "_")}`;
  switch (f.type) {
    case "boolean":
      return `<label class="field field-boolean"><input type="checkbox" data-path="${path}" ${value ? "checked" : ""} /> <span>${escapeHtml(lbl)}</span></label>`;
    case "number":
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)}</label><input id="${id}" type="number" data-path="${path}" value="${escapeHtml(value ?? "")}" /></div>`;
    case "select": {
      const opts = (f.options || []).map((o) => {
        const v = typeof o === "object" ? o.value : o;
        const l = typeof o === "object" ? o.label : o;
        return `<option value="${escapeHtml(v)}" ${value === v ? "selected" : ""}>${escapeHtml(l)}</option>`;
      }).join("");
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)}</label><select id="${id}" data-path="${path}"><option value="">—</option>${opts}</select></div>`;
    }
    case "text":
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)}</label><textarea id="${id}" data-path="${path}" rows="4">${escapeHtml(value ?? "")}</textarea></div>`;
    case "stringList": {
      const v = Array.isArray(value) ? value.join("\n") : (value || "");
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)} <span class="hint">(un per línia)</span></label><textarea id="${id}" data-path="${path}" data-type="stringList" rows="6">${escapeHtml(v)}</textarea></div>`;
    }
    case "image":
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)}</label><input id="${id}" type="url" data-path="${path}" value="${escapeHtml(value ?? "")}" placeholder="https://… o /media/…" />${value ? `<img class="preview-img" src="${escapeHtml(value)}" alt="" onerror="this.style.display='none'" />` : ""}</div>`;
    case "url":
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)}</label><input id="${id}" type="url" data-path="${path}" value="${escapeHtml(value ?? "")}" /></div>`;
    case "json":
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)} <span class="hint">(JSON)</span></label><textarea id="${id}" data-path="${path}" data-type="json" rows="8" class="mono">${escapeHtml(typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2))}</textarea></div>`;
    case "social":
      return `<div class="field-group"><div class="field-group-title">${escapeHtml(lbl)}</div>
        ${["url","label","icon"].map((k) => `<div class="field field-inline"><label>${k}</label><input type="text" data-path="${path}.${k}" value="${escapeHtml((value && value[k]) ?? "")}" /></div>`).join("")}
      </div>`;
    case "object":
      return `<div class="field-group"><div class="field-group-title">${escapeHtml(lbl)}</div>
        ${(f.fields || []).map((sf) => renderField(sf, `${path}.${sf.name}`, value && value[sf.name])).join("")}
      </div>`;
    case "social": {
      const v = value || {};
      return `<div class="field-group"><div class="field-group-title">${escapeHtml(lbl)}</div>
        ${["url","label","icon"].map((k) => `<div class="field field-inline"><label>${k}</label><input type="text" data-path="${path}.${k}" value="${escapeHtml(v[k] ?? "")}" /></div>`).join("")}
      </div>`;
    }
    case "list": {
      const items = Array.isArray(value) ? value : [];
      const itemFields = f.itemFields || [];
      const itemType = f.itemType || "object";
      let html = `<div class="field-group"><div class="field-group-title">${escapeHtml(lbl)}</div><div class="list-editor" data-path="${path}">`;
      items.forEach((item, i) => {
        if (itemType === "string") {
          html += `<div class="list-row"><input type="text" data-path="${path}.${i}" value="${escapeHtml(item)}" /><button type="button" class="btn btn-sm btn-danger" data-action="remove" data-path="${path}" data-idx="${i}">✕</button></div>`;
        } else {
          html += `<div class="list-item"><div class="list-item-head"><strong>#${i + 1}</strong><button type="button" class="btn btn-sm btn-danger" data-action="remove" data-path="${path}" data-idx="${i}">Eliminar</button></div>
            ${itemFields.map((sf) => renderField(sf, `${path}.${i}.${sf.name}`, item && item[sf.name])).join("")}
          </div>`;
        }
      });
      html += `<button type="button" class="btn btn-sm" data-action="add" data-path="${path}">+ Afegir</button></div></div>`;
      return html;
    }
    default: // string
      return `<div class="field"><label for="${id}">${escapeHtml(lbl)}</label><input id="${id}" type="text" data-path="${path}" value="${escapeHtml(value ?? "")}" /></div>`;
  }
}

function renderForm(fields, data, basePath = "") {
  return (fields || []).map((f) => renderField(f, f.name, data && data[f.name])).join("");
}

/* ── Render ── */
function renderLogin() {
  $("#app").innerHTML = `
    <section class="login">
      <h1>Adrián Salcedo Toca</h1>
      <p class="login-sub">backstage · admin</p>
      <p class="login-help">Connecta amb GitHub per editar el contingut del lloc. Tota la informació existent es carrega i s'edita al seu lloc.</p>
      <a class="btn btn-primary" href="/api/auth">Connectar amb GitHub</a>
      <a class="btn btn-ghost" href="/">Torna al lloc</a>
    </section>
    <div id="toasts" class="toasts"></div>`;
}

function renderShell() {
  $("#app").innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <strong>Backstage</strong>
          <span>${state.user ? state.user.login || "GitHub" : ""}</span>
        </div>
        <nav class="sidebar-nav">
          <button class="nav-item nav-roll" data-id="__roll">Rotlle (ordre)</button>
          ${COLLECTIONS.map((c) => `<button class="nav-item" data-id="${c.id}">${c.label}</button>`).join("")}
        </nav>
        <div class="sidebar-foot">
          <a href="/">Veure el lloc</a>
          <button id="logout" class="btn-link">Sortir</button>
        </div>
      </aside>
      <main class="main">
        <header class="main-head">
          <h2 id="col-title">Selecciona una col·lecció</h2>
          <div class="main-actions">
            <div class="view-toggle">
              <button class="btn btn-sm" data-view="form" class="active">Formulari</button>
              <button class="btn btn-sm" data-view="json">JSON avançat</button>
            </div>
            <input id="commit-msg" class="input" placeholder="Missatge de commit" />
            <button id="save" class="btn btn-primary" disabled>Desar</button>
          </div>
        </header>
        <div id="status" class="status"></div>
        <div id="entries" class="entries"></div>
        <div id="editor" class="editor"></div>
      </main>
    </div>
    <div id="toasts" class="toasts"></div>`;
  $$(".nav-item").forEach((b) => b.addEventListener("click", () => selectCollection(b.dataset.id)));
  $("#logout").addEventListener("click", () => { clearToken(); location.reload(); });
  $("#save").addEventListener("click", saveCurrent);
  $$(".view-toggle button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  $("#commit-msg").value = "";
}

function setView(v) {
  state.view = v;
  $$(".view-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  renderCollection();
}

async function selectCollection(id) {
  if (id === "__roll") {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    $("#col-title").textContent = "Rotlle (ordre i contingut)";
    $("#entries").innerHTML = '<p class="muted">Carregant rotlle…</p>';
    $("#editor").innerHTML = "";
    $("#status").textContent = "";
    state.collection = null;
    state.selectedEntry = null;
    state.view = "form";
    await renderRollView();
    return;
  }
  const col = COLLECTIONS.find((c) => c.id === id);
  if (!col) return;
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  $("#col-title").textContent = col.label;
  $("#entries").innerHTML = '<p class="muted">Carregant…</p>';
  $("#editor").innerHTML = "";
  $("#status").textContent = "";
  state.collection = col;
  state.data = null;
  state.sha = null;
  state.dirty = false;
  state.selectedEntry = null;
  updateSaveBtn();
  try {
    const { json, sha } = await fetchFile(col.file);
    state.data = json;
    state.sha = sha;
    renderCollection();
  } catch (e) {
    $("#entries").innerHTML = `<p class="error">Error carregant: ${escapeHtml(e.message)}</p>`;
  }
}

function updateSaveBtn() {
  const btn = $("#save");
  if (!btn) return;
  if (state.collection === null) {
    btn.disabled = state.rollDirty.size === 0 || state.busy;
    btn.textContent = state.busy ? "Desant…" : "Desar rotlle";
  } else {
    btn.disabled = !state.dirty || state.busy;
    btn.textContent = state.busy ? "Desant…" : "Desar";
  }
}

function markDirty() {
  state.dirty = true;
  updateSaveBtn();
  // sync json textarea if present
  const ta = $("#json-editor");
  if (ta && state.view === "form") {
    // keep json in sync silently
  }
}

/* ── Collection rendering ── */
function renderCollection() {
  const col = state.collection;
  const data = state.data;
  const entriesEl = $("#entries");
  const editorEl = $("#editor");
  entriesEl.innerHTML = "";
  editorEl.innerHTML = "";

  if (state.view === "json") {
    renderJsonView(entriesEl, editorEl, data);
    return;
  }

  if (col.kind === "file") {
    renderFileForm(entriesEl, editorEl, col, data);
  } else {
    renderListCollection(entriesEl, editorEl, col, data);
  }
}

function renderJsonView(entriesEl, editorEl, data) {
  entriesEl.innerHTML = "";
  const ta = document.createElement("textarea");
  ta.id = "json-editor";
  ta.className = "json-editor";
  ta.value = JSON.stringify(data, null, 2);
  ta.spellcheck = false;
  editorEl.appendChild(ta);
  ta.addEventListener("input", () => {
    try {
      state.data = JSON.parse(ta.value);
      state.dirty = true;
      updateSaveBtn();
      $("#status").textContent = "";
    } catch (e) {
      $("#status").textContent = `JSON invàlid: ${e.message}`;
      $("#status").className = "status error";
    }
  });
}

function renderFileForm(entriesEl, editorEl, col, data) {
  const fields = col.fields || [];
  if (!fields.length) {
    // fallback to json
    renderJsonView(entriesEl, editorEl, data);
    return;
  }
  const form = document.createElement("div");
  form.className = "form";
  form.innerHTML = renderForm(fields, data);
  editorEl.appendChild(form);
  bindForm(form, data);
}

function renderListCollection(entriesEl, editorEl, col, data) {
  const arr = (data && data[col.arrayKey]) || [];
  // top fields (file-level)
  if (col.topFields && col.topFields.length) {
    const topForm = document.createElement("div");
    topForm.className = "form form-top";
    topForm.innerHTML = `<h3 class="section-title">Dades generals</h3>` + renderForm(col.topFields, data);
    entriesEl.appendChild(topForm);
    bindForm(topForm, data);
  }
  // entries cards
  const cardsWrap = document.createElement("div");
  cardsWrap.className = "cards";
  const cardsHtml = arr.map((item, i) => {
    const title = item[col.titleKey] || item.id || `#${i + 1}`;
    const on = !!item.destacat;
    return `<div class="card">
      <div class="card-head">
        <span class="card-title">${escapeHtml(title)}</span>
        <div class="card-actions">
          <label class="switch"><input type="checkbox" data-idx="${i}" data-field="destacat" ${on ? "checked" : ""} /><span>Destacar</span></label>
          <button type="button" class="btn btn-sm" data-action="edit" data-idx="${i}">Editar</button>
          <button type="button" class="btn btn-sm btn-danger" data-action="remove" data-idx="${i}">✕</button>
        </div>
      </div>
    </div>`;
  }).join("");
  cardsWrap.innerHTML = cardsHtml + `<div class="card card-add"><button type="button" class="btn" data-action="add">+ Nova entrada</button></div>`;
  entriesEl.appendChild(cardsWrap);

  // handlers
  $$('input[data-field="destacat"]', cardsWrap).forEach((cb) => {
    cb.addEventListener("change", () => {
      const i = +cb.dataset.idx;
      state.data[col.arrayKey][i].destacat = cb.checked;
      markDirty();
      // re-render editor if this entry is open
      if (state.selectedEntry === i) renderEntryForm(editorEl, col, i);
    });
  });
  $$('button[data-action="edit"]', cardsWrap).forEach((b) => {
    b.addEventListener("click", () => {
      state.selectedEntry = +b.dataset.idx;
      renderEntryForm(editorEl, col, state.selectedEntry);
    });
  });
  $$('button[data-action="remove"]', cardsWrap).forEach((b) => {
    b.addEventListener("click", () => {
      const i = +b.dataset.idx;
      if (!confirm("Eliminar aquesta entrada?")) return;
      state.data[col.arrayKey].splice(i, 1);
      if (state.selectedEntry === i) state.selectedEntry = null;
      else if (state.selectedEntry > i) state.selectedEntry--;
      markDirty();
      renderCollection();
    });
  });
  const addBtn = cardsWrap.querySelector('button[data-action="add"]');
  if (addBtn) addBtn.addEventListener("click", () => {
    const newItem = { id: `entry-${Date.now()}` };
    (col.itemFields || []).forEach((f) => {
      if (f.name !== "id" && f.type === "boolean") newItem[f.name] = false;
      else if (f.type === "stringList" || f.type === "list") newItem[f.name] = [];
      else if (f.type === "object") newItem[f.name] = {};
    });
    state.data[col.arrayKey].push(newItem);
    state.selectedEntry = state.data[col.arrayKey].length - 1;
    markDirty();
    renderCollection();
    renderEntryForm($("#editor"), col, state.selectedEntry);
  });

  // entry form area
  if (state.selectedEntry != null && arr[state.selectedEntry]) {
    renderEntryForm(editorEl, col, state.selectedEntry);
  } else {
    editorEl.innerHTML = `<p class="muted">Selecciona «Editar» en una entrada per modificar-la.</p>`;
  }
}

function renderEntryForm(editorEl, col, idx) {
  const item = state.data[col.arrayKey][idx];
  const fields = col.itemFields || [];
  editorEl.innerHTML = `<h3 class="section-title">Entrada #${idx + 1}${item.id ? " · " + escapeHtml(item.id) : ""}</h3>
    <div class="form" data-entry="${idx}">${renderForm(fields, item)}</div>`;
  bindForm(editorEl.querySelector(".form"), item);
}

function bindForm(formEl, dataObj) {
  // delegated input/change
  formEl.addEventListener("input", (e) => {
    const t = e.target;
    const path = t.dataset && t.dataset.path;
    if (!path) return;
    let val;
    if (t.type === "checkbox") val = t.checked;
    else if (t.dataset.type === "stringList") val = t.value.split("\n").map((s) => s).filter((s, i, a) => !(s === "" && i === a.length - 1));
    else if (t.dataset.type === "json") {
      try { val = JSON.parse(t.value); $("#status").textContent = ""; $("#status").className = "status"; }
      catch (err) { $("#status").textContent = `JSON invàlid: ${err.message}`; $("#status").className = "status error"; return; }
    } else if (t.type === "number") val = t.value === "" ? null : Number(t.value);
    else val = t.value;
    setByPath(dataObj, path, val);
    state.dirty = true;
    updateSaveBtn();
  });
  formEl.addEventListener("change", (e) => {
    const t = e.target;
    const path = t.dataset && t.dataset.path;
    if (!path) return;
    // list add/remove
    if (t.dataset.action === "add") {
      const arr = getByPath(dataObj, t.dataset.path);
      const itemFields = findItemFields(t.dataset.path);
      const newItem = {};
      (itemFields || []).forEach((f) => {
        if (f.type === "boolean") newItem[f.name] = false;
        else if (f.type === "stringList" || f.type === "list") newItem[f.name] = [];
        else if (f.type === "object" || f.type === "social") newItem[f.name] = {};
        else newItem[f.name] = "";
      });
      if (!Array.isArray(arr)) setByPath(dataObj, t.dataset.path, [newItem]);
      else arr.push(newItem);
      markDirty();
      renderCollection();
    }
    if (t.dataset.action === "remove") {
      const arr = getByPath(dataObj, t.dataset.path);
      if (Array.isArray(arr)) {
        arr.splice(+t.dataset.idx, 1);
        markDirty();
        renderCollection();
      }
    }
  });
}

function findItemFields(path) {
  const col = state.collection;
  if (!col) return null;
  // top-level list field
  const topField = (col.fields || []).find((f) => f.name === path.split(".")[0] && f.type === "list");
  if (topField) return topField.itemFields;
  const itemField = (col.itemFields || []).find((f) => f.name === path.split(".").pop() && f.type === "list");
  if (itemField) return itemField.itemFields;
  // nested in itemFields
  for (const f of col.itemFields || []) {
    if (f.type === "object" || f.type === "list") {
      const sub = (f.fields || f.itemFields || []).find((x) => x.name === path.split(".").slice(-2, -1)[0] && x.type === "list");
      if (sub) return sub.itemFields;
    }
  }
  return null;
}

/* ── Vista del Rotlle ─────────────────────────────────────────── */
let rollEntries = []; // [{source, collection, id, item, order, title}]
let rollAvailable = []; // entries not on roll

async function loadRollData() {
  // Load all source collections
  const dataByCol = {};
  const shaByCol = {};
  for (const src of ROLL_SOURCES) {
    if (dataByCol[src.collection]) continue;
    const col = COLLECTIONS.find((c) => c.id === src.collection);
    const { json, sha } = await fetchFile(col.file);
    dataByCol[src.collection] = json;
    shaByCol[src.collection] = sha;
  }
  state._rollData = dataByCol;
  state._rollSha = shaByCol;

  // Build roll entries: items with destacat true, sorted by order
  const onRoll = [];
  const available = [];
  const seen = new Set();
  for (const src of ROLL_SOURCES) {
    const data = dataByCol[src.collection];
    const arr = src.single ? [getByPathArr(data, src.path)] : (getByPathArr(data, src.path) || []);
    if (!Array.isArray(arr)) continue;
    arr.forEach((item, idx) => {
      if (!item) return;
      const key = `${src.collection}:${item.id || idx}`;
      if (seen.has(key)) return;
      seen.add(key);
      const entry = { src, collection: src.collection, item, idx, title: (item[src.titleKey] || item.id || `#${idx + 1}`) };
      if (item.destacat) {
        entry.order = item.order != null ? item.order : onRoll.length;
        onRoll.push(entry);
      } else {
        available.push(entry);
      }
    });
  }
  onRoll.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  // reassign clean orders
  onRoll.forEach((e, i) => { e.order = i; });
  rollEntries = onRoll;
  rollAvailable = available;
}

async function renderRollView() {
  const entriesEl = $("#entries");
  const editorEl = $("#editor");
  entriesEl.innerHTML = '<p class="muted">Carregant rotlle…</p>';
  editorEl.innerHTML = "";
  try {
    await loadRollData();
  } catch (e) {
    entriesEl.innerHTML = `<p class="error">Error carregant: ${escapeHtml(e.message)}</p>`;
    return;
  }
  renderRollList(entriesEl);
}

function renderRollList(entriesEl) {
  entriesEl.innerHTML = `
    <div class="roll-view">
      <div class="roll-section">
        <h3 class="section-title">Al rotlle (${rollEntries.length})</h3>
        <p class="muted small">Arrossega o usa les fletxes per reordenar. Els canvis es desen amb «Desar».</p>
        <div id="roll-list" class="roll-list">
          ${rollEntries.map((e, i) => rollEntryHtml(e, i)).join("")}
        </div>
      </div>
      <div class="roll-section">
        <h3 class="section-title">Disponibles (${rollAvailable.length})</h3>
        <p class="muted small">Entrades no destacades. Clica «Afegir» per incloure-les al rotlle.</p>
        <div id="avail-list" class="avail-list">
          ${rollAvailable.map((e) => availEntryHtml(e)).join("")}
        </div>
      </div>
      <div class="roll-section">
        <h3 class="section-title">Panells fixos</h3>
        <p class="muted small">Portada, declaració, premsa i colofó. Editables des de les col·leccions.</p>
        <div class="fixed-panels">
          <button class="btn btn-sm" data-goto="home">Portada / Hero / Bio</button>
          <button class="btn btn-sm" data-goto="premsa">Premsa (top 3)</button>
          <button class="btn btn-sm" data-goto="site">Colofó / Xarxes</button>
        </div>
      </div>
    </div>`;
  bindRollEvents(entriesEl);
}

function rollEntryHtml(e, i) {
  return `<div class="roll-row" draggable="true" data-idx="${i}">
    <span class="drag-handle" title="Arrossega">⋮⋮</span>
    <span class="roll-title">${escapeHtml(e.title)}</span>
    <span class="roll-source">${escapeHtml(e.src.label)}</span>
    <div class="roll-actions">
      <button type="button" class="btn btn-xs" data-action="up" data-idx="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
      <button type="button" class="btn btn-xs" data-action="down" data-idx="${i}" ${i === rollEntries.length - 1 ? "disabled" : ""}>↓</button>
      <button type="button" class="btn btn-xs" data-action="edit" data-idx="${i}">Editar</button>
      <button type="button" class="btn btn-xs btn-danger" data-action="remove" data-idx="${i}">Treure</button>
    </div>
  </div>`;
}

function availEntryHtml(e) {
  return `<div class="avail-row">
    <span class="roll-title">${escapeHtml(e.title)}</span>
    <span class="roll-source">${escapeHtml(e.src.label)}</span>
    <button type="button" class="btn btn-xs btn-primary" data-action="add" data-key="${e.collection}:${e.item.id || e.idx}">Afegir</button>
  </div>`;
}

function bindRollEvents(root) {
  const list = root.querySelector("#roll-list");
  // up/down
  list.querySelectorAll("button[data-action]").forEach((b) => {
    b.addEventListener("click", () => {
      const i = +b.dataset.idx;
      const action = b.dataset.action;
      if (action === "up" && i > 0) {
        [rollEntries[i - 1], rollEntries[i]] = [rollEntries[i], rollEntries[i - 1]];
      } else if (action === "down" && i < rollEntries.length - 1) {
        [rollEntries[i], rollEntries[i + 1]] = [rollEntries[i + 1], rollEntries[i]];
      } else if (action === "remove") {
        const e = rollEntries[i];
        e.item.destacat = false;
        if (e.item.order != null) delete e.item.order;
        rollAvailable.push(e);
        rollEntries.splice(i, 1);
        markRollDirty(e.src.collection);
      } else if (action === "edit") {
        const e = rollEntries[i];
        const col = COLLECTIONS.find((c) => c.id === e.collection);
        selectCollection(col.id);
        // try to open the entry editor after load
        setTimeout(() => {
          state.selectedEntry = e.idx;
          const ed = $("#editor");
          if (ed && col.kind === "list") renderEntryForm(ed, col, e.idx);
        }, 800);
        return;
      }
      rollEntries.forEach((e, i) => { e.order = i; e.item.order = i; });
      markRollDirtyForAll();
      renderRollList($("#entries"));
    });
  });
  // drag and drop
  let dragIdx = null;
  list.querySelectorAll(".roll-row").forEach((row) => {
    row.addEventListener("dragstart", (ev) => {
      dragIdx = +row.dataset.idx;
      row.classList.add("dragging");
      ev.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      dragIdx = null;
    });
    row.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "move";
      row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", (ev) => {
      ev.preventDefault();
      row.classList.remove("drag-over");
      const targetIdx = +row.dataset.idx;
      if (dragIdx == null || dragIdx === targetIdx) return;
      const [moved] = rollEntries.splice(dragIdx, 1);
      rollEntries.splice(targetIdx, 0, moved);
      rollEntries.forEach((e, i) => { e.order = i; e.item.order = i; });
      markRollDirtyForAll();
      renderRollList($("#entries"));
    });
  });
  // add from available
  root.querySelectorAll('button[data-action="add"]').forEach((b) => {
    b.addEventListener("click", () => {
      const key = b.dataset.key;
      const entry = rollAvailable.find((e) => `${e.collection}:${e.item.id || e.idx}` === key);
      if (!entry) return;
      entry.item.destacat = true;
      entry.item.order = rollEntries.length;
      rollEntries.push(entry);
      rollAvailable = rollAvailable.filter((e) => e !== entry);
      rollEntries.forEach((e, i) => { e.order = i; e.item.order = i; });
      markRollDirty(entry.src.collection);
      renderRollList($("#entries"));
    });
  });
  // fixed panel shortcuts
  root.querySelectorAll(".fixed-panels button[data-goto]").forEach((b) => {
    b.addEventListener("click", () => selectCollection(b.dataset.goto));
  });
}

function markRollDirty(collectionId) {
  const col = COLLECTIONS.find((c) => c.id === collectionId);
  if (col) state.rollDirty.add(col.file);
  updateSaveBtn();
}
function markRollDirtyForAll() {
  const cols = new Set(rollEntries.map((e) => e.collection));
  cols.forEach((c) => {
    const col = COLLECTIONS.find((x) => x.id === c);
    if (col) state.rollDirty.add(col.file);
  });
  updateSaveBtn();
}

async function saveCurrent() {
  // Vista del rotlle: desa tots els fitxers bruts
  if (state.collection === null) {
    if (state.rollDirty.size === 0) return;
    state.busy = true;
    updateSaveBtn();
    const msg = ($("#commit-msg").value || "").trim() || "Reordena el rotlle";
    try {
      for (const file of state.rollDirty) {
        const col = COLLECTIONS.find((c) => c.file === file);
        const data = state._rollData[col.id];
        const sha = state._rollSha[col.id];
        const res = await saveFile(file, data, sha, msg);
        state._rollSha[col.id] = res.content.sha;
      }
      state.rollDirty.clear();
      toast("Rotlle desat", "success");
    } catch (e) {
      toast(`Error desant: ${e.message}`, "error");
    } finally {
      state.busy = false;
      updateSaveBtn();
    }
    return;
  }
  // Vista de col·lecció
  if (!state.dirty) return;
  const col = state.collection;
  let json = state.data;
  if (state.view === "json") {
    const ta = $("#json-editor");
    try { json = JSON.parse(ta.value); }
    catch (e) { toast(`JSON invàlid: ${e.message}`, "error"); return; }
  }
  const msg = ($("#commit-msg").value || "").trim() || `Actualitza ${col.label}`;
  state.busy = true;
  updateSaveBtn();
  try {
    const res = await saveFile(col.file, json, state.sha, msg);
    state.sha = res.content.sha;
    state.data = json;
    state.dirty = false;
    toast("Desat correctament", "success");
    if (state.view === "json") {
      const ta = $("#json-editor");
      if (ta) ta.value = JSON.stringify(json, null, 2);
    } else {
      renderCollection();
    }
  } catch (e) {
    toast(`Error desant: ${e.message}`, "error");
  } finally {
    state.busy = false;
    updateSaveBtn();
  }
}

function init() {
  const u = getToken();
  if (!u) { renderLogin(); return; }
  state.token = u.token;
  state.user = u;
  gh("/user").then((me) => { state.user = { ...u, login: me.login }; const el = document.querySelector(".sidebar-brand span"); if (el) el.textContent = me.login; })
    .catch(() => { clearToken(); location.reload(); });
  renderShell();
  selectCollection(COLLECTIONS[0].id);
}

init();
