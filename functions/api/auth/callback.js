export async function onRequest(context) {
  const { request, env } = context;
  const siteUrl = env.SITE_URL || 'https://adriansalcedo.com';
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth not configured.', { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  let redirectUri = `${siteUrl}/admin/`;
  if (stateParam) {
    try {
      const state = JSON.parse(stateParam);
      if (state.redirect_uri) redirectUri = state.redirect_uri;
    } catch (e) {}
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const data = await tokenRes.json();

  if (!data.access_token) {
    return new Response(`Failed to get token: ${data.error_description || data.error || 'unknown'}`, {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const html = `<!DOCTYPE html><html><body><script>
    (function() {
      try {
        window.opener.postMessage('authorization:${data.access_token}:${data.scope || ''}', '${redirectUri}');
      } catch(e) {}
      window.close();
    })();
  </script></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}
