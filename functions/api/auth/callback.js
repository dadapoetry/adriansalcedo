export async function onRequest(context) {
  const { request, env } = context;
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET', { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code parameter', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!tokenRes.ok) {
    return new Response(`GitHub API status: ${tokenRes.status}`, { status: 502 });
  }

  const data = await tokenRes.json();

  if (!data.access_token) {
    return new Response(`GitHub error: ${data.error_description || data.error || 'unknown'}`, { status: 400 });
  }

  const tokenJson = JSON.stringify(data.access_token);
  const scopeJson = JSON.stringify(data.scope || 'repo');
  const fullScope = data.scope || 'repo';

  const html = `<!DOCTYPE html>
<html><body>
<h2>GitHub OAuth</h2>
<p>Token: ${data.access_token.substring(0, 15)}...</p>
<p>Scope: <strong>${fullScope}</strong></p>
<p id="status">Processing...</p>
<script>
try {
  if (window.opener) {
    var token = ${tokenJson};
    var scope = ${scopeJson};
    var user = JSON.stringify({ backendName: 'github', token: token, scope: scope });
    window.opener.localStorage.setItem('github-token', user);
    window.opener.localStorage.setItem('netlify-cms-user', user);
    document.getElementById('status').textContent = 'Token saved to opener localStorage. Reloading opener...';
    window.opener.location.reload();
    setTimeout(function() { window.close(); }, 2000);
  } else {
    document.getElementById('status').textContent = 'ERROR: no window.opener (direct access)';
  }
} catch(e) {
  document.getElementById('status').textContent = 'ERROR: ' + e.message;
}
</script>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}
