export async function onRequest(context) {
  const { request } = context;
  const origin = new URL(request.url).origin;

  try {
    const res = await fetch('https://ag0.surge.sh/articles.json');

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch AG0 articles' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const articles = await res.json();
    const baseUrl = 'https://ag0.surge.sh';

    const feed = articles.map(a => ({
      id: a.id,
      title: a.title,
      author: a.author,
      subtitle: a.subtitle,
      image: a.image,
      url: `${baseUrl}/?entry=${a.id}`,
      date: a.date || null,
    }));

    return new Response(JSON.stringify(feed, null, 2), {
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
