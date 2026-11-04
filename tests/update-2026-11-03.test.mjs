import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("November 3 publishes Starlink 15-18 and advances the official schedule", async () => {
  const [batch, events, schedule, constellations, companies, meta] = await Promise.all([
    readJson("pending/2026-11-03-approved.json"),
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

  const completed = events.events.find((event) => event.id === "sx-starlink-15-18-deployed-20261030");
  assert.equal(completed.status, "27 顆已部署／首節成功著陸");
  assert.match(completed.detail, /第 18 次飛行/);
  assert.match(completed.detail, /11 月 6 日 10:21–14:21/);
  assert.ok(completed.sources.every((source) => source.type === "官方"));

  assert.ok(schedule.items.length >= 14);
  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-window-20261030"), false);
  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-date-20261105"), false);
  assert.equal(schedule.items.some((item) => item.id === "sx-ussf432-window-20261103"), false);
  assert.match(schedule.items.find((item) => item.id === "sx-starlink-window-20261106").window, /10:21–14:21/);

  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.equal(starlink.deployment.nextLaunchDate, "2026-11-06");
  assert.equal(starlink.deployment.nextSource, "https://www.spacex.com/launches");
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  assert.match(companies.items.find((item) => item.id === "spacex").status, /Starlink 15-18 已發射並部署 27 顆/);
});
