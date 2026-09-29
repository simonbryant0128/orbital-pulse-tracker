import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
const batch = await readJson("pending/2026-09-28-approved.json");

test("September 28 updates the existing USSF-385 event exactly once", async () => {
  const published = await readJson("events.json");
  assert.equal(batch.state, "approved-source-snapshot");
  assert.equal(batch.range, "A76:Q76");
  assert.equal(batch.events.length, 1);
  const approved = batch.events[0];
  assert.equal(approved.reviewStatus, "自動查證");
  assert.equal(approved.publicationStatus, "待同步");
  assert.equal(approved.checkedDate, "2026-09-28");
  const matches = published.events.filter((event) => event.id === approved.id);
  assert.equal(matches.length, 1);
  for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
    assert.equal(matches[0][key], approved[key]);
  }
  assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  assert.equal(published.events.length, 88);
});

test("September 28 removes completed USSF-385 from the future schedule without inventing deployment totals", async () => {
  const published = await readJson("events.json");
  const event = published.events.find((candidate) => candidate.id === "sx-ussf385-target-20260917");
  assert.equal(event.status, "已完成發射／載荷細節未公開");
  assert.match(event.detail, /Completed missions/);
  assert.match(event.detail, /不推定衛星部署數/);

  const schedule = await readJson("schedule.json");
  assert.equal(schedule.items.length, 14);
  assert.ok(!schedule.items.some((item) => item.id === event.id));

  const companies = await readJson("companies.json");
  const spacex = companies.items.find((company) => company.id === "spacex");
  assert.equal(spacex.status, "Flight 14 已列完成；部署結果待官方摘要");

  const constellations = await readJson("constellations.json");
  assert.equal(constellations.items.length, 7);
  assert.equal(constellations.lastVerified, "2026-09-29");
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-09-29"));
});
