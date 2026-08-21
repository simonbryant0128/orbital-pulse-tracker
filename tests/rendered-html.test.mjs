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
  assert.match(html, /<title>火箭衛星追蹤網<\/title>/i);
  assert.match(html, /火箭衛星[^<]*<span>追蹤網<\/span>/i);
  assert.match(html, /ORBITAL PULSE/);
  assert.match(html, /低軌星系公開檢查點/);
  assert.match(html, /衛星部署進度與下一班任務/);
  assert.match(html, /待官方公告/);
  assert.match(html, /DETAIL PREVIEW/);
  assert.match(html, /點擊閱讀完整內容/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /Electron 第 93 次任務成功部署 iQPS/);
  assert.match(html, /575 公里低地球軌道/);
  assert.match(html, /Rocket Lab Robotics 為 NASA EMILIA-3D/);
  assert.match(html, /Blue Ghost 將搭載 Zeno/);
  assert.match(html, /5W 鋂-241/);
  assert.match(html, /Flight 13 已入列/);
  assert.match(html, /Viasat/);
  assert.match(html, /Firefly Aerospace/);
  assert.match(html, /Voyager Technologies/);
  assert.match(html, /Iridium/);
  assert.match(html, /近期事件流/);
  assert.match(html, /開啟雲端主表/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
