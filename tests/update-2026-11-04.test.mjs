import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("November 4 publishes Electron flight 99 and advances the official iQPS schedule", async () => {
  const [batch, events, schedule, constellations, companies, meta] = await Promise.all([
    readJson("pending/2026-11-04-approved.json"),
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.ok(meta.lastVerified >= "2026-11-09");
  for (const data of [events, schedule, constellations, companies]) {
    assert.equal(data.lastVerified, meta.lastVerified);
  }
  assert.ok(events.events.length >= 128);
  assert.equal(batch.events.length, 1);
  assert.equal(batch.manualReviewCount, 3);
  assert.equal(batch.events[0].reviewStatus, "自動查證");
  assert.equal(batch.events[0].publicationStatus, "待同步");

  const completed = events.events.find((event) => event.id === "rklb-sea-god-surveys-success-20261103");
  assert.equal(completed.status, "1 顆成功部署至 575 公里 LEO");
  assert.match(completed.detail, /第 99 次 Electron/);
  assert.match(completed.detail, /第 100 次 Electron/);
  assert.ok(completed.sources.every((source) => source.type === "官方"));
  assert.ok(completed.sources.every((source) => source.url.startsWith("https://")));

  assert.ok(schedule.items.length >= 16);
  for (const id of ["sx-ussf432-window-20261103", "rklb-sea-god-surveys-20261104", "rklb-mountain-god-rises-20261110"]) {
    assert.equal(schedule.items.some((item) => item.id === id), false);
  }
  const next = schedule.items.find((item) => item.id === "rklb-mountain-god-rises-20261114");
  assert.match(next.window, /2026-11-14/);
  assert.match(next.confidence, /時刻 TBD/);

  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.deployment.nextLaunchDate, "2026-11-14");
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  assert.match(companies.items.find((item) => item.id === "rocket-lab").status, /第 99 次 Electron/);
  assert.match(companies.items.find((item) => item.id === "rocket-lab").status, /11\/14/);
});
