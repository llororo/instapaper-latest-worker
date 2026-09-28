const DEFAULT_CACHE_TTL = 60;
const MAX_CACHE_TTL = 3600;

function json(body, status, origin, cacheControl = "no-store, max-age=0") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Accept",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": cacheControl,
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function allowedOrigin(request, configuredOrigin) {
  const origin = request.headers.get("Origin") || "";

  if (configuredOrigin === "*") return "*";
  if (origin && origin === configuredOrigin) return origin;
  return null;
}

function cacheTtl(value) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_CACHE_TTL;
  return Math.min(Math.max(parsed, 0), MAX_CACHE_TTL);
}

function forbidden() {
  return new Response(JSON.stringify({ error: "Orixe non autorizada" }), {
    status: 403,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env.ALLOWED_ORIGIN);
    if (!origin) return forbidden();

    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname !== "/instapaper-latest") {
      return json({ error: "Ruta non atopada" }, 404, origin);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Headers": "Accept",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "no-store, max-age=0",
          "Vary": "Origin"
        }
      });
    }

    if (request.method !== "GET") {
      return json({ error: "Método non permitido" }, 405, origin);
    }

    const username = (env.INSTAPAPER_USERNAME || "").trim();
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return json({ error: "Configuración de Instapaper incorrecta" }, 500, origin);
    }

    const ttl = cacheTtl(env.CACHE_TTL_SECONDS);
    const apiUrl = `https://www.instapaper.com/data/profile/${encodeURIComponent(username)}?page=1`;

    try {
      const response = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
        cf: { cacheEverything: true, cacheTtl: ttl }
      });

      if (!response.ok) {
        return json({ error: "Non se puido consultar Instapaper" }, 502, origin);
      }

      const data = await response.json();
      const bookmark = Array.isArray(data.bookmarks)
        ? data.bookmarks.find((item) => item?.liked === true && item?.title && item?.url)
        : null;

      if (!bookmark) {
        return json({ error: "Non hai favoritos públicos dispoñibles" }, 404, origin);
      }

      return json(
        {
          title: bookmark.title,
          articleUrl: bookmark.url,
          profileUrl: `https://www.instapaper.com/p/${encodeURIComponent(username)}`
        },
        200,
        origin,
        `public, max-age=${ttl}, stale-while-revalidate=${Math.max(ttl * 5, ttl)}`
      );
    } catch {
      return json({ error: "Non se puido consultar Instapaper" }, 502, origin);
    }
  }
};
