import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("October 4 publishes the verified NROL-97 completion exactly once", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-10-04-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.events.length, 1);
  const approved = batch.events[0];
  assert.equal(approved.reviewStatus, "自動查證");
  assert.equal(approved.publicationStatus, "待同步");
  assert.equal(approved.checkedDate, "2026-10-04");
  const matches = published.events.filter((event) => event.id === approved.id);
  assert.equal(matches.length, 1);
  for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
    assert.equal(matches[0][key], approved[key]);
  }
  assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  assert.equal(published.events.length, 90);
});

test("October 4 preserves deployment totals and records the Falcon Heavy recovery facts", async () => {
  const [published, schedule, constellations, companies, meta] = await Promise.all([
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);
  const event = published.events.find((item) => item.id === "sx-nrol97-falcon-heavy-20261002");
  assert.match(event.detail, /LZ-1 與 LZ-2/);
  assert.match(event.detail, /中央核心採耗盡/);
  assert.match(event.detail, /不推算衛星部署總量/);
  assert.ok(event.sources.every((source) => new URL(source.url).hostname === "www.spacex.com"));
  assert.equal(schedule.items.length, 13);
  assert.equal(schedule.lastVerified, "2026-10-04");
  assert.equal(constellations.items.length, 7);
  assert.equal(constellations.lastVerified, "2026-10-04");
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-10-04"));
  assert.match(companies.items.find((item) => item.id === "spacex").status, /NROL-97/);
  assert.equal(companies.lastVerified, "2026-10-04");
  assert.equal(meta.lastVerified, "2026-10-04");
});
