/* ═══════════════════════════════════════════════════════════
   ADMIN PERSONALITZAT — Adrián Salcedo Toca
   Editor git-backed sobre l'API de GitHub. Autenticació via
   /api/auth (worker). Sense Decap, sense dependències.
   ═══════════════════════════════════════════════════════════ */

const OWNER = "dadapoetry";
const REPO = "adriansalcedo";
const BRANCH = "main";
const API = "https://api.github.com";

const COLLECTIONS = [
  { id: "site", label: "Configuració (CA)", file: "content/site.json", kind: "file" },
  { id: "site-en", label: "Configuració (EN)", file: "content/site.en.json", kind: "file" },
  { id: "labels", label: "Textos UI", file: "content/labels.json", kind: "file" },
  { id: "seo", label: "SEO", file: "content/seo.json", kind: "file" },
  { id: "home", label: "Inici", file: "content/home.json", kind: "file" },
  { id: "projectes", label: "Projectes", file: "content/projectes.json", kind: "list", arrayKey: "projects", titleKey: "title" },
  { id: "festivals", label: "Festivals", file: "content/festivals.json", kind: "list", arrayKey: "festivals", titleKey: "title" },
  { id: "obres", label: "Obres", file: "content/obres.json", kind: "list", arrayKey: "works", titleKey: "title" },
  { id: "premis", label: "Premis", file: "content/premis.json", kind: "list", arrayKey: "awards", titleKey: "title" },
  { id: "quisoc", label: "Qui soc", file: "content/quisoc.json", kind: "file" },
  { id: "premsa", label: "Premsa", file: "content/premsa.json", kind: "list", arrayKey: "articles", titleKey: "title" },
  { id: "arxiu", label: "Arxiu", file: "content/arxiu.json", kind: "file" },
  { id: "contacte", label: "Contacte", file: "content/contacte.json", kind: "file" },
  { id: "agenda", label: "Agenda", file: "content/agenda.json", kind: "list", arrayKey: "events", titleKey: "title" },
];

const state = {
  token: null,
  user: null,
  collection: null,
  data: null,
  sha: null,
  dirty: false,
  busy: false,
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
  } catch {
    return null;
  }
}
function setToken(obj) { localStorage.setItem("netlify-cms-user", JSON.stringify(obj)); }
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
  if (!state.token) throw new Error("Cal connectar amb GitHub per desar");
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

function renderLogin() {
  $("#app").innerHTML = `
    <section class="login">
      <h1>Adrián Salcedo Toca</h1>
      <p class="login-sub">backstage · cms</p>
      <p class="login-help">Connecta amb GitHub per editar el contingut del lloc.</p>
      <a class="btn btn-primary" href="/api/auth">Connectar amb GitHub</a>
      <a class="btn btn-ghost" href="/">Torna al lloc</a>
    </section>`;
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
  $("#commit-msg").value = "";
}

async function selectCollection(id) {
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
  updateSaveBtn();
  try {
    const { json, sha } = await fetchFile(col.file);
    state.data = json;
    state.sha = sha;
    renderCollection();
  } catch (e) {
    $("#entries").innerHTML = `<p class="error">Error carregant: ${e.message}</p>`;
  }
}

function updateSaveBtn() {
  const btn = $("#save");
  if (!btn) return;
  btn.disabled = !state.token || !state.dirty || state.busy;
  btn.textContent = state.busy ? "Desant…" : "Desar";
}

function renderCollection() {
  const col = state.collection;
  const data = state.data;
  const entriesEl = $("#entries");
  const editorEl = $("#editor");
  entriesEl.innerHTML = "";
  editorEl.innerHTML = "";

  if (col.kind === "list") {
    const arr = (data && data[col.arrayKey]) || [];
    const meta = { ...data };
    delete meta[col.arrayKey];
    const metaKeys = Object.keys(meta);
    // Toggle cards
    const cards = arr.map((item, i) => {
      const title = item[col.titleKey] || item.id || `#${i + 1}`;
      const on = !!item.destacat;
      return `<div class="card">
        <div class="card-head">
          <span class="card-title">${escapeHtml(title)}</span>
          <label class="switch">
            <input type="checkbox" data-idx="${i}" ${on ? "checked" : ""} />
            <span>Destacar al rotlle</span>
          </label>
        </div>
      </div>`;
    }).join("");
    entriesEl.innerHTML = `<div class="cards">${cards || '<p class="muted">Sense entrades.</p>'}</div>`;
    $$('input[type="checkbox"]', entriesEl).forEach((cb) => {
      cb.addEventListener("change", () => {
        const i = +cb.dataset.idx;
        state.data[col.arrayKey][i].destacat = cb.checked;
        state.dirty = true;
        syncTextarea();
        updateSaveBtn();
      });
    });
  }

  // JSON editor (always available, full control)
  const ta = document.createElement("textarea");
  ta.className = "json-editor";
  ta.value = JSON.stringify(data, null, 2);
  ta.spellcheck = false;
  editorEl.appendChild(document.createElement("h3")).textContent = "JSON (edició completa)";
  editorEl.appendChild(ta);
  ta.addEventListener("input", () => {
    state.dirty = true;
    updateSaveBtn();
  });
  // keep reference
  state.textarea = ta;
}

function syncTextarea() {
  if (state.textarea) state.textarea.value = JSON.stringify(state.data, null, 2);
}

async function saveCurrent() {
  if (!state.collection || !state.dirty) return;
  const col = state.collection;
  let json;
  try {
    json = JSON.parse(state.textarea.value);
  } catch (e) {
    toast(`JSON invàlid: ${e.message}`, "error");
    return;
  }
  const msg = ($("#commit-msg").value || "").trim() || `Actualitza ${col.label}`;
  state.busy = true;
  updateSaveBtn();
  try {
    const res = await saveFile(col.file, json, state.sha, msg);
    state.sha = res.content.sha;
    state.data = json;
    state.dirty = false;
    syncTextarea();
    toast("Desat correctament", "success");
  } catch (e) {
    toast(`Error desant: ${e.message}`, "error");
  } finally {
    state.busy = false;
    updateSaveBtn();
  }
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function init() {
  const u = getToken();
  if (!u) {
    renderLogin();
    return;
  }
  state.token = u.token;
  state.user = u;
  // verify token
  try {
    const me = await gh("/user");
    state.user = { ...u, login: me.login };
  } catch (e) {
    clearToken();
    renderLogin();
    toast("Sessió caducada, torna a connectar", "error");
    return;
  }
  renderShell();
  // auto-select first collection
  selectCollection(COLLECTIONS[0].id);
}

init();
