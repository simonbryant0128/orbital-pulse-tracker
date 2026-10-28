import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("October 28 publishes Starlink 15-16 and advances the next official mission", async () => {
  const [batch, events, schedule, constellations, companies, meta] = await Promise.all([
    readJson("pending/2026-10-28-approved.json"),
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.equal(meta.lastVerified, "2026-10-28");
  for (const data of [events, schedule, constellations, companies]) {
    assert.equal(data.lastVerified, meta.lastVerified);
  }
  assert.equal(events.events.length, 118);
  assert.equal(batch.events.length, 1);
  assert.equal(batch.manualReviewCount, 3);
  assert.equal(batch.events[0].reviewStatus, "自動查證");
  assert.equal(batch.events[0].publicationStatus, "待同步");
  assert.ok(batch.events[0].sources.every((source) => source.startsWith("https://www.spacex.com/")));

  const completed = events.events.find((event) => event.id === "sx-starlink-15-16-deployed-20261027");
  assert.equal(completed.status, "27 顆已部署／首節成功著陸");
  assert.match(completed.detail, /第 26 次飛行/);
  assert.ok(completed.sources.every((source) => source.type === "官方"));

  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-15-16-20261027"), false);
  const next = schedule.items.find((item) => item.id === "sx-starlink-window-20261030");
  assert.equal(next.mission, "Starlink 15-18（27 顆）");
  assert.match(next.window, /10\/30 12:02–16:02/);
  assert.equal(next.source, "https://www.spacex.com/launches/sl-15-18");

  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.equal(starlink.deployment.nextLaunchDate, "2026-10-30");
  assert.equal(starlink.deployment.nextSource, "https://www.spacex.com/launches/sl-15-18");
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  assert.match(companies.items.find((item) => item.id === "spacex").status, /Starlink 15-16 已發射並部署 27 顆/);
});
