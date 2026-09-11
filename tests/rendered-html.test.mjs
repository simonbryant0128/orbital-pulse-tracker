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
  const starlink = publishedEvents.find((event) => event.id === "sx-starlink-15-24-deployed-20260906");
  assert.match(starlink.title, /Starlink 15-24 發射成功，27 顆衛星完成部署/);
  assert.match(starlink.detail, /單次任務的部署量/);
  assert.match(html, /2096621981328130462/);
  assert.doesNotMatch(html, /sx-starship-flight14-date-review-20260902/);
  assert.match(html, /IMM Apex 太空太陽能電池量產/);
  assert.ok(publishedEvents.some((event) => event.title === "NexusWave 取得 Bureau Veritas 資安型式認可"));
  assert.match(html, /FAA 規劃窗口／非最終升空承諾/);
  assert.match(html, /台北 9\/14 02:40–05:10/);
  assert.match(html, /開啟雲端主表/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps September 8 milestones separate from completed satellite deployments", () => {
  const solar = publishedEvents.find((e) => e.id === "rklb-imm-apex-production-20260908");
  const approval = publishedEvents.find((e) => e.id === "vsat-nexuswave-bv-approval-20260908");
  const plan = publishedEvents.find((e) => e.id === "sx-mpower-f-faa-window-20260908");
  assert.match(solar.detail, /不是整艘衛星的重量降幅/);
  assert.match(approval.detail, /不是新衛星發射或部署/);
  assert.match(plan.status, /尚未發射/);
  assert.match(plan.detail, /不調增部署總數/);
  assert.match(approval.title, /NexusWave 取得 Bureau Veritas 資安型式認可/);
  assert.match(plan.sources[0].url, /adv_date=09082026&advn=84$/);
});

test("distinguishes September 10 launches, messaging trials and retrospective disclosures", async () => {
  const launch = publishedEvents.find((e) => e.id === "sx-ussf153-launch-20260910");
  const iridium = publishedEvents.find((e) => e.id === "irdm-ntn-direct-toyota-demo-20260910");
  const viasat = publishedEvents.find((e) => e.id === "vsat-pcc6-satcom-demo-20260910");
  assert.match(launch.detail, /台北同日 23:42/);
  assert.match(launch.detail, /不增加 Starlink 或其他星座部署總量/);
  assert.match(iridium.detail, /不代表一般手機即時通話已全面商用/);
  assert.match(iridium.status, /Q4 2026/);
  assert.match(viasat.detail, /演習在當年夏季/);
  assert.match(viasat.detail, /TRL 6 是去年達成/);
  const html = await (await render()).text();
  for (const event of [launch, iridium, viasat]) {
    assert.ok(html.includes(escapeHtml(event.title)), event.id);
    assert.ok(html.includes(escapeHtml(event.detail)), event.id);
  }
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

test("keeps September 9 plans and consortium scale separate from deployed totals", async () => {
  const firefly = publishedEvents.find((e) => e.id === "fly-ssc-two-alpha-launches-20260909");
  const blacksky = publishedEvents.find((e) => e.id === "bksy-ai-constellation-partnership-20260909");
  const th1 = publishedEvents.find((e) => e.id === "sx-th1-faa-window-20260909");
  assert.match(firefly.status, /NET 2028/);
  assert.match(firefly.detail, /不是已完成發射或衛星部署/);
  assert.match(blacksky.detail, /50 顆不是 BlackSky 的供應顆數/);
  assert.match(blacksky.detail, /10 億美元也不是已授予 BlackSky 的合約金額/);
  assert.match(th1.status, /尚未發射/);
  assert.match(th1.detail, /台北同日 09:00–13:43/);
  assert.match(th1.sources[0].url, /adv_date=09092026&advn=85$/);
  const html = await (await render()).text();
  for (const event of [firefly, blacksky, th1]) {
    assert.ok(html.includes(escapeHtml(event.title)));
  }
});
