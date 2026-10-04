const ALLOWED_HOSTS = new Set([
  "cdn.cloudflare.steamstatic.com",
  "cdn.akamai.steamstatic.com",
  "avatars.steamstatic.com",
]);

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return new Response("Нужен адрес картинки.", { status: 400 });
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Адрес картинки не разобран.", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Этот адрес для карточки не разрешён.", { status: 400 });
  }
  const upstream = await fetch(target, { next: { revalidate: 86_400 } });
  if (!upstream.ok) return new Response("Картинка не открылась.", { status: 502 });
  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return new Response("Ответ не картинка.", { status: 400 });
  const bytes = await upstream.arrayBuffer();
  return new Response(bytes, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400",
    },
  });
}
