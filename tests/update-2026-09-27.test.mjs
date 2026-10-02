import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
const batch = await readJson("pending/2026-09-27-approved.json");

test("September 27 approved Rocket Lab lifecycle update is integrated exactly once", async () => {
  const published = await readJson("events.json");
  assert.equal(batch.state, "approved-source-snapshot");
  assert.equal(batch.range, "A83:Q83");
  assert.equal(batch.events.length, 1);
  const approved = batch.events[0];
  assert.equal(approved.reviewStatus, "自動查證");
  assert.equal(approved.publicationStatus, "待同步");
  assert.equal(approved.checkedDate, "2026-09-27");
  const matches = published.events.filter((event) => event.id === approved.id);
  assert.equal(matches.length, 1);
  for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
    assert.equal(matches[0][key], approved[key]);
  }
  assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  assert.equal(published.events.length, 89);
});

test("September 27 closes the completed schedule without overstating constellation totals", async () => {
  const published = await readJson("events.json");
  const event = published.events.find((candidate) => candidate.id === "rklb-owlright-target-20260922");
  assert.equal(event.status, "成功部署");
  assert.match(event.detail, /2026 年 9 月 26 日 00:39 UTC/);
  assert.match(event.detail, /第 13 顆 StriX/);
  assert.match(event.detail, /第 97 次 Electron 發射/);
  assert.match(event.detail, /第 96 次 overall launch/);
  assert.match(event.detail, /不加入既有七組星系總量/);

  const schedule = await readJson("schedule.json");
  assert.equal(schedule.items.length, 13);
  assert.ok(!schedule.items.some((item) => item.id === event.id));

  const companies = await readJson("companies.json");
  const rocketLab = companies.items.find((company) => company.id === "rocket-lab");
  assert.equal(rocketLab.status, "Electron 成功部署第 13 顆 StriX");
  assert.match(rocketLab.source, /97th-electron-mission$/);

  const constellations = await readJson("constellations.json");
  assert.equal(constellations.items.length, 7);
  assert.equal(constellations.lastVerified, "2026-10-02");
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-10-02"));
});
