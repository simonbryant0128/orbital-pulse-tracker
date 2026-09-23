import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
const batch = await readJson("pending/2026-09-23-approved.json");

test("September 23 approved events are integrated exactly once", async () => {
  const published = await readJson("events.json");
  assert.equal(batch.state, "approved-source-snapshot");
  assert.equal(batch.range, "A73:Q73; A86:Q87");
  assert.equal(batch.events.length, 3);
  assert.equal(new Set(batch.events.map((event) => event.id)).size, 3);
  for (const event of batch.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    assert.equal(event.checkedDate, "2026-09-23");
    const matches = published.events.filter((candidate) => candidate.id === event.id);
    assert.equal(matches.length, 1);
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], event[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), event.sources.map((source) => source.url));
  }
});

test("September 23 distinguishes target, airspace and completed deployment", async () => {
  const published = await readJson("events.json");
  const byId = (id) => published.events.find((event) => event.id === id);
  const starship = byId("sx-starship-flight14-spacex-window-review-20260916");
  assert.match(starship.detail, /SpaceX 任務目標窗口/);
  assert.match(starship.detail, /FAA 空域作業窗口/);
  assert.match(starship.detail, /尚未完成試飛/);
  const firefly = byId("fly-cleanroom-expansion-20260922");
  assert.match(firefly.detail, /最多 12 艘/);
  assert.match(firefly.detail, /不調整任何在軌／已部署總量/);
  const spire = byId("spir-noaa-gnssro-contract-20260922");
  assert.match(spire.detail, /尚未撥款/);
  assert.match(spire.detail, /不能把選項視為已確定收入/);
  assert.match(spire.detail, /部署總量不變/);
});

test("September 23 updates Starship schedule without changing deployment totals", async () => {
  const schedule = await readJson("schedule.json");
  const item = schedule.items.find((candidate) => candidate.id === "sx-starship-flight14-spacex-window-review-20260916");
  assert.equal(item.window, "台北 2026-09-28 20:15–21:30；FAA 空域窗口至 22:14");
  assert.equal(item.vehicle, "Starship／Super Heavy");
  assert.match(item.confidence, /尚未發射/);
  const constellations = await readJson("constellations.json");
  assert.equal(constellations.items.length, 7);
  assert.equal(publishedCount(await readJson("events.json")), 82);
});

function publishedCount(data) {
  return data.events.length;
}
