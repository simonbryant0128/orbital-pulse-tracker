import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("October 2 advances two SpaceX lifecycle events without duplicate IDs", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-10-02-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.events.length, 2);
  assert.equal(new Set(batch.events.map((event) => event.id)).size, 2);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-02");
    const matches = published.events.filter((event) => event.id === approved.id);
    assert.equal(matches.length, 1);
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], approved[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  }
  assert.ok(published.events.length >= 89);
});

test("October 2 closes completed missions and preserves deployment accounting", async () => {
  const [published, schedule, constellations, companies, meta] = await Promise.all([
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);
  const crew = published.events.find((event) => event.id === "sx-crew13-faa-window-20260924");
  assert.equal(crew.status, "已發射並完成對接／7 小時 55 分");
  assert.match(crew.detail, /Harmony/);
  assert.match(crew.detail, /最快紀錄/);
  const transporter = published.events.find((event) => event.id === "sx-transporter18-faa-window-20260924");
  assert.match(transporter.detail, /ASCENT/);
  assert.match(transporter.detail, /不把 130 項載荷整批計入/);
  assert.equal(schedule.items.length, 13);
  assert.ok(!schedule.items.some((item) => item.id === crew.id || item.id === transporter.id));
  assert.equal(constellations.items.length, 7);
  assert.ok(constellations.lastVerified >= "2026-10-02");
  assert.ok(constellations.items.every((item) => item.lastChecked >= "2026-10-02"));
  const spacex = companies.items.find((item) => item.id === "spacex");
  assert.ok(spacex.status);
  assert.match(spacex.source, /^https:\/\//);
  assert.ok(meta.lastVerified >= "2026-10-02");
});
