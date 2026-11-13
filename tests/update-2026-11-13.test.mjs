import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("November 13 backfill publishes eleven official-source events exactly once", async () => {
  const [batch, events, meta] = await Promise.all([
    readJson("pending/2026-11-13-approved.json"),
    readJson("events.json"),
    readJson("meta.json"),
  ]);
  assert.equal(meta.lastVerified, "2026-11-13");
  assert.equal(events.lastVerified, meta.lastVerified);
  assert.equal(batch.events.length, 11);
  assert.equal(batch.manualReviewCount, 4);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(events.events.filter((event) => event.id === approved.id).length, 1);
  }
  assert.ok(!events.events.some((event) => event.id === "sx-ussf317-window-conflict-20261113"));
});

test("November 13 keeps totals stable while advancing verified schedules", async () => {
  const [constellations, schedule, programs, companies, meta] = await Promise.all([
    readJson("constellations.json"),
    readJson("schedule.json"),
    readJson("programs.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);
  for (const data of [constellations, schedule, companies]) assert.equal(data.lastVerified, meta.lastVerified);
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  assert.equal(constellations.items.find((item) => item.id === "amazon-leo").current, 396);
  assert.equal(constellations.items.find((item) => item.id === "starlink").current, 10971);
  assert.match(constellations.items.find((item) => item.id === "ast-spacemobile").deployment.nextMission, /14–16/);
  assert.ok(schedule.items.some((item) => item.id === "rklb-mountain-god-rises-20261114" && item.window.includes("13:30")));
  assert.ok(schedule.items.some((item) => item.id === "asts-blacklift-late-2028"));
  assert.match(programs.items.find((item) => item.id === "neutron").headline, /16 次/);
  assert.match(programs.items.find((item) => item.id === "new-glenn").detail, /主氧閥/);
});
