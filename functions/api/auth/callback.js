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

  const html = `<!DOCTYPE html>
<html><body>
<p id="status">Processing...</p>
<pre id="debug"></pre>
<script>
  const debug = document.getElementById('debug');
  const status = document.getElementById('status');

  if (window.opener) {
    status.textContent = 'opener found, sending postMessage...';
    try {
      window.opener.postMessage('authorization:${data.access_token}:${data.scope || ''}', '*');
      status.textContent = 'postMessage sent successfully. Closing...';
      setTimeout(function() {
        window.close();
      }, 1000);
    } catch(e) {
      status.textContent = 'postMessage error: ' + e.message;
      debug.textContent = e.stack || '';
    }
  } else {
    status.textContent = 'NO OPENER - direct browser access. Token received.';
    debug.textContent = 'Token starts with: ${data.access_token.substring(0, 10)}...';
  }
</script>
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}
