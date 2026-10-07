import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("September 30 advances Starlink 15-25 without creating a duplicate event", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-09-30-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.range, "A81:Q81");
  assert.equal(batch.events.length, 1);
  const approved = batch.events[0];
  const matches = published.events.filter((event) => event.id === approved.id);
  assert.equal(matches.length, 1);
  for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
    assert.equal(matches[0][key], approved[key]);
  }
  assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  assert.ok(published.events.length >= 89);
});

test("September 30 invalidates only the old launch window and preserves deployment totals", async () => {
  const [schedule, constellations, companies] = await Promise.all([
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
  ]);
  assert.ok(!schedule.items.some((item) => item.id === "sx-starlink-15-25-target-20260920"));
  const mission = schedule.items.find((item) => item.id === "sx-starlink-next-window-20261007");
  assert.equal(mission.bucket, "30d");
  assert.match(mission.window, /10\/11 07:00–11:00/);
  assert.match(mission.confidence, /精確升空時刻未定/);
  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.equal(starlink.deployment.nextLaunchDate, "2026-10-11");
  assert.match(starlink.deployment.nextLaunchDisplay, /07:00–11:00/);
  assert.match(starlink.deployment.nextStatus, /衛星顆數未公開/);
  const spacex = companies.items.find((item) => item.id === "spacex");
  assert.ok(spacex.status);
  assert.match(spacex.source, /^https:\/\//);
});
