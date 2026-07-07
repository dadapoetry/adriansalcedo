export async function onRequest(context) {
  const { request } = context;
  const origin = new URL(request.url).origin;

  try {
    const res = await fetch('https://dadapoetry.cat');
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch Dada Poetry' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await res.text();
    const objects = [];
    const itemRegex = /<li>[\s\S]*?\[(\d+)\][\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?—\s*([\d-]+)/g;
    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      objects.push({
        id: match[1],
        title: match[3].trim(),
        url: `https://dadapoetry.cat${match[2]}`,
        date: match[4].trim(),
      });
    }

    return new Response(JSON.stringify(objects, null, 2), {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': origin,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
