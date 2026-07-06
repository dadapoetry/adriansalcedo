export async function onRequest(context) {
  const { request, env } = context;
  const siteUrl = env.SITE_URL || 'https://adriansalcedo.com';
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response('GitHub OAuth not configured. Set GITHUB_CLIENT_ID environment variable.', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri') || `${siteUrl}/admin/`;
  const nonce = Math.random().toString(36).slice(2);
  const state = JSON.stringify({ redirect_uri: redirectUri, nonce });

  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&state=${encodeURIComponent(state)}`;

  return Response.redirect(githubUrl, 302);
}
