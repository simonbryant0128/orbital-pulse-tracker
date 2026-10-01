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
  assert.equal(published.events.length, 89);
});

test("September 30 invalidates only the old launch window and preserves deployment totals", async () => {
  const [schedule, constellations, companies] = await Promise.all([
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
  ]);
  const mission = schedule.items.find((item) => item.id === "sx-starlink-15-25-target-20260920");
  assert.equal(mission.bucket, "tbd");
  assert.match(mission.window, /原定 2026-09-30 窗口已失效/);
  assert.match(mission.confidence, /不推定取消或延後/);
  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.equal(starlink.deployment.nextLaunchDate, null);
  assert.equal(starlink.deployment.nextLaunchDisplay, "待官方公告");
  assert.match(starlink.deployment.nextStatus, /不推定取消或延後/);
  assert.equal(companies.items.find((item) => item.id === "spacex").status, "Starlink 15-25 原定 9/30 窗口失效；待新官方窗口");
});
