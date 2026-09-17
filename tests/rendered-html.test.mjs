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
  assert.match(html, /Flight 14 規劃窗口/);
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
  assert.ok(publishedEvents.some((event) => event.title.includes("IMM Apex 太空太陽能電池量產")));
  assert.ok(publishedEvents.some((event) => event.title === "NexusWave 取得 Bureau Veritas 資安型式認可"));
  assert.match(html, /FAA 規劃窗口／非最終升空承諾/);
  assert.match(html, /台北 9\/22 20:15–22:14/);
  assert.match(html, /開啟雲端主表/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("publishes September 14 verified updates without pending Starlink timing", async () => {
  const starship = publishedEvents.find((e) => e.id === "sx-starship-flight14-faa-window-20260913");
  const electron = publishedEvents.find((e) => e.id === "rklb-happily-ever-faster-20260911");
  const mpower = publishedEvents.find((e) => e.id === "sx-o3b-mpower-deployment-20260914");
  const ussf = publishedEvents.find((e) => e.id === "sx-ussf259-target-20260914");
  assert.match(starship.status, /尚未發射/);
  assert.match(starship.detail, /不是 SpaceX 最終升空承諾/);
  assert.match(starship.sources[0].url, /adv_date=09132026&advn=158$/);
  assert.match(electron.detail, /客戶與衛星名稱未公開/);
  assert.match(electron.detail, /不歸入任何具名星座總數/);
  assert.match(mpower.detail, /中軌 MEO/);
  assert.match(mpower.detail, /不增加低軌/);
  assert.match(ussf.status, /尚未發射/);
  assert.ok(!publishedEvents.some((e) => e.id === "sx-starlink-15-27-faa-window-20260913"));
  const schedule = JSON.parse(await readFile(new URL("../content/schedule.json", import.meta.url), "utf8"));
  assert.ok(!schedule.items.some((item) => item.id === "sx-mpower-f-faa-window-20260908"));
  assert.ok(publishedEvents.some((e) => e.id === "sx-mpower-f-faa-window-20260908"), "retain historical planning event");
  const html = await (await render()).text();
  assert.doesNotMatch(html, /sx-starlink-15-27-faa-window-20260913/);
  assert.doesNotMatch(html, /Flight 13 已入列/);
});

test("publishes September 15 updates with history and deployment definitions intact", async () => {
  const byId = (id) => publishedEvents.find((event) => event.id === id);
  const current = byId("sx-starship-flight14-faa-window-20260915");
  const prior = byId("sx-starship-flight14-faa-window-20260913");
  assert.match(current.detail, /9\/22 12:15–14:14 UTC/);
  assert.match(current.detail, /不是 SpaceX 最終升空承諾/);
  assert.match(prior.detail, /9\/18 12:15–14:14 UTC/);
  assert.match(byId("bo-afrl-propulsion-partnership-20260914").detail, /沒有提供新引擎首飛日/);
  assert.match(byId("voyg-avio-ifd-qd-delivery-20260914").detail, /不是火箭已發射/);
  assert.match(byId("bksy-gen3-fifth-firstlight-20260914").detail, /首光不等於五顆均已完成商轉/);
  assert.ok(!byId("vsat-equatys-binding-agreement-review-20260914"));
  const { items } = JSON.parse(await readFile(new URL("../content/constellations.json", import.meta.url), "utf8"));
  const blacksky = items.find((item) => item.id === "blacksky-gen3");
  assert.equal(blacksky.current, 5);
  assert.equal(blacksky.breakdown.reduce((total, row) => total + row.value, 0), 5);
  assert.match(blacksky.metric, /非均已商轉/);
  assert.equal(blacksky.deployment.nextLaunchDate, null);
  assert.equal(blacksky.deployment.nextLaunchDisplay, "2026 年底前（未定日）");
  const schedule = JSON.parse(await readFile(new URL("../content/schedule.json", import.meta.url), "utf8"));
  assert.ok(!schedule.items.some((item) => item.id === prior.id || item.id === "blacksky-gen3-q3"));
  assert.ok(schedule.items.some((item) => item.id === current.id));
  const html = await (await render()).text();
  assert.match(html, /台北 9\/22 20:15–22:14/);
  assert.doesNotMatch(html, /vsat-equatys-binding-agreement-review-20260914/);
});

test("publishes September 16 schedule changes without guessing mission identities", async () => {
  const byId = (id) => publishedEvents.find((event) => event.id === id);
  const ussf = byId("sx-ussf259-target-update-20260916");
  const r3 = byId("sx-r3-faa-window-20260915");
  assert.match(ussf.detail, /台北 9\/17 09:00–13:00/);
  assert.match(ussf.detail, /頁面未標示公告時間，事件日採本次查核日/);
  assert.match(ussf.detail, /不將 FAA 的 TH-1 代號自行視為同一任務/);
  assert.ok(byId("sx-ussf259-target-20260914"), "retain prior target history");
  assert.match(r3.detail, /台北 19:28–23:11/);
  assert.match(r3.detail, /不計入衛星部署總量/);
  assert.ok(!byId("sx-starship-flight14-spacex-window-review-20260916"));
  const { items } = JSON.parse(await readFile(new URL("../content/schedule.json", import.meta.url), "utf8"));
  assert.ok(!items.some((item) => item.id === "sx-ussf259-target-20260914"));
  assert.ok(!items.some((item) => item.id === ussf.id || item.id === r3.id), "superseded targets stay in history, not upcoming missions");
  const html = await (await render()).text();
  assert.doesNotMatch(html, /Starship Flight 14 出現在 SpaceX 任務清單，窗口差異待確認/);
});

test("publishes September 17 updates without inventing deployment totals or mission mappings", async () => {
  const byId = (id) => publishedEvents.find((event) => event.id === id);
  const launch = byId("sx-ussf259-launch-20260917");
  const r3 = byId("sx-r3-faa-window-update-20260917");
  const target = byId("sx-ussf385-target-20260917");
  const viasat = byId("vsat-pgz-satcom-loi-20260916");
  const planet = byId("pl-german-federal-constellation-contract-20260915");
  assert.equal(launch.date, "2026-09-17");
  assert.match(launch.detail, /台北 9 月 17 日 09:07/);
  assert.match(launch.detail, /未公布載荷顆數/);
  assert.match(launch.detail, /不增加任何星座部署總量/);
  assert.match(r3.detail, /9\/26 11:56–15:39 UTC/);
  assert.match(r3.detail, /不僅憑相近時刻將 R-3 與 USSF-385 合併/);
  assert.match(r3.sources[0].url, /adv_date=09172026&advn=29$/);
  assert.match(target.detail, /台北 9\/27 20:49/);
  assert.match(target.detail, /未另列備援結束時間/);
  assert.match(viasat.detail, /不等於正式衛星採購/);
  assert.match(planet.detail, /五年最高潛在價值為 2,500 萬歐元/);
  assert.match(planet.detail, /不列為過去 24 小時新發生事件/);
  const { items } = JSON.parse(await readFile(new URL("../content/schedule.json", import.meta.url), "utf8"));
  for (const id of ["sx-ussf259-target-update-20260916", "sx-th1-faa-window-20260909", "sx-r3-faa-window-20260915"]) {
    assert.ok(byId(id), `retain historical event ${id}`);
    assert.ok(!items.some((item) => item.id === id), `remove expired/superseded upcoming entry ${id}`);
  }
  assert.match(items.find((item) => item.id === r3.id).window, /9\/26 19:56–23:39/);
  assert.match(items.find((item) => item.id === target.id).window, /9\/27 20:49 起/);
  for (const id of ["sx-starlink-15-27-faa-window-20260913", "vsat-equatys-binding-agreement-review-20260914", "sx-starship-flight14-spacex-window-review-20260916"]) {
    assert.ok(!byId(id), `pending event must not be published: ${id}`);
  }
  const html = await (await render()).text();
  for (const event of [launch, r3, target, viasat, planet]) {
    assert.ok(html.includes(escapeHtml(event.title)), `new event visible: ${event.id}`);
  }
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

test("distinguishes September 10 launches, messaging trials and retrospective disclosures", () => {
  const launch = publishedEvents.find((e) => e.id === "sx-ussf153-launch-20260910");
  const iridium = publishedEvents.find((e) => e.id === "irdm-ntn-direct-toyota-demo-20260910");
  const viasat = publishedEvents.find((e) => e.id === "vsat-pcc6-satcom-demo-20260910");
  assert.match(launch.detail, /台北同日 23:42/);
  assert.match(launch.detail, /不增加 Starlink 或其他星座部署總量/);
  assert.match(iridium.detail, /不代表一般手機即時通話已全面商用/);
  assert.match(iridium.status, /Q4 2026/);
  assert.match(viasat.detail, /演習在當年夏季/);
  assert.match(viasat.detail, /TRL 6 是去年達成/);
  // These historical records may be beyond the initial seven-card page.
  // The product-page test checks the actual current first page separately.
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

test("keeps September 9 plans and consortium scale separate from deployed totals", () => {
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
  // Retain the historical content checks without assuming first-page presence.
});
