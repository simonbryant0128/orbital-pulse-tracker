import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const { events: publishedEvents } = JSON.parse(
  await readFile(new URL("../content/events.json", import.meta.url), "utf8"),
);
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

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
  assert.match(html, /未來任務時間窗/);
  assert.match(html, /30 天內窗口/);
  assert.match(html, /公開里程碑/);
  assert.match(html, /待官方公告/);
  assert.match(html, /DETAIL PREVIEW/);
  assert.match(html, /點擊閱讀完整內容/);
  assert.match(html, /aria-haspopup="dialog"/);
  // The initial page intentionally paginates to the newest seven events.
  // Historical-event presence is checked separately, not against this page.
  const initialEvents = [...publishedEvents].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  ).slice(0, 7);
  assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, initialEvents.length);
  for (const event of initialEvents) {
    assert.ok(html.includes(escapeHtml(event.title)), `Missing initial title: ${event.id}`);
    assert.ok(html.includes(escapeHtml(event.summary)), `Missing initial summary: ${event.id}`);
    assert.ok(html.includes(escapeHtml(event.detail)), `Missing detail preview: ${event.id}`);
  }
  assert.match(html, /Flight 13 已入列/);
  assert.match(html, /Viasat/);
  assert.match(html, /Firefly Aerospace/);
  assert.match(html, /Voyager Technologies/);
  assert.match(html, /Iridium/);
  assert.match(html, /Planet Labs/);
  assert.match(html, /BlackSky/);
  assert.match(html, /Spire Global/);
  assert.match(html, /Globalstar/);
  assert.match(html, /Pelican 已入軌（含 TD2）/);
  assert.match(html, /Spire 2026 deployments/);
  assert.match(html, /每日 10:15 掃描/);
  assert.match(html, /近期事件流/);
  assert.match(html, /Starlink 15-24 發射成功，27 顆衛星完成部署/);
  assert.match(html, /單次任務的部署量/);
  assert.match(html, /2096621981328130462/);
  assert.doesNotMatch(html, /sx-starship-flight14-date-review-20260902/);
  assert.match(html, /開啟雲端主表/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("preserves older verified event details outside the initial page", () => {
  const cases = [
    ["rklb-electron-93-iqps-20260821", /575 公里低地球軌道/],
    ["vsat-addvalue-idrs-20260825", /延遲低於 2 秒/],
    ["bo-nasa-mars-telecom-20260901", /最高潛在價值約 7 億美元/],
    ["irdm-furuno-solion-100-20260901", /新造船專案則於 2027 年推出/],
    ["rklb-owl-around-world-success-20260902", /另有 16 次 Electron 任務已預訂/],
    ["rklb-emilia-3d-gimbal-20260819", /NASA EMILIA-3D/],
    ["fly-zeno-blue-ghost-20260819", /5W 鋂-241/],
  ];
  for (const [id, detail] of cases) {
    const event = publishedEvents.find((item) => item.id === id);
    assert.ok(event, `Historical event missing: ${id}`);
    assert.match(event.detail, detail);
  }
});
