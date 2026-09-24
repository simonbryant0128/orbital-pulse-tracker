import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
const batch = await readJson("pending/2026-09-24-approved.json");

test("September 24 approved events are integrated exactly once", async () => {
  const published = await readJson("events.json");
  assert.equal(batch.state, "approved-source-snapshot");
  assert.equal(batch.range, "A88:Q91");
  assert.equal(batch.events.length, 4);
  assert.equal(new Set(batch.events.map((event) => event.id)).size, 4);
  for (const event of batch.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    assert.equal(event.checkedDate, "2026-09-24");
    const matches = published.events.filter((candidate) => candidate.id === event.id);
    assert.equal(matches.length, 1);
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], event[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), event.sources.map((source) => source.url));
  }
  assert.equal(published.events.length, 86);
});

test("September 24 distinguishes launch targets from regulator windows", async () => {
  const published = await readJson("events.json");
  const byId = (id) => published.events.find((event) => event.id === id);
  const crew = byId("sx-crew13-faa-window-20260924");
  assert.match(crew.detail, /23:10/);
  assert.match(crew.detail, /FAA.*空域窗口/);
  assert.match(crew.detail, /尚未發射/);
  const transporter = byId("sx-transporter18-faa-window-20260924");
  assert.match(transporter.detail, /未取得 SpaceX 對應任務頁/);
  assert.match(transporter.detail, /不推定衛星名稱、顆數或星座歸屬/);
  const r3 = byId("sx-r3-faa-backup-revision-20260924");
  assert.match(r3.detail, /備援起點延後 1 小時/);
  assert.match(r3.detail, /不把它自行合併到 USSF-385/);
});

test("September 24 keeps contract ceilings and deployment totals explicit", async () => {
  const published = await readJson("events.json");
  const viasat = published.events.find((event) => event.id === "vsat-usmc-mecs2-task-order-20260923");
  assert.match(viasat.detail, /首筆 4,200 萬美元/);
  assert.match(viasat.detail, /最高上限，不代表已確定全額收入/);
  assert.match(viasat.detail, /部署總量不變/);
  const constellations = await readJson("constellations.json");
  assert.equal(constellations.items.length, 7);
  const schedule = await readJson("schedule.json");
  assert.equal(schedule.items.length, 16);
  assert.equal(schedule.items.find((item) => item.id === "sx-r3-faa-backup-revision-20260924").window, "台北 9/26 19:56–23:39；備援 9/27 20:49–23:25");
  assert.ok(schedule.items.some((item) => item.id === "sx-crew13-faa-window-20260924"));
  assert.ok(schedule.items.some((item) => item.id === "sx-transporter18-faa-window-20260924"));
  assert.ok(!schedule.items.some((item) => item.id === "sx-r3-faa-window-update-20260917"));
});
