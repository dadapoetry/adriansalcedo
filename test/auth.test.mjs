// Proves del flux d'auth del CMS (GitHub OAuth + PKCE + CSRF) i dels headers
// de seguretat. Executa el _worker.js real amb fetch i env.ASSETS simulats,
// de manera que no cal xarxa ni cap configuració real.
//
//   npm test
//
// Cal Node 18+ (crypto.subtle global).

import worker from "../_worker.js";

const SITE = "https://adriansalcedo.com";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, extra) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(name + (extra ? ` -> ${extra}` : ""));
  }
}

const env = {
  GITHUB_CLIENT_ID: "client-123",
  GITHUB_CLIENT_SECRET: "secret-456",
  SITE_URL: SITE,
  ASSETS: {
    async fetch(request) {
      const u = new URL(request.url);
      if (u.pathname === "/admin/index.html") {
        return new Response("<html><body>admin</body></html>", {
          headers: { "Content-Type": "text/html" },
        });
      }
      return new Response("not found", { status: 404 });
    },
  },
};

function get(url, headers = {}) {
  return new Request(url, { headers });
}

// ── 1. authStart emet cookie + PKCE + state ─────────────────────────────
const startRes = await worker.fetch(
  get(`${SITE}/api/auth?redirect_uri=https://evil.example/steal`),
  env
);

check("authStart retorna 302", startRes.status === 302, `status=${startRes.status}`);

const loc = new URL(startRes.headers.get("Location"));
check(
  "authStart apunta a GitHub",
  loc.origin === "https://github.com" &&
    loc.pathname === "/login/oauth/authorize",
  loc.href
);
check(
  "code_challenge present (43 caràcters)",
  /^[A-Za-z0-9_-]{43}$/.test(loc.searchParams.get("code_challenge") || ""),
  loc.searchParams.get("code_challenge")
);
check(
  "code_challenge_method=S256",
  loc.searchParams.get("code_challenge_method") === "S256"
);

const state = loc.searchParams.get("state");
check("state present i llarg", !!state && state.length >= 40, `len=${(state || "").length}`);

// El redirect_uri del query string de l'atacant ha d'haver estat ignorat.
check(
  "redirect_uri ignorat (evita open redirect)",
  loc.searchParams.get("redirect_uri") === `${SITE}/api/auth/callback`,
  loc.searchParams.get("redirect_uri")
);

const setCookie = startRes.headers.get("Set-Cookie") || "";
check("cookie HttpOnly", /HttpOnly/i.test(setCookie), setCookie);
check("cookie Secure", /Secure/i.test(setCookie));
check("cookie SameSite=Lax", /SameSite=Lax/i.test(setCookie));
check("cookie limitat a /api/auth", /Path=\/api\/auth/i.test(setCookie));

const cookieValue = decodeURIComponent(/cms_oauth=([^;]*)/.exec(setCookie)?.[1] || "");
const session = JSON.parse(cookieValue);
check("cookie porta el mateix state", session.state === state);
check(
  "cookie porta code_verifier",
  typeof session.codeVerifier === "string" && session.codeVerifier.length >= 43
);

// El code_verifier ha de generar el code_challenge que vam enviar.
const digest = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(session.codeVerifier)
);
const derived = Buffer.from(digest)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");
check(
  "code_verifier correspon al code_challenge",
  derived === loc.searchParams.get("code_challenge"),
  derived
);

// ── 2. Callback sense cookie → rebutjat ─────────────────────────────────
let githubCalled = null;
globalThis.fetch = async (url, init) => {
  githubCalled = { url: String(url), body: init?.body };
  return new Response(JSON.stringify({ access_token: "gho_ok", scope: "public_repo" }), {
    headers: { "Content-Type": "application/json" },
  });
};

const noCookie = await worker.fetch(
  get(`${SITE}/api/auth/callback?code=abc&state=${encodeURIComponent(state)}`),
  env
);
check("callback sense cookie → 400", noCookie.status === 400, `status=${noCookie.status}`);
check("callback sense cookie no continua", githubCalled === null);

// ── 3. Callback amb cookie d'un altre navegador (CSRF) → rebutjat ────────
const csrf = await worker.fetch(
  get(`${SITE}/api/auth/callback?code=abc&state=${encodeURIComponent("tot-altre-estat")}`, {
    Cookie: `cms_oauth=${encodeURIComponent(cookieValue)}`,
  }),
  env
);
check("state diferent → 400 (CSRF)", csrf.status === 400, `status=${csrf.status}`);
check("state diferent no continua", githubCalled === null);

// ── 4. Cookie caducada → rebutjada ──────────────────────────────────────
const expired = { ...session, exp: Date.now() - 1000 };
const expiredRes = await worker.fetch(
  get(`${SITE}/api/auth/callback?code=abc&state=${encodeURIComponent(state)}`, {
    Cookie: `cms_oauth=${encodeURIComponent(JSON.stringify(expired))}`,
  }),
  env
);
check("cookie caducada → 400", expiredRes.status === 400, `status=${expiredRes.status}`);

// ── 5. Callback correcte ────────────────────────────────────────────────
githubCalled = null;
const okRes = await worker.fetch(
  get(`${SITE}/api/auth/callback?code=abc&state=${encodeURIComponent(state)}`, {
    Cookie: `cms_oauth=${encodeURIComponent(cookieValue)}`,
  }),
  env
);
check("callback correcte → 200", okRes.status === 200, `status=${okRes.status}`);
check("intercanvi de token fet", githubCalled !== null);

const body = JSON.parse(githubCalled.body);
check("code_verifier enviat a GitHub", body.code_verifier === session.codeVerifier);
check(
  "redirect_uri enviat a GitHub",
  body.redirect_uri === `${SITE}/api/auth/callback`,
  body.redirect_uri
);
check("client_secret enviat", body.client_secret === "secret-456");

const html = await okRes.text();
check("token posat al localStorage del CMS", html.includes("netlify-cms-user"));
check("token present a la resposta", html.includes("gho_ok"));
check(
  "resposta esborra la cookie",
  /cms_oauth=;/.test(okRes.headers.get("Set-Cookie") || "")
);
check("resposta no es cacheja", okRes.headers.get("Cache-Control") === "no-store");

// Un token de GitHub que contingui '</script>' no ha d'escapar del bloc.
globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      access_token: "evil</script><img onerror=alert(1)>",
      scope: "public_repo",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
const evilRes = await worker.fetch(
  get(`${SITE}/api/auth/callback?code=abc&state=${encodeURIComponent(state)}`, {
    Cookie: `cms_oauth=${encodeURIComponent(cookieValue)}`,
  }),
  env
);
const evilHtml = await evilRes.text();
check(
  "token maliciós escapat (no injecta HTML)",
  !evilHtml.includes("</script><img"),
  evilHtml.slice(evilHtml.indexOf("netlify-cms-user"), evilHtml.indexOf("netlify-cms-user") + 160)
);

// ── 6. GitHub denega l'autorització ──────────────────────────────────────
const denied = await worker.fetch(
  get(`${SITE}/api/auth/callback?error=access_denied&state=${encodeURIComponent(state)}`),
  env
);
check("error de GitHub → 400", denied.status === 400, `status=${denied.status}`);

// ── 7. Headers i CSP de /admin/ ─────────────────────────────────────────
const adminRes = await worker.fetch(get(`${SITE}/admin/`), env);
const csp = adminRes.headers.get("Content-Security-Policy") || "";
check("admin rep CSP", csp.length > 0);
check("CSP sense unsafe-inline als scripts", !/script-src[^;]*'unsafe-inline'/.test(csp), csp);
check("CSP inclou frame-ancestors", /frame-ancestors/.test(csp));
check("admin no-store", adminRes.headers.get("Cache-Control") === "no-store");

const adminStatic = await worker.fetch(get(`${SITE}/admin/style.css`), env);
check(
  "els estils de l'admin també repen CSP",
  !!(adminStatic.headers.get("Content-Security-Policy") || "")
);

// ── 8. Gate d'accés ─────────────────────────────────────────────────────
const sha = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("s3cret"));
const shaHex = Buffer.from(sha).toString("hex");

const gatedEnv = { ...env, ADMIN_PASSWORD_SHA256: shaHex, ADMIN_USER: "adri" };

const deniedRes = await worker.fetch(get(`${SITE}/admin/`), gatedEnv);
check("gate: sense credencials → 401", deniedRes.status === 401, `status=${deniedRes.status}`);
check(
  "gate: WWW-Authenticate present",
  /Basic realm/.test(deniedRes.headers.get("WWW-Authenticate") || "")
);

const badRes = await worker.fetch(
  get(`${SITE}/admin/`, { Authorization: "Basic " + btoa("adri:wrong") }),
  gatedEnv
);
check("gate: contrasenya incorrecta → 401", badRes.status === 401, `status=${badRes.status}`);

const goodRes = await worker.fetch(
  get(`${SITE}/admin/`, { Authorization: "Basic " + btoa("adri:s3cret") }),
  gatedEnv
);
check("gate: credencials bones → 200", goodRes.status === 200, `status=${goodRes.status}`);

const wrongUser = await worker.fetch(
  get(`${SITE}/admin/`, { Authorization: "Basic " + btoa("altre:s3cret") }),
  gatedEnv
);
check("gate: usuari incorrecte → 401", wrongUser.status === 401, `status=${wrongUser.status}`);

const authGated = await worker.fetch(get(`${SITE}/api/auth`), gatedEnv);
check("gate: també cobreix /api/auth", authGated.status === 401, `status=${authGated.status}`);

const callbackGated = await worker.fetch(
  get(`${SITE}/api/auth/callback?code=abc&state=x`),
  gatedEnv
);
check("gate: també cobreix /api/auth/callback", callbackGated.status === 401, `status=${callbackGated.status}`);

// Sense gate configurat, /admin ha de continuar obert (no trencem res).
const openRes = await worker.fetch(get(`${SITE}/admin/`), env);
check("sense gate, admin continua obert", openRes.status === 200, `status=${openRes.status}`);

// ── 9. El lloc public continua intacte ──────────────────────────────────
const home = await worker.fetch(get(`${SITE}/obres`), env);
check("ruta publica segueix servint", home.status === 200, `status=${home.status}`);
check(
  "ruta publica no rep CSP de l'admin",
  !(home.headers.get("Content-Security-Policy") || "").includes("frame-ancestors")
);

// La canonicalització de la barra final ja existia abans dels nostres canvis.
const slash = await worker.fetch(get(`${SITE}/obres/`), env);
check(
  "rambla final continua redirigit (com abans)",
  slash.status === 301,
  `status=${slash.status}`
);

// ── Resum ───────────────────────────────────────────────────────────────
console.log(`\n  ${pass} passaven, ${fail} fallaven\n`);
if (fail) {
  console.log("  FALLADES:");
  for (const f of failures) console.log("   - " + f);
  process.exit(1);
}
console.log("  Tot correcte.\n");