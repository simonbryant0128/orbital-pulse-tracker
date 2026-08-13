import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the orbital tracker product page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-Hant"/i);
  assert.match(html, /<title>軌道脈動｜火箭與低軌衛星追蹤<\/title>/i);
  assert.match(html, /ORBITAL PULSE/);
  assert.match(html, /低軌星系公開檢查點/);
  assert.match(html, /Flight 13 已入列/);
  assert.match(html, /Viasat/);
  assert.match(html, /Firefly Aerospace/);
  assert.match(html, /Voyager Technologies/);
  assert.match(html, /Iridium/);
  assert.match(html, /LC-36B/);
  assert.match(html, /近期事件流/);
  assert.match(html, /開啟雲端主表/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
