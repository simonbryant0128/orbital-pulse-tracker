import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
const batch = await readJson("pending/2026-09-22-approved.json");

test("September 22 approved events are integrated exactly once", async () => {
  const published = await readJson("events.json");
  assert.equal(batch.state, "approved-source-snapshot");
  assert.equal(batch.range, "A83:Q85");
  assert.equal(batch.events.length, 3);
  assert.equal(new Set(batch.events.map((event) => event.id)).size, 3);
  for (const event of batch.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    assert.equal(event.checkedDate, "2026-09-22");
    const matches = published.events.filter((candidate) => candidate.id === event.id);
    assert.equal(matches.length, 1);
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], event[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), event.sources.map((source) => source.url));
  }
});

test("September 22 schedule preserves official precision and deployment caveats", async () => {
  const events = await readJson("events.json");
  const schedule = await readJson("schedule.json");
  const electron = schedule.items.find((item) => item.id === "rklb-owlright-target-20260922");
  assert.equal(electron.window, "台北 2026-09-26 08:15（NET）");
  assert.equal(electron.vehicle, "Electron");
  assert.match(events.events.find((event) => event.id === electron.id).detail, /不計入已部署總量/);
  assert.match(events.events.find((event) => event.id === electron.id).detail, /不自行推定為第 97 次/);
  const nel = schedule.items.find((item) => item.id === "voyg-nrep-nel-transition-20260921");
  assert.equal(nel.window, "2026 年 12 月（未定日）");
  assert.equal(nel.vehicle, "待官方公告");
  assert.match(nel.confidence, /日期與載具未公布/);
  const globalstar = events.events.find((event) => event.id === "gsat-nemea-ground-station-expansion-20260921");
  assert.match(globalstar.detail, /不調整在軌或已部署衛星數/);
});

test("September 22 publication keeps manual-review records out of the website", async () => {
  const published = await readJson("events.json");
  for (const id of [
    "sx-starlink-15-27-faa-window-20260913",
    "vsat-equatys-binding-agreement-review-20260914",
  ]) {
    assert.ok(!published.events.some((event) => event.id === id));
  }
  assert.equal(published.events.length, 82);
});
