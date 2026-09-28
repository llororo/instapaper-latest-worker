import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const env = {
  ALLOWED_ORIGIN: "https://example.com",
  CACHE_TTL_SECONDS: "60",
  INSTAPAPER_USERNAME: "example-user"
};

test("devolve o favorito público máis recente", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response(JSON.stringify({
    bookmarks: [
      { liked: true, title: "Un artigo", url: "https://example.org/artigo" }
    ]
  }), { status: 200 });

  const request = new Request("https://worker.example/", {
    headers: { Origin: "https://example.com" }
  });
  const response = await worker.fetch(request, env);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    title: "Un artigo",
    articleUrl: "https://example.org/artigo",
    profileUrl: "https://www.instapaper.com/p/example-user"
  });
});

test("bloquea as orixes non autorizadas", async () => {
  const request = new Request("https://worker.example/", {
    headers: { Origin: "https://outro.example" }
  });
  const response = await worker.fetch(request, env);

  assert.equal(response.status, 403);
});

test("responde ás solicitudes CORS previas", async () => {
  const request = new Request("https://worker.example/", {
    method: "OPTIONS",
    headers: { Origin: "https://example.com" }
  });
  const response = await worker.fetch(request, env);

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS");
});
