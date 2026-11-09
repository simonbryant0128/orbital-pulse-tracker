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

  assert.ok(meta.lastVerified >= "2026-11-03");
  for (const data of [events, schedule, constellations, companies]) {
    assert.equal(data.lastVerified, meta.lastVerified);
  }
  assert.ok(events.events.length >= 119);
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
  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-window-20261030"), false);
  const next = schedule.items.find((item) => item.id === "sx-starship-flight15-20261114");
  assert.match(next.mission, /Flight 15/);
  assert.match(next.window, /11-14 06:45–08:00/);
  assert.equal(next.source, "https://www.spacex.com/launches/starship-flight-15");

  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.equal(starlink.deployment.nextLaunchDate, "2026-11-14");
  assert.equal(starlink.deployment.nextSource, "https://www.spacex.com/launches/starship-flight-15");
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  assert.match(companies.items.find((item) => item.id === "spacex").status, /Flight 15/);
});
