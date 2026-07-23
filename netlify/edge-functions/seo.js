export default async (request, context) => {
  const url = new URL(request.url);

  const res = await context.next();
  const html = await res.text();

  const modified = html
    .replace(/<title>[^<]*<\/title>/, '<title>EDGE FUNCTION WORKS</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/, '$1Edge function test$2');

  const response = new Response(modified, {
    status: res.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
  response.headers.set("x-edge-seo", "active");
  return response;
};

export const config = { path: "/*" };
