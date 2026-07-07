export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const origin = url.origin;

  try {
    const [premsaRes, siteRes] = await Promise.all([
      fetch(`${origin}/content/premsa.json`),
      fetch(`${origin}/content/site.json`),
    ]);

    if (!premsaRes.ok) {
      return new Response('Feed unavailable', { status: 404 });
    }

    const premsa = await premsaRes.json();
    const siteData = siteRes.ok ? await siteRes.json() : null;

    const articles = premsa.articles || [];
    const siteUrl = siteData?.site?.url || origin;
    const siteTitle = siteData?.site?.title || 'Adri\u00E1n Salcedo Toca';

    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));

    const items = sorted.map(a => `
  <item>
    <title><![CDATA[${a.title}]]></title>
    <link>${a.url || `${siteUrl}/premsa`}</link>
    <guid isPermaLink="${a.url ? 'true' : 'false'}">${a.url || `${siteUrl}/premsa#${a.id}`}</guid>
    <pubDate>${new Date(a.date).toUTCString()}</pubDate>
    <description><![CDATA[${a.title} — ${a.publication} (${a.type})]]></description>
    <source url="${siteUrl}">${siteTitle}</source>
  </item>`).join('');

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle} — Press</title>
    <link>${siteUrl}</link>
    <description>Press articles and media appearances</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(feed, {
      headers: {
        'Content-Type': 'application/rss+xml;charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(`Feed error: ${err.message}`, { status: 500 });
  }
}
