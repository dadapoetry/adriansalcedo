export async function onRequest(context) {
  const { request, env } = context;
  const siteUrl = env.SITE_URL || 'https://adriansalcedo.com';
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET env vars', { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code parameter received', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!tokenRes.ok) {
    return new Response(`GitHub API returned ${tokenRes.status}`, { status: 502 });
  }

  const data = await tokenRes.json();

  if (!data.access_token) {
    return new Response(`GitHub error: ${data.error_description || data.error || 'no token returned'}`, { status: 400 });
  }

  const html = `<!DOCTYPE html><html><body><script>
    (function() {
      try {
        window.opener.postMessage('authorization:${data.access_token}:${data.scope || ''}', '${siteUrl}');
      } catch(e) { document.body.textContent = 'postMessage failed: ' + e.message; }
      window.close();
    })();
  </script><p>Authorized. This window should close automatically.</p></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}
