export async function onRequest(context) {
  const { request, env } = context;
  const siteUrl = env.SITE_URL || 'https://adriansalcedo.pages.dev';
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri') || `${siteUrl}/admin/`;
  const callbackUrl = `${siteUrl}/api/auth/callback?redirect_uri=${encodeURIComponent(redirectUri)}`;

  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo,user&state=${Math.random().toString(36).slice(2)}`;

  return Response.redirect(githubUrl, 302);
}
