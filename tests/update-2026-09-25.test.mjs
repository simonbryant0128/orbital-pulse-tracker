import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
const batch = await readJson("pending/2026-09-25-approved.json");

test("September 25 approved events are integrated exactly once", async () => {
  const published = await readJson("events.json");
  assert.equal(batch.state, "approved-source-snapshot");
  assert.equal(batch.range, "A92:Q93");
  assert.equal(batch.events.length, 2);
  assert.equal(new Set(batch.events.map((event) => event.id)).size, 2);
  for (const event of batch.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    assert.equal(event.checkedDate, "2026-09-25");
    const matches = published.events.filter((candidate) => candidate.id === event.id);
    assert.equal(matches.length, 1);
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], event[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), event.sources.map((source) => source.url));
  }
  assert.equal(published.events.length, 88);
});

test("September 25 keeps approvals, windows, and deployment scope explicit", async () => {
  const published = await readJson("events.json");
  const iridium = published.events.find((event) => event.id === "irdm-rklb-shareholder-approval-20260924");
  assert.match(iridium.detail, /99\.6%/);
  assert.match(iridium.detail, /81\.0%/);
  assert.match(iridium.detail, /仍須取得剩餘監管核准/);
  assert.match(iridium.detail, /不調整部署總量/);

  const voyager = published.events.find((event) => event.id === "voyg-exobiosphere-ohts-iss-campaigns-20260924");
  assert.match(voyager.detail, /2027 年 4 月/);
  assert.match(voyager.detail, /2027 年 6 月/);
  assert.match(voyager.detail, /2027 年 8 至 9 月/);
  assert.match(voyager.detail, /不計入衛星星系部署總量/);

  const constellations = await readJson("constellations.json");
  assert.equal(constellations.items.length, 7);
  assert.equal(constellations.lastVerified, "2026-09-25");
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-09-25"));

  const schedule = await readJson("schedule.json");
  assert.equal(schedule.items.length, 17);
  assert.ok(schedule.items.some((item) => item.id === "voyg-exobiosphere-ohts-iss-campaigns-20260924"));
});
